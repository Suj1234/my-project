import { useState } from 'react';
import { PageConfig, FormInputField } from '../types/journey';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Label } from './ui/label';
import { Input } from './ui/input';
import { Switch } from './ui/switch';
import { AddInputDialog } from './AddInputDialog';
import {
  ChevronDown,
  ChevronRight,
  CheckCircle2,
  Wand2,
  Link2,
  Plus,
  Trash2,
  Pencil,
  Loader2,
  RefreshCw,
  Lock,
  ShieldCheck,
} from 'lucide-react';

// ─── Mock data ──────────────────────────────────────────────────────────────

const MOCK_GLOBAL_PAGES = [
  { id: 'gp_pan_input_std', name: 'Standard PAN Input UI' },
  { id: 'gp_pan_input_ent', name: 'Enterprise PAN Input UI' },
  { id: 'gp_pan_confirm_std', name: 'Standard PAN Confirm UI' },
  { id: 'gp_aadhaar_info', name: 'Standard Aadhaar Info UI' },
  { id: 'gp_selfie_landing', name: 'Selfie Landing UI' },
  { id: 'gp_selfie_capture', name: 'Photo Capture UI' },
  { id: 'gp_bank_stmt', name: 'Bank Statement Upload UI' },
  { id: 'gp_offer_show', name: 'Offer Display UI' },
  { id: 'gp_esign_init', name: 'eSign Initiation UI' },
  { id: 'gp_sanction', name: 'Sanction Letter Display UI' },
];

const PREDEFINED_ACTIONS = [
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
];

// ─── User-inputs list display ────────────────────────────────────────────────

interface UserInputsListProps {
  inputs: FormInputField[];
  onAdd: () => void;
  onEdit: (input: FormInputField) => void;
  onDelete: (id: string) => void;
}

