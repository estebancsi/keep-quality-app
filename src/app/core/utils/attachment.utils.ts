import { inject, Injectable } from '@angular/core';
import { StorageService } from '../services/storage.service';
import { AttachmentCache } from '../interfaces/attachment.interface';
import { lastValueFrom } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class AttachmentUtilsService {
  private readonly storageService = inject(StorageService);

  /**
   * Verifies the expiration of a list of attachment caches.
   * If any are expired (or expiring within the next 5 minutes),
   * requests new signed URLs from the storage service and updates the array.
   *
   * @param attachments The attachments array to verify (will be mutated in place).
   * @returns true if any attachment was refreshed.
   */
  async ensureAttachmentsFresh(attachments: AttachmentCache[]): Promise<boolean> {
    if (!attachments || attachments.length === 0) {
      return false;
    }

    const now = new Date();
    // Add a 5 minute buffer to prevent URLs from expiring while the user is viewing
    const bufferTime = 5 * 60 * 1000;

    let anyRefreshed = false;

    const refreshPromises = attachments.map(async (attachment) => {
      const expirationDate = new Date(attachment.expiresAt);

      if (expirationDate.getTime() - now.getTime() < bufferTime) {
        try {
          const response = await lastValueFrom(
            this.storageService.getDownloadUrl(attachment.objectName),
          );
          attachment.publicUrl = response.url;
          // Assume the new URL is valid for at least 1 hour - backend usually controls this.
          // Since the backend doesn't return the new expires_at in the DTO, we have to
          // add a sensible default or parse it from the URL string.
          // Most S3/Supabase signed URLs have X-Amz-Expires/token query params, but
          // estimating 1 hour from now is a safe fallback.
          attachment.expiresAt = new Date(now.getTime() + 60 * 60 * 1000).toISOString();
          anyRefreshed = true;
        } catch (error) {
          console.error(`Failed to refresh URL for ${attachment.objectName}`, error);
        }
      }
    });

    await Promise.all(refreshPromises);
    return anyRefreshed;
  }

  /**
   * Refreshes expired attachment URLs and replaces their old occurrences in the provided HTML string.
   *
   * @param html The rich text HTML containing image tags.
   * @param attachments The attachments array to verified and mutated.
   * @returns An object containing the updated HTML string and a boolean indicating if any refresh occurred.
   */
  async refreshHtmlAttachments(
    html: string,
    attachments: AttachmentCache[],
  ): Promise<{ html: string; refreshed: boolean }> {
    if (!attachments || attachments.length === 0 || !html) {
      return { html, refreshed: false };
    }

    // Clone the attachments array so we can compare old vs new URLs
    const oldUrls = attachments.map((a) => ({ objectName: a.objectName, oldUrl: a.publicUrl }));

    const didRefresh = await this.ensureAttachmentsFresh(attachments);

    if (didRefresh) {
      let updatedHtml = html;
      // Replace the old URL with the new URL for each updated attachment
      for (let i = 0; i < attachments.length; i++) {
        const oldUrl = oldUrls[i].oldUrl;
        const newUrl = attachments[i].publicUrl;

        if (oldUrl !== newUrl) {
          // Replace exact match
          updatedHtml = updatedHtml.split(oldUrl).join(newUrl);

          // Replace HTML encoded match (e.g. & becoming &amp; inside innerHTML)
          const encodedOldUrl = oldUrl.replace(/&/g, '&amp;');
          if (encodedOldUrl !== oldUrl) {
            const encodedNewUrl = newUrl.replace(/&/g, '&amp;');
            updatedHtml = updatedHtml.split(encodedOldUrl).join(encodedNewUrl);
          }
        }
      }
      return { html: updatedHtml, refreshed: true };
    }

    return { html, refreshed: false };
  }
}
