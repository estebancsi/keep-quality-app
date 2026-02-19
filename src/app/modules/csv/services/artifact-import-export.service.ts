import { Injectable, inject } from '@angular/core';
import { forkJoin, map, Observable, switchMap, lastValueFrom } from 'rxjs';
import { UrsService } from './urs.service';
import { FsCsService } from './fs-cs.service';
import { UrsCategory } from '../urs.interface';
import { FsCsRequirementType } from '../fs-cs.interface';

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
  reqType: FsCsRequirementType;
  code: number;
  groupName: string | null; // e.g., 'Hardware', 'Software' sub-category
  position: number;
  description: string;
  traceUrsTempIds: string[]; // references ExportUrsRequirement.tempId
}

@Injectable({
  providedIn: 'root',
})
export class ArtifactImportExportService {
  private readonly ursService = inject(UrsService);
  private readonly fsCsService = inject(FsCsService);

  /**
   * Export artifacts for a project to a JSON file.
   */
  exportArtifacts(projectId: string, projectCode: string, projectName: string): Observable<void> {
    return forkJoin({
      ursArtifact: this.ursService.getOrCreateArtifact(projectId),
      fsCsArtifact: this.fsCsService.getOrCreateArtifact(projectId),
    }).pipe(
      switchMap(({ ursArtifact, fsCsArtifact }) =>
        forkJoin({
          ursReqs: this.ursService.loadRequirements(ursArtifact.id),
          fsCsReqs: this.fsCsService.loadRequirements(fsCsArtifact.id),
        }).pipe(
          map(({ ursReqs, fsCsReqs }) => ({
            ursArtifact,
            fsCsArtifact,
            ursReqs,
            fsCsReqs,
          })),
        ),
      ),
      map(({ ursArtifact, ursReqs, fsCsArtifact, fsCsReqs }) => {
        const data = this.buildExportData(
          projectCode,
          projectName,
          ursArtifact,
          ursReqs,
          fsCsArtifact,
          fsCsReqs,
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
    ursArtifact: any,
    ursReqs: any[],
    fsCsArtifact: any,
    fsCsReqs: any[],
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
    const exportFsCsReqs: ExportFsCsRequirement[] = fsCsReqs.map((req) => {
      const traceUrsTempIds = (req.traceUrsIds || [])
        .map((realId: string) => ursIdMap.get(realId))
        .filter((tempId: string | undefined): tempId is string => !!tempId);

      return {
        reqType: req.reqType,
        code: req.code,
        groupName: req.groupName, // mapped from category
        position: req.position,
        description: req.description,
        traceUrsTempIds,
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
  ): Promise<void> {
    // 1. Get or Create Artifacts
    const ursArtifact = await lastValueFrom(this.ursService.getOrCreateArtifact(projectId));
    const fsCsArtifact = await lastValueFrom(this.fsCsService.getOrCreateArtifact(projectId));

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

      // Split by type? standard createRequirements takes `reqType`?
      // No, `createMixedRequirements` handles mixed types.
      // I need to add `createMixedRequirements` to `FsCsService`?
      // `FsCsService` has `createMixedRequirements` (I saw it in view_file).
      await lastValueFrom(this.fsCsService.createMixedRequirements(fsCsArtifact.id, fsCsInserts));
    }
  }
}
