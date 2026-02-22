// Base types for configuration options
export interface ListOption {
  value: string;
  label: string;
  order: number;
  disabled?: boolean;
  isDefault?: boolean;
  group?: string;
  description?: string;
}

export interface ValidationRule {
  type: 'MIN_LENGTH' | 'MAX_LENGTH' | 'PATTERN' | 'MIN_VALUE' | 'MAX_VALUE' | 'CUSTOM';
  value: any;
  message: string;
}

export interface FieldValidation {
  required: boolean;
  customRules: ValidationRule[];
  errorMessages: Record<string, string>;
}

export interface Condition {
  fieldId: string;
  operator:
    | 'EQUALS'
    | 'NOT_EQUALS'
    | 'CONTAINS'
    | 'GREATER_THAN'
    | 'LESS_THAN'
    | 'IS_EMPTY'
    | 'IS_NOT_EMPTY';
  value: any;
}

export interface ConditionGroup {
  operator: 'AND' | 'OR';
  conditions: Condition[];
}

export interface ConditionalLogic {
  showIf?: ConditionGroup;
  requiredIf?: ConditionGroup;
}

// Type for grouping fields
export interface FieldGroup {
  name: string;
  label: string;
  description?: string;
  order: number;
  collapsible?: boolean;
  defaultCollapsed?: boolean;
}

// Field Type Enum
export type FieldType =
  | 'BOOLEAN'
  | 'DATE'
  | 'DATETIME'
  | 'INTEGER'
  | 'LIST'
  | 'TEXT'
  | 'LONG_TEXT'
  | 'TIME'
  | 'USER';

// Base field configuration interface
export interface BaseFieldConfig {
  type: FieldType;
}

// Field Type Specific Configurations
export interface BooleanFieldConfig extends BaseFieldConfig {
  type: 'BOOLEAN';
  defaultValue?: boolean;
  displayStyle: 'CHECKBOX' | 'TOGGLE' | 'RADIO';
  trueLabel?: string;
  falseLabel?: string;
}

export interface DateFieldConfig extends BaseFieldConfig {
  type: 'DATE';
  defaultValue?: Date | 'TODAY';
  minDate?: Date | 'TODAY';
  maxDate?: Date | 'TODAY';
  dateFormat: string;
  showCalendar: boolean;
  disabledDates?: Date[];
  disabledDays?: number[];
}

export interface DateTimeFieldConfig extends BaseFieldConfig {
  type: 'DATETIME';
  defaultValue?: Date | 'NOW';
  minDateTime?: Date | 'NOW';
  maxDateTime?: Date | 'NOW';
  dateFormat: string;
  timeFormat: '12' | '24';
  showSeconds: boolean;
  minuteStep: number;
}

export interface IntegerFieldConfig extends BaseFieldConfig {
  type: 'INTEGER';
  defaultValue?: number;
  minValue?: number;
  maxValue?: number;
  step: number;
  showSpinButtons: boolean;
  thousandsSeparator: boolean;
  prefix?: string;
  suffix?: string;
}

export interface ListFieldConfig extends BaseFieldConfig {
  type: 'LIST';
  allowMultiple: boolean;
  options: ListOption[];
  displayStyle: 'DROPDOWN' | 'RADIO' | 'CHECKBOX' | 'MULTISELECT';
  searchable: boolean;
  allowCustomValues: boolean;
  maxSelections?: number;
}

export interface TextFieldConfig extends BaseFieldConfig {
  type: 'TEXT';
  defaultValue?: string;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  inputType: 'TEXT' | 'EMAIL' | 'URL' | 'PHONE' | 'PASSWORD';
  autoComplete?: string;
  showCharacterCount: boolean;
  template?: string;
}

export interface LongTextFieldConfig extends BaseFieldConfig {
  type: 'LONG_TEXT';
  defaultValue?: string;
  minLength?: number;
  maxLength?: number;
  rows: number;
  resizable: boolean;
  showCharacterCount: boolean;
  richText: boolean;
  template?: string;
}

