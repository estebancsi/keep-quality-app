import { Component, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CdkDragDrop, DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';
import { FormsModule } from '@angular/forms';
import { FieldGroup, CustomFieldDefinition } from '../../types/custom-fields.types';

@Component({
  selector: 'app-field-group-manager',
  standalone: true,
  imports: [CommonModule, FormsModule, DragDropModule],
  templateUrl: './field-group-manager.component.html',
  styleUrls: ['./field-group-manager.component.scss'],
})
export class FieldGroupManagerComponent {
  groups = input.required<FieldGroup[]>();
  fields = input.required<CustomFieldDefinition[]>();

  groupAdded = output<FieldGroup>();
  groupUpdated = output<FieldGroup>();
  groupDeleted = output<string>();
  groupsReordered = output<FieldGroup[]>();
  fieldAdded = output<{ field: CustomFieldDefinition | null; groupName?: string }>();
  fieldMoved = output<CustomFieldDefinition[]>();

  newGroupName = signal('');
  newGroupLabel = signal('');
  showAddGroupForm = signal(false);

  getFieldsByGroup(groupName?: string): CustomFieldDefinition[] {
    return this.fields()
      .filter((field) => field.group === groupName)
      .sort((a, b) => a.order - b.order);
  }

  toggleAddGroupForm(): void {
    this.showAddGroupForm.update((value) => !value);
    if (this.showAddGroupForm()) {
      this.newGroupName.set('');
      this.newGroupLabel.set('');
    }
  }

  addGroup(): void {
    const name = this.newGroupName();
    const label = this.newGroupLabel();

    if (!name || !label) return;

    const newGroup: FieldGroup = {
      name,
      label,
      order: this.groups().length,
      collapsible: true,
      defaultCollapsed: false,
    };

    this.groupAdded.emit(newGroup);
    this.showAddGroupForm.set(false);
    this.newGroupName.set('');
    this.newGroupLabel.set('');
  }

  updateGroup(group: FieldGroup): void {
    this.groupUpdated.emit(group);
  }

  deleteGroup(groupName: string): void {
    if (confirm('Are you sure you want to delete this group? Fields will be moved to ungrouped.')) {
      this.groupDeleted.emit(groupName);
    }
  }

  dropGroup(event: CdkDragDrop<FieldGroup[]>): void {
    if (event.previousIndex === event.currentIndex) return;

    const reorderedGroups = [...this.groups()];
    moveItemInArray(reorderedGroups, event.previousIndex, event.currentIndex);

    // Update order property
    const updatedGroups = reorderedGroups.map((group, index) => ({
      ...group,
      order: index,
    }));

    this.groupsReordered.emit(updatedGroups);
  }

  dropField(event: CdkDragDrop<CustomFieldDefinition[]>, targetGroupName?: string): void {
    if (event.previousIndex === event.currentIndex && event.previousContainer === event.container)
      return;

    if (event.previousContainer === event.container) {
      const otherGroupsFields = this.fields().filter((f) => f.group !== targetGroupName);
      // Reordering within the same group
      const groupFields = this.getFieldsByGroup(targetGroupName);
      moveItemInArray(groupFields, event.previousIndex, event.currentIndex);
      // Update order property
      const updatedFields = groupFields.map((f, index) => ({
        ...f,
        order: index,
      }));
      this.fieldMoved.emit([...updatedFields, ...otherGroupsFields]);
      return;
    }
    // Moving between different groups
    const prevGroupFields = event.previousContainer.data;
    const targetGroupFields = event.container.data;
    const movedField = prevGroupFields[event.previousIndex];

    // Remove from previous group
    const updatedPrevGroupFields = prevGroupFields
      .filter((f) => f.name !== movedField.name)
      .map((f, index) => ({
        ...f,
        order: index,
      }));
    // Add to target group
    const updatedTargetGroupFields = [
      ...targetGroupFields.slice(0, event.currentIndex),
      { ...movedField, group: targetGroupName },
      ...targetGroupFields.slice(event.currentIndex),
    ].map((f, index) => ({
      ...f,
      order: index,
    }));
    this.fieldMoved.emit([...updatedPrevGroupFields, ...updatedTargetGroupFields]);
  }

  addFieldToGroup(groupName?: string): void {
    // Signal to parent component that user wants to add a field to this group
    // Parent component will handle the actual field creation logic
    this.fieldAdded.emit({
      field: null as any, // Parent will create the actual field
      groupName: groupName,
    });
  }

  trackByGroupName(index: number, group: FieldGroup): string {
    return `${index}_${group.name}`;
  }

  trackByFieldName(index: number, field: CustomFieldDefinition): string {
    return `${index}_${field.name}`;
  }
}
