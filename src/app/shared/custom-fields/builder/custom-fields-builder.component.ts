import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CustomFieldsService } from '../service/custom-fields.service';
import {
  CustomFieldsSchema,
  CustomFieldDefinition,
  FieldGroup,
} from '../types/custom-fields.types';
import { FieldEditorComponent } from './field-editor/field-editor.component';
import { FieldGroupManagerComponent } from './field-group-manager/field-group-manager.component';
import { FormPreviewComponent } from './form-preview/form-preview.component';

@Component({
  selector: 'app-custom-fields-builder',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    FieldEditorComponent,
    FieldGroupManagerComponent,
    FormPreviewComponent,
  ],
  templateUrl: './custom-fields-builder.component.html',
  styleUrls: ['./custom-fields-builder.component.scss'],
})
export class CustomFieldsBuilderComponent implements OnInit {
  currentSchema = signal<CustomFieldsSchema | null>(null);
  selectedField = signal<CustomFieldDefinition | null>(null);

  isLoading = signal(false);
  error = signal<string | null>(null);

  constructor(
    private customFieldsService: CustomFieldsService,
    private route: ActivatedRoute,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
      const id = params.get('id');
      if (id) {
        this.loadSchema(id);
      } else {
        this.createNewSchema();
      }
    });
  }

  private loadSchema(id: string): void {
    this.isLoading.set(true);
    this.error.set(null);

    this.customFieldsService.getSchemaById(id).subscribe({
      next: (schema) => {
        this.currentSchema.set(schema);
        this.isLoading.set(false);
      },
      error: (error) => {
        this.error.set(`Failed to load schema: ${error.message}`);
        this.isLoading.set(false);
      },
    });
  }

  private createNewSchema(): void {
    const newSchema: CustomFieldsSchema = {
      name: '',
      description: '',
      groups: [],
      fields: [],
    };
    this.currentSchema.set(newSchema);
  }

  selectField(field: CustomFieldDefinition): void {
    this.selectedField.set(field);
  }

  deselectField(): void {
    this.selectedField.set(null);
  }

  addField(field: CustomFieldDefinition): void {
    const currentSchema = this.currentSchema();
    if (currentSchema) {
      const updatedSchema = {
        ...currentSchema,
        fields: [...currentSchema.fields, field],
      };
      this.currentSchema.set(updatedSchema);
    }
  }

  updateField(updatedField: CustomFieldDefinition): void {
    const currentSchema = this.currentSchema();
    if (currentSchema) {
      const selectedField = this.selectedField();
      if (!selectedField) return;

      const updatedFields = currentSchema.fields.map((field) =>
        field.name === selectedField.name ? updatedField : field,
      );
      const updatedSchema = {
        ...currentSchema,
        fields: updatedFields,
      };
      this.currentSchema.set(updatedSchema);
      this.selectedField.set(updatedField);
    }
  }

  deleteField(fieldName: string): void {
    const currentSchema = this.currentSchema();
    if (currentSchema) {
      const updatedFields = currentSchema.fields.filter((field) => field.name !== fieldName);
      const updatedSchema = {
        ...currentSchema,
        fields: updatedFields,
      };
      this.currentSchema.set(updatedSchema);
      this.deselectField();
    }
  }

  addGroup(group: FieldGroup): void {
    const currentSchema = this.currentSchema();
    if (currentSchema) {
      const updatedSchema = {
        ...currentSchema,
        groups: [...currentSchema.groups, group],
      };
      this.currentSchema.set(updatedSchema);
    }
  }

  updateGroup(updatedGroup: FieldGroup): void {
    const currentSchema = this.currentSchema();
    if (currentSchema) {
      const updatedGroups = currentSchema.groups.map((group) =>
        group.name === updatedGroup.name ? updatedGroup : group,
      );
      const updatedSchema = {
        ...currentSchema,
        groups: updatedGroups,
      };
      this.currentSchema.set(updatedSchema);
    }
  }

  deleteGroup(groupName: string): void {
    const currentSchema = this.currentSchema();
    if (currentSchema) {
      // Remove the group and update fields that reference it
      const updatedGroups = currentSchema.groups.filter((group) => group.name !== groupName);
      const updatedFields = currentSchema.fields.map((field) =>
        field.group === groupName ? { ...field, group: undefined } : field,
      );
      const updatedSchema = {
        ...currentSchema,
        groups: updatedGroups,
        fields: updatedFields,
      };
      this.currentSchema.set(updatedSchema);
    }
  }

  saveSchema(): void {
    const currentSchema = this.currentSchema();
    if (!currentSchema) return;

    this.isLoading.set(true);
    this.error.set(null);

    const saveOperation = currentSchema.id
      ? this.customFieldsService.updateSchema(currentSchema.id, currentSchema)
      : this.customFieldsService.createSchema(currentSchema);

    saveOperation.subscribe({
      next: (savedSchema) => {
        this.currentSchema.set(savedSchema);
        this.isLoading.set(false);
        if (!currentSchema.id) {
          // Navigate to edit route for new schemas
          this.router.navigate(['/custom-fields/edit', savedSchema.id]);
        }
      },
      error: (error) => {
        this.error.set(`Failed to save schema: ${error.message}`);
        this.isLoading.set(false);
      },
    });
  }

  deleteSchema(): void {
    const currentSchema = this.currentSchema();
    if (!currentSchema || !currentSchema.id) return;

    if (confirm('Are you sure you want to delete this schema? This action cannot be undone.')) {
      this.isLoading.set(true);
      this.error.set(null);

      this.customFieldsService.deleteSchema(currentSchema.id).subscribe({
        next: () => {
          this.isLoading.set(false);
          this.router.navigate(['/custom-fields']);
        },
        error: (error) => {
          this.error.set(`Failed to delete schema: ${error.message}`);
          this.isLoading.set(false);
        },
      });
    }
  }

  reorderFields(fields: CustomFieldDefinition[]): void {
    const currentSchema = this.currentSchema();
    if (currentSchema) {
      const updatedSchema = {
        ...currentSchema,
        fields: fields,
      };
      this.currentSchema.set(updatedSchema);
    }
  }

  reorderGroups(groups: FieldGroup[]): void {
    const currentSchema = this.currentSchema();
    if (currentSchema) {
      const updatedSchema = {
        ...currentSchema,
        groups: groups,
      };
      this.currentSchema.set(updatedSchema);
    }
  }

  addFieldToGroup(event: { field: CustomFieldDefinition | null; groupName?: string }): void {
    const currentSchema = this.currentSchema();
    if (!currentSchema) return;

    // Create a new field with default configuration
    const newField: CustomFieldDefinition = {
      name: `field_${Date.now()}`,
      label: 'New Field',
      type: 'TEXT',
      required: false,
      order: currentSchema.fields.length,
      group: event.groupName,
      validation: {
        required: false,
        customRules: [],
        errorMessages: {},
      },
      config: {
        type: 'TEXT',
        inputType: 'TEXT',
        showCharacterCount: false,
      },
    };

    // Add the field to the schema
    const updatedSchema = {
      ...currentSchema,
      fields: [...currentSchema.fields, newField],
    };

    this.currentSchema.set(updatedSchema);

    // Automatically select the new field for editing
    this.selectField(newField);
  }
}
