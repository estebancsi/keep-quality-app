import { CustomFieldDefinition, FieldGroup } from '../types/custom-fields.types';

// Helper para agrupar campos
export function groupFields(fields: CustomFieldDefinition[]): Map<string | undefined, CustomFieldDefinition[]> {
  const grouped = new Map<string | undefined, CustomFieldDefinition[]>();

  for (const field of fields) {
    const group = field.group;
    if (!grouped.has(group)) {
      grouped.set(group, []);
    }
    grouped.get(group)!.push(field);
  }

  return grouped;
}

// Helper para obtener campos por grupo
export function getFieldsByGroup(
  fields: CustomFieldDefinition[],
  groups: FieldGroup[]
): Array<{ group?: FieldGroup; fields: CustomFieldDefinition[] }> {
  const groupedFields = groupFields(fields);
  const result: Array<{ group?: FieldGroup; fields: CustomFieldDefinition[] }> = [];

  // Campos sin grupo (groupId undefined)
  const ungroupedFields = groupedFields.get(undefined);
  if (ungroupedFields && ungroupedFields.length > 0) {
    result.push({ fields: ungroupedFields.sort((a, b) => a.order - b.order) });
  }

  // Campos agrupados
  for (const group of groups.sort((a, b) => a.order - b.order)) {
    const fields = groupedFields.get(group.name);
    if (fields && fields.length > 0) {
      result.push({
        group,
        fields: fields.sort((a, b) => a.order - b.order)
      });
    }
  }

  return result;
}
