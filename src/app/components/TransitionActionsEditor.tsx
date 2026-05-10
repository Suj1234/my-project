import { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Plus, X } from 'lucide-react';

export const PREDEFINED_ACTIONS = [
  'User confirmed',
  'User submitted',
  'Form submitted',
  'Data collected',
  'Verification initiated',
  'Verification completed',
  'Document viewed',
  'Document accepted',
  'Signed successfully',
  'Account selected',
  'Offer accepted',
  'Journey completed',
  'Edit details',
  'Proceed',
  'Go back',
  'Skip',
  'Retry',
];

interface TransitionActionsEditorProps {
  actions: string[];
  onChange: (actions: string[]) => void;
}

export function TransitionActionsEditor({ actions, onChange }: TransitionActionsEditorProps) {
  const [inputValue, setInputValue] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);

  const addAction = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed || actions.includes(trimmed)) return;
    onChange([...actions, trimmed]);
    setInputValue('');
    setShowSuggestions(false);
  };

  const removeAction = (index: number) => {
    onChange(actions.filter((_, i) => i !== index));
  };

  const suggestions = PREDEFINED_ACTIONS.filter(
    (a) => !actions.includes(a) && a.toLowerCase().includes(inputValue.toLowerCase())
  );

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label className="text-xs font-semibold text-gray-700">Transition Actions</Label>
        <span className="text-[10px] text-gray-400">What can a user do on this page?</span>
      </div>

      {actions.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {actions.map((a, i) => (
            <span
              key={i}
              className="inline-flex items-center gap-1 bg-green-50 border border-green-200 text-green-800 text-xs rounded-full px-2.5 py-0.5"
            >
              {a}
              <button
                className="ml-0.5 text-green-500 hover:text-red-500 transition-colors"
                onClick={() => removeAction(i)}
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      <div className="relative">
        <div className="flex gap-1.5">
          <Input
            className="h-8 text-xs flex-1"
            placeholder="Type action name or pick from suggestions…"
            value={inputValue}
            onChange={(e) => { setInputValue(e.target.value); setShowSuggestions(true); }}
            onFocus={() => setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addAction(inputValue); } }}
          />
          <Button
            variant="outline"
            size="sm"
            className="h-8 text-xs px-2 shrink-0"
            onClick={() => addAction(inputValue)}
            disabled={!inputValue.trim()}
          >
            <Plus className="h-3 w-3 mr-1" />
            Add
          </Button>
        </div>

        {showSuggestions && suggestions.length > 0 && (
          <div className="absolute z-10 top-full mt-1 left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-md max-h-40 overflow-y-auto">
            {suggestions.map((s) => (
              <button
                key={s}
                className="w-full text-left px-3 py-1.5 text-xs hover:bg-gray-50 text-gray-700"
                onMouseDown={(e) => { e.preventDefault(); addAction(s); }}
              >
                {s}
              </button>
            ))}
          </div>
        )}
      </div>

      {actions.length === 0 && (
        <p className="text-[10px] text-amber-600">At least one transition action is required.</p>
      )}
    </div>
  );
}
