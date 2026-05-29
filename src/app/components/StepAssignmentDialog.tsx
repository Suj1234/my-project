import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Plus, Layers } from 'lucide-react';

export interface StepDefinition {
  id: string;
  name: string;
  description: string;
  color?: string;
}

interface StepAssignmentDialogProps {
  open: boolean;
  steps: StepDefinition[];
  onClose: () => void;
  onAssign: (stepId: string) => void;
  onCreateAndAssign: (step: StepDefinition) => void;
}

export function StepAssignmentDialog({
  open,
  steps,
  onClose,
  onAssign,
  onCreateAndAssign,
}: StepAssignmentDialogProps) {
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');

  const handleCreate = () => {
    if (!newName.trim()) return;
    const newStep: StepDefinition = {
      id: `step-${Date.now()}`,
      name: newName.trim(),
      description: newDesc.trim(),
    };
    onCreateAndAssign(newStep);
    setNewName('');
    setNewDesc('');
    setCreating(false);
  };

  const handleClose = () => {
    setCreating(false);
    setNewName('');
    setNewDesc('');
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Layers className="h-4 w-4 text-slate-500" />
            Assign to a Step
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3 mt-2">
          <p className="text-xs text-gray-500">
            Which step does this block belong to? You can assign it to an existing step or create a new one.
          </p>

          {/* Existing steps */}
          {steps.length > 0 && !creating && (
            <div className="space-y-1.5">
              {steps.map((step, idx) => (
                <button
                  key={step.id}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 transition-colors text-left"
                  onClick={() => onAssign(step.id)}
                >
                  <span className="w-5 h-5 rounded-full bg-slate-700 text-white text-[10px] font-bold flex items-center justify-center flex-shrink-0">
                    {idx + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate text-slate-800">{step.name}</p>
                    {step.description && (
                      <p className="text-xs text-slate-400 truncate">{step.description}</p>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}

          {steps.length === 0 && !creating && (
            <p className="text-xs text-gray-400 text-center py-2">No steps defined yet. Create one below.</p>
          )}

          {/* Create new step form */}
          {creating && (
            <div className="space-y-3 border border-slate-200 rounded-lg p-3 bg-slate-50">
              <p className="text-xs font-semibold text-slate-700">New Step</p>
              <div className="space-y-1.5">
                <Label className="text-xs">Step Name</Label>
                <Input
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. KYC Verification"
                  className="h-8 text-sm"
                  autoFocus
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Description (optional)</Label>
                <Input
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="e.g. Identity verification steps"
                  className="h-8 text-sm"
                />
              </div>
              <div className="flex gap-2">
                <Button size="sm" className="flex-1 h-8" onClick={handleCreate} disabled={!newName.trim()}>
                  Create & Assign
                </Button>
                <Button size="sm" variant="ghost" className="h-8" onClick={() => setCreating(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {/* Actions */}
          {!creating && (
            <div className="flex gap-2 pt-1">
              <Button
                variant="outline"
                size="sm"
                className="flex-1 h-8 text-xs"
                onClick={() => setCreating(true)}
              >
                <Plus className="h-3 w-3 mr-1" />
                New Step
              </Button>
              <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={handleClose}>
                Skip (No Step)
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
