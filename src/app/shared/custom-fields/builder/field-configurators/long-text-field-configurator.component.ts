import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LongTextFieldDefinition } from '../../types/custom-fields.types';

@Component({
  selector: 'app-long-text-field-configurator',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './long-text-field-configurator.component.html',
  styleUrls: ['./long-text-field-configurator.component.scss']
})
export class LongTextFieldConfiguratorComponent {
  field = input<LongTextFieldDefinition | null>(null);
  fieldUpdated = output<LongTextFieldDefinition>();

  updateField(): void {
    const field = this.field();
    if (field) {
      this.fieldUpdated.emit(field);
    }
  }
}
