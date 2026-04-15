import { useState } from 'react';
import {
  ArrowLeft, Save, CheckCircle2, Plus, Globe, ExternalLink,
  Clock, Shuffle, GitBranch, Trash2, GripVertical, ChevronDown,
  ChevronRight, Settings2, ShieldCheck, X, Variable,
} from 'lucide-react';
import { ApiFlow, FlowStep, FlowStepType, createDefaultFlow, createDefaultStep } from '../../types/apiFlow';
import { AuthConfig, createDefaultIntegration } from '../../types/apiIntegration';
import { Button } from '../../components/ui/button';

// — Tab components
import { RequestTab }       from './tabs/RequestTab';
import { HeadersTab }       from './tabs/HeadersTab';
import { ParamsTab }        from './tabs/ParamsTab';
import { BodyTab }          from './tabs/BodyTab';
import { ResponseTab }      from './tabs/ResponseTab';
import { AdvancedTab }      from './tabs/AdvancedTab';
import { TestTab }          from './tabs/TestTab';
import { FlowApiCallAuthTab } from './tabs/FlowApiCallAuthTab';
import { OutputMappingsTab }  from './tabs/OutputMappingsTab';
import { RedirectStepTab, RedirectStepTestTab } from './tabs/RedirectStepTab';
import { WaitStepTab, WaitStepTestTab }          from './tabs/WaitStepTab';
import { TransformStepTab, TransformStepTestTab } from './tabs/TransformStepTab';
import { ConditionStepTab, ConditionStepTestTab } from './tabs/ConditionStepTab';
import { AuthTab } from './tabs/AuthTab';

// ─── Step metadata ────────────────────────────────────────────────────────────

const STEP_META: Record<FlowStepType, { label: string; icon: React.ReactNode; color: string; bg: string; border: string; dot: string }> = {
  api_call:  { label: 'API Call',  icon: <Globe size={12} />,       color: 'text-teal-700',   bg: 'bg-teal-50',   border: 'border-teal-200',  dot: 'bg-teal-400' },
  redirect:  { label: 'Redirect',  icon: <ExternalLink size={12} />, color: 'text-orange-700', bg: 'bg-orange-50', border: 'border-orange-200', dot: 'bg-orange-400' },
  wait:      { label: 'Wait',      icon: <Clock size={12} />,        color: 'text-slate-600',  bg: 'bg-slate-50',  border: 'border-slate-200',  dot: 'bg-slate-400' },
  transform: { label: 'Transform', icon: <Shuffle size={12} />,      color: 'text-purple-700', bg: 'bg-purple-50', border: 'border-purple-200', dot: 'bg-purple-400' },
  condition: { label: 'Condition', icon: <GitBranch size={12} />,    color: 'text-blue-700',   bg: 'bg-blue-50',   border: 'border-blue-200',   dot: 'bg-blue-400' },
};

const STEP_TYPES: FlowStepType[] = ['api_call', 'redirect', 'wait', 'transform', 'condition'];

// ─── Available variables panel (used in step editors) ─────────────────────────

