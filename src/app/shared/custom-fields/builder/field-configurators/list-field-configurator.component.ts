import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ListFieldDefinition, ListOption } from '../../types/custom-fields.types';

@Component({
  selector: 'app-list-field-configurator',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './list-field-configurator.component.html',
  styleUrls: ['./list-field-configurator.component.scss'],
})
export class ListFieldConfiguratorComponent {
  field = input<ListFieldDefinition | null>(null);
  fieldUpdated = output<ListFieldDefinition>();

  updateField(): void {
    const field = this.field();
    if (field) {
      this.fieldUpdated.emit(field);
    }
  }

  addOption(): void {
    const field = this.field();
    if (!field) return;

    if (!field.config.options) {
      field.config.options = [];
    }

    const newOrder = field.config.options.length;
    field.config.options.push({
      label: `Option ${newOrder + 1}`,
      value: `option_${newOrder + 1}`,
      order: newOrder,
      isDefault: false,
    });
    this.updateField();
  }

  removeOption(index: number): void {
    const field = this.field();
    if (field && field.config.options) {
      field.config.options.splice(index, 1);
      field.config.options.forEach((opt, i) => (opt.order = i));
      this.updateField();
    }
  }

  onDefaultChange(option: ListOption, isChecked: boolean): void {
    const field = this.field();
    if (!field || !field.config.options) return;

    if (isChecked) {
      const isSingleSelect =
        !field.config.allowMultiple && field.config.displayStyle !== 'CHECKBOX';
      if (isSingleSelect) {
        field.config.options.forEach((opt) => {
          if (opt !== option) opt.isDefault = false;
        });
      }
    }
    this.updateField();
  }

  onAllowMultipleChange(allowMultiple: boolean): void {
    const field = this.field();
    if (!field) return;

    field.config.allowMultiple = allowMultiple;

    if (allowMultiple) {
      if (field.config.displayStyle !== 'MULTISELECT' && field.config.displayStyle !== 'CHECKBOX') {
        field.config.displayStyle = 'MULTISELECT';
      }
    } else {
      if (field.config.displayStyle !== 'DROPDOWN' && field.config.displayStyle !== 'RADIO') {
        field.config.displayStyle = 'DROPDOWN';
      }

      // Cleanup extra default values when switching to single selection
      if (field.config.options) {
        let defaultFound = false;
        field.config.options.forEach((opt) => {
          if (opt.isDefault) {
            if (!defaultFound) {
              defaultFound = true;
            } else {
              opt.isDefault = false;
            }
          }
        });
      }
    }

    this.updateField();
  }
}
