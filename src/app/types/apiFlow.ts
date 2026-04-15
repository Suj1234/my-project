import { ApiIntegration, AuthConfig, createDefaultIntegration } from './apiIntegration';

// ─── Step Types ───────────────────────────────────────────────────────────────

export type FlowStepType = 'api_call' | 'redirect' | 'wait' | 'transform' | 'condition';
export type FlowStatus = 'draft' | 'active' | 'inactive';

// ─── Output Mapping ──────────────────────────────────────────────────────────
// Downstream: {{flow.steps.N.output.variableName}}

export interface FlowOutputMapping {
  id: string;
  responsePath: string;   // JSONPath e.g. $.result.link  OR  callback.code
  variableName: string;   // local name, e.g. redirectLink
  label?: string;         // friendly label
}

// ─── Transform Operation ─────────────────────────────────────────────────────

export type TransformType =
  | 'map'           // copy value from one path to a variable
  | 'template'      // build string from template e.g. "{{step1.first}} {{step1.last}}"
  | 'base64_encode'
  | 'base64_decode'
  | 'url_encode'
  | 'url_decode'
  | 'json_stringify'
  | 'json_parse';

export interface TransformOperation {
  id: string;
  type: TransformType;
  outputVariable: string;     // variable name to store result in
  // map / encode / decode / json operations — input
  inputPath?: string;         // e.g. {{flow.steps.0.output.firstName}}
  // template
  template?: string;          // e.g. "{{flow.steps.0.output.first}} {{flow.steps.0.output.last}}"
  label?: string;
}

// ─── Flow Step ────────────────────────────────────────────────────────────────

export interface FlowStep {
  id: string;
  type: FlowStepType;
  name: string;
  description?: string;
  onError?: 'stop' | 'continue' | 'skip';

  // ── api_call ──
  // Full ApiIntegration config embedded — all existing tab components work directly
  apiConfig?: ApiIntegration;
  // When true, use flow-level sharedAuth instead of apiConfig.auth
  useFlowAuth?: boolean;
  // How to expose response fields to downstream steps
  outputMappings?: FlowOutputMapping[];

  // ── redirect ──
  redirectUrl?: string;
  // Params the callback URL will carry back
  callbackParams?: Array<{ name: string; description?: string }>;
  // outputMappings reused: responsePath = 'callback.<paramName>'

  // ── wait ──
  waitType?: 'delay' | 'callback';
  waitSeconds?: number;
  callbackSignalPath?: string;  // JSONPath to detect callback completion

  // ── transform ──
  transformations?: TransformOperation[];
  // outputMappings reused for transform outputs

  // ── condition ──
  // Simple expression gate — evaluates to true/false, no branching
  // e.g. "{{flow.steps.1.output.consentStatus}} == APPROVED"
  conditionExpression?: string;
  conditionOperator?: '==' | '!=' | '>' | '<' | '>=' | '<=' | 'contains' | 'not_contains' | 'is_empty' | 'not_empty';
  conditionLeftOperand?: string;
  conditionRightOperand?: string;
  conditionOnFalse?: 'stop' | 'fail' | 'skip' | 'continue';
}

// ─── API Flow ─────────────────────────────────────────────────────────────────

export interface ApiFlow {
  id: string;
  name: string;
  description?: string;
  tags: string[];
  steps: FlowStep[];
  status: FlowStatus;
  // Optional shared auth — api_call steps can inherit this
  sharedAuth?: AuthConfig;
  createdAt: string;
  updatedAt: string;
}

// ─── Unified list item (used by ApiIntegrationsPage) ─────────────────────────

export type IntegrationListItemType = 'single' | 'flow';

export interface IntegrationListItem {
  type: IntegrationListItemType;
  id: string;
  name: string;
  description?: string;
  tags: string[];
  status: 'draft' | 'active' | 'inactive';
  updatedAt: string;
  // For single
  singleData?: ApiIntegration;
  // For flow
  flowData?: ApiFlow;
}

// ─── Defaults ────────────────────────────────────────────────────────────────

export function createDefaultFlow(): ApiFlow {
  return {
    id: `flow-${Date.now()}`,
    name: '',
    description: '',
    tags: [],
    steps: [],
    status: 'draft',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

export function createDefaultStep(type: FlowStepType): FlowStep {
  const id = `step-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  const base: FlowStep = {
    id,
    type,
    name: '',
    description: '',
    outputMappings: [],
    onError: 'stop',
  };

  switch (type) {
    case 'api_call':
      return {
        ...base,
        name: 'API Call',
        apiConfig: {
          ...createDefaultIntegration(),
          id: `step-api-${Date.now()}`,
          method: 'POST',
        },
        useFlowAuth: false,
        outputMappings: [],
      };
    case 'redirect':
      return {
        ...base,
        name: 'User Redirect',
        redirectUrl: '',
        callbackParams: [{ name: 'code', description: 'Returned by callback' }],
        outputMappings: [],
      };
    case 'wait':
      return {
        ...base,
        name: 'Wait',
        waitType: 'delay',
        waitSeconds: 5,
      };
    case 'transform':
      return {
        ...base,
        name: 'Transform',
        transformations: [],
        outputMappings: [],
      };
    case 'condition':
      return {
        ...base,
        name: 'Condition',
        conditionLeftOperand: '',
        conditionOperator: '==',
        conditionRightOperand: '',
        conditionOnFalse: 'stop',
      };
    default:
      return base;
  }
}
