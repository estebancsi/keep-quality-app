export interface SystemPrompt {
  id: string;
  name: string;
  description?: string;
  systemPromptTemplate: string;
  userPromptTemplate: string;
  modelConfig?: Record<string, unknown>;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SystemPromptDto {
  id: string;
  name: string;
  description?: string;
  system_prompt_template: string;
  user_prompt_template: string;
  model_config?: Record<string, unknown>;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  tenant_id?: string;
}

export type CreateSystemPromptDto = Omit<
  SystemPromptDto,
  'id' | 'created_at' | 'updated_at' | 'tenant_id'
>;
export type UpdateSystemPromptDto = Partial<CreateSystemPromptDto>;
