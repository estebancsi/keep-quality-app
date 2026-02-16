import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TimeFieldDefinition } from '../../types/custom-fields.types';

@Component({
  selector: 'app-time-field-configurator',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './time-field-configurator.component.html',
  styleUrls: ['./time-field-configurator.component.scss']
})
export class TimeFieldConfiguratorComponent {
  field = input<TimeFieldDefinition | null>(null);
  fieldUpdated = output<TimeFieldDefinition>();

  updateField(): void {
    const field = this.field();
    if (field) {
      this.fieldUpdated.emit(field);
    }
  }
}
