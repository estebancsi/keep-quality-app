import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { TextareaModule } from 'primeng/textarea';
import { CheckboxModule } from 'primeng/checkbox';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { SelectModule } from 'primeng/select';
import { MultiSelectModule } from 'primeng/multiselect';
import { DatePickerModule } from 'primeng/datepicker';
import { EditorModule } from 'primeng/editor';
import {
  CustomFieldsSchema,
  CustomFieldDefinition,
  isBooleanField,
  isDateField,
  isDateTimeField,
  isIntegerField,
  isListField,
  isTextField,
  isLongTextField,
  isTimeField,
  isUserField,
  BooleanFieldDefinition,
  DateFieldDefinition,
  DateTimeFieldDefinition,
  IntegerFieldDefinition,
  ListFieldDefinition,
  TextFieldDefinition,
  LongTextFieldDefinition,
  TimeFieldDefinition,
  UserFieldDefinition,
} from '../types/custom-fields.types';
import { getFieldsByGroup } from '../utils/custom-fields.helpers';

/**
 * Reusable custom fields renderer.
 * Takes a schema definition + values object and renders editable PrimeNG inputs
 * for every field, grouped by FieldGroup. Emits value changes on each edit.
 *
 * Usage:
 *   <app-custom-fields-renderer
 *     [schema]="schema"
 *     [values]="artifact.customFieldValues ?? {}"
 *     (valuesChange)="onCustomFieldsChanged($event)"
 *   />
 */
