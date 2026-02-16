import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CustomFieldsSchema, CustomFieldDefinition, FieldGroup } from '../../types/custom-fields.types';
import { getFieldsByGroup } from '../../utils/custom-fields.helpers';

@Component({
  selector: 'app-form-preview',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './form-preview.component.html',
  styleUrls: ['./form-preview.component.scss']
})
export class FormPreviewComponent {
  schema = input.required<CustomFieldsSchema>();

  fieldSelected = output<CustomFieldDefinition>();

  get groupedFields() {
    return getFieldsByGroup(this.schema().fields, this.schema().groups);
  }

  onFieldClick(field: CustomFieldDefinition): void {
    this.fieldSelected.emit(field);
  }

  getFieldTypeLabel(type: string): string {
    const typeMap: Record<string, string> = {
      TEXT: 'Text',
      LONG_TEXT: 'Long Text',
      INTEGER: 'Number',
      BOOLEAN: 'Boolean',
      LIST: 'List',
      DATE: 'Date',
      DATETIME: 'Date Time',
      TIME: 'Time',
      USER: 'User'
    };
    return typeMap[type] || type;
  }

  getDisplayValue(field: CustomFieldDefinition): string {
    switch (field.type) {
      case 'BOOLEAN':
        return field.config.trueLabel || 'Yes/No';
      case 'LIST':
        if (field.config.options && field.config.options.length > 0) {
          return `${field.config.options.length} options`;
        }
        return 'No options';
      case 'USER':
        return field.config.allowMultiple ? 'Multiple users' : 'Single user';
      default:
        return '';
    }
  }
}
