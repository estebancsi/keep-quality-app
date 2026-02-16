import { Component, input, output, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  CustomFieldDefinition,
  FieldType,
  TextFieldDefinition,
  LongTextFieldDefinition,
  IntegerFieldDefinition,
  BooleanFieldDefinition,
  ListFieldDefinition,
  DateFieldDefinition,
  DateTimeFieldDefinition,
  TimeFieldDefinition,
  UserFieldDefinition
} from '../../types/custom-fields.types';
import { TextFieldConfiguratorComponent } from '../field-configurators/text-field-configurator.component';
import { LongTextFieldConfiguratorComponent } from '../field-configurators/long-text-field-configurator.component';
import { IntegerFieldConfiguratorComponent } from '../field-configurators/integer-field-configurator.component';
import { BooleanFieldConfiguratorComponent } from '../field-configurators/boolean-field-configurator.component';
import { ListFieldConfiguratorComponent } from '../field-configurators/list-field-configurator.component';
import { DateFieldConfiguratorComponent } from '../field-configurators/date-field-configurator.component';
import { DateTimeFieldConfiguratorComponent } from '../field-configurators/datetime-field-configurator.component';
import { TimeFieldConfiguratorComponent } from '../field-configurators/time-field-configurator.component';
import { UserFieldConfiguratorComponent } from '../field-configurators/user-field-configurator.component';

@Component({
  selector: 'app-field-editor',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TextFieldConfiguratorComponent,
    LongTextFieldConfiguratorComponent,
    IntegerFieldConfiguratorComponent,
    BooleanFieldConfiguratorComponent,
    ListFieldConfiguratorComponent,
    DateFieldConfiguratorComponent,
    DateTimeFieldConfiguratorComponent,
    TimeFieldConfiguratorComponent,
    UserFieldConfiguratorComponent
  ],
  templateUrl: './field-editor.component.html',
  styleUrls: ['./field-editor.component.scss']
})
export class FieldEditorComponent {
  field = input<CustomFieldDefinition | null>(null);

  fieldUpdated = output<CustomFieldDefinition>();
  fieldDeleted = output<CustomFieldDefinition>();

  fieldTypes: { value: FieldType; label: string; icon: string }[] = [
    { value: 'TEXT', label: 'Text', icon: '📝' },
    { value: 'LONG_TEXT', label: 'Long Text', icon: '📄' },
    { value: 'INTEGER', label: 'Number', icon: '🔢' },
    { value: 'BOOLEAN', label: 'Boolean', icon: '☑️' },
    { value: 'LIST', label: 'List', icon: '📋' },
    { value: 'DATE', label: 'Date', icon: '📅' },
    { value: 'DATETIME', label: 'Date Time', icon: '🕐' },
    { value: 'TIME', label: 'Time', icon: '⏰' },
    { value: 'USER', label: 'User', icon: '👤' }
  ];

  editedField = signal<CustomFieldDefinition | null>(null);

  /**
   *
   */
  constructor() {
    effect(() => {
      const field = this.field();
      if (field) {
        // Create a deep copy to avoid mutating the original
        this.editedField.set(JSON.parse(JSON.stringify(field)));
      } else {
        this.editedField.set(null);
      }
    });
  }

  updateField(): void {
    const field = this.editedField();
    if (field) {
      this.fieldUpdated.emit(field);
    }
  }

  onFieldConfigUpdated(updatedField: CustomFieldDefinition): void {
    this.editedField.set(updatedField);
    this.updateField();
  }

  deleteField(): void {
    const field = this.editedField();
    if (field && confirm('Are you sure you want to delete this field?')) {
      this.fieldDeleted.emit(field);
    }
  }

  onFieldTypeChange(newType: FieldType): void {
    const currentField = this.editedField();
    if (!currentField) return;

    // Preserve common properties
    const commonProps = {
      name: currentField.name,
      label: currentField.label,
      type: newType,
      required: currentField.required,
      order: currentField.order,
      description: currentField.description,
      placeholder: currentField.placeholder,
      helpText: currentField.helpText,
      group: currentField.group,
      validation: currentField.validation,
      conditional: currentField.conditional
    };

    // Create type-specific config
    switch (newType) {
      case 'TEXT':
        this.editedField.set({
          ...commonProps,
          config: {
            type: 'TEXT',
            inputType: 'TEXT',
            showCharacterCount: false
          }
        } as any);
        break;
      case 'LONG_TEXT':
        this.editedField.set({
          ...commonProps,
          config: {
            type: 'LONG_TEXT',
            rows: 4,
            resizable: true,
            showCharacterCount: true,
            richText: false
          }
        } as any);
        break;
      case 'INTEGER':
        this.editedField.set({
          ...commonProps,
          config: {
            type: 'INTEGER',
            step: 1,
            showSpinButtons: true,
            thousandsSeparator: false
          }
        } as any);
        break;
      case 'BOOLEAN':
        this.editedField.set({
          ...commonProps,
          config: {
            type: 'BOOLEAN',
            displayStyle: 'CHECKBOX'
          }
        } as any);
        break;
      case 'LIST':
        this.editedField.set({
          ...commonProps,
          config: {
            type: 'LIST',
            allowMultiple: false,
            options: [],
            displayStyle: 'DROPDOWN',
            searchable: false,
            allowCustomValues: false
          }
        } as any);
        break;
      case 'DATE':
        this.editedField.set({
          ...commonProps,
          config: {
            type: 'DATE',
            dateFormat: 'YYYY-MM-DD',
            showCalendar: true
          }
        } as any);
        break;
      case 'DATETIME':
        this.editedField.set({
          ...commonProps,
          config: {
            type: 'DATETIME',
            dateFormat: 'YYYY-MM-DD',
            timeFormat: '24',
            showSeconds: false,
            minuteStep: 5
          }
        } as any);
        break;
      case 'TIME':
        this.editedField.set({
          ...commonProps,
          config: {
            type: 'TIME',
            timeFormat: '24',
            minuteStep: 5,
            showSeconds: false
          }
        } as any);
        break;
      case 'USER':
        this.editedField.set({
          ...commonProps,
          config: {
            type: 'USER',
            allowMultiple: false,
            includeInactive: false,
            displayFormat: 'NAME',
            searchable: true
          }
        } as any);
        break;
    }

    this.updateField();
  }

  // Type-safe field getters for template
  getTextField() {
    return this.editedField() as TextFieldDefinition;
  }

  getLongTextField() {
    return this.editedField() as LongTextFieldDefinition;
  }

  getIntegerField() {
    return this.editedField() as IntegerFieldDefinition;
  }

  getBooleanField() {
    return this.editedField() as BooleanFieldDefinition;
  }

  getListField() {
    return this.editedField() as ListFieldDefinition;
  }

  getDateField() {
    return this.editedField() as DateFieldDefinition;
  }

  getDateTimeField() {
    return this.editedField() as DateTimeFieldDefinition;
  }

  getTimeField() {
    return this.editedField() as TimeFieldDefinition;
  }

  getUserField() {
    return this.editedField() as UserFieldDefinition;
  }
}
