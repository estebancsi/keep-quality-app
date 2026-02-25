import {
  Component,
  ChangeDetectionStrategy,
  inject,
  input,
  effect,
  signal,
  model,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { AttachmentCache } from '@/core/interfaces/attachment.interface';
import { AttachmentUtilsService } from '@/core/utils/attachment.utils';

@Component({
  selector: 'app-rich-text-viewer',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (displayHtml()) {
      <div class="rich-text-content" [innerHTML]="displayHtml()"></div>
    } @else {
      <span class="text-surface-400 italic">{{ placeholder() }}</span>
    }
  `,
  styles: `
    :host {
      display: block;
    }
    :host ::ng-deep .rich-text-content img {
      max-width: 100% !important;
      height: auto !important;
    }
  `,
})
export class RichTextViewerComponent {
  readonly content = input<string>('');
  readonly placeholder = input<string>('No content to display...');
  readonly attachments = model<AttachmentCache[]>([]);

  protected displayHtml = signal<string>('');

  private attachmentUtils = inject(AttachmentUtilsService);

  constructor() {
    effect(async () => {
      const currentHtml = this.content();
      const currentAttachments = this.attachments();

      if (currentHtml && currentAttachments && currentAttachments.length > 0) {
        // We pass a clone of the array so we don't mutate the model reference directly
        // unless we actually refreshed something
        const clonedAttachments = [...currentAttachments];

        const { html, refreshed } = await this.attachmentUtils.refreshHtmlAttachments(
          currentHtml,
          clonedAttachments,
        );

        if (refreshed) {
          // If URLs were refreshed, update the HTML display and the attachment model
          this.displayHtml.set(html);
          this.attachments.set(clonedAttachments);
        } else {
          // URLs are still valid, use original HTML
          this.displayHtml.set(currentHtml);
        }
      } else {
        // No attachments, just display the raw HTML
        this.displayHtml.set(currentHtml || '');
      }
    });
  }
}
