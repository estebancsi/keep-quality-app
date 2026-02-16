import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DateTimeFieldDefinition } from '../../types/custom-fields.types';

@Component({
  selector: 'app-datetime-field-configurator',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './datetime-field-configurator.component.html',
  styleUrls: ['./datetime-field-configurator.component.scss']
})
export class DateTimeFieldConfiguratorComponent {
  field = input<DateTimeFieldDefinition | null>(null);
  fieldUpdated = output<DateTimeFieldDefinition>();

  updateField(): void {
    const field = this.field();
    if (field) {
      this.fieldUpdated.emit(field);
    }
  }
}