@Component({
  selector: 'app-custom-fields-renderer',
  imports: [
    CommonModule,
    FormsModule,
    InputTextModule,
    InputNumberModule,
    TextareaModule,
    CheckboxModule,
    ToggleSwitchModule,
    SelectModule,
    MultiSelectModule,
    DatePickerModule,
    EditorModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @for (group of groupedFields(); track group.group?.name ?? 'ungrouped') {
      <fieldset
        class="border-surface-200 dark:border-surface-700 rounded-lg mb-4"
        [ngClass]="{
          border: !!group.group?.name,
          'p-4': !!group.group?.name,
        }"
      >
        <legend class="text-sm font-semibold text-surface-600 dark:text-surface-300 px-2">
          {{ group.group?.label }}
        </legend>

        @if (group.group?.description) {
          <p class="text-sm text-surface-500 mb-3 mt-0">{{ group.group!.description }}</p>
        }

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          @for (field of group.fields; track field.name) {
            <div class="flex flex-col gap-1" [class.md:col-span-2]="isWideField(field)">
              <label [for]="'cf-' + field.name" class="text-sm font-medium">
                {{ field.label }}
                @if (field.required) {
                  <span class="text-red-500">*</span>
                }
              </label>

              @if (field.description) {
                <small class="text-surface-500">{{ field.description }}</small>
              }

              <!-- TEXT -->
              @if (isTextField(field)) {
                <input
                  pInputText
                  [id]="'cf-' + field.name"
                  [type]="getInputType(asTextField(field))"
                  [ngModel]="getFieldValue(field.name)"
                  (ngModelChange)="onFieldChange(field.name, $event)"
                  [placeholder]="field.placeholder ?? ''"
                  [maxlength]="asTextField(field).config.maxLength ?? null"
                  class="w-full"
                />
                @if (
                  asTextField(field).config.showCharacterCount &&
                  asTextField(field).config.maxLength
                ) {
                  <small class="text-surface-400 text-right">
                    {{ getStringLength(field.name) }} /
                    {{ asTextField(field).config.maxLength }}
                  </small>
                }
              }

              <!-- LONG_TEXT (plain) -->
              @if (isLongTextField(field) && !asLongTextField(field).config.richText) {
                <textarea
                  pTextarea
                  [id]="'cf-' + field.name"
                  [ngModel]="getFieldValue(field.name)"
                  (ngModelChange)="onFieldChange(field.name, $event)"
                  [placeholder]="field.placeholder ?? ''"
                  [rows]="asLongTextField(field).config.rows"
                  [autoResize]="asLongTextField(field).config.resizable"
                  class="w-full"
                ></textarea>
                @if (
                  asLongTextField(field).config.showCharacterCount &&
                  asLongTextField(field).config.maxLength
                ) {
                  <small class="text-surface-400 text-right">
                    {{ getStringLength(field.name) }} /
                    {{ asLongTextField(field).config.maxLength }}
                  </small>
                }
              }

              <!-- LONG_TEXT (rich text) -->
              @if (isLongTextField(field) && asLongTextField(field).config.richText) {
                <p-editor
                  [ngModel]="getFieldValue(field.name)"
                  (ngModelChange)="onFieldChange(field.name, $event)"
                  [style]="{ height: asLongTextField(field).config.rows * 24 + 'px' }"
                />
              }

              <!-- INTEGER -->
              @if (isIntegerField(field)) {
                <p-inputNumber
                  [id]="'cf-' + field.name"
                  [ngModel]="getFieldValue(field.name)"
                  (ngModelChange)="onFieldChange(field.name, $event)"
                  [min]="asIntegerField(field).config.minValue ?? undefined"
                  [max]="asIntegerField(field).config.maxValue ?? undefined"
                  [step]="asIntegerField(field).config.step"
                  [showButtons]="asIntegerField(field).config.showSpinButtons"
                  [useGrouping]="asIntegerField(field).config.thousandsSeparator"
                  [prefix]="asIntegerField(field).config.prefix ?? ''"
                  [suffix]="asIntegerField(field).config.suffix ?? ''"
                  [placeholder]="field.placeholder ?? ''"
                  styleClass="w-full"
                />
              }

              <!-- BOOLEAN (checkbox) -->
              @if (
                isBooleanField(field) && asBooleanField(field).config.displayStyle === 'CHECKBOX'
              ) {
                <div class="flex items-center gap-2">
                  <p-checkbox
                    [inputId]="'cf-' + field.name"
                    [ngModel]="
                      getFieldValue(field.name) ??
                      asBooleanField(field).config.defaultValue ??
                      false
                    "
                    (ngModelChange)="onFieldChange(field.name, $event)"
                    [binary]="true"
                  />
                  <label [for]="'cf-' + field.name" class="text-sm">
                    {{ asBooleanField(field).config.trueLabel ?? 'Yes' }}
                  </label>
                </div>
              }

              <!-- BOOLEAN (toggle) -->
              @if (
                isBooleanField(field) && asBooleanField(field).config.displayStyle === 'TOGGLE'
              ) {
                <div class="flex items-center gap-2">
                  <p-toggleSwitch
                    [inputId]="'cf-' + field.name"
                    [ngModel]="
                      getFieldValue(field.name) ??
                      asBooleanField(field).config.defaultValue ??
                      false
                    "
                    (ngModelChange)="onFieldChange(field.name, $event)"
                  />
                  <span class="text-sm">
                    {{
                      (getFieldValue(field.name) ?? false)
                        ? (asBooleanField(field).config.trueLabel ?? 'Yes')
                        : (asBooleanField(field).config.falseLabel ?? 'No')
                    }}
                  </span>
                </div>
              }

              <!-- BOOLEAN (radio) -->
              @if (isBooleanField(field) && asBooleanField(field).config.displayStyle === 'RADIO') {
                <div class="flex gap-4">
                  <div class="flex items-center gap-2">
                    <p-checkbox
                      [inputId]="'cf-' + field.name + '-true'"
                      [ngModel]="getFieldValue(field.name) === true"
                      (ngModelChange)="onFieldChange(field.name, true)"
                      [binary]="true"
                    />
                    <label [for]="'cf-' + field.name + '-true'" class="text-sm">
                      {{ asBooleanField(field).config.trueLabel ?? 'Yes' }}
                    </label>
                  </div>
                  <div class="flex items-center gap-2">
                    <p-checkbox
                      [inputId]="'cf-' + field.name + '-false'"
                      [ngModel]="getFieldValue(field.name) === false"
                      (ngModelChange)="onFieldChange(field.name, false)"
                      [binary]="true"
                    />
                    <label [for]="'cf-' + field.name + '-false'" class="text-sm">
                      {{ asBooleanField(field).config.falseLabel ?? 'No' }}
                    </label>
                  </div>
                </div>
              }

              <!-- LIST (single - dropdown) -->
              @if (isListField(field) && !asListField(field).config.allowMultiple) {
                <p-select
                  [inputId]="'cf-' + field.name"
                  [ngModel]="getFieldValue(field.name)"
                  (ngModelChange)="onFieldChange(field.name, $event)"
                  [options]="asListField(field).config.options"
                  optionLabel="label"
                  optionValue="value"
                  [placeholder]="field.placeholder ?? 'Select...'"
                  [filter]="asListField(field).config.searchable"
                  [showClear]="!field.required"
                  styleClass="w-full"
                />
              }

              <!-- LIST (multiple - multiselect) -->
              @if (isListField(field) && asListField(field).config.allowMultiple) {
                <p-multiselect
                  [inputId]="'cf-' + field.name"
                  [ngModel]="getFieldValue(field.name) ?? []"
                  (ngModelChange)="onFieldChange(field.name, $event)"
                  [options]="asListField(field).config.options"
                  optionLabel="label"
                  optionValue="value"
                  [placeholder]="field.placeholder ?? 'Select...'"
                  [filter]="asListField(field).config.searchable"
                  [maxSelectedLabels]="3"
                  [selectionLimit]="asListField(field).config.maxSelections ?? undefined"
                  styleClass="w-full"
                />
              }

              <!-- DATE -->
              @if (isDateField(field)) {
                <p-datepicker
                  [inputId]="'cf-' + field.name"
                  [ngModel]="getFieldValue(field.name)"
                  (ngModelChange)="onFieldChange(field.name, $event)"
                  [dateFormat]="asDateField(field).config.dateFormat || 'yy-mm-dd'"
                  [showIcon]="asDateField(field).config.showCalendar"
                  [placeholder]="field.placeholder ?? 'Select date...'"
                  styleClass="w-full"
                />
              }

              <!-- DATETIME -->
              @if (isDateTimeField(field)) {
                <p-datepicker
                  [inputId]="'cf-' + field.name"
                  [ngModel]="getFieldValue(field.name)"
                  (ngModelChange)="onFieldChange(field.name, $event)"
                  [dateFormat]="asDateTimeField(field).config.dateFormat || 'yy-mm-dd'"
                  [showTime]="true"
                  [showSeconds]="asDateTimeField(field).config.showSeconds"
                  [stepMinute]="asDateTimeField(field).config.minuteStep"
                  [hourFormat]="asDateTimeField(field).config.timeFormat === '12' ? '12' : '24'"
                  [showIcon]="true"
                  [placeholder]="field.placeholder ?? 'Select date and time...'"
                  styleClass="w-full"
                />
              }

              <!-- TIME -->
              @if (isTimeField(field)) {
                <p-datepicker
                  [inputId]="'cf-' + field.name"
                  [ngModel]="getFieldValue(field.name)"
                  (ngModelChange)="onFieldChange(field.name, $event)"
                  [timeOnly]="true"
                  [showSeconds]="asTimeField(field).config.showSeconds"
                  [stepMinute]="asTimeField(field).config.minuteStep"
                  [hourFormat]="asTimeField(field).config.timeFormat === '12' ? '12' : '24'"
                  [showIcon]="true"
                  [placeholder]="field.placeholder ?? 'Select time...'"
                  styleClass="w-full"
                />
              }

              <!-- USER (simplified as a select — apps can override with a user picker) -->
              @if (isUserField(field) && !asUserField(field).config.allowMultiple) {
                <p-select
                  [inputId]="'cf-' + field.name"
                  [ngModel]="getFieldValue(field.name)"
                  (ngModelChange)="onFieldChange(field.name, $event)"
                  [options]="userOptions()"
                  optionLabel="label"
                  optionValue="value"
                  [placeholder]="field.placeholder ?? 'Select user...'"
                  [filter]="asUserField(field).config.searchable"
                  [showClear]="!field.required"
                  styleClass="w-full"
                />
              }

              <!-- USER (multiple) -->
              @if (isUserField(field) && asUserField(field).config.allowMultiple) {
                <p-multiselect
                  [inputId]="'cf-' + field.name"
                  [ngModel]="getFieldValue(field.name) ?? []"
                  (ngModelChange)="onFieldChange(field.name, $event)"
                  [options]="userOptions()"
                  optionLabel="label"
                  optionValue="value"
                  [placeholder]="field.placeholder ?? 'Select users...'"
                  [filter]="asUserField(field).config.searchable"
                  [maxSelectedLabels]="3"
                  styleClass="w-full"
                />
              }

              @if (field.helpText) {
                <small class="text-surface-400 italic">{{ field.helpText }}</small>
              }
            </div>
          }
        </div>
      </fieldset>
    }
  `,
})
export class CustomFieldsRendererComponent {
  /** Schema definition describing which fields to render */
  readonly schema = input.required<CustomFieldsSchema>();

  /** Current field values (key = field name, value = field value) */
  readonly values = input.required<Record<string, unknown>>();

  /** User options for USER fields — parent must supply [{label, value}] */
  readonly userOptions = input<{ label: string; value: string }[]>([]);

  /** Emitted whenever a field value changes, with the full updated values map */
  readonly valuesChange = output<Record<string, unknown>>();

  /** Fields grouped by FieldGroup, ordered by group.order then field.order */
  protected readonly groupedFields = computed(() => {
    const s = this.schema();
    return getFieldsByGroup(s.fields, s.groups);
  });

  // ─── Type guards (forwarded for template use) ──────

  protected readonly isTextField = isTextField;
  protected readonly isLongTextField = isLongTextField;
  protected readonly isIntegerField = isIntegerField;
  protected readonly isBooleanField = isBooleanField;
  protected readonly isListField = isListField;
  protected readonly isDateField = isDateField;
  protected readonly isDateTimeField = isDateTimeField;
  protected readonly isTimeField = isTimeField;
  protected readonly isUserField = isUserField;

  // ─── Type assertion helpers (for template property access) ──────

  protected asTextField(f: CustomFieldDefinition): TextFieldDefinition {
    return f as TextFieldDefinition;
  }

  protected asLongTextField(f: CustomFieldDefinition): LongTextFieldDefinition {
    return f as LongTextFieldDefinition;
  }

  protected asIntegerField(f: CustomFieldDefinition): IntegerFieldDefinition {
    return f as IntegerFieldDefinition;
  }

  protected asBooleanField(f: CustomFieldDefinition): BooleanFieldDefinition {
    return f as BooleanFieldDefinition;
  }

  protected asListField(f: CustomFieldDefinition): ListFieldDefinition {
    return f as ListFieldDefinition;
  }

  protected asDateField(f: CustomFieldDefinition): DateFieldDefinition {
    return f as DateFieldDefinition;
  }

  protected asDateTimeField(f: CustomFieldDefinition): DateTimeFieldDefinition {
    return f as DateTimeFieldDefinition;
  }

  protected asTimeField(f: CustomFieldDefinition): TimeFieldDefinition {
    return f as TimeFieldDefinition;
  }

  protected asUserField(f: CustomFieldDefinition): UserFieldDefinition {
    return f as UserFieldDefinition;
  }

  // ─── Value helpers ─────────────────────────────────

  protected getFieldValue(fieldName: string): unknown {
    return this.values()[fieldName] ?? null;
  }

  /** Get string length of a field value (for character count display) */
  protected getStringLength(fieldName: string): number {
    const val = this.values()[fieldName];
    return typeof val === 'string' ? val.length : 0;
  }

  protected onFieldChange(fieldName: string, value: unknown): void {
    const updated = { ...this.values(), [fieldName]: value };
    this.valuesChange.emit(updated);
  }

  /** Fields that should span the full width (LONG_TEXT, rich text, etc.) */
  protected isWideField(field: CustomFieldDefinition): boolean {
    return field.type === 'LONG_TEXT' || field.type === 'USER';
  }

  /** Map text field input types */
  protected getInputType(field: TextFieldDefinition): string {
    const map: Record<string, string> = {
      TEXT: 'text',
      EMAIL: 'email',
      URL: 'url',
      PHONE: 'tel',
      PASSWORD: 'password',
    };
    return map[field.config.inputType] ?? 'text';
  }
}
