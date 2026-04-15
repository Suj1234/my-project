import type { BlockData } from './journey';

export type WorkflowStatus = 'ACTIVE' | 'INACTIVE' | 'DRAFT';
export type WorkflowVersionStatus = 'ACTIVE' | 'INACTIVE' | 'DRAFT';

export interface WorkflowVersion {
  id: string;
  workflow_id: string;
  version: string;       // e.g. "v1", "v2"
  status: WorkflowVersionStatus;
  canvas_blocks: BlockData[];   // independent canvas state per version
  created_at: string;
  updated_at: string;
}

export interface Workflow {
  id: string;
  program_id: string;           // owning program
  workflow_name: string;
  workflow_code: string;
  description: string;
  default_version: string;      // e.g. "v1"
  status: WorkflowStatus;
  versions: WorkflowVersion[];
  created_at: string;
  updated_at: string;
}

export interface WorkflowCreate {
  program_id: string;
  workflow_name: string;
  workflow_code: string;
  description: string;
  status: WorkflowStatus;
}
