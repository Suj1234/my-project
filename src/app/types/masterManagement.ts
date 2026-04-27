export type MasterStatus = 'ACTIVE' | 'INACTIVE' | 'DRAFT' | 'IN_PROGRESS';
export type FieldDataType = 'TEXT' | 'NUMBER';
export type ValidationType = 'MAXIMUM_LENGTH' | 'MINIMUM_LENGTH' | 'MAX' | 'MIN' | 'REGEX';

export const VALIDATION_TYPE_LABELS: Record<ValidationType, string> = {
  MAXIMUM_LENGTH: 'Maximum Length',
  MINIMUM_LENGTH: 'Minimum Length',
  MAX: 'Max',
  MIN: 'Min',
  REGEX: 'Regex',
};

export const STATUS_LABELS: MasterStatus[] = ['ACTIVE', 'INACTIVE', 'DRAFT', 'IN_PROGRESS'];

export interface FieldValidation {
  id: string;
  type: ValidationType;
  value: string;
}

export interface MasterField {
  id: string;
  fieldName: string;
  dataType: FieldDataType;
  isPrimary: boolean;
  validations: FieldValidation[];
}

export interface SubMaster {
  id: string;
  name: string;
  subMasterCode: string;
  description: string;
  parentMasterId: string;
  parentMasterName: string;
  status: MasterStatus;
  entries: number;
  fields: MasterField[];
  records: Record<string, string>[];
  createdAt: string;
  updatedAt: string;
}

export interface Master {
  id: string;
  name: string;
  masterCode: string;
  description: string;
  status: MasterStatus;
  defaultVersion: number;
  fields: MasterField[];
  subMasters: SubMaster[];
  records: Record<string, string>[];
  createdAt: string;
  updatedAt: string;
}

export interface MasterListFilters {
  name: string;
  status: string;
  dateFrom: string;
  dateTo: string;
}

export interface CreateMasterPayload {
  name: string;
  masterCode: string;
  description: string;
  fields: Array<{
    fieldName: string;
    dataType: FieldDataType;
    isPrimary: boolean;
    validations: Array<{ type: ValidationType; value: string }>;
  }>;
}

export interface CreateSubMasterPayload {
  name: string;
  subMasterCode: string;
  description: string;
  fields: Array<{
    fieldName: string;
    dataType: FieldDataType;
    isPrimary: boolean;
    validations: Array<{ type: ValidationType; value: string }>;
  }>;
}

export interface UpdateMasterPayload {
  name: string;
  description: string;
  status: MasterStatus;
}
