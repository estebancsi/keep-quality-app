import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TextFieldDefinition } from '../../types/custom-fields.types';

@Component({
  selector: 'app-text-field-configurator',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './text-field-configurator.component.html',
  styleUrls: ['./text-field-configurator.component.scss']
})
export class TextFieldConfiguratorComponent {
  field = input<TextFieldDefinition | null>(null);
  fieldUpdated = output<TextFieldDefinition>();

  updateField(): void {
    const field = this.field();
    if (field) {
      this.fieldUpdated.emit(field);
    }
  }
}
