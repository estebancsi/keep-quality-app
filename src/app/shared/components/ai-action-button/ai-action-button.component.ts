import { Component, inject, input, output, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import { AiService, ChatRequest, Message } from '@/core/services/ai.service';
import { SystemPromptsService } from '@/core/services/system-prompts.service';
import { MessageService } from 'primeng/api';

@Component({
  selector: 'app-ai-action-button',
  standalone: true,
  imports: [CommonModule, ButtonModule, TooltipModule],
  template: `
    <p-button
      [label]="label()"
      [icon]="loading() ? 'pi pi-spin pi-spinner' : icon()"
      [disabled]="loading() || disabled()"
      (onClick)="executeAction()"
      [pTooltip]="tooltip()"
      [severity]="severity()"
      [text]="text()"
      [outlined]="outlined()"
      [size]="size()"
    ></p-button>
  `,
  providers: [MessageService],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AiActionButtonComponent {
  action = input.required<string>(); // Name of the system prompt
  context = input<Record<string, unknown>>({});
  label = input('AI Action');
  icon = input('pi pi-sparkles');
  tooltip = input('');
  disabled = input(false);
  severity = input<
    'success' | 'info' | 'warn' | 'danger' | 'help' | 'primary' | 'secondary' | 'contrast'
  >('primary');
  text = input(false);
  outlined = input(false);
  size = input<'small' | 'large' | undefined>(undefined);

  actionSuccess = output<string>();
  actionError = output<unknown>();

  loading = signal(false);

  private aiService = inject(AiService);
  private systemPromptsService = inject(SystemPromptsService);
  private messageService = inject(MessageService);

  executeAction() {
    if (this.loading()) return;
    this.loading.set(true);

    this.systemPromptsService.getPromptByName(this.action()).subscribe({
      next: (prompt) => {
        if (!prompt) {
          this.handleError(`Prompt "${this.action()}" not found.`);
          return;
        }

        if (!prompt.isActive) {
          this.handleError(`Prompt "${this.action()}" is inactive.`);
          return;
        }

        const hydratedSystemPrompt = this.systemPromptsService.hydratePrompt(
          prompt.systemPromptTemplate,
          this.context(),
        );
        const hydratedUserPrompt = this.systemPromptsService.hydratePrompt(
          prompt.userPromptTemplate,
          this.context(),
        );

        const messages: Message[] = [
          { role: 'system', content: hydratedSystemPrompt },
          { role: 'user', content: hydratedUserPrompt },
        ];

        // Default model, can be overridden by prompt config or global config
        const model = (prompt.modelConfig?.['model'] as string) || 'gemini-2.0-flash-exp';
        const provider = (prompt.modelConfig?.['provider'] as string) || 'google';

        const request: ChatRequest = {
          messages,
          provider,
          model,
          temperature: (prompt.modelConfig?.['temperature'] as number) || 0.7,
        };

        // Accumulate response
        let fullResponse = '';
        this.aiService
          .sendMessage(request, (chunk) => {
            fullResponse += chunk;
          })
          .then(() => {
            this.actionSuccess.emit(fullResponse);
          })
          .catch((err) => {
            this.handleError(err);
          })
          .finally(() => {
            this.loading.set(false);
          });
      },
      error: (err) => this.handleError(err),
    });
  }

  private handleError(error: unknown) {
    console.error('AI Action Error:', error);
    this.loading.set(false);
    this.actionError.emit(error);

    let detail = 'Unknown error';
    if (typeof error === 'string') {
      detail = error;
    } else if (error instanceof Error) {
      detail = error.message;
    }

    this.messageService.add({
      severity: 'error',
      summary: 'AI Action Failed',
      detail,
    });
  }
}
