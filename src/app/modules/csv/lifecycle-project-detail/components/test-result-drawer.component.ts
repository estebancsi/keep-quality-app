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
import { EditorInitEvent, EditorModule } from 'primeng/editor';
import { ButtonModule } from 'primeng/button';
import { TestStep } from '../../test-protocol.interface';
import { StorageService, SignedUrlResponse } from '@/core/services/storage.service';
import { AttachmentUtilsService } from '@/core/utils/attachment.utils';
import { AttachmentCache } from '@/core/interfaces/attachment.interface';
import { lastValueFrom } from 'rxjs';
import { Editor } from 'primeng/editor';
import Quill from 'quill';

@Component({
  selector: 'app-test-result-drawer',
  imports: [CommonModule, FormsModule, DrawerModule, EditorModule, ButtonModule],
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
              <p-editor
                #editor
                [(ngModel)]="editActualResult"
                class="grow"
                [style]="{ minHeight: '250px' }"
                (onInit)="onEditorInit($event)"
              >
                <ng-template #header>
                  <span class="ql-formats">
                    <button type="button" class="ql-bold" aria-label="Bold"></button>
                    <button type="button" class="ql-italic" aria-label="Italic"></button>
                    <button type="button" class="ql-underline" aria-label="Underline"></button>
                  </span>
                  <span class="ql-formats">
                    <button
                      type="button"
                      class="ql-list"
                      value="ordered"
                      aria-label="Ordered list"
                    ></button>
                    <button
                      type="button"
                      class="ql-list"
                      value="bullet"
                      aria-label="Bullet list"
                    ></button>
                  </span>
                  <span class="ql-formats">
                    <button type="button" class="ql-image" aria-label="Image"></button>
                  </span>
                </ng-template>
              </p-editor>
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
                @if (step()?.actualResult) {
                  <div class="rich-text-content" [innerHTML]="step()?.actualResult"></div>
                } @else {
                  <span class="text-surface-400 italic">Click to add actual result...</span>
                }
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
  protected currentAttachmentUrls: AttachmentCache[] = [];

  private storageService = inject(StorageService);
  private attachmentUtils = inject(AttachmentUtilsService);

  editor = viewChild<Editor>('editor');

  constructor() {
    effect(async () => {
      const currentStep = this.step();

      const isVisible = this.visible();
      // Auto-start edit mode if there is no actual result yet when the drawer is opened.
      if (isVisible && currentStep) {
        // Prepare attachments
        this.currentAttachmentUrls = [...(currentStep.attachmentUrls || [])];

        // Refresh expired signed URLs
        if (this.currentAttachmentUrls.length > 0) {
          const didRefresh = await this.attachmentUtils.ensureAttachmentsFresh(
            this.currentAttachmentUrls,
          );
          if (didRefresh) {
            // Need to update the actualResult HTML to point to the new URLs
            let updatedHtml = currentStep.actualResult || '';
            for (const att of this.currentAttachmentUrls) {
              // Simple regex replacement for the src attribute where data-object-name matches
              const regex = new RegExp(
                `(<img[^>]*data-object-name=["']${this.escapeRegExp(att.objectName)}["'][^>]*src=["'])([^"']*)(["'][^>]*>)`,
                'g',
              );
              updatedHtml = updatedHtml.replace(regex, `$1${att.publicUrl}$3`);
            }
            // Temporarily mutate the step to hold the updated HTML so it renders correctly
            if (currentStep.actualResult !== updatedHtml) {
              currentStep.actualResult = updatedHtml;
            }
          }
        }

        if (!currentStep.actualResult) {
          this.startEdit();
        } else {
          this.editMode.set(false);
          this.editActualResult = currentStep.actualResult;
        }
      }
    });
  }

  private escapeRegExp(string: string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
  }

  onEditorInit(event: EditorInitEvent) {
    const quill = event.editor;
    const toolbar = quill.getModule('toolbar') as any;

    toolbar.addHandler('image', () => {
      const input = document.createElement('input');
      input.setAttribute('type', 'file');
      input.setAttribute('accept', 'image/*');
      input.style.display = 'none';
      document.body.appendChild(input);
      input.click();

      input.onchange = async () => {
        document.body.removeChild(input);
        const file = input.files ? input.files[0] : null;
        if (file) {
          await this.uploadAndInsertImage(file, quill);
        }
      };
    });

    // Handle paste events for images using capture phase to intercept before Quill
    quill.root.addEventListener(
      'paste',
      async (e: ClipboardEvent) => {
        const items = e.clipboardData?.items;
        if (!items) return;

        let hasImage = false;
        for (const item of Array.from(items)) {
          if (item.type.indexOf('image') !== -1) {
            hasImage = true;
            break;
          }
        }

        if (hasImage) {
          // Prevent Quill from processing this paste event
          e.preventDefault();
          e.stopPropagation();

          for (const item of Array.from(items)) {
            if (item.type.indexOf('image') !== -1) {
              const file = item.getAsFile();
              if (file) {
                await this.uploadAndInsertImage(file, quill);
              }
            }
          }
        }
      },
      true, // useCapture: true ensures this runs before Quill's own paste listeners
    );
  }

  private async uploadAndInsertImage(file: File, quill: Quill) {
    try {
      const stepId = this.step()?.id || 'new';
      const filename = `${crypto.randomUUID()}-${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;
      const objectName = `test-steps/${stepId}/${filename}`;

      // 1. Get upload signed URL
      const uploadData = (await lastValueFrom(
        this.storageService.getUploadUrl(objectName, file.type),
      )) as SignedUrlResponse;

      // 2. Upload the file
      await lastValueFrom(this.storageService.uploadFileToSignedUrl(file, uploadData.url));

      // 3. Get download signed URL
      const downloadData = (await lastValueFrom(
        this.storageService.getDownloadUrl(objectName),
      )) as SignedUrlResponse;

      // 4. Add to cache
      const cacheItem: AttachmentCache = {
        objectName,
        publicUrl: downloadData.url,
        expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
      };
      this.currentAttachmentUrls.push(cacheItem);

      // 5. Insert image into editor
      const range = quill.getSelection(true);
      quill.insertEmbed(range.index, 'image', downloadData.url);

      // Update the range to be after the inserted image
      quill.setSelection(range.index + 1);
    } catch (e) {
      console.error('Upload failed', e);
      // Optionally, show a toast error
    }
  }

  getFilename(objectName: string): string {
    const parts = objectName.split('/');
    return parts[parts.length - 1];
  }

  startEdit() {
    this.editActualResult = this.step()?.actualResult || '';
    this.currentAttachmentUrls = [...(this.step()?.attachmentUrls || [])];
    this.editMode.set(true);
  }

  cancelEdit() {
    this.editMode.set(false);
  }

  async saveEdit() {
    const s = this.step();
    if (s) {
      // Find which images were deleted by checking the src attributes
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = this.editActualResult;
      const imagesInHtml = Array.from(tempDiv.querySelectorAll('img'));
      const urlsInHtml = imagesInHtml
        .map((img) => img.getAttribute('src'))
        .filter((src): src is string => !!src);

      const deletedAttachments = this.currentAttachmentUrls.filter(
        (att) => !urlsInHtml.includes(att.publicUrl),
      );

      // Clean up deleted images from storage
      for (const att of deletedAttachments) {
        try {
          await lastValueFrom(this.storageService.deleteFile(att.objectName));
        } catch (e) {
          console.error(`Failed to delete object: ${att.objectName}`, e);
        }
      }

      // Update current attachments to reflect deletions
      this.currentAttachmentUrls = this.currentAttachmentUrls.filter((att) =>
        urlsInHtml.includes(att.publicUrl),
      );

      this.save.emit({
        stepId: s.id,
        actualResult: this.editActualResult,
        attachmentUrls: this.currentAttachmentUrls,
      });
    }
  }

  close() {
    this.visible.set(false);
    this.editMode.set(false);
  }
}
