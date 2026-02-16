import { MapperPatterns } from '@/lib/mappers.patterns';
import { CustomFieldsSchema } from '../types/custom-fields.types';
import { CustomFieldsSchemaDto } from '../types/custom-fields-dto.types';
export class CustomFieldsSchemaMapper extends MapperPatterns<
  CustomFieldsSchemaDto,
  CustomFieldsSchema
> {
  toDomain(entity: CustomFieldsSchemaDto): CustomFieldsSchema {
    return {
      id: entity.id,
      name: entity.name,
      description: entity.description || undefined,
      groups: entity.schema_definition?.groups || [],
      fields: entity.schema_definition?.fields || [],
    };
  }

  toPersistence(dto: Partial<CustomFieldsSchema>): Partial<CustomFieldsSchemaDto> {
    const persistenceData: Partial<CustomFieldsSchemaDto> = {
      name: dto.name!,
      description: dto.description || null,
      schema_definition: {
        groups: dto.groups || [],
        fields: dto.fields || [],
      },
      is_active: true,
    };

    // Only include id if it exists (for updates)
    if (dto.id) {
      (persistenceData as any).id = dto.id;
    }

    return persistenceData;
  }

  // Helper method for update operations that need to exclude certain fields
  toUpdatePersistence(dto: Partial<CustomFieldsSchema>): Partial<CustomFieldsSchemaDto> {
    const persistenceData = this.toPersistence(dto);

    // Add updated timestamp
    persistenceData.updated_at = new Date().toISOString();

    return persistenceData;
  }
}
