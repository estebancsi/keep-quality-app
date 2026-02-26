import {
  Component,
  ChangeDetectionStrategy,
  input,
  output,
  model,
  effect,
  signal,
  viewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DrawerModule } from 'primeng/drawer';
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import {
  CsvRole,
  CsvPermission,
  CsvRolePermissionMapping,
  CsvRolePermissionTestResult,
} from '../../../roles-permissions.interface';
import { RichTextEditorComponent } from '@/shared/components/rich-text-editor/rich-text-editor.component';
import { RichTextViewerComponent } from '@/shared/components/rich-text-viewer/rich-text-viewer.component';
import { AttachmentCache } from '@/core/interfaces/attachment.interface';

@Component({
  selector: 'app-csv-role-permission-test-drawer',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    DrawerModule,
    RichTextEditorComponent,
    RichTextViewerComponent,
    ButtonModule,
    SelectModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    :host ::ng-deep .p-editor-content img,
    :host ::ng-deep .rich-text-content img {
      max-width: 100% !important;
      height: auto !important;
    }
  `,
  template: `
    <p-drawer
      [(visible)]="visible"
      position="right"
      header="Role & Permission Execution"
      styleClass="w-[65%] min-w-[500px]"
      (onHide)="close()"
    >
      @if (mapping() && role() && permission()) {
        <div class="flex flex-col gap-4">
          <div class="text-sm border-b border-surface-200 dark:border-surface-700 pb-4">
            <h4 class="font-semibold text-primary-600 m-0 mb-2">Testing Context</h4>
            <div class="grid grid-cols-2 gap-4">
              <div>
                <strong class="text-surface-700 dark:text-surface-300 block">Role</strong>
                <span class="text-surface-600 dark:text-surface-400">{{ role()?.name }}</span>
              </div>
              <div>
                <strong class="text-surface-700 dark:text-surface-300 block">Permission</strong>
                <span class="text-surface-600 dark:text-surface-400">{{ permission()?.name }}</span>
              </div>
              <div>
                <strong class="text-surface-700 dark:text-surface-300 block"
                  >Expected Access</strong
                >
                <span
                  class="font-medium px-2 py-1 rounded text-xs"
                  [ngClass]="{
                    'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400':
                      mapping()?.expectedAccess === 'Granted',
                    'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400':
                      mapping()?.expectedAccess === 'Restricted',
                    'bg-surface-100 text-surface-700 dark:bg-surface-800 dark:text-surface-400':
                      mapping()?.expectedAccess === 'N/A',
                  }"
                  >{{ mapping()?.expectedAccess }}</span
                >
              </div>
            </div>
          </div>

          <div class="flex flex-col gap-2 flex-1 mt-2">
            <div class="font-semibold text-sm flex justify-between items-center">
              <span>Actual Result / Exception Evidence</span>
              <p-select
                [options]="statusOptions"
                [(ngModel)]="currentStatus"
                placeholder="Select Status"
                styleClass="w-[150px] p-select-sm"
              >
                <ng-template #selectedItem let-option>
                  <div
                    class="flex items-center gap-2 font-medium"
                    [ngClass]="getStatusColor(option)"
                  >
                    <span>{{ option }}</span>
                  </div>
                </ng-template>
                <ng-template #item let-option>
                  <div
                    class="flex items-center gap-2 font-medium"
                    [ngClass]="getStatusColor(option)"
                  >
                    <span>{{ option }}</span>
                  </div>
                </ng-template>
              </p-select>
            </div>

            <p class="text-xs text-surface-500 mb-2">
              Evidence-based reporting: Upload images or screenshots to document the test result and
              support the outcome.
            </p>

            @if (editMode()) {
              <app-rich-text-editor
                #editor
                [(ngModel)]="editActualResult"
                [(attachments)]="currentAttachmentUrls"
                [storagePrefix]="
                  'roles-permissions-tests/' + (testResult()?.id || mapping()?.id || 'new')
                "
                class="grow"
              />
              <div class="flex gap-2">
                <p-button
                  label="Save Result"
                  icon="pi pi-check"
                  size="small"
                  (click)="saveEdit()"
                  [loading]="saving()"
                />
                <p-button
                  label="Cancel"
                  icon="pi pi-times"
                  size="small"
                  severity="secondary"
                  [outlined]="true"
                  (click)="cancelEdit()"
                />
              </div>
            } @else {
              <div
                class="cursor-pointer min-h-[150px] p-3 rounded border border-surface-200 dark:border-surface-700 hover:bg-surface-50 dark:hover:bg-surface-800 transition-colors"
                (click)="startEdit()"
                tabindex="0"
                (keydown.enter)="startEdit()"
                aria-label="Edit actual result"
              >
                <app-rich-text-viewer
                  [content]="testResult()?.actualResult || ''"
                  [attachments]="testResult()?.attachmentUrls || []"
                  placeholder="Click to add evidence / outcome details..."
                />
              </div>
            }
          </div>

          @if (testResult()?.attachmentUrls?.length) {
            <div class="flex flex-col gap-2 mt-4 text-sm">
              <strong class="text-primary-600">Attachments:</strong>
              <div class="flex flex-wrap gap-2">
                @for (attachment of testResult()?.attachmentUrls; track attachment.objectName) {
                  <a
                    [href]="attachment.publicUrl"
                    target="_blank"
                    class="flex items-center gap-2 p-2 rounded border border-surface-200 dark:border-surface-700 hover:bg-surface-50 dark:hover:bg-surface-800 transition-colors text-surface-600 dark:text-surface-400 no-underline"
                  >
                    <i class="pi pi-image"></i>
                    <span class="truncate max-w-[200px]">{{
                      getFilename(attachment.objectName)
                    }}</span>
                  </a>
                }
              </div>
            </div>
          }
        </div>
      }
    </p-drawer>
  `,
})
export class CsvRolePermissionTestDrawerComponent {
  readonly visible = model<boolean>(false);
  readonly mapping = input<CsvRolePermissionMapping | null>(null);
  readonly role = input<CsvRole | null>(null);
  readonly permission = input<CsvPermission | null>(null);
  readonly testResult = input<CsvRolePermissionTestResult | null>(null);
  readonly saving = input<boolean>(false);

  readonly save = output<{
    mappingId: string;
    actualResult: string;
    attachmentUrls: AttachmentCache[];
    status: 'Pass' | 'Fail' | 'Pending';
  }>();

  readonly statusOptions = ['Pending', 'Pass', 'Fail'];

  protected readonly editMode = signal(false);
  protected editActualResult = '';
  protected currentAttachmentUrls = signal<AttachmentCache[]>([]);
  protected currentStatus: 'Pass' | 'Fail' | 'Pending' = 'Pending';

  editor = viewChild<RichTextEditorComponent>('editor');

  constructor() {
    effect(async () => {
      const currentResult = this.testResult();
      const currentMapping = this.mapping();
      const isVisible = this.visible();

      if (isVisible && currentMapping) {
        if (currentResult) {
          this.currentStatus = currentResult.status || 'Pending';
          this.currentAttachmentUrls.set([...(currentResult.attachmentUrls || [])]);
          this.editMode.set(false);
          this.editActualResult = currentResult.actualResult || '';
        } else {
          this.currentStatus = 'Pending';
          this.startEdit();
        }
      }
    });
  }

  getFilename(objectName: string): string {
    const parts = objectName.split('/');
    return parts[parts.length - 1];
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'Pass':
        return 'text-green-600 dark:text-green-400';
      case 'Fail':
        return 'text-red-600 dark:text-red-400';
      default:
        return 'text-surface-600 dark:text-surface-400';
    }
  }

  startEdit() {
    this.editActualResult = this.testResult()?.actualResult || '';
    this.currentAttachmentUrls.set([...(this.testResult()?.attachmentUrls || [])]);
    this.editMode.set(true);
  }

  cancelEdit() {
    if (this.testResult()) {
      this.editMode.set(false);
    } else {
      // If there was no previous result and they cancel, just close the drawer
      this.visible.set(false);
      this.editMode.set(false);
    }
  }

  async saveEdit() {
    const m = this.mapping();
    if (m) {
      if (this.editor()) {
        const updatedAttachments = await this.editor()!.cleanupDeletedImages();
        this.currentAttachmentUrls.set(updatedAttachments);
      }

      this.save.emit({
        mappingId: m.id,
        actualResult: this.editActualResult,
        attachmentUrls: this.currentAttachmentUrls(),
        status: this.currentStatus,
      });
    }
  }

  close() {
    this.visible.set(false);
    this.editMode.set(false);
  }
}
