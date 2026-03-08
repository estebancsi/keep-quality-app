import { ChangeDetectionStrategy, Component, effect, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { switchMap } from 'rxjs';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ProgressSpinnerModule } from 'primeng/progressspinner';

import { LifecycleAttachmentsService } from '../services/lifecycle-attachments.service';
import { LifecycleProjectsService } from '../services/lifecycle-projects.service';
import { LifecycleAttachment, AttachmentStatus } from '../lifecycle-attachment.interface';
import { LifecycleProject } from '../lifecycle-project.interface';

@Component({
  selector: 'app-lifecycle-attachments',
  imports: [
    CommonModule,
    ButtonModule,
    TableModule,
    TagModule,
    TooltipModule,
    ConfirmDialogModule,
    ProgressSpinnerModule,
  ],
  providers: [ConfirmationService],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (loading()) {
      <div class="flex items-center justify-center py-20">
        <p-progressSpinner ariaLabel="Loading attachments" />
      </div>
    } @else {
      <div class="flex flex-col gap-4">
        <!-- Header -->
        <div class="flex items-center gap-3">
          <p-button
            icon="pi pi-arrow-left"
            [rounded]="true"
            [text]="true"
            severity="secondary"
            (click)="goBack()"
            pTooltip="Back to Project"
          />
          <div class="flex-1">
            <h2 class="text-2xl font-bold m-0">Project Attachments</h2>
            @if (project(); as p) {
              <p class="text-surface-500 mt-1 mb-0">
                Lifecycle Project #{{ p.code }}
                @if (p.system) {
                  — {{ p.system.name }}
                }
              </p>
            }
          </div>
          <p-button
            icon="pi pi-refresh"
            [rounded]="true"
            [text]="true"
            severity="secondary"
            (click)="refreshAttachments()"
            pTooltip="Refresh"
            [disabled]="loadingAttachments()"
          />
        </div>

        <!-- Attachments Table -->
        <p-table
          [value]="attachments()"
          dataKey="id"
          [loading]="loadingAttachments()"
          styleClass="p-datatable-sm"
          [tableStyle]="{ 'min-width': '50rem' }"
        >
          <ng-template #header>
            <tr>
              <th style="width: 30%">Name</th>
              <th style="width: 15%">Status</th>
              <th style="width: 15%">Type</th>
              <th style="width: 20%">Created</th>
              <th style="width: 20%">Actions</th>
            </tr>
          </ng-template>

          <ng-template #body let-attachment>
            <tr>
              <td>
                <div class="flex items-center gap-2">
                  <i class="pi pi-file-pdf text-red-500"></i>
                  <span class="font-medium">{{ attachment.name }}</span>
                </div>
              </td>
              <td>
                <p-tag
                  [value]="getStatusLabel(attachment.status)"
                  [severity]="getStatusSeverity(attachment.status)"
                  [icon]="getStatusIcon(attachment.status)"
                />
              </td>
              <td>
                <span class="text-surface-500 text-sm">{{ attachment.contentType }}</span>
              </td>
              <td>
                <span class="text-surface-500 text-sm">
                  {{ attachment.createdAt | date: 'medium' }}
                </span>
              </td>
              <td>
                <div class="flex gap-1">
                  @if (attachment.status === 'published') {
                    <p-button
                      icon="pi pi-download"
                      [rounded]="true"
                      [text]="true"
                      size="small"
                      pTooltip="Download"
                      (click)="downloadAttachment(attachment)"
                    />
                  }
                  <p-button
                    icon="pi pi-trash"
                    [rounded]="true"
                    [text]="true"
                    severity="danger"
                    size="small"
                    pTooltip="Delete"
                    (click)="confirmDelete(attachment)"
                  />
                </div>
              </td>
            </tr>
          </ng-template>

          <ng-template #emptymessage>
            <tr>
              <td colspan="5" class="text-center py-8">
                <div class="flex flex-col items-center gap-2">
                  <i class="pi pi-paperclip text-4xl text-surface-400"></i>
                  <span class="text-surface-500">No attachments yet</span>
                </div>
              </td>
            </tr>
          </ng-template>
        </p-table>
      </div>
    }

    <p-confirmDialog [key]="'attachment-dialog'" />
  `,
})
export class LifecycleAttachments {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly attachmentsService = inject(LifecycleAttachmentsService);
  private readonly lifecycleService = inject(LifecycleProjectsService);
  private readonly confirmationService = inject(ConfirmationService);
  private readonly messageService = inject(MessageService);

  protected readonly project = signal<LifecycleProject | null>(null);
  protected readonly attachments = signal<LifecycleAttachment[]>([]);
  protected readonly loading = signal(true);
  protected readonly loadingAttachments = signal(false);

  private projectId = '';

  constructor() {
    effect(() => {
      const projectId = this.route.snapshot.paramMap.get('projectId');
      if (projectId) {
        this.projectId = projectId;
        this.loadProject(projectId);
        this.loadAttachments(projectId);
      } else {
        this.loading.set(false);
      }
    });
  }

  private loadProject(projectId: string): void {
    this.lifecycleService.getProject(projectId).subscribe({
      next: (p) => {
        this.project.set(p);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  private loadAttachments(projectId: string): void {
    this.loadingAttachments.set(true);
    this.attachmentsService
      .loadAttachments(projectId)
      .pipe(
        switchMap((attachments) =>
          this.attachmentsService.syncPublishingStatuses(attachments, projectId),
        ),
      )
      .subscribe({
        next: (attachments) => {
          this.attachments.set(attachments);
          this.loadingAttachments.set(false);
        },
        error: () => this.loadingAttachments.set(false),
      });
  }

  protected goBack(): void {
    this.router.navigate(['/csv/lifecycle', this.projectId]);
  }

  protected refreshAttachments(): void {
    if (this.projectId) {
      this.loadAttachments(this.projectId);
    }
  }

  protected getStatusLabel(status: AttachmentStatus): string {
    const labels: Record<AttachmentStatus, string> = {
      publishing: 'Publishing',
      published: 'Published',
      failed: 'Failed',
    };
    return labels[status] ?? status;
  }

  protected getStatusSeverity(
    status: AttachmentStatus,
  ): 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast' {
    const map: Record<
      AttachmentStatus,
      'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast'
    > = {
      publishing: 'warn',
      published: 'success',
      failed: 'danger',
    };
    return map[status] ?? 'secondary';
  }

  protected getStatusIcon(status: AttachmentStatus): string {
    const icons: Record<AttachmentStatus, string> = {
      publishing: 'pi pi-spin pi-spinner',
      published: 'pi pi-check-circle',
      failed: 'pi pi-times-circle',
    };
    return icons[status] ?? '';
  }

  protected downloadAttachment(attachment: LifecycleAttachment): void {
    // TODO: Implement download from storage using objectName
    this.messageService.add({
      severity: 'info',
      summary: 'Download',
      detail: `Download for "${attachment.name}" will be implemented with storage integration.`,
    });
  }

  protected confirmDelete(attachment: LifecycleAttachment): void {
    this.confirmationService.confirm({
      key: 'attachment-dialog',
      message: `Are you sure you want to delete "${attachment.name}"?`,
      header: 'Confirm Delete',
      icon: 'pi pi-exclamation-triangle',
      rejectButtonProps: {
        label: 'Cancel',
        severity: 'secondary',
        outlined: true,
      },
      acceptButtonProps: {
        label: 'Delete',
        severity: 'danger',
      },
      accept: () => {
        this.attachmentsService.deleteAttachment(attachment.id, attachment.objectName).subscribe({
          next: () => this.loadAttachments(this.projectId),
        });
      },
    });
  }
}
