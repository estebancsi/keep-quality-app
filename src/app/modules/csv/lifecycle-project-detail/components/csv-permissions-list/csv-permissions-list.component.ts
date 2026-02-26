import {
  Component,
  ChangeDetectionStrategy,
  input,
  output,
  inject,
  signal,
  computed,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { FormsModule } from '@angular/forms';
import { CsvPermission } from '../../../roles-permissions.interface';
import { RolesPermissionsService } from '../../../services/roles-permissions.service';
import { ConfirmationService } from 'primeng/api';
import { ConfirmDialogModule } from 'primeng/confirmdialog';

@Component({
  selector: 'app-csv-permissions-list',
  standalone: true,
  imports: [
    CommonModule,
    ButtonModule,
    TableModule,
    DialogModule,
    InputTextModule,
    FormsModule,
    ConfirmDialogModule,
  ],
  providers: [ConfirmationService],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex justify-between items-center mb-4">
      <h3 class="text-xl font-semibold text-surface-900 dark:text-surface-0 m-0">
        Project Permissions
      </h3>
      <p-button label="Add Permission" icon="pi pi-plus" size="small" (click)="openDialog()" />
    </div>

    <p-table
      [value]="permissions()"
      [loading]="loading()"
      styleClass="p-datatable-sm"
      responsiveLayout="scroll"
    >
      <ng-template pTemplate="header">
        <tr>
          <th>Permission Name</th>
          <th>Description</th>
          <th class="w-[100px] text-center">Actions</th>
        </tr>
      </ng-template>
      <ng-template pTemplate="body" let-permission>
        <tr>
          <td class="font-medium">{{ permission.name }}</td>
          <td>{{ permission.description }}</td>
          <td class="text-center">
            <div class="flex justify-center gap-2">
              <p-button
                icon="pi pi-pencil"
                [text]="true"
                [rounded]="true"
                severity="info"
                size="small"
                (click)="openDialog(permission)"
              />
              <p-button
                icon="pi pi-trash"
                [text]="true"
                [rounded]="true"
                severity="danger"
                size="small"
                (click)="confirmDelete(permission)"
              />
            </div>
          </td>
        </tr>
      </ng-template>
      <ng-template pTemplate="empty">
        <tr>
          <td colspan="3" class="text-center text-surface-500 p-4">
            No permissions configured for this project yet.
          </td>
        </tr>
      </ng-template>
    </p-table>

    <!-- Add/Edit Dialog -->
    <p-dialog
      [(visible)]="dialogVisible"
      [header]="editingId() ? 'Edit Permission' : 'New Permission'"
      [modal]="true"
      styleClass="w-[450px]"
    >
      <div class="flex flex-col gap-4 py-4">
        <div class="flex flex-col gap-2">
          <label for="name" class="font-semibold"
            >Permission Name <span class="text-red-500">*</span></label
          >
          <input pInputText id="name" [(ngModel)]="formData.name" autocomplete="off" />
        </div>
        <div class="flex flex-col gap-2">
          <label for="description" class="font-semibold">Description</label>
          <input
            pInputText
            id="description"
            [(ngModel)]="formData.description"
            autocomplete="off"
          />
        </div>
      </div>
      <ng-template pTemplate="footer">
        <p-button
          label="Cancel"
          icon="pi pi-times"
          [text]="true"
          severity="secondary"
          (click)="dialogVisible.set(false)"
        />
        <p-button
          label="Save"
          icon="pi pi-check"
          [text]="true"
          (click)="savePermission()"
          [loading]="saving()"
          [disabled]="!formData.name.trim()"
        />
      </ng-template>
    </p-dialog>
    <p-confirmDialog [style]="{ width: '450px' }" />
  `,
})
export class CsvPermissionsListComponent {
  readonly projectId = input.required<string>();
  readonly permissions = input.required<CsvPermission[]>();
  readonly loading = input<boolean>(false);

  readonly permissionAdded = output<Omit<CsvPermission, 'id' | 'createdAt' | 'updatedAt'>>();
  readonly permissionUpdated = output<{ id: string; data: Partial<CsvPermission> }>();
  readonly permissionDeleted = output<string>();

  private service = inject(RolesPermissionsService);
  private confirmationService = inject(ConfirmationService);

  readonly dialogVisible = signal(false);
  readonly editingId = signal<string | null>(null);
  readonly saving = signal(false);

  formData = {
    name: '',
    description: '',
  };

  openDialog(permission?: CsvPermission) {
    if (permission) {
      this.editingId.set(permission.id);
      this.formData = { name: permission.name, description: permission.description || '' };
    } else {
      this.editingId.set(null);
      this.formData = { name: '', description: '' };
    }
    this.dialogVisible.set(true);
  }

  savePermission() {
    if (!this.formData.name.trim()) return;

    this.saving.set(true);
    const id = this.editingId();

    if (id) {
      this.permissionUpdated.emit({ id, data: { ...this.formData } });
    } else {
      this.permissionAdded.emit({
        lifecycleProjectId: this.projectId(),
        ...this.formData,
      });
    }
    this.dialogVisible.set(false);
    this.saving.set(false);
  }

  confirmDelete(permission: CsvPermission) {
    this.confirmationService.confirm({
      message: `Are you sure you want to delete the permission "${permission.name}"? This will also remove any mappings and test results associated with it.`,
      header: 'Confirm Deletion',
      icon: 'pi pi-exclamation-triangle',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.permissionDeleted.emit(permission.id);
      },
    });
  }
}
