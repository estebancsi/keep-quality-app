import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BooleanFieldDefinition } from '../../types/custom-fields.types';

@Component({
  selector: 'app-boolean-field-configurator',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './boolean-field-configurator.component.html',
  styleUrls: ['./boolean-field-configurator.component.scss']
})
export class BooleanFieldConfiguratorComponent {
  field = input<BooleanFieldDefinition | null>(null);
  fieldUpdated = output<BooleanFieldDefinition>();

  updateField(): void {
    const field = this.field();
    if (field) {
      this.fieldUpdated.emit(field);
    }
  }
}