function AvailableVariablesPanel({
  stepIndex,
  allSteps,
}: {
  stepIndex: number;
  allSteps: FlowStep[];
}) {
  const [open, setOpen] = useState(false);

  const vars: Array<{ path: string; label: string; source: string }> = [];
  const journeyVars = [
    { path: 'journey.pan_number',    label: 'PAN Number' },
    { path: 'journey.mobile',        label: 'Mobile' },
    { path: 'journey.date_of_birth', label: 'Date of Birth' },
    { path: 'journey.email',         label: 'Email' },
    { path: 'journey.full_name',     label: 'Full Name' },
    { path: 'session.applicationId', label: 'Application ID' },
    { path: 'session.journeyId',     label: 'Journey ID' },
    { path: 'system.timestamp',      label: 'Timestamp' },
    { path: 'system.uuid',           label: 'UUID' },
  ];
  journeyVars.forEach((v) => vars.push({ path: `{{${v.path}}}`, label: v.label, source: 'Journey / Session' }));

  for (let i = 0; i < stepIndex; i++) {
    const s = allSteps[i];
    const maps = s.outputMappings ?? [];
    if (maps.length > 0) {
      maps.forEach((m) => {
        if (m.variableName) {
          vars.push({
            path: `{{flow.steps.${i}.output.${m.variableName}}}`,
            label: m.label ?? m.variableName,
            source: `Step ${i + 1}: ${s.name || '(unnamed)'}`,
          });
        }
      });
    }
  }

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center gap-2 px-3 py-2.5 bg-gray-50 hover:bg-gray-100 transition-colors text-left"
      >
        <Variable size={12} className="text-blue-500" />
        <span className="text-xs font-medium text-gray-600 flex-1">Available Variables</span>
        <span className="text-[10px] text-gray-400 mr-1">{vars.length} variables</span>
        {open ? <ChevronDown size={12} className="text-gray-400" /> : <ChevronRight size={12} className="text-gray-400" />}
      </button>
      {open && (
        <div className="px-3 py-3 space-y-2 max-h-52 overflow-y-auto">
          {Object.entries(
            vars.reduce<Record<string, typeof vars>>((acc, v) => {
              if (!acc[v.source]) acc[v.source] = [];
              acc[v.source].push(v);
              return acc;
            }, {})
          ).map(([source, svars]) => (
            <div key={source}>
              <p className="text-[9px] font-semibold text-gray-400 uppercase tracking-wide mb-1">{source}</p>
              <div className="flex flex-wrap gap-1">
                {svars.map((v) => (
                  <button
                    key={v.path}
                    title={`Click to copy: ${v.path}`}
                    onClick={() => navigator.clipboard?.writeText(v.path)}
                    className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 transition-colors"
                  >
                    {v.path}
                  </button>
                ))}
              </div>
            </div>
          ))}
          <p className="text-[9px] text-gray-400 mt-1">Click any variable to copy to clipboard</p>
        </div>
      )}
    </div>
  );
}

// ─── Add Step Picker ──────────────────────────────────────────────────────────

