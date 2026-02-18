import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import { InputTextModule } from 'primeng/inputtext';
import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';
import { ConfirmationService } from 'primeng/api';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToastModule } from 'primeng/toast';
import { toSignal } from '@angular/core/rxjs-interop';
import { SystemPromptsService } from '@/core/services/system-prompts.service';
import { SystemPrompt } from '@/core/interfaces/system-prompts.types';
import { SystemPromptFormComponent } from '../../components/system-prompt-form/system-prompt-form.component';

@Component({
  selector: 'app-system-prompts-list',
  standalone: true,
  imports: [
    CommonModule,
    TableModule,
    ButtonModule,
    TooltipModule,
    InputTextModule,
    ConfirmDialogModule,
    ToastModule,
  ],
  providers: [DialogService, ConfirmationService],
  templateUrl: './system-prompts-list.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SystemPromptsListComponent {
  private systemPromptsService = inject(SystemPromptsService);
  private dialogService = inject(DialogService);
  private confirmationService = inject(ConfirmationService);

  prompts = toSignal(this.systemPromptsService.getAllPrompts(), { initialValue: [] });
  ref: DynamicDialogRef<SystemPromptFormComponent> | null = null;

  openCreateDialog() {
    this.ref = this.dialogService.open(SystemPromptFormComponent, {
      header: 'Create System Prompt',
      width: '70%',
      contentStyle: { overflow: 'auto' },
      baseZIndex: 10000,
      maximizable: true,
    });

    if (this.ref) {
      this.ref.onClose.subscribe((result) => {
        if (result) {
          window.location.reload();
        }
      });
    }
  }

  openEditDialog(prompt: SystemPrompt) {
    this.ref = this.dialogService.open(SystemPromptFormComponent, {
      header: `Edit Prompt: ${prompt.name}`,
      width: '70%',
      contentStyle: { overflow: 'auto' },
      baseZIndex: 10000,
      maximizable: true,
      data: { prompt },
    });

    if (this.ref) {
      this.ref.onClose.subscribe((result) => {
        if (result) {
          window.location.reload();
        }
      });
    }
  }

  deletePrompt(prompt: SystemPrompt) {
    this.confirmationService.confirm({
      message: `Are you sure you want to delete prompt "${prompt.name}"?`,
      header: 'Confirm Delete',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.systemPromptsService.deletePrompt(prompt.id).subscribe(() => {
          window.location.reload();
        });
      },
    });
  }
}
