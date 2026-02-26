import { Component, inject, ChangeDetectionStrategy, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import { InputTextModule } from 'primeng/inputtext';
import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';
import { ConfirmationService } from 'primeng/api';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToastModule } from 'primeng/toast';
import { rxResource } from '@angular/core/rxjs-interop';
import { catchError, of } from 'rxjs';
import { SystemPromptsService } from '@/core/services/system-prompts.service';
import { SystemPrompt } from '@/core/interfaces/system-prompts.types';
import { SystemPromptFormComponent } from '../../components/system-prompt-form/system-prompt-form.component';

@Component({
  selector: 'app-system-prompts-list',
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
  // Use rxResource for modern data fetching and easy reloading
  private promptsResource = rxResource({
    stream: () => this.systemPromptsService.getAllPrompts().pipe(catchError(() => of([]))),
  });

  // Derived signal for the table
  prompts = computed(() => this.promptsResource.value() ?? []);

  loadPrompts() {
    this.promptsResource.reload();
  }

  ref: DynamicDialogRef<SystemPromptFormComponent> | null = null;

  openCreateDialog() {
    this.ref = this.dialogService.open(SystemPromptFormComponent, {
      header: 'Create System Prompt',
      width: '70%',
      contentStyle: { overflow: 'auto' },
      baseZIndex: 10000,
      maximizable: true,
    });

    this.ref?.onClose.subscribe((result) => {
      if (result) {
        this.loadPrompts();
      }
    });
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

    this.ref?.onClose.subscribe((result) => {
      if (result) {
        this.loadPrompts();
      }
    });
  }

  deletePrompt(prompt: SystemPrompt) {
    this.confirmationService.confirm({
      message: `Are you sure you want to delete prompt "${prompt.name}"?`,
      header: 'Confirm Delete',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.systemPromptsService.deletePrompt(prompt.id).subscribe(() => {
          this.loadPrompts();
        });
      },
      reject: () => {
        // Optional: Handle rejection or do nothing
      },
    });
  }
}
