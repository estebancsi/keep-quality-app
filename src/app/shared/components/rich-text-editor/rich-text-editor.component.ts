import {
  Component,
  ChangeDetectionStrategy,
  inject,
  input,
  model,
  forwardRef,
  viewChild,
  ChangeDetectorRef,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, FormsModule, NG_VALUE_ACCESSOR } from '@angular/forms';
import { EditorInitEvent, EditorModule, Editor, EditorTextChangeEvent } from 'primeng/editor';
import { StorageService, SignedUrlResponse } from '@/core/services/storage.service';
import { AttachmentCache } from '@/core/interfaces/attachment.interface';
import { AttachmentUtilsService } from '@/core/utils/attachment.utils';
import { lastValueFrom } from 'rxjs';
import Quill from 'quill';

@Component({
  selector: 'app-rich-text-editor',
  standalone: true,
  imports: [CommonModule, FormsModule, EditorModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => RichTextEditorComponent),
      multi: true,
    },
  ],
  template: `
    <p-editor
      #editor
      [ngModel]="content()"
      (onTextChange)="onEditorTextChange($event)"
      [style]="style()"
      class="w-full flex flex-col"
      (onInit)="onEditorInit($event)"
    >
      <ng-template #header>
        <span class="ql-formats">
          <button type="button" class="ql-bold" aria-label="Bold"></button>
          <button type="button" class="ql-italic" aria-label="Italic"></button>
          <button type="button" class="ql-underline" aria-label="Underline"></button>
        </span>
        <span class="ql-formats">
          <button type="button" class="ql-list" value="ordered" aria-label="Ordered list"></button>
          <button type="button" class="ql-list" value="bullet" aria-label="Bullet list"></button>
        </span>
        <span class="ql-formats">
          <button type="button" class="ql-image" aria-label="Image"></button>
        </span>
      </ng-template>
    </p-editor>
  `,
  styles: `
    :host {
      display: block;
      width: 100%;
    }
    :host ::ng-deep .p-editor-container {
      display: flex;
      flex-direction: column;
      flex-grow: 1;
    }
  `,
})
export class RichTextEditorComponent implements ControlValueAccessor {
  readonly storagePrefix = input.required<string>();
  readonly style = input<Record<string, string>>({ minHeight: '250px' });
  readonly attachments = model<AttachmentCache[]>([]);

  editor = viewChild<Editor>('editor');

  content = signal('');

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  private onChange: (value: string) => void = () => {};
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  private onTouched: () => void = () => {};

  private storageService = inject(StorageService);
  private attachmentUtils = inject(AttachmentUtilsService);
  private cdr = inject(ChangeDetectorRef);

  writeValue(value: string | null): void {
    const rawHtml = value || '';
    const currentAttachments = this.attachments();

    if (rawHtml && currentAttachments && currentAttachments.length > 0) {
      const clonedAttachments = [...currentAttachments];
      this.attachmentUtils
        .refreshHtmlAttachments(rawHtml, clonedAttachments)
        .then(({ html, refreshed }) => {
          this.content.set(html);
          if (refreshed) {
            this.onChange(html);
            this.attachments.set(clonedAttachments);
          }
          this.cdr.markForCheck();
        });
    } else {
      this.content.set(rawHtml);
      this.cdr.markForCheck();
    }
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  onEditorTextChange(event: EditorTextChangeEvent) {
    this.content.set(event.htmlValue || '');
    this.onChange(this.content());
  }

  onEditorInit(event: EditorInitEvent) {
    const quill = event.editor;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
      true,
    );
  }

  private async uploadAndInsertImage(file: File, quill: Quill) {
    try {
      const filename = `${crypto.randomUUID()}-${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;
      const objectName = `${this.storagePrefix()}/${filename}`;

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

      this.attachments.update((atts) => [...atts, cacheItem]);

      // 5. Insert image into editor
      const range = quill.getSelection(true);
      quill.insertEmbed(range.index, 'image', downloadData.url);

      // Update the range to be after the inserted image
      quill.setSelection(range.index + 1);

      // Programmatic Quill inserts don't always trigger onTextChange in PrimeNG, force sync
      this.content.set(quill.root.innerHTML);
      this.onChange(this.content());
    } catch (e) {
      console.error('Upload failed', e);
    }
  }

  /**
   * Compares current HTML content with the attachments list to find deleted images,
   * deletes them from storage, and updates the attachments list.
   * Call this when the parent component saves the content.
   */
  async cleanupDeletedImages(): Promise<AttachmentCache[]> {
    const html = this.content() || '';
    const currentAttachments = this.attachments();

    const deletedAttachments = currentAttachments.filter((att) => !html.includes(att.objectName));

    for (const att of deletedAttachments) {
      try {
        await lastValueFrom(this.storageService.deleteFile(att.objectName));
      } catch (e) {
        console.error(`Failed to delete object: ${att.objectName}`, e);
      }
    }

    const updatedAttachments = currentAttachments.filter((att) => html.includes(att.objectName));

    this.attachments.set(updatedAttachments);
    return updatedAttachments;
  }
}
