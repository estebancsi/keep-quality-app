import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IntegerFieldDefinition } from '../../types/custom-fields.types';

@Component({
  selector: 'app-integer-field-configurator',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './integer-field-configurator.component.html',
  styleUrls: ['./integer-field-configurator.component.scss']
})
export class IntegerFieldConfiguratorComponent {
  field = input<IntegerFieldDefinition | null>(null);
  fieldUpdated = output<IntegerFieldDefinition>();

  updateField(): void {
    const field = this.field();
    if (field) {
      this.fieldUpdated.emit(field);
    }
  }
}
