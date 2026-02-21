import { ChangeDetectionStrategy, Component, effect, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { firstValueFrom } from 'rxjs';
import { ActivatedRoute, Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { TabsModule } from 'primeng/tabs';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { LifecycleProjectsService } from '../services/lifecycle-projects.service';
import {
  LifecycleProject,
  LIFECYCLE_PROJECT_TYPE_OPTIONS,
  LIFECYCLE_PROJECT_STATUS_OPTIONS,
} from '../lifecycle-project.interface';
import { UrsRequirementsTable } from './components/urs-requirements-table';
import { FsCsRequirementsTable } from './components/fs-cs-requirements-table';
import { RiskAnalysisTableComponent } from './components/risk-analysis-table';
import { FsCsArtifact, FsCsRequirementType } from '../fs-cs.interface';
import { FsCsService } from '../services/fs-cs.service';
import { CustomFieldsRendererComponent } from '@/shared/custom-fields/renderer/custom-fields-renderer.component';
import { CustomFieldsService } from '@/shared/custom-fields/service/custom-fields.service';
import { CustomFieldsSchema } from '@/shared/custom-fields/types/custom-fields.types';
import { UrsService } from '../services/urs.service';
import { UrsArtifact } from '../urs.interface';
import {
  ArtifactImportExportService,
  ExportData,
  ExportUrsRequirement,
  ExportFsCsRequirement,
  ExportRiskAnalysisItem,
} from '../services/artifact-import-export.service';
import { ArtifactImportDialogComponent } from '../components/artifact-import-dialog/artifact-import-dialog.component';
import { ReportsService, PDFOptions } from '@/shared/services/reports.service';
import { PdfTemplatesService } from '@/modules/pdf-templates/services/pdf-templates.service';
import { RiskAnalysisService } from '../services/risk-analysis.service';
import { ValidationPlanService } from '../services/validation-plan.service';
import { ValidationPlanArtifact } from '../validation-plan.interface';

@Component({
  selector: 'app-lifecycle-project-detail',
  imports: [
    CommonModule,
    ButtonModule,
    TagModule,
    TabsModule,
    ProgressSpinnerModule,
    UrsRequirementsTable,
    FsCsRequirementsTable,
    RiskAnalysisTableComponent,
    CustomFieldsRendererComponent,
    ArtifactImportDialogComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (loading()) {
      <div class="flex items-center justify-center py-20">
        <p-progressSpinner ariaLabel="Loading project details" />
      </div>
    } @else if (project(); as p) {
      <div class="flex flex-col gap-4">
        <!-- Header -->
        <div class="flex items-center gap-3">
          <p-button
            icon="pi pi-arrow-left"
            [rounded]="true"
            [text]="true"
            severity="secondary"
            (click)="goBack()"
            pTooltip="Back to Lifecycle Projects"
          />
          <div class="flex-1">
            <div class="flex items-center gap-3">
              <h2 class="text-2xl font-bold m-0">Lifecycle Project #{{ p.code }}</h2>
              <p-tag [value]="getTypeLabel(p.type)" [severity]="getTypeSeverity(p.type)" />
              <p-tag [value]="getStatusLabel(p.status)" [severity]="getStatusSeverity(p.status)" />
            </div>
            @if (p.system) {
              <p class="text-surface-500 mt-1 mb-0">
                System: {{ p.system.name }} (Code: {{ p.system.code }})
              </p>
            }
          </div>

          <!-- Actions -->
          <div class="flex gap-2">
            <p-button
              label="Export"
              icon="pi pi-download"
              [outlined]="true"
              severity="secondary"
              (click)="exportProject()"
              [loading]="isExporting()"
              pTooltip="Export URS and FS/CS to JSON"
            />
            <p-button
              label="Import"
              icon="pi pi-upload"
              [outlined]="true"
              severity="secondary"
              (click)="triggerImport()"
              pTooltip="Import URS and FS/CS from JSON"
            />
            <input
              type="file"
              #fileInput
              class="hidden"
              accept=".json"
              (change)="onImportFileSelected($event)"
            />
          </div>
        </div>

        <app-artifact-import-dialog
          [(visible)]="importDialogVisible"
          [importData]="importData()"
          (confirm)="onImportConfirm($event)"
        />

        <!-- Tabs for artifacts -->
        @if (showUrsTab()) {
          <p-tabs value="0">
            <p-tablist>
              <p-tab value="0">
                <i class="pi pi-file-edit mr-2"></i>
                User Requirements (URS)
              </p-tab>
              @if (showValidationPlanTab()) {
                <p-tab value="validation-plan">
                  <i class="pi pi-check-circle mr-2"></i>
                  Validation Plan
                </p-tab>
              }
              @if (showFsCsTab()) {
                <p-tab value="fs-cs">
                  <i class="pi pi-list mr-2"></i>
                  FS / CS / DS
                </p-tab>
              }
              @if (showRiskTab()) {
                <p-tab value="risk-analysis">
                  <i class="pi pi-shield mr-2"></i>
                  Risk Analysis (FMEA)
                </p-tab>
              }
            </p-tablist>
            <p-tabpanels>
              <p-tabpanel value="0">
                <!-- Custom fields section (hidden if no schema exists) -->

                <div class="mb-4">
                  <div class="flex justify-between items-center mt-4">
                    <h3 class="text-lg font-semibold">Document Properties</h3>
                    <div class="flex justify-end gap-2">
                      <p-button
                        label="Edit PDF"
                        icon="pi pi-pencil"
                        [outlined]="true"
                        size="small"
                        (click)="editPdf('csv.urs_artifact')"
                      />
                      <p-button
                        label="Generate PDF"
                        icon="pi pi-file-pdf"
                        [outlined]="true"
                        size="small"
                        [loading]="generatingPdf() === 'csv.urs_artifact'"
                        (click)="generatePdf('csv.urs_artifact')"
                      />
                      @if (customFieldsSchema(); as schema) {
                        <p-button
                          label="Save Properties"
                          icon="pi pi-save"
                          [loading]="savingCustomFields()"
                          (click)="saveCustomFields()"
                          size="small"
                        />
                      }
                    </div>
                  </div>
                  @if (customFieldsSchema(); as schema) {
                    <app-custom-fields-renderer
                      [schema]="schema"
                      [values]="customFieldValues()"
                      (valuesChange)="onCustomFieldsChanged($event)"
                    />
                  }
                </div>

                <app-urs-requirements-table [lifecycleProjectId]="p.id" [system]="p.system" />
              </p-tabpanel>

              @if (showValidationPlanTab()) {
                <p-tabpanel value="validation-plan">
                  <div class="mb-4">
                    <div class="flex justify-between items-center mt-4">
                      <h3 class="text-lg font-semibold">Document Properties</h3>
                      <div class="flex justify-end gap-2">
                        <p-button
                          label="Edit PDF"
                          icon="pi pi-pencil"
                          [outlined]="true"
                          size="small"
                          (click)="editPdf('csv.validation_plan')"
                        />
                        <p-button
                          label="Generate PDF"
                          icon="pi pi-file-pdf"
                          [outlined]="true"
                          size="small"
                          [loading]="generatingPdf() === 'csv.validation_plan'"
                          (click)="generatePdf('csv.validation_plan')"
                        />
                        @if (validationPlanSchema(); as schema) {
                          <p-button
                            label="Save Properties"
                            icon="pi pi-save"
                            [loading]="savingValidationPlan()"
                            (click)="saveValidationPlan()"
                            size="small"
                          />
                        }
                      </div>
                    </div>
                    @if (validationPlanSchema(); as schema) {
                      <app-custom-fields-renderer
                        [schema]="schema"
                        [values]="validationPlanValues()"
                        (valuesChange)="onValidationPlanValuesChanged($event)"
                      />
                    } @else if (!loading()) {
                      <div class="text-surface-500 italic mt-4">
                        Failed to load Validation Plan schema.
                      </div>
                    }
                  </div>
                </p-tabpanel>
              }

              @if (showRiskTab()) {
                <p-tabpanel value="risk-analysis">
                  <div class="flex justify-end my-4 gap-2">
                    <p-button
                      label="Edit PDF"
                      icon="pi pi-pencil"
                      [outlined]="true"
                      size="small"
                      (click)="editPdf('csv.risk_analysis_artifact')"
                    />
                    <p-button
                      label="Generate PDF"
                      icon="pi pi-file-pdf"
                      [outlined]="true"
                      size="small"
                      [loading]="generatingPdf() === 'csv.risk_analysis_artifact'"
                      (click)="generatePdf('csv.risk_analysis_artifact')"
                    />
                  </div>
                  <app-risk-analysis-table
                    [lifecycleProjectId]="p.id"
                    [systemCategory]="p.system?.categoryCode"
                    [system]="p.system"
                  />
                </p-tabpanel>
              }

              @if (showFsCsTab()) {
                <p-tabpanel value="fs-cs">
                  <div class="flex flex-col gap-8 mt-4">
                    @for (type of fsCsReqTypes(); track type) {
                      <div>
                        <!-- Custom Fields for this Type -->
                        <div
                          class="mb-4 p-4 border rounded-lg bg-surface-50 dark:bg-surface-900 border-surface-200 dark:border-surface-700"
                        >
                          <div class="flex justify-between items-center">
                            <h4 class="text-base font-semibold mb-3">
                              {{ type }} Specification Properties
                            </h4>
                            <div class="flex justify-end mt-2 gap-2">
                              <p-button
                                label="Edit PDF"
                                icon="pi pi-pencil"
                                size="small"
                                [outlined]="true"
                                (click)="editPdf('csv.spec.' + type.toLowerCase())"
                              />
                              <p-button
                                label="Generate PDF"
                                icon="pi pi-file-pdf"
                                size="small"
                                [outlined]="true"
                                [loading]="generatingPdf() === 'csv.spec.' + type.toLowerCase()"
                                (click)="generatePdf('csv.spec.' + type.toLowerCase(), type)"
                              />
                              @if (fsCsSchemas()[type]; as schema) {
                                <p-button
                                  label="Save {{ type }} Properties"
                                  icon="pi pi-save"
                                  [loading]="savingFsCs()[type] || false"
                                  (click)="saveFsCsFields(type)"
                                  size="small"
                                  [outlined]="true"
                                />
                              }
                            </div>
                          </div>
                          @if (fsCsSchemas()[type]; as schema) {
                            <app-custom-fields-renderer
                              [schema]="schema"
                              [values]="fsCsValues()[type] || {}"
                              (valuesChange)="onFsCsValuesChanged(type, $event)"
                            />
                          }

                          <app-fs-cs-requirements-table
                            [lifecycleProjectId]="p.id"
                            [reqType]="type"
                            [title]="type + ' Specification'"
                          />
                        </div>
                      </div>
                    }
                  </div>
                </p-tabpanel>
              }
            </p-tabpanels>
          </p-tabs>
        } @else {
          <div class="flex flex-col items-center gap-3 py-12">
            <i class="pi pi-info-circle text-4xl text-surface-400"></i>
            <p class="text-surface-500">No artifacts available for this project type.</p>
          </div>
        }
      </div>
    } @else {
      <div class="flex flex-col items-center gap-3 py-12">
        <i class="pi pi-exclamation-triangle text-4xl text-surface-400"></i>
        <p class="text-surface-500">Project not found.</p>
        <p-button label="Back to Lifecycle Projects" (click)="goBack()" />
      </div>
    }
  `,
})
export class LifecycleProjectDetail {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly lifecycleService = inject(LifecycleProjectsService);
  private readonly customFieldsService = inject(CustomFieldsService);
  private readonly ursService = inject(UrsService);
  private readonly importExportService = inject(ArtifactImportExportService);
  private readonly fsCsService = inject(FsCsService);
  private readonly riskService = inject(RiskAnalysisService);
  private readonly reportsService = inject(ReportsService);
  private readonly pdfTemplatesService = inject(PdfTemplatesService);
  private readonly validationPlanService = inject(ValidationPlanService);

  protected readonly project = signal<LifecycleProject | null>(null);
  protected readonly loading = signal(true);

  /** Only show URS tab for validation/revalidation projects */
  protected readonly showUrsTab = signal(false);
  protected readonly showValidationPlanTab = signal(false);

  /** Only show FS/CS tab for GAMP Cat 4 & 5 (Validation/Revalidation) */
  protected readonly showFsCsTab = signal(false);
  protected readonly showRiskTab = signal(false);
  protected readonly fsCsReqTypes = signal<FsCsRequirementType[]>([]);

  /** Custom fields schema (null = not found or not loaded yet) */
  protected readonly customFieldsSchema = signal<CustomFieldsSchema | null>(null);

  /** Current custom field values from the URS artifact */
  protected readonly customFieldValues = signal<Record<string, unknown>>({});

  /** Saving state for custom fields */
  protected readonly savingCustomFields = signal(false);

  /** The URS artifact for persisting custom field values */
  private ursArtifact: UrsArtifact | null = null;

  // Validation Plan State
  protected readonly validationPlanSchema = signal<CustomFieldsSchema | null>(null);
  protected readonly validationPlanValues = signal<Record<string, unknown>>({});
  protected readonly savingValidationPlan = signal(false);
  private validationPlanArtifact: ValidationPlanArtifact | null = null;

  // Export / Import State
  protected readonly isExporting = signal(false);
  protected readonly importDialogVisible = signal(false);
  protected readonly importData = signal<ExportData | null>(null);

  // FS/CS Custom Fields Logic State
  protected readonly fsCsSchemas = signal<Record<string, CustomFieldsSchema | null>>({});
  protected readonly fsCsValues = signal<Record<string, Record<string, unknown>>>({});
  protected readonly savingFsCs = signal<Record<string, boolean>>({});
  private fsCsArtifact: FsCsArtifact | null = null;
  private riskAnalysisArtifactId: string | null = null;

  // PDF Generation State
  protected readonly generatingPdf = signal<string | null>(null);

  constructor() {
    effect(() => {
      const projectId = this.route.snapshot.paramMap.get('projectId');
      if (projectId) {
        this.reloadProjectData(projectId);
      } else {
        this.loading.set(false);
      }
    });
  }

  // Reload Logic
  private reloadProjectData(projectId: string) {
    this.loading.set(true);
    this.lifecycleService.getProject(projectId).subscribe({
      next: (p) => {
        this.project.set(p);
        const isValidation = p.type === 'validation' || p.type === 'revalidation';
        this.showUrsTab.set(isValidation);
        this.showValidationPlanTab.set(isValidation);
        this.showRiskTab.set(isValidation);

        if (isValidation) {
          this.loadRiskArtifact(p.id);
          this.loadValidationPlanData(p.id);
        }

        const categoryCode = p.system?.categoryCode;
        if (isValidation && (categoryCode === 4 || categoryCode === 5)) {
          this.showFsCsTab.set(true);
          if (categoryCode === 4) {
            this.fsCsReqTypes.set(['Functional', 'Configuration']);
          } else {
            this.fsCsReqTypes.set(['Functional', 'Design']);
          }
          this.loadFsCsData(p.id, this.fsCsReqTypes());
        } else {
          this.showFsCsTab.set(false);
          this.fsCsReqTypes.set([]);
        }

        this.loading.set(false);

        if (isValidation) {
          this.loadCustomFieldsSchema();
          this.loadUrsArtifact(p.id);
        }
      },
      error: () => {
        this.project.set(null);
        this.loading.set(false);
      },
    });
  }

  private loadCustomFieldsSchema(): void {
    this.customFieldsService.getSchemaByName('csv.urs_artifact').subscribe({
      next: (schema) => this.customFieldsSchema.set(schema),
      error: () => this.customFieldsSchema.set(null),
    });
  }

  private loadUrsArtifact(projectId: string): void {
    this.ursService.getOrCreateArtifact(projectId).subscribe({
      next: (artifact) => {
        this.ursArtifact = artifact;
        this.customFieldValues.set(artifact.customFieldValues ?? {});
      },
    });
  }

  private loadRiskArtifact(projectId: string): void {
    this.riskService.getOrCreateArtifact(projectId).subscribe({
      next: (artifact) => {
        this.riskAnalysisArtifactId = artifact.id;
      },
    });
  }

  protected onCustomFieldsChanged(values: Record<string, unknown>): void {
    this.customFieldValues.set(values);
  }

  protected saveCustomFields(): void {
    if (!this.ursArtifact) return;

    this.savingCustomFields.set(true);
    this.ursService
      .updateArtifactCustomFields(this.ursArtifact.id, this.customFieldValues())
      .subscribe({
        next: (updated) => {
          this.ursArtifact = updated;
          this.customFieldValues.set(updated.customFieldValues ?? {});
          this.savingCustomFields.set(false);
        },
        error: () => this.savingCustomFields.set(false),
      });
  }

  private loadValidationPlanData(projectId: string): void {
    // Load schema
    this.customFieldsService.getSchemaByName('csv.validation_plan').subscribe({
      next: (schema) => this.validationPlanSchema.set(schema),
      error: () => this.validationPlanSchema.set(null),
    });

    // Load artifact
    this.validationPlanService.getOrCreateArtifact(projectId).subscribe({
      next: (artifact) => {
        this.validationPlanArtifact = artifact;
        this.validationPlanValues.set(artifact.customFieldValues ?? {});
      },
    });
  }

  protected onValidationPlanValuesChanged(values: Record<string, unknown>): void {
    this.validationPlanValues.set(values);
  }

  protected saveValidationPlan(): void {
    if (!this.validationPlanArtifact) return;

    this.savingValidationPlan.set(true);
    this.validationPlanService
      .updateArtifactCustomFields(this.validationPlanArtifact.id, this.validationPlanValues())
      .subscribe({
        next: (updated) => {
          this.validationPlanArtifact = updated;
          this.validationPlanValues.set(updated.customFieldValues ?? {});
          this.savingValidationPlan.set(false);
        },
        error: () => this.savingValidationPlan.set(false),
      });
  }

  protected exportProject(): void {
    const p = this.project();
    if (!p) return;

    this.isExporting.set(true);
    this.importExportService
      .exportArtifacts(p.id, p.code.toString(), p.system?.name || 'Project')
      .subscribe({
        next: () => this.isExporting.set(false),
        error: () => this.isExporting.set(false),
      });
  }

  protected triggerImport(): void {
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    if (fileInput) fileInput.click();
  }

  protected onImportFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;

    const file = input.files[0];
    this.importExportService
      .parseImportFile(file)
      .then((data) => {
        this.importData.set(data);
        this.importDialogVisible.set(true);
        input.value = '';
      })
      .catch((err) => {
        console.error('Failed to parse import file', err);
      });
  }

  protected onImportConfirm(selection: {
    ursReqsToImport: ExportUrsRequirement[];
    fsCsReqsToImport: ExportFsCsRequirement[];
    riskItemsToImport: ExportRiskAnalysisItem[];
  }): void {
    const p = this.project();
    if (!p) return;

    this.loading.set(true);
    this.importExportService
      .executeImport(
        p.id,
        this.importData()!,
        selection.ursReqsToImport,
        selection.fsCsReqsToImport,
        selection.riskItemsToImport,
      )
      .then(() => {
        this.loading.set(false);
        this.reloadProjectData(p.id);
      })
      .catch(() => {
        this.loading.set(false);
      });
  }

  private loadFsCsData(projectId: string, types: FsCsRequirementType[]) {
    this.fsCsService.getOrCreateArtifact(projectId).subscribe({
      next: (artifact) => {
        this.fsCsArtifact = artifact;
        const currentVals =
          (artifact.customFieldValues as Record<string, Record<string, unknown>>) || {};
        this.fsCsValues.set(currentVals);
      },
    });

    types.forEach((type) => {
      const schemaName = `csv.spec.${type.toLowerCase()}`;
      this.customFieldsService.getSchemaByName(schemaName).subscribe({
        next: (schema) => {
          this.fsCsSchemas.update((prev) => ({ ...prev, [type]: schema }));
        },
        error: () => {
          this.fsCsSchemas.update((prev) => ({ ...prev, [type]: null }));
        },
      });
    });
  }

  protected onFsCsValuesChanged(type: string, values: Record<string, unknown>) {
    this.fsCsValues.update((prev) => ({
      ...prev,
      [type]: values,
    }));
  }

  protected saveFsCsFields(type: string) {
    if (!this.fsCsArtifact) return;

    this.savingFsCs.update((prev) => ({ ...prev, [type]: true }));
    const currentAllValues = this.fsCsValues();

    this.fsCsService.updateArtifactCustomFields(this.fsCsArtifact.id, currentAllValues).subscribe({
      next: (updated) => {
        this.fsCsArtifact = updated;
        this.fsCsValues.set(
          (updated.customFieldValues as Record<string, Record<string, unknown>>) ?? {},
        );
        this.savingFsCs.update((prev) => ({ ...prev, [type]: false }));
      },
      error: () => {
        this.savingFsCs.update((prev) => ({ ...prev, [type]: false }));
      },
    });
  }

  protected editPdf(templateCode: string): void {
    this.router.navigate(['/pdf-templates/editor'], {
      queryParams: { templateName: templateCode },
    });
  }

  protected async generatePdf(templateCode: string, fsCsType?: string): Promise<void> {
    this.generatingPdf.set(templateCode);
    try {
      const template = await firstValueFrom(
        this.pdfTemplatesService.getTemplateByName(templateCode),
      );
      if (!template) {
        throw new Error('Template not found');
      }

      let items: unknown[] = [];
      const p = this.project();
      const systemInfo = p?.system
        ? {
            name: p.system.name,
            version: p.system.version,
            description: p.system.description,
            category: p.system.categoryCode?.toString(),
          }
        : {};

      if (templateCode === 'csv.urs_artifact' && this.ursArtifact) {
        items = await firstValueFrom(this.ursService.loadRequirements(this.ursArtifact.id));
      } else if (templateCode.startsWith('csv.spec.') && this.fsCsArtifact && fsCsType) {
        items = await firstValueFrom(
          this.fsCsService.loadRequirements(this.fsCsArtifact.id, fsCsType as FsCsRequirementType),
        );
      } else if (templateCode === 'csv.risk_analysis_artifact' && this.riskAnalysisArtifactId) {
        const riskItems = await firstValueFrom(
          this.riskService.loadItems(this.riskAnalysisArtifactId),
        );
        // Map traceIDs to an array of codes if needed, or just pass as is.
        items = riskItems.map((r) => ({
          ...r,
          traceUrs: r.traceUrsIds || [],
          traceFsCs: r.traceFsCsIds || [],
        }));
      } else if (templateCode === 'csv.validation_plan' && this.validationPlanArtifact) {
        // Validation plan has no items list, just properties
        items = [];
      }

      const payload = {
        system: systemInfo,
        items,
      };

      const pdfOptions = template.options
        ? {
            ...template.options,
            title: systemInfo.name ? `${systemInfo.name} - ${templateCode}` : templateCode,
            marginTop: template.options.marginTop + 'px',
            marginBottom: template.options.marginBottom + 'px',
            marginLeft: template.options.marginLeft + 'px',
            marginRight: template.options.marginRight + 'px',
          }
        : { title: templateCode };

      const blob = await firstValueFrom(
        this.reportsService.renderRaw({
          html: template.html,
          css: template.css,
          header: template.header,
          footer: template.footer,
          options: pdfOptions as unknown as PDFOptions,
          data: payload,
        }),
      );

      const url = URL.createObjectURL(blob);
      this.router.navigate(['/pdf-viewer'], { queryParams: { src: url } });
    } catch (err) {
      console.error('Failed to generate PDF', err);
    } finally {
      this.generatingPdf.set(null);
    }
  }

  protected goBack(): void {
    this.router.navigate(['/csv/lifecycle']);
  }

  protected getTypeLabel(type: string): string {
    return LIFECYCLE_PROJECT_TYPE_OPTIONS.find((o) => o.value === type)?.label ?? type;
  }

  protected getTypeSeverity(
    type: string,
  ): 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast' {
    const map: Record<string, 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast'> = {
      validation: 'info',
      periodic_review: 'success',
      revalidation: 'warn',
      retirement: 'danger',
    };
    return map[type] ?? 'secondary';
  }

  protected getStatusLabel(status: string): string {
    return LIFECYCLE_PROJECT_STATUS_OPTIONS.find((o) => o.value === status)?.label ?? status;
  }

  protected getStatusSeverity(
    status: string,
  ): 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast' {
    const map: Record<string, 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast'> = {
      draft: 'secondary',
      in_progress: 'info',
      completed: 'success',
      cancelled: 'danger',
    };
    return map[status] ?? 'secondary';
  }
}
