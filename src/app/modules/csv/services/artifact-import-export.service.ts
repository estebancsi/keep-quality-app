import { Injectable, inject } from '@angular/core';
import { forkJoin, map, Observable, switchMap, lastValueFrom } from 'rxjs';
import { UrsService } from './urs.service';
import { FsCsService } from './fs-cs.service';
import { UrsCategory } from '../urs.interface';
import { FsCsRequirementType } from '../fs-cs.interface';
import { RiskAnalysisService } from './risk-analysis.service';

// --- Export/Import Data Interfaces ---

export interface ExportData {
  version: string; // '1.0'
  projectCode?: string;
  sourceProjectName?: string;
  exportDate: string;
  urs?: {
    customFields?: Record<string, unknown>; // Artifact level
    requirements: ExportUrsRequirement[];
  };
  fsCs?: {
    customFields?: Record<string, unknown>; // Artifact level
    requirements: ExportFsCsRequirement[];
  };
  riskAnalysis?: {
    customFields?: Record<string, unknown>;
    items: ExportRiskAnalysisItem[];
  };
}

export interface ExportUrsRequirement {
  tempId: string; // generated temp ID to preserve relationships
  code: number;
  position: number;
  description: string;
  category: UrsCategory;
  groupName: string | null;
}

export interface ExportFsCsRequirement {
  tempId: string; // generated temp ID for Risk Analysis tracing
  reqType: FsCsRequirementType;
  code: number;
  groupName: string | null; // e.g., 'Hardware', 'Software' sub-category
  position: number;
  description: string;
  traceUrsTempIds: string[]; // references ExportUrsRequirement.tempId
}

export interface ExportRiskAnalysisItem {
  code: number;
  position: number;
  failureMode: string;
  cause: string;
  effect: string;
  severity: number;
  probability: number;
  detectability: number;
  rpn: number;
  riskClass: number;
  mitigation: string;
  traceUrsTempIds: string[];
  traceFsCsTempIds: string[];
}

@Injectable({
  providedIn: 'root',
})
export class ArtifactImportExportService {
  private readonly ursService = inject(UrsService);
  private readonly fsCsService = inject(FsCsService);
  private readonly riskService = inject(RiskAnalysisService);

  /**
   * Export artifacts for a project to a JSON file.
   */
  exportArtifacts(projectId: string, projectCode: string, projectName: string): Observable<void> {
    return forkJoin({
      ursArtifact: this.ursService.getOrCreateArtifact(projectId),
      fsCsArtifact: this.fsCsService.getOrCreateArtifact(projectId),
      riskArtifact: this.riskService.getOrCreateArtifact(projectId),
    }).pipe(
      switchMap(({ ursArtifact, fsCsArtifact, riskArtifact }) =>
        forkJoin({
          ursReqs: this.ursService.loadRequirements(ursArtifact.id),
          fsCsReqs: this.fsCsService.loadRequirements(fsCsArtifact.id),
          riskItems: this.riskService.loadItems(riskArtifact.id),
        }).pipe(
          map(({ ursReqs, fsCsReqs, riskItems }) => ({
            ursArtifact,
            fsCsArtifact,
            riskArtifact,
            ursReqs,
            fsCsReqs,
            riskItems,
          })),
        ),
      ),
      map(({ ursArtifact, ursReqs, fsCsArtifact, fsCsReqs, riskArtifact, riskItems }) => {
        const data = this.buildExportData(
          projectCode,
          projectName,
          ursArtifact,
          ursReqs,
          fsCsArtifact,
          fsCsReqs,
          riskArtifact,
          riskItems,
        );
        this.downloadJson(
          data,
          `csv-export-${projectCode}-${new Date().toISOString().split('T')[0]}.json`,
        );
      }),
    );
  }

