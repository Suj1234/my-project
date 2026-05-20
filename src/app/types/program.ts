export type ProgramStatus = 'Active' | 'Draft' | 'Inactive';
export type ProgramVertical = 'RETAIL' | 'GOLD' | 'MSME' | string;

export type IdentifierType = 'mobile' | 'pan' | 'account' | 'aadhaar';

export interface ProgramIdentifier {
  type: IdentifierType;
  label: string;
  placeholder: string;
}

export interface Program {
  id: string;
  program_name: string;
  product_category: string;
  vertical: ProgramVertical[];
  program_code: string;
  description?: string;
  status: ProgramStatus;
  supported_identifiers: ProgramIdentifier[];
  rapid_ui_app_id?: string;
  rapid_ui_app_name?: string;
  default_page_template?: string;
  created_at: string;
  updated_at: string;
}

export interface ProgramCreate {
  program_name: string;
  product_category: string;
  vertical: ProgramVertical[];
  program_code: string;
  description?: string;
  status: ProgramStatus;
}

export interface NativeField {
  id: string;
  variable_id: string;
  variable_name: string;
  field_type: string;
  alias: string;
  description?: string;
  category: string;
  status: 'Active' | 'Inactive';
}

export interface CustomField {
  id: string;
  field_name: string;
  display_name: string;
  data_type: string;
  category: string;
  description?: string;
  is_required: boolean;
  master_list?: string;
  master_list_values?: string[];
  status: 'Active' | 'Inactive';
  created_at: string;
  updated_at: string;
}

export interface ProgramDocument {
  id: string;
  program_id: string;
  document_id: string;
  document_name?: string;
  document_code?: string;
  document_category?: string;
  scheme_ids: string[];
  closure_action_ids: string[];
  role_ids: string[];
  status: 'Active' | 'Inactive';
}

export interface Scheme {
  id: string;
  scheme_name: string;
  scheme_code: string;
  description?: string;
  status: string;
}

export interface ClosureAction {
  id: string;
  action_name: string;
  action_code: string;
  description?: string;
}

export interface Role {
  id: string;
  role_name: string;
  role_code: string;
  description?: string;
}

export interface VariableMaster {
  id: string;
  variable_name: string;
  data_type: 'Native' | 'Custom';
  field_type: string;
  category: string;
  description?: string;
}

export interface OpsDashboardFilter {
  field_id: string;
  variable_name: string;
  filter_type: string;
}

export interface OpsDashboardColumn {
  field_id: string;
  variable_name: string;
  is_sortable: boolean;
}

export interface OpsDashboardViewField {
  field_id: string;
  variable_name: string;
  field_type?: string;
}

export interface OpsDashboardViewCategory {
  category_name: string;
  fields: OpsDashboardViewField[];
}

export type PageType = 'APP_STATE_PAGE';
export type PageStatus = 'ACTIVE' | 'INACTIVE' | 'DRAFT';

export interface ProgramPage {
  id: string;
  program_id: string;
  page_name: string;
  page_type: PageType;
  status: PageStatus;
  page_config: string;
  created_at: string;
  updated_at: string;
}

export interface ProgramPageCreate {
  program_id: string;
  page_name: string;
  page_type: PageType;
  status: PageStatus;
  page_config: string;
}

export interface OpsDashboardConfig {
  id?: string;
  program_id: string;
  filters: OpsDashboardFilter[];
  listing_columns: OpsDashboardColumn[];
  view_categories: OpsDashboardViewCategory[];
  field_aliases: Record<string, string>;
}
