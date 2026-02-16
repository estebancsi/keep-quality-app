import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DateFieldDefinition } from '../../types/custom-fields.types';

@Component({
  selector: 'app-date-field-configurator',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './date-field-configurator.component.html',
  styleUrls: ['./date-field-configurator.component.scss']
})
export class DateFieldConfiguratorComponent {
  field = input<DateFieldDefinition | null>(null);
  fieldUpdated = output<DateFieldDefinition>();

  updateField(): void {
    const field = this.field();
    if (field) {
      this.fieldUpdated.emit(field);
    }
  }
}