function UserInputsList({ inputs, onAdd, onEdit, onDelete }: UserInputsListProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label className="text-xs font-semibold text-gray-700">User Inputs</Label>
        <Button variant="outline" size="sm" className="h-7 text-xs px-2" onClick={onAdd}>
          <Plus className="h-3 w-3 mr-1" />
          Add Input
        </Button>
      </div>

      {inputs.length === 0 ? (
        <div
          className="border-2 border-dashed border-gray-200 rounded-lg p-4 text-center cursor-pointer hover:border-blue-300 hover:bg-blue-50/30 transition-colors"
          onClick={onAdd}
        >
          <Plus className="h-4 w-4 text-gray-400 mx-auto mb-1" />
          <p className="text-xs text-gray-400">Click to add the first input field</p>
        </div>
      ) : (
        <div className="space-y-1.5">
          {inputs.map((inp) => (
            <div
              key={inp.id}
              className="flex items-start justify-between gap-2 bg-white border rounded-lg px-3 py-2.5 group hover:border-gray-300 transition-colors"
            >
              <div className="flex-1 min-w-0 space-y-1">
                {/* Label + source badge */}
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-medium text-gray-800">{inp.name}</span>
                  <Badge
                    variant="outline"
                    className={`text-[10px] shrink-0 ${inp.fieldSource === 'native' ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-purple-50 text-purple-700 border-purple-200'}`}
                  >
                    <span className={`h-1.5 w-1.5 rounded-full mr-1 inline-block ${inp.fieldSource === 'native' ? 'bg-blue-500' : 'bg-purple-500'}`} />
                    {inp.fieldSource === 'native' ? 'NATIVE' : 'CUSTOM'}
                  </Badge>
                  <Badge variant="outline" className="text-[10px] bg-gray-50 text-gray-500 shrink-0">
                    {inp.dataType ?? 'STRING'}
                  </Badge>
                  {inp.required && (
                    <Badge variant="outline" className="text-[10px] bg-orange-50 text-orange-700 border-orange-200 shrink-0">
                      Required
                    </Badge>
                  )}
                  {inp.validations && inp.validations.length > 0 && (
                    <Badge variant="outline" className="text-[10px] bg-emerald-50 text-emerald-700 border-emerald-200 shrink-0">
                      <ShieldCheck className="h-2.5 w-2.5 mr-1" />
                      {inp.validations.length} validation{inp.validations.length > 1 ? 's' : ''}
                    </Badge>
                  )}
                </div>
                {/* Key */}
                {inp.key && (
                  <div className="flex items-center gap-1">
                    <Lock className="h-2.5 w-2.5 text-gray-300" />
                    <code className={`text-[10px] ${inp.fieldSource === 'native' ? 'text-blue-400' : 'text-purple-400'}`}>
                      {inp.key}
                    </code>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0 text-gray-500 hover:text-blue-600"
                  onClick={() => onEdit(inp)}
                >
                  <Pencil className="h-3 w-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0 text-gray-400 hover:text-red-600"
                  onClick={() => onDelete(inp.id)}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main PageConfigCard ─────────────────────────────────────────────────────

interface PageConfigCardProps {
  page: PageConfig;
  index: number;
  onChange: (updated: PageConfig) => void;
}

type Mode = 'collapsed' | 'choose' | 'assign' | 'ai' | 'view' | 'edit';

export function PageConfigCard({ page, index, onChange }: PageConfigCardProps) {
  const initialMode: Mode = page.isConfigured ? 'collapsed' : 'collapsed';
  const [mode, setMode] = useState<Mode>(initialMode);

  // Draft state
  const [assignedPageId, setAssignedPageId] = useState(page.assignedPageId ?? '');
  const [action, setAction] = useState(page.action ?? '');
  const [inputs, setInputs] = useState<FormInputField[]>(page.userInputs ?? []);
  const [pageName, setPageName] = useState(page.name ?? '');
  const [generating, setGenerating] = useState(false);
  const [regenerating, setRegenerating] = useState(false);

  // Add/Edit input dialog
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingInput, setEditingInput] = useState<FormInputField | null>(null);

  const resetDraftToPage = () => {
    setAssignedPageId(page.assignedPageId ?? '');
    setAction(page.action ?? '');
    setInputs(page.userInputs ?? []);
    setPageName(page.name ?? '');
  };

  // ── Input dialog handlers ─────────────────────────────────────────────────

  const openAddInput = () => { setEditingInput(null); setDialogOpen(true); };
  const openEditInput = (inp: FormInputField) => { setEditingInput(inp); setDialogOpen(true); };

  const handleInputSave = (field: FormInputField) => {
    if (editingInput) {
      setInputs((prev) => prev.map((i) => (i.id === editingInput.id ? field : i)));
    } else {
      setInputs((prev) => [...prev, field]);
    }
  };

  const handleDeleteInput = (id: string) => {
    setInputs((prev) => prev.filter((i) => i.id !== id));
  };

  // ── Save helpers ──────────────────────────────────────────────────────────

  const saveAssigned = () => {
    if (!assignedPageId || !action) return;
    const globalPage = MOCK_GLOBAL_PAGES.find((p) => p.id === assignedPageId);
    onChange({
      ...page,
      name: globalPage?.name ?? page.name,
      action,
      userInputs: inputs,
      isConfigured: true,
      configurationMethod: 'assigned',
      assignedPageId,
    });
    setMode('collapsed');
  };

  const triggerAiGenerate = () => {
    if (!pageName.trim() || !action) return;
    setGenerating(true);
    setTimeout(() => {
      setGenerating(false);
      onChange({
        ...page,
        name: pageName.trim(),
        action,
        userInputs: inputs,
        isConfigured: true,
        configurationMethod: 'ai_generated',
      });
      setMode('collapsed');
    }, 2000);
  };

  const triggerRegenerate = () => {
    if (!action) return;
    setRegenerating(true);
    setTimeout(() => {
      setRegenerating(false);
      onChange({
        ...page,
        name: page.configurationMethod === 'ai_generated' ? pageName.trim() : page.name,
        action,
        userInputs: inputs,
        isConfigured: true,
        configurationMethod: page.configurationMethod ?? 'ai_generated',
        assignedPageId: page.configurationMethod === 'assigned' ? assignedPageId : undefined,
      });
      setMode('collapsed');
    }, 2000);
  };

  // ── Badges ────────────────────────────────────────────────────────────────

  const statusBadge = page.isConfigured ? (
    <Badge variant="outline" className="text-[10px] bg-emerald-50 text-emerald-700 border-emerald-200 shrink-0">
      <CheckCircle2 className="h-2.5 w-2.5 mr-1" />
      Configured
    </Badge>
  ) : (
    <Badge variant="outline" className="text-[10px] bg-amber-50 text-amber-700 border-amber-200 shrink-0">
      Setup Required
    </Badge>
  );

  const methodBadge =
    page.configurationMethod === 'ai_generated' ? (
      <Badge variant="outline" className="text-[10px] bg-purple-50 text-purple-700 border-purple-200">
        <Wand2 className="h-2.5 w-2.5 mr-1" />
        AI Generated
      </Badge>
    ) : page.configurationMethod === 'assigned' ? (
      <Badge variant="outline" className="text-[10px] bg-sky-50 text-sky-700 border-sky-200">
        <Link2 className="h-2.5 w-2.5 mr-1" />
        Assigned
      </Badge>
    ) : null;

  const isExpanded = mode !== 'collapsed';

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <>
      <div className="border rounded-lg overflow-hidden transition-all">
        {/* Card header */}
        <button
          className="w-full flex items-center justify-between p-3 text-left hover:bg-gray-50 transition-colors"
          onClick={() => {
            if (mode === 'collapsed') setMode(page.isConfigured ? 'view' : 'choose');
            else setMode('collapsed');
          }}
        >
          <div className="flex items-center gap-2 min-w-0">
            {isExpanded ? (
              <ChevronDown className="h-4 w-4 text-gray-400 shrink-0" />
            ) : (
              <ChevronRight className="h-4 w-4 text-gray-400 shrink-0" />
            )}
            <span className="text-sm font-medium text-gray-800 truncate">
              <span className="text-gray-400 mr-1">{index + 1}.</span>
              {page.name}
            </span>
          </div>
          {statusBadge}
        </button>

        {/* ── Choose ───────────────────────────────────────────── */}
        {mode === 'choose' && (
          <div className="border-t p-4 space-y-3 bg-gray-50/60">
            <p className="text-xs text-gray-500">How would you like to configure this page?</p>
            <div className="grid grid-cols-2 gap-2">
              <button
                className="flex flex-col items-center gap-2 p-4 rounded-lg border-2 border-dashed border-gray-200 bg-white hover:border-sky-400 hover:bg-sky-50/40 text-center transition-all group"
                onClick={() => { resetDraftToPage(); setMode('assign'); }}
              >
                <div className="h-9 w-9 rounded-full bg-sky-100 flex items-center justify-center group-hover:bg-sky-200 transition-colors">
                  <Link2 className="h-4 w-4 text-sky-600" />
                </div>
                <span className="text-xs font-medium text-gray-700">Assign Existing Page</span>
                <span className="text-[10px] text-gray-400 leading-tight">Pick from pre-built templates</span>
              </button>

              <button
                className="flex flex-col items-center gap-2 p-4 rounded-lg border-2 border-dashed border-gray-200 bg-white hover:border-purple-400 hover:bg-purple-50/40 text-center transition-all group"
                onClick={() => { resetDraftToPage(); setMode('ai'); }}
              >
                <div className="h-9 w-9 rounded-full bg-purple-100 flex items-center justify-center group-hover:bg-purple-200 transition-colors">
                  <Wand2 className="h-4 w-4 text-purple-600" />
                </div>
                <span className="text-xs font-medium text-gray-700">Generate with AI</span>
                <span className="text-[10px] text-gray-400 leading-tight">Let AI create a page</span>
              </button>
            </div>
          </div>
        )}

        {/* ── Assign ───────────────────────────────────────────── */}
        {mode === 'assign' && (
          <div className="border-t p-4 space-y-4 bg-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Link2 className="h-3.5 w-3.5 text-sky-600" />
                <span className="text-xs font-semibold text-sky-700">Assign Existing Page</span>
              </div>
              <button className="text-xs text-gray-400 hover:text-gray-600 underline" onClick={() => setMode('choose')}>← Back</button>
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-medium">Page Template</Label>
              <Select value={assignedPageId} onValueChange={setAssignedPageId}>
                <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Select a pre-built page…" /></SelectTrigger>
                <SelectContent>
                  {MOCK_GLOBAL_PAGES.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-medium">Action</Label>
              <Select value={action} onValueChange={setAction}>
                <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Select what happens on this page…" /></SelectTrigger>
                <SelectContent>
                  {PREDEFINED_ACTIONS.map((a) => <SelectItem key={a} value={a}>{a}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <UserInputsList inputs={inputs} onAdd={openAddInput} onEdit={openEditInput} onDelete={handleDeleteInput} />

            <Button className="w-full" size="sm" disabled={!assignedPageId || !action} onClick={saveAssigned}>
              Save Configuration
            </Button>
          </div>
        )}

        {/* ── AI Generation ─────────────────────────────────────── */}
        {mode === 'ai' && (
          <div className="border-t p-4 space-y-4 bg-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Wand2 className="h-3.5 w-3.5 text-purple-600" />
                <span className="text-xs font-semibold text-purple-700">Generate with AI</span>
              </div>
              <button className="text-xs text-gray-400 hover:text-gray-600 underline" onClick={() => setMode('choose')}>← Back</button>
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-medium">Page Name</Label>
              <Input className="h-9 text-sm" placeholder="e.g. PAN Input Screen" value={pageName} onChange={(e) => setPageName(e.target.value)} />
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-medium">Action</Label>
              <Select value={action} onValueChange={setAction}>
                <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Select what happens on this page…" /></SelectTrigger>
                <SelectContent>
                  {PREDEFINED_ACTIONS.map((a) => <SelectItem key={a} value={a}>{a}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <UserInputsList inputs={inputs} onAdd={openAddInput} onEdit={openEditInput} onDelete={handleDeleteInput} />

            <Button
              className="w-full bg-purple-600 hover:bg-purple-700 text-white"
              size="sm"
              disabled={!pageName.trim() || !action || generating}
              onClick={triggerAiGenerate}
            >
              {generating ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Generating page…</>
              ) : (
                <><Wand2 className="h-4 w-4 mr-2" />Generate Page with AI</>
              )}
            </Button>
          </div>
        )}

        {/* ── View ──────────────────────────────────────────────── */}
        {mode === 'view' && page.isConfigured && (
          <div className="border-t p-4 space-y-3 bg-white">
            <div className="flex items-center justify-between">
              {methodBadge}
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs"
                onClick={() => { resetDraftToPage(); setMode('edit'); }}
              >
                <Pencil className="h-3 w-3 mr-1" />
                Edit
              </Button>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex gap-2">
                <span className="text-gray-500 shrink-0 w-14">Action</span>
                <span className="font-medium text-gray-800">{page.action}</span>
              </div>
              {page.userInputs.length > 0 && (
                <div>
                  <span className="text-gray-500 block mb-1.5">User Inputs ({page.userInputs.length})</span>
                  <div className="space-y-1.5 pl-1">
                    {page.userInputs.map((inp) => (
                      <div key={inp.id} className="flex items-center gap-2 flex-wrap">
                        <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${inp.fieldSource === 'native' ? 'bg-blue-500' : 'bg-purple-500'}`} />
                        <span className="font-medium text-gray-700">{inp.name}</span>
                        {inp.key && <code className="text-[10px] text-gray-400">{inp.key}</code>}
                        <Badge variant="outline" className="text-[10px] bg-gray-50 text-gray-500">{inp.dataType}</Badge>
                        {inp.required && <Badge variant="outline" className="text-[10px] bg-orange-50 text-orange-700 border-orange-200">Required</Badge>}
                        {inp.validations && inp.validations.length > 0 && (
                          <Badge variant="outline" className="text-[10px] bg-emerald-50 text-emerald-700 border-emerald-200">
                            <ShieldCheck className="h-2.5 w-2.5 mr-1" />{inp.validations.length}
                          </Badge>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Edit ──────────────────────────────────────────────── */}
        {mode === 'edit' && (
          <div className="border-t p-4 space-y-4 bg-white">
            <div className="flex items-center justify-between">
              {methodBadge}
              <button className="text-xs text-gray-400 hover:text-gray-600 underline" onClick={() => { resetDraftToPage(); setMode('view'); }}>Cancel</button>
            </div>

            {page.configurationMethod === 'ai_generated' && (
              <div className="space-y-1">
                <Label className="text-xs font-medium">Page Name</Label>
                <Input className="h-9 text-sm" value={pageName} onChange={(e) => setPageName(e.target.value)} />
              </div>
            )}

            {page.configurationMethod === 'assigned' && (
              <div className="space-y-1">
                <Label className="text-xs font-medium">Page Template</Label>
                <Select value={assignedPageId} onValueChange={setAssignedPageId}>
                  <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {MOCK_GLOBAL_PAGES.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-1">
              <Label className="text-xs font-medium">Action</Label>
              <Select value={action} onValueChange={setAction}>
                <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PREDEFINED_ACTIONS.map((a) => <SelectItem key={a} value={a}>{a}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <UserInputsList inputs={inputs} onAdd={openAddInput} onEdit={openEditInput} onDelete={handleDeleteInput} />

            <div className="rounded-md bg-amber-50 border border-amber-200 p-2.5 text-xs text-amber-800">
              Adding or removing inputs requires you to regenerate the page.
            </div>

            <Button
              className={`w-full ${page.configurationMethod === 'ai_generated' ? 'bg-purple-600 hover:bg-purple-700 text-white' : ''}`}
              size="sm"
              disabled={regenerating || !action}
              onClick={triggerRegenerate}
            >
              {regenerating ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Regenerating…</>
              ) : (
                <><RefreshCw className="h-4 w-4 mr-2" />Regenerate Page</>
              )}
            </Button>
          </div>
        )}
      </div>

      {/* Add/Edit Input Dialog */}
      <AddInputDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSave={handleInputSave}
        existingField={editingInput}
      />
    </>
  );
}
