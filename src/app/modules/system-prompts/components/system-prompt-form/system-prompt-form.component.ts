import {
  Component,
  inject,
  OnInit,
  signal,
  computed,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { CheckboxModule } from 'primeng/checkbox';
import { SelectModule } from 'primeng/select';
import { SliderModule } from 'primeng/slider';
import { AiService, ModelInfo } from '@/core/services/ai.service';
import { SystemPromptsService } from '@/core/services/system-prompts.service';
import {
  CreateSystemPromptDto,
  UpdateSystemPromptDto,
} from '@/core/interfaces/system-prompts.types';

@Component({
  selector: 'app-system-prompt-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ButtonModule,
    InputTextModule,
    TextareaModule,
    CheckboxModule,
    SelectModule,
    SliderModule,
  ],
  template: `
    <form [formGroup]="form" (ngSubmit)="save()" class="flex flex-col gap-4 p-4">
      <div class="flex flex-col gap-2">
        <label for="name" class="font-bold">Name (Unique Identifier)</label>
        <input pInputText id="name" formControlName="name" class="w-full" />
        @if (form.get('name')?.invalid && form.get('name')?.touched) {
          <small class="text-red-500">Name is required.</small>
        }
      </div>

      <div class="flex flex-col gap-2">
        <label for="description" class="font-bold">Description</label>
        <textarea
          pTextarea
          id="description"
          formControlName="description"
          rows="2"
          class="w-full"
        ></textarea>
      </div>

      <div class="grid grid-cols-2 gap-4">
        <div class="flex flex-col gap-2">
          <label for="provider" class="font-bold">Provider</label>
          <p-select
            [options]="providers()"
            formControlName="provider"
            placeholder="Select a Provider"
            [style]="{ width: '100%' }"
            (onChange)="onProviderChange()"
          ></p-select>
        </div>
        <div class="flex flex-col gap-2">
          <label for="model" class="font-bold">Model</label>
          <p-select
            [options]="availableModels()"
            optionLabel="name"
            optionValue="id"
            formControlName="model"
            placeholder="Select a Model"
            [style]="{ width: '100%' }"
            [disabled]="!form.get('provider')?.value"
          ></p-select>
        </div>
      </div>

      <div class="flex flex-col gap-2">
        <label for="temperature" class="font-bold"
          >Temperature: {{ form.get('temperature')?.value }}</label
        >
        <p-slider
          formControlName="temperature"
          [min]="0"
          [max]="1"
          [step]="0.1"
          [style]="{ width: '100%' }"
        ></p-slider>
      </div>

      <div class="flex flex-col gap-2">
        <label for="systemPromptTemplate" class="font-bold">System Prompt Template</label>
        <textarea
          pTextarea
          id="systemPromptTemplate"
          formControlName="systemPromptTemplate"
          rows="5"
          class="w-full"
          placeholder="You are a helpful assistant..."
        ></textarea>
        <small class="text-gray-500"
          >Use {{ '{' }}{{ '{' }}variable{{ '}' }}{{ '}' }} for dynamic content.</small
        >
        @if (
          form.get('systemPromptTemplate')?.invalid && form.get('systemPromptTemplate')?.touched
        ) {
          <small class="text-red-500">System prompt is required.</small>
        }
      </div>

      <div class="flex flex-col gap-2">
        <label for="userPromptTemplate" class="font-bold">User Prompt Template</label>
        <textarea
          pTextarea
          id="userPromptTemplate"
          formControlName="userPromptTemplate"
          rows="3"
          class="w-full"
          placeholder="Review the following: {{ '{' }}{{ '{' }}content{{ '}' }}{{ '}' }}"
        ></textarea>
        <small class="text-gray-500"
          >Use {{ '{' }}{{ '{' }}variable{{ '}' }}{{ '}' }} for dynamic content.</small
        >
        @if (form.get('userPromptTemplate')?.invalid && form.get('userPromptTemplate')?.touched) {
          <small class="text-red-500">User prompt is required.</small>
        }
      </div>

      <div class="flex align-items-center gap-2">
        <p-checkbox formControlName="isActive" [binary]="true" inputId="isActive"></p-checkbox>
        <label for="isActive" class="font-bold">Active</label>
      </div>

      <div class="flex justify-end gap-2 mt-4">
        <p-button label="Cancel" severity="secondary" (onClick)="close()"></p-button>
        <p-button
          label="Save"
          type="submit"
          [loading]="saving()"
          [disabled]="form.invalid"
        ></p-button>
      </div>
    </form>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SystemPromptFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private systemPromptsService = inject(SystemPromptsService);
  private aiService = inject(AiService);
  private ref = inject(DynamicDialogRef);
  private config = inject(DynamicDialogConfig);

  form!: FormGroup;
  saving = signal(false);
  isEditMode = false;
  promptId: string | null = null;

  modelsMap = signal<Record<string, ModelInfo[]> | null>(null);
  providers = computed(() => Object.keys(this.modelsMap() || {}));

  // Start with empty array, will be computed based on selected provider
  availableModels = signal<ModelInfo[]>([]);

  ngOnInit() {
    this.initForm();
    this.loadModels();
  }

  private initForm() {
    const prompt = this.config.data?.prompt;
    this.isEditMode = !!prompt;
    if (this.isEditMode) {
      this.promptId = prompt.id;
    }

    const modelConfig = prompt?.modelConfig || {};

    this.form = this.fb.group({
      name: [prompt?.name || '', [Validators.required]],
      description: [prompt?.description || ''],
      systemPromptTemplate: [prompt?.systemPromptTemplate || '', [Validators.required]],
      userPromptTemplate: [prompt?.userPromptTemplate || '', [Validators.required]],
      isActive: [prompt?.isActive ?? true],
      provider: [modelConfig['provider'] || 'google', [Validators.required]],
      model: [modelConfig['model'] || 'gemini-2.0-flash-exp', [Validators.required]],
      temperature: [modelConfig['temperature'] || 0.7, [Validators.required]],
    });

    // Handle initial available models if provider is set
    // We defer this until models are loaded
  }

  private loadModels() {
    this.aiService.getModels().subscribe({
      next: (models) => {
        this.modelsMap.set(models);
        this.updateAvailableModels();
      },
      error: (err) => console.error('Failed to load models:', err),
    });
  }

  onProviderChange() {
    this.updateAvailableModels();
    // Reset model selection if current model is not in new provider's list
    const currentProvider = this.form.get('provider')?.value;
    const currentModel = this.form.get('model')?.value;
    const models = this.modelsMap()?.[currentProvider] || [];

    if (!models.find((m) => m.id === currentModel)) {
      this.form.patchValue({ model: models[0]?.id || '' });
    }
  }

  private updateAvailableModels() {
    const provider = this.form.get('provider')?.value;
    if (provider && this.modelsMap()) {
      this.availableModels.set(this.modelsMap()![provider] || []);
    } else {
      this.availableModels.set([]);
    }
  }

  save() {
    if (this.form.invalid) return;

    this.saving.set(true);
    const formValue = this.form.value;

    const payload: CreateSystemPromptDto = {
      name: formValue.name,
      description: formValue.description,
      system_prompt_template: formValue.systemPromptTemplate,
      user_prompt_template: formValue.userPromptTemplate,
      is_active: formValue.isActive,
      model_config: {
        provider: formValue.provider,
        model: formValue.model,
        temperature: formValue.temperature,
      },
    };

    if (this.isEditMode && this.promptId) {
      const updatePayload: UpdateSystemPromptDto = payload;
      this.systemPromptsService.updatePrompt(this.promptId, updatePayload).subscribe({
        next: (res) => {
          this.saving.set(false);
          this.ref.close(res);
        },
        error: (err) => {
          this.saving.set(false);
          console.error(err);
        },
      });
    } else {
      this.systemPromptsService.createPrompt(payload).subscribe({
        next: (res) => {
          this.saving.set(false);
          this.ref.close(res);
        },
        error: (err) => {
          this.saving.set(false);
          console.error(err);
        },
      });
    }
  }

  close() {
    this.ref.close();
  }
}
