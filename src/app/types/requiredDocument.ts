export type DocumentStatus = 'Active' | 'Draft';

export interface RequiredDocument {
  id: string;
  document_code: string;
  document_name: string;
  document_category: string;
  supported_formats: string[];
  min_size?: number;
  max_size?: number;
  status: DocumentStatus;
  created_at: string;
  updated_at: string;
}

export interface RequiredDocumentCreate {
  document_name: string;
  document_category: string;
  supported_formats: string[];
  min_size?: number | null;
  max_size?: number | null;
  status: DocumentStatus;
}

export const DOCUMENT_CATEGORIES = [
  'POI', 'POA', 'Income Proof', 'Business Proof', 'Bank Statement',
  'Employment Proof', 'GST Documents', 'ITR', 'Property Documents',
  'Educational Documents', 'Financial Statement', 'Credit Report',
] as const;

export const FILE_FORMATS = [
  'PDF', 'JPG', 'JPEG', 'PNG', 'XLS', 'XLSX', 'DOC', 'DOCX',
  'CSV', 'TIF', 'TIFF', 'BMP', 'GIF', 'ZIP', 'RAR',
] as const;
