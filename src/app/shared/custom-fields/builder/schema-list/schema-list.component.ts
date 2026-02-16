import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CustomFieldsService } from '../../service/custom-fields.service';
import { CustomFieldsSchema } from '../../types/custom-fields.types';
import { Observable, Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';

@Component({
  selector: 'app-schema-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './schema-list.component.html',
  styleUrls: ['./schema-list.component.scss']
})
export class SchemaListComponent implements OnInit {
  schemas = signal<CustomFieldsSchema[]>([]);
  isLoading = signal(false);
  error = signal<string | null>(null);

  searchTerm = signal('');
  private searchSubject = new Subject<string>();

  constructor(
    private customFieldsService: CustomFieldsService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadSchemas();

    // Set up search with debounce
    this.searchSubject
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        switchMap((term) => {
          this.filterSchemas(term);
          return [];
        })
      )
      .subscribe();
  }

  private loadSchemas(): void {
    this.isLoading.set(true);
    this.error.set(null);

    this.customFieldsService.getAllSchemas().subscribe({
      next: (schemas) => {
        this.schemas.set(schemas);
        this.isLoading.set(false);
      },
      error: (error) => {
        this.error.set(`Failed to load schemas: ${error.message}`);
        this.isLoading.set(false);
      }
    });
  }

  onSearch(term: string): void {
    this.searchSubject.next(term);
  }

  private filterSchemas(term: string): void {
    if (!term) {
      this.loadSchemas();
      return;
    }

    const lowerTerm = term.toLowerCase();
    this.customFieldsService.getAllSchemas().subscribe({
      next: (schemas) => {
        this.schemas.set(
          schemas.filter((schema) => schema.name?.toLowerCase().includes(lowerTerm) || schema.description?.toLowerCase().includes(lowerTerm))
        );
      }
    });
  }

  createNewSchema(): void {
    this.router.navigate(['/custom-fields/edit']);
  }

  editSchema(schema: CustomFieldsSchema): void {
    if (schema.id) {
      this.router.navigate(['/custom-fields/edit', schema.id]);
    }
  }

  deleteSchema(schema: CustomFieldsSchema, event: Event): void {
    event.stopPropagation();

    if (!schema.id) return;

    if (confirm(`Are you sure you want to delete the schema "${schema.name}"? This action cannot be undone.`)) {
      this.customFieldsService.deleteSchema(schema.id).subscribe({
        next: () => {
          this.loadSchemas();
        },
        error: (error) => {
          this.error.set(`Failed to delete schema: ${error.message}`);
        }
      });
    }
  }

  duplicateSchema(schema: CustomFieldsSchema, event: Event): void {
    event.stopPropagation();

    const duplicatedSchema: CustomFieldsSchema = {
      ...schema,
      id: undefined,
      name: `${schema.name}_copy`,
      description: schema.description ? `${schema.description} (Copy)` : 'Copy of schema'
    };

    this.customFieldsService.createSchema(duplicatedSchema).subscribe({
      next: () => {
        this.loadSchemas();
      },
      error: (error) => {
        this.error.set(`Failed to duplicate schema: ${error.message}`);
      }
    });
  }

  getFieldCount(schema: CustomFieldsSchema): number {
    return schema.fields?.length || 0;
  }

  getGroupCount(schema: CustomFieldsSchema): number {
    return schema.groups?.length || 0;
  }

  trackBySchemaId(index: number, schema: CustomFieldsSchema): string | undefined {
    return schema.id;
  }
}
