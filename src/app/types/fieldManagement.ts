export type FieldDataType =
  | 'String' | 'Integer' | 'Float' | 'Boolean'
  | 'Date' | 'DateTime' | 'Array' | 'Object' | 'Number';

export type FieldStatus = 'Active' | 'Inactive';

export interface FieldManagementEntry {
  id: string;
  variable_id: string;
  variable_name: string;
  field_type: FieldDataType;
  alias: string;
  description?: string;
  category: string;
  status: FieldStatus;
  created_at?: string;
  updated_at?: string;
}

export interface FieldManagementCreate {
  variable_id: string;
  variable_name: string;
  data_type: FieldDataType;
  category: string;
  description?: string;
  alias: string;
  status: FieldStatus;
}

export const FIELD_CATEGORIES = [
  'Personal Information',
  'Contact Information',
  'Identity Documents',
  'Employment Details',
  'Financial Details',
  'Bank Details',
  'Loan Details',
  'Business Details',
  'Property Details',
  'Reference Details',
  'Other',
] as const;

export const FIELD_DATA_TYPES: FieldDataType[] = [
  'String', 'Integer', 'Float', 'Boolean', 'Date', 'DateTime', 'Array', 'Object',
];
