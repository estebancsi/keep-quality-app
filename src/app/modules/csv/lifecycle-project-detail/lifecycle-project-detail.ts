import { ChangeDetectionStrategy, Component, effect, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
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
import { FsCsRequirementType } from '../fs-cs.interface';
import { FsCsService } from '../services/fs-cs.service';
import { CustomFieldsRendererComponent } from '@/shared/custom-fields/renderer/custom-fields-renderer.component';
import { CustomFieldsService } from '@/shared/custom-fields/service/custom-fields.service';
import { CustomFieldsSchema } from '@/shared/custom-fields/types/custom-fields.types';
import { UrsService } from '../services/urs.service';
import { UrsArtifact } from '../urs.interface';

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
    CustomFieldsRendererComponent,
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
        </div>

        <!-- Tabs for artifacts -->
        @if (showUrsTab()) {
          <p-tabs value="0">
            <p-tablist>
              <p-tab value="0">
                <i class="pi pi-file-edit mr-2"></i>
                User Requirements (URS)
              </p-tab>
              @if (showFsCsTab()) {
                <p-tab value="fs-cs">
                  <i class="pi pi-list mr-2"></i>
                  FS / CS / DS
                </p-tab>
              }
            </p-tablist>
            <p-tabpanels>
              <p-tabpanel value="0">
                <!-- Custom fields section (hidden if no schema exists) -->
                @if (customFieldsSchema(); as schema) {
                  <div class="mb-4">
                    <h3 class="text-lg font-semibold mb-3">Document Properties</h3>
                    <app-custom-fields-renderer
                      [schema]="schema"
                      [values]="customFieldValues()"
                      (valuesChange)="onCustomFieldsChanged($event)"
                    />
                    <div class="flex justify-end mt-2">
                      <p-button
                        label="Save Properties"
                        icon="pi pi-save"
                        [loading]="savingCustomFields()"
                        (click)="saveCustomFields()"
                        size="small"
                      />
                    </div>
                  </div>
                }

                <app-urs-requirements-table [lifecycleProjectId]="p.id" />
              </p-tabpanel>

              @if (showFsCsTab()) {
                <p-tabpanel value="fs-cs">
                  <div class="flex flex-col gap-8">
                    @for (type of fsCsReqTypes(); track type) {
                      <div>
                        <!-- Section Header for clarity -->
                        <!-- <h4 class="text-lg font-semibold mb-3">{{ type }} Specification</h4> -->
                        <!-- (Title is in table, maybe we don't need extra header, or maybe we do for custom fields?) -->

                        <!-- Custom Fields for this Type -->
                        @if (fsCsSchemas()[type]; as schema) {
                          <div
                            class="mb-4 p-4 border rounded-lg bg-surface-50 dark:bg-surface-900 border-surface-200 dark:border-surface-700"
                          >
                            <h4 class="text-base font-semibold mb-3">{{ type }} Properties</h4>
                            <app-custom-fields-renderer
                              [schema]="schema"
                              [values]="fsCsValues()[type] || {}"
                              (valuesChange)="onFsCsValuesChanged(type, $event)"
                            />
                            <div class="flex justify-end mt-2">
                              <p-button
                                label="Save {{ type }} Properties"
                                icon="pi pi-save"
                                [loading]="savingFsCs()[type] || false"
                                (click)="saveFsCsFields(type)"
                                size="small"
                                [outlined]="true"
                              />
                            </div>
                          </div>
                        }

                        <app-fs-cs-requirements-table
                          [lifecycleProjectId]="p.id"
                          [reqType]="type"
                          [title]="type + ' Specification'"
                        />
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

  protected readonly project = signal<LifecycleProject | null>(null);
  protected readonly loading = signal(true);

  /** Only show URS tab for validation/revalidation projects */
  protected readonly showUrsTab = signal(false);

  /** Only show FS/CS tab for GAMP Cat 4 & 5 (Validation/Revalidation) */
  protected readonly showFsCsTab = signal(false);
  protected readonly fsCsReqTypes = signal<FsCsRequirementType[]>([]);

  /** Custom fields schema (null = not found or not loaded yet) */
  protected readonly customFieldsSchema = signal<CustomFieldsSchema | null>(null);

  /** Current custom field values from the URS artifact */
  protected readonly customFieldValues = signal<Record<string, unknown>>({});

  /** Saving state for custom fields */
  protected readonly savingCustomFields = signal(false);

  /** The URS artifact for persisting custom field values */
  private ursArtifact: UrsArtifact | null = null;

  private readonly loadEffect = effect(() => {
    const projectId = this.route.snapshot.paramMap.get('projectId');
    if (!projectId) {
      this.loading.set(false);
      return;
    }

    this.lifecycleService.getProject(projectId).subscribe({
      next: (p) => {
        this.project.set(p);
        const isValidation = p.type === 'validation' || p.type === 'revalidation';
        this.showUrsTab.set(isValidation);

        // FS/CS Logic: Only for Validation/Revalidation AND System Category 4 or 5
        const categoryCode = p.system?.categoryCode;
        if (isValidation && (categoryCode === 4 || categoryCode === 5)) {
          this.showFsCsTab.set(true);
          // Cat 4: Functional + Configuration
          // Cat 5: Functional + Design (we use same table but different type)
          if (categoryCode === 4) {
            this.fsCsReqTypes.set(['Functional', 'Configuration']);
          } else {
            this.fsCsReqTypes.set(['Functional', 'Design']);
          }
          // Load Custom Fields Logic
          this.loadFsCsData(p.id, this.fsCsReqTypes());
        } else {
          this.showFsCsTab.set(false);
          this.fsCsReqTypes.set([]);
        }

        this.loading.set(false);

        // Load custom fields schema + artifact values if URS tab is shown
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
  });

  /** Load the custom fields schema by name. If not found, leave null (section hidden). */
  private loadCustomFieldsSchema(): void {
    this.customFieldsService.getSchemaByName('csv.urs_artifact').subscribe({
      next: (schema) => this.customFieldsSchema.set(schema),
      error: () => this.customFieldsSchema.set(null), // Not found → hide section
    });
  }

  /** Load the URS artifact to get its custom field values. */
  private loadUrsArtifact(projectId: string): void {
    this.ursService.getOrCreateArtifact(projectId).subscribe({
      next: (artifact) => {
        this.ursArtifact = artifact;
        this.customFieldValues.set(artifact.customFieldValues ?? {});
      },
    });
  }

  /** Called when any custom field value changes in the renderer */
  protected onCustomFieldsChanged(values: Record<string, unknown>): void {
    this.customFieldValues.set(values);
  }

  /** Persist the current custom field values to the artifact (URS) */
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

  // ─── FS/CS Custom Fields Logic ─────────────────────

  /** Schemas for FS, CS, DS */
  protected readonly fsCsSchemas = signal<Record<string, CustomFieldsSchema | null>>({});
  /** Values per type (namespaced) */
  protected readonly fsCsValues = signal<Record<string, Record<string, unknown>>>({});
  protected readonly savingFsCs = signal<Record<string, boolean>>({});

  private fsCsArtifact: { id: string; customFieldValues?: Record<string, any> } | null = null;
  private readonly fsCsService = inject(FsCsService); // Inject FsCsService

  /** Load schemas for enabled types and fetch artifact */
  private loadFsCsData(projectId: string, types: FsCsRequirementType[]) {
    // 1. Load Artifact
    this.fsCsService.getOrCreateArtifact(projectId).subscribe({
      next: (artifact) => {
        this.fsCsArtifact = artifact;
        // Parse current values (defaulting to empty object if null)
        const currentVals = artifact.customFieldValues || {};
        this.fsCsValues.set(currentVals);
      },
    });

    // 2. Load Schemas for each type
    // Schema names: csv.spec.functional, csv.spec.configuration, csv.spec.design
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

    // Set loading state for this specific type
    this.savingFsCs.update((prev) => ({ ...prev, [type]: true }));

    // Merge changes into the artifact's full values object
    const currentAllValues = this.fsCsValues();

    // We update the whole object in DB
    this.fsCsService.updateArtifactCustomFields(this.fsCsArtifact.id, currentAllValues).subscribe({
      next: (updated) => {
        this.fsCsArtifact = updated;
        this.fsCsValues.set(updated.customFieldValues ?? {});
        this.savingFsCs.update((prev) => ({ ...prev, [type]: false }));
      },
      error: () => {
        this.savingFsCs.update((prev) => ({ ...prev, [type]: false }));
      },
    });
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
