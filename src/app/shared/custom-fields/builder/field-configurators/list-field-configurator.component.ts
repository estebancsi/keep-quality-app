import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ListFieldDefinition } from '../../types/custom-fields.types';

@Component({
  selector: 'app-list-field-configurator',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './list-field-configurator.component.html',
  styleUrls: ['./list-field-configurator.component.scss']
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
}
