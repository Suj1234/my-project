import { useState } from 'react';
import { BlockData } from '../types/journey';
import { StepDefinition } from './StepAssignmentDialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Layers, Plus, Eye, EyeOff } from 'lucide-react';

const STEP_COLORS = [
  { key: 'blue',   dot: 'bg-blue-500' },
  { key: 'green',  dot: 'bg-green-500' },
  { key: 'purple', dot: 'bg-purple-500' },
  { key: 'orange', dot: 'bg-orange-500' },
  { key: 'teal',   dot: 'bg-teal-500' },
];

const COLOR_MAP: Record<string, { badge: string; dot: string }> = {
  blue:   { badge: 'bg-blue-100 text-blue-700 border-blue-200',   dot: 'bg-blue-500' },
  green:  { badge: 'bg-green-100 text-green-700 border-green-200', dot: 'bg-green-500' },
  purple: { badge: 'bg-purple-100 text-purple-700 border-purple-200', dot: 'bg-purple-500' },
  orange: { badge: 'bg-orange-100 text-orange-700 border-orange-200', dot: 'bg-orange-500' },
  teal:   { badge: 'bg-teal-100 text-teal-700 border-teal-200',   dot: 'bg-teal-500' },
};

const LOGIC_TYPES = ['router', 'merge', 'decision'];

interface StepConfigSectionProps {
  block: BlockData;
  steps: StepDefinition[];
  onUpdate: (updated: BlockData) => void;
  onCreateStep?: (name: string, color: string) => StepDefinition;
}

export function StepConfigSection({ block, steps, onUpdate, onCreateStep }: StepConfigSectionProps) {
  const [creatingStep, setCreatingStep] = useState(false);
  const [newStepName, setNewStepName] = useState('');
  const [newStepColor, setNewStepColor] = useState('blue');

  const isLogic = LOGIC_TYPES.includes(block.type);
  const currentStep = steps.find((s) => s.id === block.stepId);
  const visibleToApplicant = !isLogic && block.visibleToApplicant !== false;

  const handleStepChange = (value: string) => {
    if (value === '__new__') {
      setCreatingStep(true);
      return;
    }
    if (value === '__none__') {
      onUpdate({ ...block, stepId: undefined, stepLabel: undefined, stepColor: undefined });
      return;
    }
    const step = steps.find((s) => s.id === value);
    if (step) {
      onUpdate({ ...block, stepId: step.id, stepLabel: step.name, stepColor: step.color });
    }
  };

  const handleCreateStep = () => {
    if (!newStepName.trim() || !onCreateStep) return;
    const newStep = onCreateStep(newStepName.trim(), newStepColor);
    onUpdate({ ...block, stepId: newStep.id, stepLabel: newStep.name, stepColor: newStep.color });
    setCreatingStep(false);
    setNewStepName('');
    setNewStepColor('blue');
  };

  return (
    <div className="px-4 py-3 bg-slate-50 border-b border-gray-200 flex-shrink-0">
      {/* Header */}
      <div className="flex items-center gap-2 mb-2.5">
        <Layers className="h-3.5 w-3.5 text-slate-500" />
        <span className="text-xs font-semibold text-slate-600 tracking-wide uppercase">Step Assignment</span>
        {currentStep && (
          <span
            className={`ml-auto text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
              COLOR_MAP[currentStep.color]?.badge ?? 'bg-gray-100 text-gray-600 border-gray-200'
            }`}
          >
            {currentStep.name}
          </span>
        )}
      </div>

      {/* Step selector */}
      <Select value={block.stepId ?? '__none__'} onValueChange={handleStepChange}>
        <SelectTrigger className="h-8 text-xs bg-white">
          <SelectValue placeholder="No step assigned" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="__none__">
            <span className="text-gray-400 text-xs italic">No step assigned</span>
          </SelectItem>
          {steps.map((step) => (
            <SelectItem key={step.id} value={step.id}>
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full flex-shrink-0 ${COLOR_MAP[step.color]?.dot ?? 'bg-gray-400'}`} />
                <span className="text-xs">{step.name}</span>
              </div>
            </SelectItem>
          ))}
          {onCreateStep && (
            <SelectItem value="__new__">
              <div className="flex items-center gap-1.5 text-blue-600">
                <Plus className="h-3 w-3" />
                <span className="text-xs font-medium">Create new step...</span>
              </div>
            </SelectItem>
          )}
        </SelectContent>
      </Select>

      {/* Inline step creation form */}
      {creatingStep && (
        <div className="mt-2 p-2.5 bg-white rounded-lg border border-gray-200 space-y-2">
          <Input
            className="h-7 text-xs"
            placeholder="Step name (e.g. KYC Verification)"
            value={newStepName}
            onChange={(e) => setNewStepName(e.target.value)}
            autoFocus
            onKeyDown={(e) => { if (e.key === 'Enter') handleCreateStep(); if (e.key === 'Escape') setCreatingStep(false); }}
          />
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-gray-400 mr-1">Color:</span>
            {STEP_COLORS.map((c) => (
              <button
                key={c.key}
                type="button"
                className={`w-5 h-5 rounded-full ${c.dot} transition-all ${
                  newStepColor === c.key ? 'ring-2 ring-offset-1 ring-gray-500 scale-110' : 'opacity-60 hover:opacity-100'
                }`}
                onClick={() => setNewStepColor(c.key)}
              />
            ))}
          </div>
          <div className="flex gap-1.5">
            <Button
              size="sm"
              className="h-6 text-[11px] px-2 bg-blue-600 hover:bg-blue-700 text-white flex-1"
              onClick={handleCreateStep}
              disabled={!newStepName.trim()}
            >
              Create & Assign
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="h-6 text-[11px] px-2"
              onClick={() => { setCreatingStep(false); setNewStepName(''); }}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Visible to applicant toggle — hidden for logic blocks */}
      {!isLogic && (
        <div className="flex items-center justify-between mt-2.5">
          <span className="text-xs text-gray-500">Visible to applicant</span>
          <button
            type="button"
            onClick={() => onUpdate({ ...block, visibleToApplicant: !visibleToApplicant })}
            className={`flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full border font-medium transition-colors ${
              visibleToApplicant
                ? 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100'
                : 'bg-gray-100 text-gray-500 border-gray-200 hover:bg-gray-200'
            }`}
          >
            {visibleToApplicant ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
            {visibleToApplicant ? 'Visible' : 'Hidden'}
          </button>
        </div>
      )}

      {isLogic && (
        <p className="text-[10px] text-gray-400 mt-2 italic">
          Logic blocks are not shown to applicants and are excluded from sub-step numbering.
        </p>
      )}
    </div>
  );
}
