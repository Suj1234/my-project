import { useState } from 'react';
import { BlockData } from '../types/journey';
import { ConfigurationPanel } from './ConfigurationPanel';
import { RouterPanelC } from './RouterPanelC';
import { StepDefinition } from './StepAssignmentDialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Button } from './ui/button';
import { Plus, AlertCircle } from 'lucide-react';

const LOGIC_TYPES = ['router', 'merge', 'decision', 'start'];

interface Props {
  block: BlockData | null;
  allBlocks: BlockData[];
  onClose: () => void;
  onSave: (block: BlockData) => void;
  onDelete: (blockId: string) => void;
  steps?: StepDefinition[];
  onCreateStep?: (name: string) => StepDefinition;
}

export function ConfigurationPanelC({ steps, onCreateStep, ...panelProps }: Props) {
  const { block } = panelProps;
  const [creatingStep, setCreatingStep] = useState(false);
  const [newStepName, setNewStepName] = useState('');

  if (block?.type === 'router') {
    return (
      <RouterPanelC
        block={block}
        allBlocks={panelProps.allBlocks}
        onClose={panelProps.onClose}
        onSave={panelProps.onSave}
        onDelete={panelProps.onDelete}
      />
    );
  }

  if (!block || !steps) {
    return <ConfigurationPanel {...panelProps} />;
  }

  const isLogic = LOGIC_TYPES.includes(block.type);
  const assignedStep = steps.find((s) => s.id === block.stepId);

  const handleStepChange = (value: string) => {
    if (value === '__new__') {
      setCreatingStep(true);
      return;
    }
    const step = steps.find((s) => s.id === value);
    if (step) {
      panelProps.onSave({ ...block, stepId: step.id, stepLabel: step.name });
    }
  };

  const handleCreateStep = () => {
    if (!newStepName.trim() || !onCreateStep) return;
    const newStep = onCreateStep(newStepName.trim());
    panelProps.onSave({ ...block, stepId: newStep.id, stepLabel: newStep.name });
    setCreatingStep(false);
    setNewStepName('');
  };

  const stepIdx = assignedStep ? steps.findIndex((s) => s.id === block.stepId) + 1 : 0;
  const blocksInStep = panelProps.allBlocks.filter((b) => b.stepId === block.stepId && !LOGIC_TYPES.includes(b.type));
  const subIdx = blocksInStep.findIndex((b) => b.id === block.id) + 1;
  const previewText = assignedStep ? `${stepIdx}.${subIdx} ${block.subStepLabel || block.name}` : '';

  const stepSection = isLogic ? (
    <p className="text-xs text-gray-400 italic">
      Logic blocks are internal — not part of the customer-facing journey steps.
    </p>
  ) : (
    <div className="space-y-3">
      {!block.stepId && (
        <div className="flex items-center gap-1.5 rounded-md bg-red-50 border border-red-200 px-3 py-2">
          <AlertCircle className="h-3.5 w-3.5 text-red-500 flex-shrink-0" />
          <p className="text-xs text-red-600 font-medium">Step assignment is required for this block</p>
        </div>
      )}

      <div>
        <Label htmlFor="step-select" className="text-sm font-medium text-gray-700">Journey Step</Label>
        <p className="text-xs text-gray-400 mt-0.5 mb-1.5">e.g. KYC, Financial Details, Document Upload</p>
        <Select value={block.stepId ?? ''} onValueChange={handleStepChange}>
          <SelectTrigger id="step-select" className={`h-9 text-sm ${!block.stepId ? 'border-red-400 bg-red-50' : ''}`}>
            <SelectValue placeholder="Select a step… (required)" />
          </SelectTrigger>
          <SelectContent>
            {steps.map((step, idx) => (
              <SelectItem key={step.id} value={step.id}>
                <div className="flex items-center gap-2">
                  <span className="w-4 h-4 rounded-full bg-slate-700 text-white text-[9px] font-bold flex items-center justify-center flex-shrink-0">
                    {idx + 1}
                  </span>
                  <span>{step.name}</span>
                </div>
              </SelectItem>
            ))}
            {onCreateStep && (
              <SelectItem value="__new__">
                <div className="flex items-center gap-1.5 text-blue-600">
                  <Plus className="h-3 w-3" />
                  <span className="font-medium">Create new step...</span>
                </div>
              </SelectItem>
            )}
          </SelectContent>
        </Select>

        {creatingStep && (
          <div className="mt-2 p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-2.5">
            <Input
              className="h-8 text-sm"
              placeholder="Step name (e.g. KYC Verification)"
              value={newStepName}
              onChange={(e) => setNewStepName(e.target.value)}
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleCreateStep();
                if (e.key === 'Escape') setCreatingStep(false);
              }}
            />
            <div className="flex gap-2">
              <Button
                size="sm"
                className="h-7 text-xs px-3 bg-blue-600 hover:bg-blue-700 text-white flex-1"
                onClick={handleCreateStep}
                disabled={!newStepName.trim()}
              >
                Create & Assign
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="h-7 text-xs px-3"
                onClick={() => { setCreatingStep(false); setNewStepName(''); }}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
      </div>

      {assignedStep && (
        <div className="rounded-lg border border-gray-200 bg-white p-3 space-y-1.5">
          <Label htmlFor="substep-label" className="text-xs font-medium text-gray-700">
            Sub-step name
          </Label>
          <Input
            id="substep-label"
            value={block.subStepLabel ?? ''}
            placeholder={block.name}
            onChange={(e) => panelProps.onSave({ ...block, subStepLabel: e.target.value })}
            className="h-8 text-sm"
            maxLength={30}
          />
          <p className="text-[11px] text-gray-400">
            Customer sees →{' '}
            <span className="font-medium text-gray-600">{previewText}</span>
          </p>
        </div>
      )}
    </div>
  );

  return (
    <ConfigurationPanel
      {...panelProps}
      stepSection={stepSection}
      stepUnassigned={!isLogic && !block.stepId}
    />
  );
}
