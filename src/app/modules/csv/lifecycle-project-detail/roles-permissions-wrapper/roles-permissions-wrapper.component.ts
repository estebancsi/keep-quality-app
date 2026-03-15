import { Component, ChangeDetectionStrategy, input, inject, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TabsModule } from 'primeng/tabs';
import { MessageModule } from 'primeng/message';
import { CsvRolesListComponent } from '../components/csv-roles-list/csv-roles-list.component';
import { CsvPermissionsListComponent } from '../components/csv-permissions-list/csv-permissions-list.component';
import { CsvRolePermissionMatrixComponent } from '../components/csv-role-permission-matrix/csv-role-permission-matrix.component';
import { CsvRolePermissionTestingComponent } from '../components/csv-role-permission-testing/csv-role-permission-testing.component';
import { RolesPermissionsService } from '../../services/roles-permissions.service';
import { MessageService } from 'primeng/api';
import {
  CsvRole,
  CsvPermission,
  CsvRolePermissionMapping,
  CsvRolePermissionTestResult,
} from '../../roles-permissions.interface';
import { tap, catchError } from 'rxjs/operators';
import { EMPTY, firstValueFrom } from 'rxjs';
import { AttachmentCache } from '@/core/interfaces/attachment.interface';
import { ButtonModule } from 'primeng/button';
import { Router } from '@angular/router';
import { ReportsService, PDFOptions } from '@/shared/services/reports.service';
import { PdfTemplatesService } from '@/modules/pdf-templates/services/pdf-templates.service';
import { OrganizationService } from '@/auth/organization.service';
import { LifecycleProject } from '../../lifecycle-project.interface';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { FormsModule } from '@angular/forms';
import { LifecycleAttachmentsService } from '../../services/lifecycle-attachments.service';
import { PdfJobService } from '@/shared/services/pdf-job.service';

