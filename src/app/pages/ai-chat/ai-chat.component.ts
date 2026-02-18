import { Component, inject, signal, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AiService, Message, ChatRequest, ModelInfo } from '../../core/services/ai.service';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { SelectModule } from 'primeng/select';
import { CardModule } from 'primeng/card';
import { ScrollPanelModule } from 'primeng/scrollpanel';
import { PanelModule } from 'primeng/panel';
import { SelectButtonModule } from 'primeng/selectbutton';

@Component({
  selector: 'app-ai-chat',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    InputTextModule,
    TextareaModule,
    SelectModule,
    CardModule,
    ScrollPanelModule,
    PanelModule,
    SelectButtonModule,
  ],
  templateUrl: './ai-chat.component.html',
  styles: [
    `
      :host {
        display: block;
        height: 100%;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AiChatComponent implements OnInit {
  private aiService = inject(AiService);

  messages = signal<Message[]>([]);
  userInput = signal('');
  isLoading = signal(false);

  availableModels = signal<Record<string, ModelInfo[]>>({});

  providers = [
    { label: 'Gemini', value: 'gemini' },
    { label: 'OpenAI', value: 'openai' },
  ];
  selectedProvider = signal('gemini');

  selectedModel = signal<ModelInfo | null>(null);

  systemPrompt = signal('You are a helpful assistant.');

  ngOnInit() {
    this.loadModels();
  }

  loadModels() {
    this.aiService.getModels().subscribe({
      next: (models) => {
        this.availableModels.set(models);
        this.updateSelectedModel();
      },
      error: (err) => console.error('Failed to load models', err),
    });
  }

  updateSelectedModel() {
    const provider = this.selectedProvider();
    const models = this.availableModels()[provider] || [];
    if (models.length > 0) {
      this.selectedModel.set(models[0]);
    } else {
      this.selectedModel.set(null);
    }
  }

  onProviderChange() {
    this.updateSelectedModel();
  }

  get currentModels() {
    return this.availableModels()[this.selectedProvider()] || [];
  }

  async sendMessage() {
    const content = this.userInput().trim();
    if (!content || this.isLoading()) return;

    this.isLoading.set(true);
    const userMsg: Message = { role: 'user', content };

    // Optimistic update
    this.messages.update((msgs) => [...msgs, userMsg]);
    this.userInput.set('');

    const assistantMsg: Message = { role: 'assistant', content: '' };
    this.messages.update((msgs) => [...msgs, assistantMsg]);

    try {
      const request: ChatRequest = {
        messages: this.messages().slice(0, -1), // Send history including new user msg, excluding empty assistant msg
        provider: this.selectedProvider(),
        model: this.selectedModel()?.id || 'gpt-3.5-turbo',
        system_prompt: this.systemPrompt(),
        temperature: 0.7,
      };

      await this.aiService.sendMessage(request, (chunk) => {
        assistantMsg.content += chunk;
        // Trigger change detection by creating new array but mutating last message content
        // Or better, replace the last message
        this.messages.update((msgs) => {
          const newMsgs = [...msgs];
          newMsgs[newMsgs.length - 1] = { ...assistantMsg };
          return newMsgs;
        });
      });
    } catch (error) {
      console.error('Error sending message:', error);
      assistantMsg.content += '\n[Error sending message]';
      this.messages.update((msgs) => {
        const newMsgs = [...msgs];
        newMsgs[newMsgs.length - 1] = { ...assistantMsg };
        return newMsgs;
      });
    } finally {
      this.isLoading.set(false);
    }
  }
}