function AddStepPicker({
  onAdd,
  onClose,
}: {
  onAdd: (type: FlowStepType) => void;
  onClose: () => void;
}) {
  return (
    <div className="absolute bottom-16 left-3 right-3 bg-white border border-gray-200 rounded-2xl shadow-xl z-10 p-3">
      <div className="flex items-center justify-between mb-2.5 px-1">
        <p className="text-xs font-semibold text-gray-700">Add Step</p>
        <button onClick={onClose} className="p-1 rounded hover:bg-gray-100 text-gray-400">
          <X size={12} />
        </button>
      </div>
      <div className="space-y-1">
        {STEP_TYPES.map((type) => {
          const meta = STEP_META[type];
          const descriptions: Record<FlowStepType, string> = {
            api_call:  'Full API call with auth, headers, body, response mapping',
            redirect:  'Redirect user to external URL, capture callback params',
            wait:      'Fixed delay or wait for external webhook/callback',
            transform: 'Transform variables — map, encode, template strings',
            condition: 'Gate flow on a condition — stop, fail, or skip if false',
          };
          return (
            <button
              key={type}
              onClick={() => { onAdd(type); onClose(); }}
              className={`w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-gray-50 transition-colors text-left group`}
            >
              <span className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${meta.bg} ${meta.border} border`}>
                <span className={meta.color}>{meta.icon}</span>
              </span>
              <div>
                <p className="text-xs font-semibold text-gray-700">{meta.label}</p>
                <p className="text-[9px] text-gray-400">{descriptions[type]}</p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Shared Auth Config Panel ─────────────────────────────────────────────────

function SharedAuthPanel({
  sharedAuth,
  onChange,
}: {
  sharedAuth?: AuthConfig;
  onChange: (auth: AuthConfig | undefined) => void;
}) {
  const [open, setOpen] = useState(false);
  const hasAuth = !!sharedAuth && sharedAuth.type !== 'none';

  // Wrap a fake integration so AuthTab works unchanged
  const fakeIntegration = {
    ...createDefaultIntegration(),
    auth: sharedAuth ?? { type: 'none' as const },
  };

  return (
    <div className="border-b border-white/10">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center gap-2 px-4 py-2.5 text-left text-white/80 hover:text-white hover:bg-white/5 transition-colors"
      >
        <ShieldCheck size={13} className="flex-shrink-0" />
        <span className="text-xs font-medium flex-1 truncate">Shared Auth</span>
        {hasAuth && (
          <span className="text-[9px] bg-teal-500/30 text-teal-200 px-1.5 py-0.5 rounded font-medium">
            {sharedAuth!.type}
          </span>
        )}
        {open ? <ChevronDown size={11} className="text-white/40" /> : <ChevronRight size={11} className="text-white/40" />}
      </button>
      {open && (
        <div className="px-3 py-3 bg-white rounded-xl mx-3 mb-3 shadow-sm">
          <p className="text-[10px] text-gray-500 mb-3 leading-relaxed">
            Configure auth here to share it across all API Call steps. Each step can override with its own auth if needed.
          </p>
          <AuthTab
            integration={fakeIntegration}
            onChange={(updated) => onChange(updated.auth)}
          />
          {hasAuth && (
            <button
              onClick={() => onChange({ type: 'none' })}
              className="mt-3 text-[10px] text-red-500 hover:underline"
            >
              Clear shared auth
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ─── api_call Step Editor ─────────────────────────────────────────────────────

type ApiCallTab = 'request' | 'auth' | 'headers' | 'params' | 'body' | 'response' | 'advanced' | 'outputs' | 'test';

const API_CALL_TABS: { id: ApiCallTab; label: string }[] = [
  { id: 'request',  label: 'Request' },
  { id: 'auth',     label: 'Auth' },
  { id: 'headers',  label: 'Headers' },
  { id: 'params',   label: 'Params' },
  { id: 'body',     label: 'Body' },
  { id: 'response', label: 'Response' },
  { id: 'advanced', label: 'Advanced' },
  { id: 'outputs',  label: 'Outputs' },
  { id: 'test',     label: 'Test' },
];

function ApiCallStepEditor({
  step,
  stepIndex,
  allSteps,
  flowSharedAuth,
  onChange,
}: {
  step: FlowStep;
  stepIndex: number;
  allSteps: FlowStep[];
  flowSharedAuth?: AuthConfig;
  onChange: (updated: FlowStep) => void;
}) {
  const [activeTab, setActiveTab] = useState<ApiCallTab>('request');
  const apiConfig = step.apiConfig ?? { ...createDefaultIntegration(), id: `step-api-${Date.now()}` };

  const setApiConfig = (updated: typeof apiConfig) =>
    onChange({ ...step, apiConfig: updated });

  const getTabBadge = (tabId: ApiCallTab): string | null => {
    if (tabId === 'headers') {
      const count = apiConfig.headers.filter((h) => h.enabled && h.key).length;
      return count > 0 ? String(count) : null;
    }
    if (tabId === 'params') {
      const count = apiConfig.queryParams.filter((p) => p.enabled && p.key).length;
      return count > 0 ? String(count) : null;
    }
    if (tabId === 'auth') {
      if (step.useFlowAuth && flowSharedAuth && flowSharedAuth.type !== 'none') return '⟳';
      return apiConfig.auth.type !== 'none' ? '✓' : null;
    }
    if (tabId === 'body' && apiConfig.body.contentType !== 'none' && !['GET','HEAD','OPTIONS'].includes(apiConfig.method)) return '✓';
    if (tabId === 'response' && apiConfig.response.mappings.length > 0) return String(apiConfig.response.mappings.length);
    if (tabId === 'outputs' && (step.outputMappings ?? []).length > 0) return String(step.outputMappings!.length);
    return null;
  };

  return (
    <div className="flex flex-col h-full">
      {/* Available variables */}
      <div className="px-5 pt-4 pb-2">
        <AvailableVariablesPanel stepIndex={stepIndex} allSteps={allSteps} />
      </div>

      {/* Tab bar */}
      <div className="flex border-b border-gray-100 px-5 bg-gray-50/50 overflow-x-auto flex-shrink-0">
        {API_CALL_TABS.map((tab) => {
          const badge = getTabBadge(tab.id);
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`relative flex items-center gap-1.5 px-3.5 py-2.5 text-xs font-medium whitespace-nowrap transition-colors border-b-2 -mb-px ${
                isActive
                  ? 'text-teal-700 border-teal-600'
                  : 'text-gray-500 border-transparent hover:text-gray-800 hover:border-gray-300'
              }`}
            >
              {tab.label}
              {badge && (
                <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold ${isActive ? 'bg-teal-100 text-teal-700' : 'bg-gray-200 text-gray-500'}`}>
                  {badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto px-5 py-5">
        {activeTab === 'request'  && <RequestTab  integration={apiConfig} onChange={setApiConfig} />}
        {activeTab === 'auth'     && (
          <FlowApiCallAuthTab
            integration={apiConfig}
            onChange={setApiConfig}
            useFlowAuth={step.useFlowAuth ?? false}
            onToggleFlowAuth={(v) => onChange({ ...step, useFlowAuth: v })}
            flowSharedAuth={flowSharedAuth}
          />
        )}
        {activeTab === 'headers'  && <HeadersTab  integration={apiConfig} onChange={setApiConfig} />}
        {activeTab === 'params'   && <ParamsTab   integration={apiConfig} onChange={setApiConfig} />}
        {activeTab === 'body'     && <BodyTab     integration={apiConfig} onChange={setApiConfig} />}
        {activeTab === 'response' && <ResponseTab integration={apiConfig} onChange={setApiConfig} />}
        {activeTab === 'advanced' && <AdvancedTab integration={apiConfig} onChange={setApiConfig} />}
        {activeTab === 'outputs'  && (
          <OutputMappingsTab
            step={step}
            stepIndex={stepIndex}
            allSteps={allSteps}
            onChange={(mappings) => onChange({ ...step, outputMappings: mappings })}
          />
        )}
        {activeTab === 'test'     && <TestTab integration={apiConfig} />}
      </div>
    </div>
  );
}

// ─── Non-api_call step editors ────────────────────────────────────────────────

type GenericTab = string;

function GenericStepEditor({
  step,
  stepIndex,
  allSteps,
  flowSharedAuth,
  onChange,
}: {
  step: FlowStep;
  stepIndex: number;
  allSteps: FlowStep[];
  flowSharedAuth?: AuthConfig;
  onChange: (updated: FlowStep) => void;
}) {
  const tabConfigs: Record<FlowStepType, { id: string; label: string }[]> = {
    api_call:  [], // handled above
    redirect:  [{ id: 'redirect', label: 'Redirect' }, { id: 'outputs', label: 'Outputs' }, { id: 'test', label: 'Test' }],
    wait:      [{ id: 'wait', label: 'Wait' }, { id: 'test', label: 'Test' }],
    transform: [{ id: 'transform', label: 'Transform' }, { id: 'test', label: 'Test' }],
    condition: [{ id: 'condition', label: 'Condition' }, { id: 'test', label: 'Test' }],
  };

  const tabs = tabConfigs[step.type];
  const [activeTab, setActiveTab] = useState<GenericTab>(tabs[0]?.id ?? '');

  const hasOutputsBadge = (tabId: string) =>
    tabId === 'outputs' && (step.outputMappings ?? []).length > 0
      ? String(step.outputMappings!.length)
      : null;

  return (
    <div className="flex flex-col h-full">
      {/* Available variables */}
      {stepIndex > 0 && (
        <div className="px-5 pt-4 pb-2">
          <AvailableVariablesPanel stepIndex={stepIndex} allSteps={allSteps} />
        </div>
      )}

      {/* Tab bar */}
      <div className="flex border-b border-gray-100 px-5 bg-gray-50/50 flex-shrink-0">
        {tabs.map((tab) => {
          const badge = hasOutputsBadge(tab.id);
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`relative flex items-center gap-1.5 px-4 py-2.5 text-xs font-medium whitespace-nowrap transition-colors border-b-2 -mb-px ${
                isActive
                  ? 'text-teal-700 border-teal-600'
                  : 'text-gray-500 border-transparent hover:text-gray-800 hover:border-gray-300'
              }`}
            >
              {tab.label}
              {badge && (
                <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold ${isActive ? 'bg-teal-100 text-teal-700' : 'bg-gray-200 text-gray-500'}`}>
                  {badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto px-5 py-5">
        {step.type === 'redirect' && activeTab === 'redirect' && (
          <RedirectStepTab step={step} onChange={onChange} />
        )}
        {step.type === 'redirect' && activeTab === 'outputs' && (
          <OutputMappingsTab
            step={step}
            stepIndex={stepIndex}
            allSteps={allSteps}
            onChange={(mappings) => onChange({ ...step, outputMappings: mappings })}
          />
        )}
        {step.type === 'redirect' && activeTab === 'test' && (
          <RedirectStepTestTab step={step} stepIndex={stepIndex} allSteps={allSteps} />
        )}

        {step.type === 'wait' && activeTab === 'wait' && (
          <WaitStepTab step={step} onChange={onChange} />
        )}
        {step.type === 'wait' && activeTab === 'test' && (
          <WaitStepTestTab step={step} />
        )}

        {step.type === 'transform' && activeTab === 'transform' && (
          <TransformStepTab step={step} onChange={onChange} />
        )}
        {step.type === 'transform' && activeTab === 'test' && (
          <TransformStepTestTab step={step} />
        )}

        {step.type === 'condition' && activeTab === 'condition' && (
          <ConditionStepTab step={step} onChange={onChange} />
        )}
        {step.type === 'condition' && activeTab === 'test' && (
          <ConditionStepTestTab step={step} />
        )}
      </div>
    </div>
  );
}

// ─── Main FlowEditor ──────────────────────────────────────────────────────────

interface ApiFlowEditorProps {
  flow?: ApiFlow;
  onBack: () => void;
  onSave: (flow: ApiFlow) => void;
}

export function ApiFlowEditor({ flow: initial, onBack, onSave }: ApiFlowEditorProps) {
  const [flow, setFlow] = useState<ApiFlow>(
    initial ?? { ...createDefaultFlow(), id: `flow-${Date.now()}` }
  );
  const [selectedStepId, setSelectedStepId] = useState<string | null>(
    initial?.steps[0]?.id ?? null
  );
  const [showAddPicker, setShowAddPicker] = useState(false);
  const [showSettings, setShowSettings] = useState(!initial);
  const [saved, setSaved] = useState(false);

  const isNew = !initial;
  const isValid = !!flow.name.trim();

  const selectedStep = flow.steps.find((s) => s.id === selectedStepId) ?? null;
  const selectedStepIndex = flow.steps.findIndex((s) => s.id === selectedStepId);

  const updateStep = (id: string, updated: FlowStep) =>
    setFlow((f) => ({ ...f, steps: f.steps.map((s) => (s.id === id ? updated : s)) }));

  const addStep = (type: FlowStepType) => {
    const newStep = createDefaultStep(type);
    // Default new api_call steps to use flow auth if flow has shared auth
    const withFlowAuth =
      type === 'api_call' && flow.sharedAuth && flow.sharedAuth.type !== 'none'
        ? { ...newStep, useFlowAuth: true }
        : newStep;
    setFlow((f) => ({ ...f, steps: [...f.steps, withFlowAuth] }));
    setSelectedStepId(withFlowAuth.id);
  };

  const removeStep = (id: string) => {
    setFlow((f) => ({ ...f, steps: f.steps.filter((s) => s.id !== id) }));
    if (selectedStepId === id) {
      const remaining = flow.steps.filter((s) => s.id !== id);
      setSelectedStepId(remaining.length > 0 ? remaining[0].id : null);
    }
  };

  const moveStep = (fromIdx: number, dir: -1 | 1) => {
    const toIdx = fromIdx + dir;
    if (toIdx < 0 || toIdx >= flow.steps.length) return;
    const next = [...flow.steps];
    [next[fromIdx], next[toIdx]] = [next[toIdx], next[fromIdx]];
    setFlow((f) => ({ ...f, steps: next }));
  };

  const handleSave = () => {
    onSave({ ...flow, updatedAt: new Date().toISOString(), status: 'active' });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="flex flex-col h-full bg-white overflow-hidden">
      {/* ── Header ── */}
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100 flex-shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-800 transition-colors"
          >
            <ArrowLeft size={15} />
          </button>
          <div>
            <h2 className="text-sm font-semibold text-gray-900">
              {isNew ? 'New API Flow' : flow.name || 'Untitled Flow'}
            </h2>
            <p className="text-[10px] text-gray-400 mt-0.5">
              {flow.steps.length} step{flow.steps.length !== 1 ? 's' : ''}
              {!isNew && ` · Last saved: ${new Date(flow.updatedAt).toLocaleString()}`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className={`text-[10px] px-2 py-1 rounded-full border font-medium ${
            flow.status === 'active'   ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
            flow.status === 'draft'    ? 'bg-gray-100 text-gray-600 border-gray-200' :
                                         'bg-red-50 text-red-600 border-red-200'
          }`}>
            {flow.status.toUpperCase()}
          </span>
          <Button
            size="sm"
            onClick={handleSave}
            disabled={!isValid}
            className="gap-2 text-xs text-white"
            style={{ backgroundColor: isValid ? '#0B6B5A' : undefined }}
          >
            {saved
              ? <><CheckCircle2 size={12} />Saved</>
              : <><Save size={12} />Save Flow</>
            }
          </Button>
        </div>
      </div>

      {/* ── Body: Left + Right ── */}
      <div className="flex flex-1 overflow-hidden">

        {/* ── LEFT PANEL ── */}
        <div className="w-72 flex-shrink-0 flex flex-col border-r border-gray-100 overflow-y-auto" style={{ backgroundColor: '#0B6B5A' }}>

          {/* Flow Settings */}
          <div className="border-b border-white/10">
            <button
              onClick={() => setShowSettings((o) => !o)}
              className="w-full flex items-center gap-2 px-4 py-2.5 text-left text-white/80 hover:text-white hover:bg-white/5 transition-colors"
            >
              <Settings2 size={13} className="flex-shrink-0" />
              <span className="text-xs font-medium flex-1">Flow Settings</span>
              {showSettings ? <ChevronDown size={11} className="text-white/40" /> : <ChevronRight size={11} className="text-white/40" />}
            </button>
            {showSettings && (
              <div className="px-3 pb-3 space-y-2.5">
                <div>
                  <label className="block text-[10px] text-white/60 mb-1 font-medium">Flow Name *</label>
                  <input
                    type="text"
                    value={flow.name}
                    onChange={(e) => setFlow((f) => ({ ...f, name: e.target.value }))}
                    placeholder="e.g. DigiLocker Document Download"
                    className="w-full text-xs bg-white/10 border border-white/20 rounded-lg px-2.5 py-1.5 text-white placeholder:text-white/30 focus:outline-none focus:ring-1 focus:ring-white/40"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-white/60 mb-1 font-medium">Description</label>
                  <textarea
                    value={flow.description ?? ''}
                    onChange={(e) => setFlow((f) => ({ ...f, description: e.target.value }))}
                    placeholder="What does this flow do?"
                    rows={2}
                    className="w-full text-xs bg-white/10 border border-white/20 rounded-lg px-2.5 py-1.5 text-white placeholder:text-white/30 focus:outline-none focus:ring-1 focus:ring-white/40 resize-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-white/60 mb-1 font-medium">Tags</label>
                  <input
                    type="text"
                    value={flow.tags.join(', ')}
                    onChange={(e) =>
                      setFlow((f) => ({ ...f, tags: e.target.value.split(',').map((t) => t.trim()).filter(Boolean) }))
                    }
                    placeholder="digilocker, kyc, oauth"
                    className="w-full text-xs bg-white/10 border border-white/20 rounded-lg px-2.5 py-1.5 text-white placeholder:text-white/30 focus:outline-none focus:ring-1 focus:ring-white/40"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-white/60 mb-1 font-medium">Status</label>
                  <select
                    value={flow.status}
                    onChange={(e) => setFlow((f) => ({ ...f, status: e.target.value as ApiFlow['status'] }))}
                    className="w-full text-xs bg-white/10 border border-white/20 rounded-lg px-2.5 py-1.5 text-white focus:outline-none focus:ring-1 focus:ring-white/40"
                  >
                    <option value="draft" className="text-gray-900">Draft</option>
                    <option value="active" className="text-gray-900">Active</option>
                    <option value="inactive" className="text-gray-900">Inactive</option>
                  </select>
                </div>
              </div>
            )}
          </div>

          {/* Shared Auth */}
          <SharedAuthPanel
            sharedAuth={flow.sharedAuth}
            onChange={(auth) => setFlow((f) => ({ ...f, sharedAuth: auth }))}
          />

          {/* Step list */}
          <div className="flex-1 py-2 relative">
            <p className="text-[9px] font-semibold text-white/40 uppercase tracking-widest px-4 py-1.5">
              Steps ({flow.steps.length})
            </p>

            {flow.steps.length === 0 ? (
              <div className="px-4 py-6 text-center">
                <p className="text-[10px] text-white/40 leading-relaxed">
                  No steps yet. Add a step to build your flow.
                </p>
              </div>
            ) : (
              <div className="space-y-0.5 px-2">
                {flow.steps.map((step, idx) => {
                  const meta = STEP_META[step.type];
                  const isSelected = step.id === selectedStepId;
                  return (
                    <div
                      key={step.id}
                      onClick={() => setSelectedStepId(step.id)}
                      className={`flex items-center gap-2 px-2 py-2 rounded-xl cursor-pointer transition-all group relative ${
                        isSelected
                          ? 'bg-white/20 text-white'
                          : 'text-white/70 hover:bg-white/10 hover:text-white'
                      }`}
                    >
                      {/* Step number */}
                      <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold flex-shrink-0 ${
                        isSelected ? 'bg-white text-teal-700' : 'bg-white/20 text-white'
                      }`}>
                        {idx + 1}
                      </span>

                      {/* Type icon */}
                      <span className={`flex-shrink-0 ${isSelected ? 'text-white' : meta.color.replace('text-', 'text-white/')}`}>
                        {meta.icon}
                      </span>

                      {/* Name */}
                      <span className="text-xs flex-1 truncate font-medium">
                        {step.name || meta.label}
                      </span>

                      {/* Move + delete (hover) */}
                      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={(e) => { e.stopPropagation(); moveStep(idx, -1); }}
                          disabled={idx === 0}
                          className="p-1 rounded hover:bg-white/20 text-white/60 hover:text-white disabled:opacity-20"
                          title="Move up"
                        >
                          ↑
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); moveStep(idx, 1); }}
                          disabled={idx === flow.steps.length - 1}
                          className="p-1 rounded hover:bg-white/20 text-white/60 hover:text-white disabled:opacity-20"
                          title="Move down"
                        >
                          ↓
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); removeStep(step.id); }}
                          className="p-1 rounded hover:bg-red-500/30 text-white/40 hover:text-red-300"
                          title="Remove step"
                        >
                          <Trash2 size={11} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Add Step */}
            <div className="px-2 mt-2 relative">
              <button
                onClick={() => setShowAddPicker((o) => !o)}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-xl border border-white/20 text-white/70 hover:text-white hover:border-white/40 hover:bg-white/5 transition-all text-xs font-medium"
              >
                <Plus size={13} />
                Add Step
              </button>
              {showAddPicker && (
                <AddStepPicker onAdd={addStep} onClose={() => setShowAddPicker(false)} />
              )}
            </div>
          </div>
        </div>

        {/* ── RIGHT PANEL ── */}
        <div className="flex-1 flex flex-col overflow-hidden bg-white">
          {selectedStep === null ? (
            /* Empty state */
            <div className="flex-1 flex flex-col items-center justify-center text-center px-8">
              <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
                <GitBranch size={24} className="text-gray-300" />
              </div>
              <p className="text-sm font-semibold text-gray-600">
                {flow.steps.length === 0 ? 'No steps yet' : 'Select a step'}
              </p>
              <p className="text-xs text-gray-400 mt-1 max-w-xs leading-relaxed">
                {flow.steps.length === 0
                  ? 'Add your first step using the "Add Step" button in the left panel.'
                  : 'Click a step in the left panel to configure it.'
                }
              </p>
              {!flow.name.trim() && (
                <p className="text-xs text-amber-600 mt-3 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                  Flow name is required. Fill it in under "Flow Settings".
                </p>
              )}
            </div>
          ) : (
            <div className="flex flex-col h-full overflow-hidden">
              {/* Step header */}
              <div className="px-5 py-3 border-b border-gray-100 flex-shrink-0">
                <div className="flex items-center gap-3">
                  {/* Type badge */}
                  <span className={`flex items-center gap-1.5 text-[10px] font-semibold px-2.5 py-1 rounded-full border ${STEP_META[selectedStep.type].bg} ${STEP_META[selectedStep.type].color} ${STEP_META[selectedStep.type].border}`}>
                    {STEP_META[selectedStep.type].icon}
                    {STEP_META[selectedStep.type].label}
                  </span>

                  {/* Editable step name */}
                  <input
                    type="text"
                    value={selectedStep.name}
                    onChange={(e) => updateStep(selectedStep.id, { ...selectedStep, name: e.target.value })}
                    placeholder={`${STEP_META[selectedStep.type].label} name`}
                    className="flex-1 text-sm font-semibold text-gray-800 bg-transparent border-b border-transparent focus:border-teal-400 focus:outline-none py-0.5 placeholder:text-gray-300"
                  />

                  {/* Step number pill */}
                  <span className="text-[10px] text-gray-400 font-medium flex-shrink-0">
                    Step {selectedStepIndex + 1} of {flow.steps.length}
                  </span>
                </div>

                {/* Editable description */}
                <input
                  type="text"
                  value={selectedStep.description ?? ''}
                  onChange={(e) => updateStep(selectedStep.id, { ...selectedStep, description: e.target.value })}
                  placeholder="Step description (optional)"
                  className="w-full text-xs text-gray-500 bg-transparent border-b border-transparent focus:border-teal-300 focus:outline-none mt-1 py-0.5 placeholder:text-gray-300"
                />
              </div>

              {/* Step content */}
              <div className="flex-1 overflow-hidden">
                {selectedStep.type === 'api_call' ? (
                  <ApiCallStepEditor
                    step={selectedStep}
                    stepIndex={selectedStepIndex}
                    allSteps={flow.steps}
                    flowSharedAuth={flow.sharedAuth}
                    onChange={(updated) => updateStep(selectedStep.id, updated)}
                  />
                ) : (
                  <GenericStepEditor
                    step={selectedStep}
                    stepIndex={selectedStepIndex}
                    allSteps={flow.steps}
                    flowSharedAuth={flow.sharedAuth}
                    onChange={(updated) => updateStep(selectedStep.id, updated)}
                  />
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
