import {
  Component,
  input,
  output,
  model,
  effect,
  ChangeDetectionStrategy,
  signal,
  viewChild,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DrawerModule } from 'primeng/drawer';
import { ButtonModule } from 'primeng/button';
import { TestStep } from '../../test-protocol.interface';
import { AttachmentUtilsService } from '@/core/utils/attachment.utils';
import { AttachmentCache } from '@/core/interfaces/attachment.interface';
import { RichTextEditorComponent } from '@/shared/components/rich-text-editor/rich-text-editor.component';
import { RichTextViewerComponent } from '@/shared/components/rich-text-viewer/rich-text-viewer.component';

@Component({
  selector: 'app-test-result-drawer',
  imports: [
    CommonModule,
    FormsModule,
    DrawerModule,
    RichTextEditorComponent,
    RichTextViewerComponent,
    ButtonModule,
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
      header="Test Step Result"
      styleClass="w-[65%] min-w-[500px]"
      (onHide)="close()"
    >
      @if (step()) {
        <div class="flex flex-col gap-4">
          <div class="text-sm">
            <h4 class="font-semibold text-primary-600 m-0 mb-1">Step {{ step()?.stepNumber }}</h4>
            <p class="m-0 text-surface-600 dark:text-surface-400 whitespace-pre-wrap">
              {{ step()?.action }}
            </p>
          </div>

          <div class="text-sm">
            <strong class="text-primary-600">Expected Result:</strong>
            <p class="m-0 text-surface-600 dark:text-surface-400 whitespace-pre-wrap">
              {{ step()?.expectedResult }}
            </p>
          </div>

          @if (step()?.dataToRecord) {
            <div class="text-sm">
              <strong class="text-primary-600">Data to Record:</strong>
              <p class="m-0 text-surface-600 dark:text-surface-400">{{ step()?.dataToRecord }}</p>
            </div>
          }

          <div class="flex flex-col gap-2 flex-1 mt-4">
            <div class="font-semibold text-sm">Actual Result</div>
            @if (editMode()) {
              <app-rich-text-editor
                #editor
                [(ngModel)]="editActualResult"
                [(attachments)]="currentAttachmentUrls"
                [storagePrefix]="'test-steps/' + (step()?.id || 'new')"
                class="grow"
              />
              <div class="flex gap-2">
                <p-button
                  label="Save"
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
                  [content]="step()?.actualResult || ''"
                  [attachments]="step()?.attachmentUrls || []"
                  placeholder="Click to add actual result..."
                />
              </div>
            }
          </div>

          @if (step()?.attachmentUrls?.length) {
            <div class="flex flex-col gap-2 mt-4 text-sm">
              <strong class="text-primary-600">Attachments:</strong>
              <div class="flex flex-wrap gap-2">
                @for (attachment of step()?.attachmentUrls; track attachment.objectName) {
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
export class TestResultDrawerComponent {
  readonly visible = model<boolean>(false);
  readonly step = input<TestStep | null>(null);
  readonly saving = input<boolean>(false);

  readonly save = output<{
    stepId: string;
    actualResult: string;
    attachmentUrls: AttachmentCache[];
  }>();

  protected readonly editMode = signal(false);
  protected editActualResult = '';
  protected currentAttachmentUrls = signal<AttachmentCache[]>([]);

  private attachmentUtils = inject(AttachmentUtilsService);

  editor = viewChild<RichTextEditorComponent>('editor');

  constructor() {
    effect(async () => {
      const currentStep = this.step();

      const isVisible = this.visible();
      // Auto-start edit mode if there is no actual result yet when the drawer is opened.
      if (isVisible && currentStep) {
        // Prepare attachments
        this.currentAttachmentUrls.set([...(currentStep.attachmentUrls || [])]);

        if (!currentStep.actualResult) {
          this.startEdit();
        } else {
          this.editMode.set(false);
          this.editActualResult = currentStep.actualResult;
        }
      }
    });
  }

  getFilename(objectName: string): string {
    const parts = objectName.split('/');
    return parts[parts.length - 1];
  }

  startEdit() {
    this.editActualResult = this.step()?.actualResult || '';
    this.currentAttachmentUrls.set([...(this.step()?.attachmentUrls || [])]);
    this.editMode.set(true);
  }

  cancelEdit() {
    this.editMode.set(false);
  }

  async saveEdit() {
    const s = this.step();
    if (s) {
      if (this.editor()) {
        const updatedAttachments = await this.editor()!.cleanupDeletedImages();
        this.currentAttachmentUrls.set(updatedAttachments);
      }

      this.save.emit({
        stepId: s.id,
        actualResult: this.editActualResult,
        attachmentUrls: this.currentAttachmentUrls(),
      });
    }
  }

  close() {
    this.visible.set(false);
    this.editMode.set(false);
  }
}