  /**
   * Helper to build the export data structure.
   */
  private buildExportData(
    projectCode: string,
    projectName: string,
    ursArtifact: { customFieldValues?: any },
    ursReqs: {
      id: string;
      code: number;
      position: number;
      description: string;
      category: UrsCategory;
      groupName: string | null;
    }[],
    fsCsArtifact: { customFieldValues?: any },
    fsCsReqs: {
      id: string;
      reqType: FsCsRequirementType;
      code: number;
      groupName: string | null;
      position: number;
      description: string;
      traceUrsIds?: string[];
    }[],
    riskArtifact: { customFieldValues?: any },
    riskItems: {
      code: number;
      position: number;
      failureMode: string;
      cause: string;
      effect: string;
      severity: number;
      probability: number;
      detectability: number;
      rpn: number;
      riskClass: number;
      mitigation: string;
      traceUrsIds?: string[];
      traceFsCsIds?: string[];
    }[],
  ): ExportData {
    // 1. Map URS IDs to Temp IDs
    const ursIdMap = new Map<string, string>(); // realId -> tempId
    const exportUrsReqs: ExportUrsRequirement[] = ursReqs.map((req, index) => {
      const tempId = `urs_temp_${index + 1}`;
      ursIdMap.set(req.id, tempId);
      return {
        tempId,
        code: req.code,
        position: req.position,
        description: req.description,
        category: req.category,
        groupName: req.groupName,
      };
    });

    // 2. Map FS/CS Requirements and resolve traces
    const fsCsIdMap = new Map<string, string>(); // realId -> tempId
    const exportFsCsReqs: ExportFsCsRequirement[] = fsCsReqs.map((req, index) => {
      const tempId = `fscs_temp_${index + 1}`;
      fsCsIdMap.set(req.id, tempId);

      const traceUrsTempIds = (req.traceUrsIds || [])
        .map((realId: string) => ursIdMap.get(realId))
        .filter((tempId: string | undefined): tempId is string => !!tempId);

      return {
        tempId,
        reqType: req.reqType,
        code: req.code,
        groupName: req.groupName, // mapped from category
        position: req.position,
        description: req.description,
        traceUrsTempIds,
      };
    });

    // 3. Map Risk Analysis Items and resolve traces
    const exportRiskItems: ExportRiskAnalysisItem[] = riskItems.map((item) => {
      const traceUrsTempIds = (item.traceUrsIds || [])
        .map((realId: string) => ursIdMap.get(realId))
        .filter((tempId: string | undefined): tempId is string => !!tempId);

      const traceFsCsTempIds = (item.traceFsCsIds || [])
        .map((realId: string) => fsCsIdMap.get(realId))
        .filter((tempId: string | undefined): tempId is string => !!tempId);

      return {
        code: item.code,
        position: item.position,
        failureMode: item.failureMode,
        cause: item.cause,
        effect: item.effect,
        severity: item.severity,
        probability: item.probability,
        detectability: item.detectability,
        rpn: item.rpn,
        riskClass: item.riskClass,
        mitigation: item.mitigation,
        traceUrsTempIds,
        traceFsCsTempIds,
      };
    });

    return {
      version: '1.0',
      projectCode,
      sourceProjectName: projectName,
      exportDate: new Date().toISOString(),
      urs: {
        customFields: ursArtifact.customFieldValues || {},
        requirements: exportUrsReqs,
      },
      fsCs: {
        customFields: fsCsArtifact.customFieldValues || {},
        requirements: exportFsCsReqs,
      },
      riskAnalysis: {
        customFields: riskArtifact.customFieldValues || {},
        items: exportRiskItems,
      },
    };
  }

  private downloadJson(data: ExportData, filename: string): void {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  }

  // --- Import Logic ---

