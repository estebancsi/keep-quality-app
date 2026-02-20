import { Injectable, inject } from '@angular/core';
import { SupabaseService } from '@/core/services/supabase.service';
import { MessageService } from 'primeng/api';
import { catchError, defer, map, Observable, throwError } from 'rxjs';
import {
  CreateSystemPromptDto,
  SystemPrompt,
  SystemPromptDto,
  UpdateSystemPromptDto,
} from '../interfaces/system-prompts.types';

@Injectable({
  providedIn: 'root',
})
export class SystemPromptsService {
  private supabase = inject(SupabaseService).client;
  private messageService = inject(MessageService);

  getAllPrompts(): Observable<SystemPrompt[]> {
    return defer(async () => this.supabase.from('system_prompts').select('*').order('name')).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return (data || []).map((dto) => this.toDomain(dto));
      }),
      catchError((error) => this.handleError(error, 'Get All Prompts')),
    );
  }

  getPromptById(id: string): Observable<SystemPrompt> {
    return defer(async () =>
      this.supabase.from('system_prompts').select('*').eq('id', id).single(),
    ).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return this.toDomain(data);
      }),
      catchError((error) => this.handleError(error, 'Get Prompt by ID')),
    );
  }

  getPromptByName(name: string): Observable<SystemPrompt> {
    return defer(async () =>
      this.supabase.from('system_prompts').select('*').eq('name', name).single(),
    ).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return this.toDomain(data);
      }),
      catchError((error) => this.handleError(error, 'Get Prompt by Name')),
    );
  }

  createPrompt(prompt: CreateSystemPromptDto): Observable<SystemPrompt> {
    return defer(async () =>
      this.supabase.from('system_prompts').insert(prompt).select().single(),
    ).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        this.messageService.add({
          severity: 'success',
          summary: 'Success',
          detail: 'System prompt created successfully',
        });
        return this.toDomain(data);
      }),
      catchError((error) => this.handleError(error, 'Create Prompt')),
    );
  }

  updatePrompt(id: string, prompt: UpdateSystemPromptDto): Observable<SystemPrompt> {
    return defer(async () =>
      this.supabase.from('system_prompts').update(prompt).eq('id', id).select().single(),
    ).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        this.messageService.add({
          severity: 'success',
          summary: 'Success',
          detail: 'System prompt updated successfully',
        });
        return this.toDomain(data);
      }),
      catchError((error) => this.handleError(error, 'Update Prompt')),
    );
  }

  deletePrompt(id: string): Observable<void> {
    return defer(async () => this.supabase.from('system_prompts').delete().eq('id', id)).pipe(
      map(({ error }) => {
        if (error) throw error;
        this.messageService.add({
          severity: 'success',
          summary: 'Success',
          detail: 'System prompt deleted successfully',
        });
      }),
      catchError((error) => this.handleError(error, 'Delete Prompt')),
    );
  }

  hydratePrompt(template: string, context: Record<string, unknown>): string {
    return template.replace(/\{\{\s*([\w.]+)\s*\}\}/g, (match, path) => {
      const keys = path.split('.');
      let value: unknown = context;

      for (const key of keys) {
        if (value && typeof value === 'object' && key in value) {
          value = (value as Record<string, unknown>)[key];
        } else {
          // If path is not found, leave the placeholder intact or return empty string.
          // Leaving it intact is safer for debugging prompt templates.
          return match;
        }
      }

      // Handle various value types for robust hydration
      return typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value);
    });
  }

  private toDomain(dto: SystemPromptDto): SystemPrompt {
    return {
      id: dto.id,
      name: dto.name,
      description: dto.description,
      systemPromptTemplate: dto.system_prompt_template,
      userPromptTemplate: dto.user_prompt_template,
      modelConfig: dto.model_config,
      isActive: dto.is_active,
      createdAt: dto.created_at,
      updatedAt: dto.updated_at,
    };
  }

  private handleError(error: unknown, summary: string) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`[${summary}]`, errorMessage);
    this.messageService.add({
      severity: 'error',
      summary: 'Error',
      detail: errorMessage,
    });
    return throwError(() => new Error(errorMessage));
  }
}
