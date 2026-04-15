export interface Application {
  id: string;
  application_id: string;
  program_id: string;
  program_name?: string;
  program_code?: string;
  status: string;
  created_at: string;
  updated_at: string;
  [key: string]: unknown;
}