export interface TimeFieldConfig extends BaseFieldConfig {
  type: 'TIME';
  defaultValue?: string | 'NOW';
  timeFormat: '12' | '24';
  minuteStep: number;
  showSeconds: boolean;
}

export interface UserFieldConfig extends BaseFieldConfig {
  type: 'USER';
  allowMultiple: boolean;
  userRoles?: string[];
  departments?: string[];
  includeInactive: boolean;
  displayFormat: 'NAME' | 'EMAIL' | 'NAME_EMAIL';
  searchable: boolean;
}

// Field Definition Base Interface
export interface BaseFieldDefinition {
  name: string;
  label: string;
  type: FieldType;
  required: boolean;
  order: number;
  description?: string;
  placeholder?: string;
  helpText?: string;
  group?: string;
  validation: FieldValidation;
  conditional?: ConditionalLogic;
}

// Specific Field Definitions
export interface BooleanFieldDefinition extends BaseFieldDefinition {
  type: 'BOOLEAN';
  config: BooleanFieldConfig;
}

export interface DateFieldDefinition extends BaseFieldDefinition {
  type: 'DATE';
  config: DateFieldConfig;
}

export interface DateTimeFieldDefinition extends BaseFieldDefinition {
  type: 'DATETIME';
  config: DateTimeFieldConfig;
}

export interface IntegerFieldDefinition extends BaseFieldDefinition {
  type: 'INTEGER';
  config: IntegerFieldConfig;
}

export interface ListFieldDefinition extends BaseFieldDefinition {
  type: 'LIST';
  config: ListFieldConfig;
}

export interface TextFieldDefinition extends BaseFieldDefinition {
  type: 'TEXT';
  config: TextFieldConfig;
}

export interface LongTextFieldDefinition extends BaseFieldDefinition {
  type: 'LONG_TEXT';
  config: LongTextFieldConfig;
}

export interface TimeFieldDefinition extends BaseFieldDefinition {
  type: 'TIME';
  config: TimeFieldConfig;
}

export interface UserFieldDefinition extends BaseFieldDefinition {
  type: 'USER';
  config: UserFieldConfig;
}

// Discriminated Union for Field Definitions
export type CustomFieldDefinition =
  | BooleanFieldDefinition
  | DateFieldDefinition
  | DateTimeFieldDefinition
  | IntegerFieldDefinition
  | ListFieldDefinition
  | TextFieldDefinition
  | LongTextFieldDefinition
  | TimeFieldDefinition
  | UserFieldDefinition;

// Helper type to get config by type
export type ConfigByType<T extends FieldType> = Extract<
  CustomFieldDefinition,
  { type: T }
>['config'];

// Main Schema Interface
export interface CustomFieldsSchema {
  id?: string;
  name?: string;
  description?: string;
  groups: FieldGroup[];
  fields: CustomFieldDefinition[];
}

// Type Guards
export function isBooleanField(field: CustomFieldDefinition): field is BooleanFieldDefinition {
  return field.type === 'BOOLEAN';
}

export function isDateField(field: CustomFieldDefinition): field is DateFieldDefinition {
  return field.type === 'DATE';
}

export function isDateTimeField(field: CustomFieldDefinition): field is DateTimeFieldDefinition {
  return field.type === 'DATETIME';
}

export function isIntegerField(field: CustomFieldDefinition): field is IntegerFieldDefinition {
  return field.type === 'INTEGER';
}

export function isListField(field: CustomFieldDefinition): field is ListFieldDefinition {
  return field.type === 'LIST';
}

export function isTextField(field: CustomFieldDefinition): field is TextFieldDefinition {
  return field.type === 'TEXT';
}

export function isLongTextField(field: CustomFieldDefinition): field is LongTextFieldDefinition {
  return field.type === 'LONG_TEXT';
}

export function isTimeField(field: CustomFieldDefinition): field is TimeFieldDefinition {
  return field.type === 'TIME';
}

export function isUserField(field: CustomFieldDefinition): field is UserFieldDefinition {
  return field.type === 'USER';
}
