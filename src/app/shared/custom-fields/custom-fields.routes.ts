import { Route } from '@angular/router';
import { SchemaListComponent } from './builder/schema-list/schema-list.component';
import { CustomFieldsBuilderComponent } from './builder/custom-fields-builder.component';

export default [
  { path: '', component: SchemaListComponent },
  { path: 'edit', component: CustomFieldsBuilderComponent },
  { path: 'edit/:id', component: CustomFieldsBuilderComponent }
] as Route[];