@Component({
  selector: 'app-csv-roles-permissions-wrapper',
  standalone: true,
  imports: [
    CommonModule,
    TabsModule,
    MessageModule,
    CsvRolesListComponent,
    CsvPermissionsListComponent,
    CsvRolePermissionMatrixComponent,
    CsvRolePermissionTestingComponent,
    ButtonModule,
    DialogModule,
    InputTextModule,
    FormsModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      class="h-full flex flex-col bg-surface-0 dark:bg-surface-900 rounded shadow-sm border border-surface-200 dark:border-surface-700 p-4"
    >
      <div class="mb-4">
        <h2 class="text-2xl font-bold text-surface-900 dark:text-surface-0 m-0">
          Roles & Permissions Testing
        </h2>
        <p class="text-surface-600 dark:text-surface-400 mt-2">
          Configure project roles, define permissions, map them in the matrix, and execute
          exception-based tests to securely log evidence of correct configurations.
        </p>
      </div>

      @if (initialLoading()) {
        <div class="flex-1 flex justify-center items-center">
          <i class="pi pi-spin pi-spinner text-4xl text-primary-500"></i>
        </div>
      } @else {
        <p-tabs value="roles" class="w-full flex-1 flex flex-col">
          <p-tablist>
            <p-tab value="roles">Roles Configure</p-tab>
            <p-tab value="permissions">Permissions Configure</p-tab>
            <p-tab value="mapping">Mapping Matrix</p-tab>
            <p-tab value="testing">Test Execution</p-tab>
          </p-tablist>

          <p-tabpanels>
            <p-tabpanel value="roles">
              <app-csv-roles-list
                [projectId]="projectId()"
                [roles]="roles()"
                [loading]="rolesLoading()"
                (roleAdded)="onAddRole($event)"
                (roleUpdated)="onUpdateRole($event)"
                (roleDeleted)="onDeleteRole($event)"
              />
            </p-tabpanel>

            <p-tabpanel value="permissions">
              <app-csv-permissions-list
                [projectId]="projectId()"
                [permissions]="permissions()"
                [loading]="permissionsLoading()"
                (permissionAdded)="onAddPermission($event)"
                (permissionUpdated)="onUpdatePermission($event)"
                (permissionDeleted)="onDeletePermission($event)"
              />
            </p-tabpanel>

            <p-tabpanel value="mapping">
              <div class="flex justify-end mb-4 gap-2">
                <p-button
                  label="Edit PDF"
                  icon="pi pi-pencil"
                  [outlined]="true"
                  size="small"
                  (click)="editPdf('csv.roles_permissions_matrix')"
                />
                <p-button
                  label="Generate PDF"
                  icon="pi pi-file-pdf"
                  [outlined]="true"
                  size="small"
                  [loading]="generatingPdf() === 'csv.roles_permissions_matrix'"
                  (click)="generatePdf('csv.roles_permissions_matrix')"
                />
              </div>
              <app-csv-role-permission-matrix
                [projectId]="projectId()"
                [roles]="roles()"
                [permissions]="permissions()"
                [mappings]="mappings()"
                (mappingUpdated)="onUpdateMapping($event)"
              />
            </p-tabpanel>

            <p-tabpanel value="testing">
              <div class="flex justify-end mb-4 gap-2">
                <p-button
                  label="Edit PDF"
                  icon="pi pi-pencil"
                  [outlined]="true"
                  size="small"
                  (click)="editPdf('csv.roles_permissions_testing')"
                />
                <p-button
                  label="Publish Results"
                  icon="pi pi-cloud-upload"
                  [outlined]="true"
                  size="small"
                  [loading]="publishingResults()"
                  (click)="openPublishDialog()"
                  pTooltip="Publish test results as PDF attachment"
                />
              </div>
              <app-csv-role-permission-testing
                [projectId]="projectId()"
                [roles]="roles()"
                [permissions]="permissions()"
                [mappings]="mappings()"
                [testResults]="testResults()"
                [loading]="loadingResults()"
                [savingResult]="savingResult()"
                (saveResult)="onSaveTestResult($event)"
              />
            </p-tabpanel>
          </p-tabpanels>
        </p-tabs>

        <p-dialog
          header="Publish Test Results"
          [(visible)]="publishDialogVisible"
          [modal]="true"
          [style]="{ width: '450px' }"
        >
          <div class="flex flex-col gap-4 py-4">
            <p class="m-0 text-surface-600 dark:text-surface-400">
              The test results will be published as a PDF attachment for this lifecycle project.
              Once published, a notification will be sent.
            </p>
            <div class="flex flex-col gap-2">
              <label for="attachment-name" class="font-semibold text-sm">Document Name</label>
              <input
                pInputText
                id="attachment-name"
                [(ngModel)]="attachmentName"
                class="w-full"
                placeholder="e.g. Test Results Roles & Permissions"
              />
            </div>
          </div>
          <ng-template pTemplate="footer">
            <div class="flex justify-end gap-2">
              <p-button
                label="Cancel"
                icon="pi pi-times"
                [text]="true"
                severity="secondary"
                (click)="publishDialogVisible.set(false)"
              />
              <p-button
                label="Publish"
                icon="pi pi-cloud-upload"
                (click)="publishTestResults()"
                [disabled]="!attachmentName.trim()"
                [loading]="publishingResults()"
              />
            </div>
          </ng-template>
        </p-dialog>
      }
    </div>
  `,
})
export class CsvRolesPermissionsWrapperComponent {
  readonly projectId = input.required<string>();
  readonly project = input<LifecycleProject>();

  private service = inject(RolesPermissionsService);
  private messageService = inject(MessageService);
  private reportsService = inject(ReportsService);
  private pdfTemplatesService = inject(PdfTemplatesService);
  private router = inject(Router);
  private orgService = inject(OrganizationService);
  private attachmentsService = inject(LifecycleAttachmentsService);
  private pdfJobService = inject(PdfJobService);

  readonly roles = signal<CsvRole[]>([]);
  readonly permissions = signal<CsvPermission[]>([]);
  readonly mappings = signal<CsvRolePermissionMapping[]>([]);
  readonly testResults = signal<CsvRolePermissionTestResult[]>([]);

  readonly initialLoading = signal(true);
  readonly rolesLoading = signal(false);
  readonly permissionsLoading = signal(false);
  readonly loadingResults = signal(false);
  readonly savingResult = signal(false);
  readonly generatingPdf = signal<string | null>(null);

  readonly publishDialogVisible = signal(false);
  readonly publishingResults = signal(false);
  protected attachmentName = 'Test Results Roles & Permissions';

  constructor() {
    effect(() => {
      const pid = this.projectId();
      if (pid) {
        this.loadAllData(pid);
      }
    });
  }

  private loadAllData(projectId: string) {
    this.initialLoading.set(true);

    // Subscribing to observables from service directly for live updates
    this.service
      .getRolesByProjectId(projectId)
      .pipe(
        tap((data) => this.roles.set(data)),
        catchError((err) => {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Error loading roles.',
          });
          console.error(err);
          return EMPTY;
        }),
      )
      .subscribe();

    this.service
      .getPermissionsByProjectId(projectId)
      .pipe(
        tap((data) => this.permissions.set(data)),
        catchError((err) => {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Error loading permissions.',
          });
          console.error(err);
          return EMPTY;
        }),
      )
      .subscribe();

    this.service
      .getMappingsByProjectId(projectId)
      .pipe(
        tap((data) => this.mappings.set(data)),
        catchError((err) => {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Error loading mappings.',
          });
          console.error(err);
          return EMPTY;
        }),
      )
      .subscribe();

    this.service
      .getTestResultsByProjectId(projectId)
      .pipe(
        tap((data) => {
          this.testResults.set(data);
          this.initialLoading.set(false);
        }),
        catchError((err) => {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Error loading test results.',
          });
          console.error(err);
          this.initialLoading.set(false);
          return EMPTY;
        }),
      )
      .subscribe();
  }

  // --- Roles Handlers ---
  async onAddRole(role: Partial<CsvRole>) {
    this.rolesLoading.set(true);
    try {
      const newRole = await firstValueFrom(this.service.addRole(role));
      this.roles.update((r) => [...r, newRole]);
      this.messageService.add({
        severity: 'success',
        summary: 'Success',
        detail: 'Role added successfully',
      });
    } catch {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to add role',
      });
    } finally {
      this.rolesLoading.set(false);
    }
  }

  async onUpdateRole(event: { id: string; data: Partial<CsvRole> }) {
    this.rolesLoading.set(true);
    try {
      const updatedRole = await firstValueFrom(this.service.updateRole(event.id, event.data));
      this.roles.update((r) => r.map((role) => (role.id === event.id ? updatedRole : role)));
      this.messageService.add({
        severity: 'success',
        summary: 'Success',
        detail: 'Role updated successfully',
      });
    } catch {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to update role',
      });
    } finally {
      this.rolesLoading.set(false);
    }
  }

  async onDeleteRole(id: string) {
    this.rolesLoading.set(true);
    try {
      await firstValueFrom(this.service.deleteRole(id));
      this.roles.update((r) => r.filter((role) => role.id !== id));
      this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Role deleted' });
    } catch {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to delete role',
      });
    } finally {
      this.rolesLoading.set(false);
    }
  }

  // --- Permissions Handlers ---
  async onAddPermission(permission: Partial<CsvPermission>) {
    this.permissionsLoading.set(true);
    try {
      const newPerm = await firstValueFrom(this.service.addPermission(permission));
      this.permissions.update((p) => [...p, newPerm]);
      this.messageService.add({
        severity: 'success',
        summary: 'Success',
        detail: 'Permission added',
      });
    } catch {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to add permission',
      });
    } finally {
      this.permissionsLoading.set(false);
    }
  }

  async onUpdatePermission(event: { id: string; data: Partial<CsvPermission> }) {
    this.permissionsLoading.set(true);
    try {
      const updatedPerm = await firstValueFrom(this.service.updatePermission(event.id, event.data));
      this.permissions.update((p) => p.map((perm) => (perm.id === event.id ? updatedPerm : perm)));
      this.messageService.add({
        severity: 'success',
        summary: 'Success',
        detail: 'Permission updated successfully',
      });
    } catch {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to update permission',
      });
    } finally {
      this.permissionsLoading.set(false);
    }
  }

  async onDeletePermission(id: string) {
    this.permissionsLoading.set(true);
    try {
      await firstValueFrom(this.service.deletePermission(id));
      this.permissions.update((p) => p.filter((perm) => perm.id !== id));
      this.messageService.add({
        severity: 'success',
        summary: 'Success',
        detail: 'Permission deleted',
      });
    } catch {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to delete permission',
      });
    } finally {
      this.permissionsLoading.set(false);
    }
  }

  // --- Matrix Mapping Handlers ---
  async onUpdateMapping(event: {
    roleId: string;
    permissionId: string;
    expectedAccess: 'Granted' | 'Restricted' | 'N/A';
  }) {
    try {
      const existingMapping = this.mappings().find(
        (m) => m.roleId === event.roleId && m.permissionId === event.permissionId,
      );

      if (existingMapping) {
        const updated = await firstValueFrom(
          this.service.saveMapping({
            ...existingMapping,
            expectedAccess: event.expectedAccess,
          }),
        );
        this.mappings.update((m) =>
          m.map((mapping) => (mapping.id === updated.id ? updated : mapping)),
        );
      } else {
        const added = await firstValueFrom(
          this.service.saveMapping({
            lifecycleProjectId: this.projectId(),
            roleId: event.roleId,
            permissionId: event.permissionId,
            expectedAccess: event.expectedAccess,
          }),
        );
        this.mappings.update((m) => [...m, added]);
      }
    } catch {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to update mapping access rule',
      });
    }
  }

  // --- Test Results Handlers ---
  async onSaveTestResult(event: {
    mappingId: string;
    actualResult: string;
    attachmentUrls: AttachmentCache[];
    status: 'Pass' | 'Fail' | 'Pending';
  }) {
    this.savingResult.set(true);
    try {
      const existingTest = this.testResults().find((tr) => tr.mappingId === event.mappingId);
      if (existingTest) {
        const updated = await firstValueFrom(
          this.service.saveTestResult({
            ...existingTest,
            actualResult: event.actualResult,
            status: event.status,
            attachmentUrls: event.attachmentUrls,
          }),
        );
        this.testResults.update((tr) => tr.map((t) => (t.id === updated.id ? updated : t)));
      } else {
        const added = await firstValueFrom(
          this.service.saveTestResult({
            lifecycleProjectId: this.projectId(),
            mappingId: event.mappingId,
            actualResult: event.actualResult,
            status: event.status,
            attachmentUrls: event.attachmentUrls,
          }),
        );
        this.testResults.update((tr) => [...tr, added]);
      }
      this.messageService.add({
        severity: 'success',
        summary: 'Success',
        detail: 'Test execution logged successfully',
      });
    } catch {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to save test result',
      });
    } finally {
      this.savingResult.set(false);
    }
  }

  // --- PDF Generation ---
  protected editPdf(templateCode: string): void {
    this.router.navigate(['/pdf-templates/editor'], {
      queryParams: { templateName: templateCode },
    });
  }

  protected async generatePdf(templateCode: string): Promise<void> {
    this.generatingPdf.set(templateCode);
    try {
      const template = await firstValueFrom(
        this.pdfTemplatesService.getTemplateByName(templateCode),
      );
      if (!template) throw new Error('Template not found');

      let items: unknown[] = [];
      const roles = this.roles();
      const perms = this.permissions();

      if (templateCode === 'csv.roles_permissions_matrix') {
        const mappings = this.mappings();
        items = mappings.map((m) => ({
          ...m,
          roleName: roles.find((r) => r.id === m.roleId)?.name,
          permissionName: perms.find((p) => p.id === m.permissionId)?.name,
        }));
      }

      const org = this.orgService.activeOrganization();
      const p = this.project();
      const systemInfo = p?.system
        ? {
            name: p.system.name,
            code: p.system.code,
            version: p.system.version,
            description: p.system.description,
            category: p.system.categoryCode?.toString(),
          }
        : {};

      const payload = {
        organization: org ? { id: org.id, name: org.name } : null,
        lifecycle: p
          ? {
              code: p.code,
              type: p.type,
              status: p.status,
              startDate: p.startDate,
              targetCompletionDate: p.targetCompletionDate,
              actualCompletionDate: p.actualCompletionDate,
              assignedTo: p.assignedTo,
              assignedToName: p.assignedToName,
              notes: p.notes,
            }
          : null,
        system: systemInfo,
        items,
        roles,
        permissions: perms,
        mappings: this.mappings(),
        testResults: this.testResults(),
      };

      const pdfOptions = template.options
        ? {
            ...template.options,
            title: systemInfo.name ? `${systemInfo.name} - ${templateCode}` : templateCode,
            marginTop: template.options.marginTop + 'mm',
            marginBottom: template.options.marginBottom + 'mm',
            marginLeft: template.options.marginLeft + 'mm',
            marginRight: template.options.marginRight + 'mm',
          }
        : { title: templateCode };

      const blob = await firstValueFrom(
        this.reportsService.renderRaw({
          html: template.html,
          css: template.css,
          header: template.header,
          footer: template.footer,
          options: pdfOptions as PDFOptions,
          data: payload,
        }),
      );

      const url = URL.createObjectURL(blob);
      this.router.navigate(['/pdf-viewer'], { queryParams: { src: url } });
    } catch (err) {
      console.error('Failed to generate PDF', err);
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to generate PDF',
      });
    } finally {
      this.generatingPdf.set(null);
    }
  }

  // --- Publishing Test Results ---
  protected openPublishDialog(): void {
    const p = this.project();
    this.publishDialogVisible.set(true);
  }

  protected async publishTestResults(): Promise<void> {
    const p = this.project();
    if (!p) return;

    const name = this.attachmentName.trim();
    if (!name) return;

    this.publishingResults.set(true);
    this.publishDialogVisible.set(false);

    try {
      const templateCode = 'csv.roles_permissions_testing';
      const template = await firstValueFrom(
        this.pdfTemplatesService.getTemplateByName(templateCode),
      );
      if (!template) throw new Error('Template not found');

      const roles = this.roles();
      const perms = this.permissions();
      const testResults = this.testResults();
      const mappings = this.mappings();
      const items = testResults.map((tr) => {
        const m = mappings.find((mapped) => mapped.id === tr.mappingId);
        return {
          ...tr,
          roleName: m ? roles.find((r) => r.id === m.roleId)?.name : '',
          permissionName: m ? perms.find((p) => p.id === m.permissionId)?.name : '',
          expectedAccess: m?.expectedAccess,
        };
      });

      const org = this.orgService.activeOrganization();
      const systemInfo = p.system
        ? {
            name: p.system.name,
            code: p.system.code,
            version: p.system.version,
            description: p.system.description,
            category: p.system.categoryCode?.toString(),
          }
        : {};

      const payload = {
        organization: org ? { id: org.id, name: org.name } : null,
        lifecycle: {
          code: p.code,
          type: p.type,
          status: p.status,
          startDate: p.startDate,
          targetCompletionDate: p.targetCompletionDate,
          actualCompletionDate: p.actualCompletionDate,
          assignedTo: p.assignedTo,
          assignedToName: p.assignedToName,
          notes: p.notes,
        },
        system: systemInfo,
        items,
        roles,
        permissions: perms,
        mappings: this.mappings(),
        testResults: this.testResults(),
      };

      const pdfOptions = template.options
        ? {
            ...template.options,
            title: systemInfo.name ? `${systemInfo.name} - ${templateCode}` : templateCode,
            marginTop: template.options.marginTop + 'mm',
            marginBottom: template.options.marginBottom + 'mm',
            marginLeft: template.options.marginLeft + 'mm',
            marginRight: template.options.marginRight + 'mm',
          }
        : { title: templateCode };

      const fileUuid = crypto.randomUUID();
      const objectName = `lifecycle-projects/${p.id}/attachments/${fileUuid}.pdf`;
      const actionUrl = `/csv/lifecycle/${p.id}/attachments`;

      await firstValueFrom(
        this.attachmentsService.createAttachment({
          lifecycleProjectId: p.id,
          name,
          objectName,
          status: 'publishing',
          contentType: 'application/pdf',
        }),
      );

      await firstValueFrom(
        this.pdfJobService.submitPdfJob({
          object_name: objectName,
          action_url: actionUrl,
          html: template.html,
          css: template.css,
          header: template.header,
          footer: template.footer,
          options: pdfOptions as unknown as Record<string, unknown>,
          data: payload as unknown as Record<string, unknown>,
        }),
      );

      this.messageService.add({
        severity: 'success',
        summary: 'Publishing',
        detail: `"${name}" is being published. You will receive a notification when it's ready.`,
      });
    } catch (err) {
      console.error('Failed to publish test results', err);
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to publish test results.',
      });
    } finally {
      this.publishingResults.set(false);
    }
  }
}
