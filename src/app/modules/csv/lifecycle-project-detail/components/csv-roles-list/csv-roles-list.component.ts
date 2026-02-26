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
import { CsvRole } from '../../../roles-permissions.interface';
import { RolesPermissionsService } from '../../../services/roles-permissions.service';
import { ConfirmationService } from 'primeng/api';
import { ConfirmDialogModule } from 'primeng/confirmdialog';

@Component({
  selector: 'app-csv-roles-list',
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
      <h3 class="text-xl font-semibold text-surface-900 dark:text-surface-0 m-0">Project Roles</h3>
      <p-button label="Add Role" icon="pi pi-plus" size="small" (click)="openDialog()" />
    </div>

    <p-table
      [value]="roles()"
      [loading]="loading()"
      styleClass="p-datatable-sm"
      responsiveLayout="scroll"
    >
      <ng-template pTemplate="header">
        <tr>
          <th>Role Name</th>
          <th>Description</th>
          <th class="w-[100px] text-center">Actions</th>
        </tr>
      </ng-template>
      <ng-template pTemplate="body" let-role>
        <tr>
          <td class="font-medium">{{ role.name }}</td>
          <td>{{ role.description }}</td>
          <td class="text-center">
            <div class="flex justify-center gap-2">
              <p-button
                icon="pi pi-pencil"
                [text]="true"
                [rounded]="true"
                severity="info"
                size="small"
                (click)="openDialog(role)"
              />
              <p-button
                icon="pi pi-trash"
                [text]="true"
                [rounded]="true"
                severity="danger"
                size="small"
                (click)="confirmDelete(role)"
              />
            </div>
          </td>
        </tr>
      </ng-template>
      <ng-template pTemplate="empty">
        <tr>
          <td colspan="3" class="text-center text-surface-500 p-4">
            No roles configured for this project yet.
          </td>
        </tr>
      </ng-template>
    </p-table>

    <!-- Add/Edit Dialog -->
    <p-dialog
      [(visible)]="dialogVisible"
      [header]="editingId() ? 'Edit Role' : 'New Role'"
      [modal]="true"
      styleClass="w-[450px]"
    >
      <div class="flex flex-col gap-4 py-4">
        <div class="flex flex-col gap-2">
          <label for="name" class="font-semibold"
            >Role Name <span class="text-red-500">*</span></label
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
          (click)="saveRole()"
          [loading]="saving()"
          [disabled]="!formData.name.trim()"
        />
      </ng-template>
    </p-dialog>
    <p-confirmDialog [style]="{ width: '450px' }" />
  `,
})
export class CsvRolesListComponent {
  readonly projectId = input.required<string>();
  readonly roles = input.required<CsvRole[]>();
  readonly loading = input<boolean>(false);

  readonly roleAdded = output<Omit<CsvRole, 'id' | 'createdAt' | 'updatedAt'>>();
  readonly roleUpdated = output<{ id: string; data: Partial<CsvRole> }>();
  readonly roleDeleted = output<string>();

  private service = inject(RolesPermissionsService);
  private confirmationService = inject(ConfirmationService);

  readonly dialogVisible = signal(false);
  readonly editingId = signal<string | null>(null);
  readonly saving = signal(false);

  formData = {
    name: '',
    description: '',
  };

  openDialog(role?: CsvRole) {
    if (role) {
      this.editingId.set(role.id);
      this.formData = { name: role.name, description: role.description || '' };
    } else {
      this.editingId.set(null);
      this.formData = { name: '', description: '' };
    }
    this.dialogVisible.set(true);
  }

  saveRole() {
    if (!this.formData.name.trim()) return;

    this.saving.set(true);
    const id = this.editingId();

    if (id) {
      this.roleUpdated.emit({ id, data: { ...this.formData } });
    } else {
      this.roleAdded.emit({
        lifecycleProjectId: this.projectId(),
        ...this.formData,
      });
    }
    this.dialogVisible.set(false);
    this.saving.set(false);
  }

  confirmDelete(role: CsvRole) {
    this.confirmationService.confirm({
      message: `Are you sure you want to delete the role "${role.name}"? This will also remove any permission mappings and test results associated with it.`,
      header: 'Confirm Deletion',
      icon: 'pi pi-exclamation-triangle',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.roleDeleted.emit(role.id);
      },
    });
  }
}
