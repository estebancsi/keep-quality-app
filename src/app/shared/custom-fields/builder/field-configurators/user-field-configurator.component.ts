import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UserFieldDefinition } from '../../types/custom-fields.types';

@Component({
  selector: 'app-user-field-configurator',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './user-field-configurator.component.html',
  styleUrls: ['./user-field-configurator.component.scss']
})
export class UserFieldConfiguratorComponent {
  field = input<UserFieldDefinition | null>(null);
  fieldUpdated = output<UserFieldDefinition>();

  updateField(): void {
    const field = this.field();
    if (field) {
      this.fieldUpdated.emit(field);
    }
  }
}