  /**
   * Parse a JSON file into ExportData.
   */
  parseImportFile(file: File): Promise<ExportData> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const json = JSON.parse(e.target?.result as string);
          // Basic validation could go here
          resolve(json as ExportData);
        } catch (err) {
          reject(err);
        }
      };
      reader.onerror = (err) => reject(err);
      reader.readAsText(file);
    });
  }

  /**
   * Execute import of selected items.
   * preserving/remapping tracing relationships.
   */
  async executeImport(
    projectId: string,
    data: ExportData,
    ursReqsToImport: ExportUrsRequirement[],
    fsCsReqsToImport: ExportFsCsRequirement[],
    riskItemsToImport: ExportRiskAnalysisItem[],
  ): Promise<void> {
    // 1. Get or Create Artifacts
    const ursArtifact = await lastValueFrom(this.ursService.getOrCreateArtifact(projectId));
    const fsCsArtifact = await lastValueFrom(this.fsCsService.getOrCreateArtifact(projectId));
    const riskArtifact = await lastValueFrom(this.riskService.getOrCreateArtifact(projectId));

    // 2. Update Custom Fields (if present in export)
    if (data.urs?.customFields && Object.keys(data.urs.customFields).length > 0) {
      // Merge with existing? Or overwrite? For strict import we overwrite or merge.
      // Let's assume merge: existing keys kept if not in import, import keys overwrite.
      const newFields = { ...(ursArtifact.customFieldValues || {}), ...data.urs.customFields };
      await lastValueFrom(this.ursService.updateArtifactCustomFields(ursArtifact.id, newFields));
    }
    if (data.fsCs?.customFields && Object.keys(data.fsCs.customFields).length > 0) {
      const newFields = { ...(fsCsArtifact.customFieldValues || {}), ...data.fsCs.customFields };
      await lastValueFrom(this.fsCsService.updateArtifactCustomFields(fsCsArtifact.id, newFields));
    }
    if (data.riskAnalysis?.customFields && Object.keys(data.riskAnalysis.customFields).length > 0) {
      const existing = (riskArtifact.customFieldValues || {}) as Record<string, unknown>;
      const incoming = (data.riskAnalysis.customFields || {}) as Record<string, unknown>;
      const newFields = {
        ...existing,
        ...incoming,
      };
      await lastValueFrom(this.riskService.updateArtifactCustomFields(riskArtifact.id, newFields));
    }

    // 3. Import URS Requirements
    // We need to keep a map of tempId -> newDatabaseId for tracing
    const tempIdToNewIdMap = new Map<string, string>();

    if (ursReqsToImport.length > 0) {
      // We map ExportUrsRequirement to Partial<UrsRequirement>
      // NOTE: We do NOT define ID here. DB generates it.
      // We need to handle the mapping back of the created items to the tempIds.
      // Since `createRequirements` returns the created items in order (assuming bulk insert preserves order or returns mapped),
      // we rely on the order of `ursReqsToImport` matching the returned `createdUrsReqs`.
      // Supabase returns inserted rows.
      const ursInserts = ursReqsToImport.map((req) => ({
        description: req.description,
        category: req.category,
        groupName: req.groupName,
        // Let's STRIP code to allow auto-increment to handle it safely.
      }));

      const createdUrsReqs = await lastValueFrom(
        this.ursService.createRequirements(ursArtifact.id, ursInserts),
      );

      // Populate map: ursReqsToImport[i].tempId -> createdUrsReqs[i].id
      ursReqsToImport.forEach((req, index) => {
        if (createdUrsReqs[index]) {
          tempIdToNewIdMap.set(req.tempId, createdUrsReqs[index].id);
        }
      });
    }

    // 4. Import FS/CS Requirements
    const fsCsTempIdToNewIdMap = new Map<string, string>();

    if (fsCsReqsToImport.length > 0) {
      const fsCsInserts = fsCsReqsToImport.map((req) => {
        // Resolve Traces
        // Map tempIds to new real IDs. If a tempId wasn't imported (filtered out), it won't be in map.
        // So we filter undefineds.
        const validTraceIds = (req.traceUrsTempIds || [])
          .map((tempId) => tempIdToNewIdMap.get(tempId))
          .filter((id): id is string => !!id);

        return {
          reqType: req.reqType,
          description: req.description,
          groupName: req.groupName,
          traceUrsIds: validTraceIds,
          // Strip code? yes.
        };
      });

      const createdFsCsReqs = await lastValueFrom(
        this.fsCsService.createMixedRequirements(fsCsArtifact.id, fsCsInserts),
      );

      // Populate map: fsCsReqsToImport[i].tempId -> createdFsCsReqs[i].id
      fsCsReqsToImport.forEach((req, index) => {
        if (createdFsCsReqs[index]) {
          fsCsTempIdToNewIdMap.set(req.tempId, createdFsCsReqs[index].id);
        }
      });
    }

    // 5. Import Risk Analysis Items
    if (riskItemsToImport.length > 0) {
      // Since RiskService doesn't have a bulk create, we use loop for now.
      // We iterate to create items sequentially or in parallel.

      const promises = riskItemsToImport.map((item) => {
        const validTraceUrsIds = (item.traceUrsTempIds || [])
          .map((tempId) => tempIdToNewIdMap.get(tempId))
          .filter((id): id is string => !!id);

        const validTraceFsCsIds = (item.traceFsCsTempIds || [])
          .map((tempId) => fsCsTempIdToNewIdMap.get(tempId))
          .filter((id): id is string => !!id);

        return lastValueFrom(this.riskService.createItem(riskArtifact.id, item.position)).then(
          (newItem) => {
            return lastValueFrom(
              this.riskService.updateItem(newItem.id, {
                failureMode: item.failureMode,
                cause: item.cause,
                effect: item.effect,
                severity: item.severity,
                probability: item.probability,
                detectability: item.detectability,
                rpn: item.rpn,
                riskClass: item.riskClass,
                mitigation: item.mitigation,
                traceUrsIds: validTraceUrsIds,
                traceFsCsIds: validTraceFsCsIds,
              }),
            );
          },
        );
      });

      await Promise.all(promises);
    }
  }
}
