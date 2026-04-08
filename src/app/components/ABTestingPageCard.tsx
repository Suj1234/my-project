import { useState } from 'react';
import { PageConfig, FormInputField } from '../types/journey';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Label } from './ui/label';
import { Input } from './ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { AddInputDialog } from './AddInputDialog';
import {
  ChevronDown,
  ChevronRight,
  CheckCircle2,
  Wand2,
  Plus,
  Trash2,
  Pencil,
  Loader2,
  RefreshCw,
  Lock,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';

// ─── Shared mock data (mirrors PageConfigCard) ──────────────────────────────

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

// ─── User Inputs List ────────────────────────────────────────────────────────

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
          className="border-2 border-dashed border-gray-200 rounded-lg p-4 text-center cursor-pointer hover:border-purple-300 hover:bg-purple-50/30 transition-colors"
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
                {inp.key && (
                  <div className="flex items-center gap-1">
                    <Lock className="h-2.5 w-2.5 text-gray-300" />
                    <code className={`text-[10px] ${inp.fieldSource === 'native' ? 'text-blue-400' : 'text-purple-400'}`}>
                      {inp.key}
                    </code>
                  </div>
                )}
              </div>
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

// ─── ABTestingPageCard ───────────────────────────────────────────────────────

interface ABTestingPageCardProps {
  page: PageConfig;
  index: number;
  onChange: (updated: PageConfig) => void;
}

export function ABTestingPageCard({ page, index, onChange }: ABTestingPageCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Live editable fields — pre-populated from block definition
  const [selectedPageId, setSelectedPageId] = useState(page.assignedPageId ?? MOCK_GLOBAL_PAGES[0]?.id ?? '');
  const [action, setAction] = useState(page.action ?? '');
  const [inputs, setInputs] = useState<FormInputField[]>(page.userInputs ?? []);

  // Update with AI loader (full card overlay)
  const [updatingWithAI, setUpdatingWithAI] = useState(false);

  // Generate with AI modal
  const [generateModalOpen, setGenerateModalOpen] = useState(false);
  const [generatePageName, setGeneratePageName] = useState('');
  const [generating, setGenerating] = useState(false);

  // Add/Edit input dialog
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingInput, setEditingInput] = useState<FormInputField | null>(null);

  // ── Input handlers ──────────────────────────────────────────────────────────

  const openAddInput = () => { setEditingInput(null); setDialogOpen(true); };
  const openEditInput = (inp: FormInputField) => { setEditingInput(inp); setDialogOpen(true); };

  const handleInputSave = (field: FormInputField) => {
    setInputs((prev) =>
      editingInput ? prev.map((i) => (i.id === editingInput.id ? field : i)) : [...prev, field]
    );
  };

  const handleDeleteInput = (id: string) => {
    setInputs((prev) => prev.filter((i) => i.id !== id));
  };

  // ── Page change — propagate to parent immediately ───────────────────────────

  const handlePageChange = (pageId: string) => {
    setSelectedPageId(pageId);
    const globalPage = MOCK_GLOBAL_PAGES.find((p) => p.id === pageId);
    onChange({
      ...page,
      assignedPageId: pageId,
      name: globalPage?.name ?? page.name,
      action,
      userInputs: inputs,
      isConfigured: !!pageId && !!action,
      configurationMethod: 'assigned',
    });
  };

  const handleActionChange = (val: string) => {
    setAction(val);
    onChange({
      ...page,
      assignedPageId: selectedPageId || undefined,
      action: val,
      userInputs: inputs,
      isConfigured: !!selectedPageId && !!val,
      configurationMethod: page.configurationMethod ?? 'assigned',
    });
  };

  // ── Update with AI (✏️ icon) — overlay loader on card ─────────────────────

  const handleUpdateWithAI = () => {
    if (!selectedPageId) return;
    setUpdatingWithAI(true);
    setTimeout(() => {
      setUpdatingWithAI(false);
      const globalPage = MOCK_GLOBAL_PAGES.find((p) => p.id === selectedPageId);
      onChange({
        ...page,
        name: globalPage?.name ?? page.name,
        action,
        userInputs: inputs,
        isConfigured: true,
        configurationMethod: 'ai_generated',
        assignedPageId: selectedPageId,
      });
    }, 2500);
  };

  // ── Generate with AI (bottom button) — modal then loader inside modal ──────

  const handleGenerateSubmit = () => {
    if (!generatePageName.trim()) return;
    setGenerating(true);
    setTimeout(() => {
      setGenerating(false);
      setGenerateModalOpen(false);
      setGeneratePageName('');
      onChange({
        ...page,
        name: generatePageName.trim(),
        action,
        userInputs: inputs,
        isConfigured: true,
        configurationMethod: 'ai_generated',
        assignedPageId: undefined,
      });
    }, 2500);
  };

  // ── Derived display values ──────────────────────────────────────────────────

  const currentPageName =
    MOCK_GLOBAL_PAGES.find((p) => p.id === selectedPageId)?.name ?? page.name;

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
      <Badge variant="outline" className="text-[10px] bg-purple-50 text-purple-700 border-purple-200 shrink-0">
        <Wand2 className="h-2.5 w-2.5 mr-1" />
        AI Generated
      </Badge>
    ) : page.configurationMethod === 'assigned' ? (
      <Badge variant="outline" className="text-[10px] bg-sky-50 text-sky-700 border-sky-200 shrink-0">
        Assigned
      </Badge>
    ) : null;

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <>
      <div className="border rounded-lg overflow-hidden transition-all">

        {/* ── Card header ── */}
        <button
          className="w-full flex items-center justify-between p-3 text-left hover:bg-gray-50 transition-colors"
          onClick={() => setIsExpanded((prev) => !prev)}
        >
          <div className="flex items-center gap-2 min-w-0">
            {isExpanded ? (
              <ChevronDown className="h-4 w-4 text-gray-400 shrink-0" />
            ) : (
              <ChevronRight className="h-4 w-4 text-gray-400 shrink-0" />
            )}
            <span className="text-sm font-medium text-gray-800 truncate">
              <span className="text-gray-400 mr-1">{index + 1}.</span>
              {currentPageName || page.name}
            </span>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            {methodBadge}
            {statusBadge}
          </div>
        </button>

        {/* ── Expanded body ── */}
        {isExpanded && (
          <div className="relative border-t bg-white">
            <div className="p-4 space-y-4">

              {/* Page selector row */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-gray-700">Select Page</Label>
                <div className="flex items-center gap-1.5">
                  <div className="flex-1">
                    <Select value={selectedPageId} onValueChange={handlePageChange}>
                      <SelectTrigger className="h-9 text-sm">
                        <SelectValue placeholder="Select a page…" />
                      </SelectTrigger>
                      <SelectContent>
                        {MOCK_GLOBAL_PAGES.map((p) => (
                          <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* 🔄 Refresh page library — to see AI-generated pages after generation */}
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-9 w-9 p-0 shrink-0 text-gray-500 hover:text-sky-600 hover:border-sky-300"
                    title="Refresh page list to see newly generated pages"
                    onClick={() => {
                      // Refreshes the available pages list so AI-generated pages appear
                      setSelectedPageId((prev) => prev);
                    }}
                  >
                    <RefreshCw className="h-4 w-4" />
                  </Button>

                  {/* 🪄 Update page with AI */}
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-9 w-9 p-0 shrink-0 text-purple-600 hover:text-purple-700 hover:border-purple-300 hover:bg-purple-50"
                    title="Update this page with AI"
                    disabled={!selectedPageId || updatingWithAI}
                    onClick={handleUpdateWithAI}
                  >
                    {updatingWithAI
                      ? <Loader2 className="h-4 w-4 animate-spin" />
                      : <Wand2 className="h-4 w-4" />
                    }
                  </Button>
                </div>
                <p className="text-[10px] text-gray-400">
                  🔄 refresh to see newly generated pages &nbsp;·&nbsp; 🪄 update this page with AI
                </p>
              </div>

              {/* Action selector */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-gray-700">Action</Label>
                <Select value={action} onValueChange={handleActionChange}>
                  <SelectTrigger className="h-9 text-sm">
                    <SelectValue placeholder="Select what happens on this page…" />
                  </SelectTrigger>
                  <SelectContent>
                    {PREDEFINED_ACTIONS.map((a) => (
                      <SelectItem key={a} value={a}>{a}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* User Inputs */}
              <UserInputsList
                inputs={inputs}
                onAdd={openAddInput}
                onEdit={openEditInput}
                onDelete={handleDeleteInput}
              />

              {/* Divider */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-dashed border-gray-200" />
                </div>
                <div className="relative flex justify-center text-[10px] uppercase tracking-wide">
                  <span className="bg-white px-2 text-gray-400">or start fresh</span>
                </div>
              </div>

              {/* Generate new page with AI button */}
              <Button
                variant="outline"
                className="w-full border-purple-200 text-purple-700 hover:bg-purple-50 hover:border-purple-400"
                size="sm"
                onClick={() => { setGeneratePageName(''); setGenerateModalOpen(true); }}
              >
                <Sparkles className="h-4 w-4 mr-2" />
                Generate new page with AI
              </Button>

            </div>
          </div>
        )}
      </div>

      {/* ── Generate with AI modal ── */}
      <Dialog open={generateModalOpen} onOpenChange={(open) => { if (!generating) setGenerateModalOpen(open); }}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <div className="h-7 w-7 rounded-full bg-purple-100 flex items-center justify-center">
                <Sparkles className="h-4 w-4 text-purple-600" />
              </div>
              Generate new page with AI
            </DialogTitle>
          </DialogHeader>

          <div className="py-2 space-y-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-gray-700">Page Name</Label>
              <Input
                className="h-9 text-sm"
                placeholder="e.g. PAN Input Screen"
                value={generatePageName}
                onChange={(e) => setGeneratePageName(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && !generating) handleGenerateSubmit(); }}
                disabled={generating}
                autoFocus
              />
              <p className="text-[10px] text-gray-400">
                AI will create the page based on this name. Action and inputs will be pre-populated.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              size="sm"
              disabled={generating}
              onClick={() => setGenerateModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              className="bg-purple-600 hover:bg-purple-700 text-white"
              disabled={!generatePageName.trim() || generating}
              onClick={handleGenerateSubmit}
            >
              {generating
                ? <><Loader2 className="h-4 w-4 mr-1.5 animate-spin" />Generating…</>
                : <><Sparkles className="h-4 w-4 mr-1.5" />Generate</>
              }
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Add / Edit Input dialog ── */}
      <AddInputDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSave={handleInputSave}
        existingField={editingInput}
      />
    </>
  );
}
