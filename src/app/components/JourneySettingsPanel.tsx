import { useState } from 'react';
import {
  JourneySettings,
  PageSlot,
  MOCK_AVAILABLE_PAGES,
  MOCK_APP_CONFIGS,
} from '../types/journey';
import { ScrollArea } from './ui/scroll-area';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './ui/accordion';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import {
  X,
  Settings2,
  FileText,
  Download,
  Upload,
  AppWindow,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  LogIn,
  RotateCcw,
  AlertTriangle,
  Wrench,
  FlaskConical,
} from 'lucide-react';
import { Label } from './ui/label';

interface JourneySettingsPanelProps {
  settings: JourneySettings;
  onClose: () => void;
  onChange: (settings: JourneySettings) => void;
  onExport: () => void;
  onImport: () => void;
}

const PAGE_SLOT_META: {
  key: keyof Omit<JourneySettings, 'appConfigId'>;
  label: string;
  description: string;
  icon: React.ReactNode;
}[] = [
  {
    key: 'loginPage',
    label: 'Login Page',
    description: 'Authentication screen before the journey starts',
    icon: <LogIn className="h-3.5 w-3.5 text-blue-500" />,
  },
  {
    key: 'resumePage',
    label: 'Resume Page',
    description: 'Shown when applicant returns to continue journey',
    icon: <RotateCcw className="h-3.5 w-3.5 text-teal-500" />,
  },
  {
    key: 'errorPage',
    label: 'Error Page',
    description: 'Global fallback for unexpected failures',
    icon: <AlertCircle className="h-3.5 w-3.5 text-red-500" />,
  },
  {
    key: 'maintenancePage',
    label: 'Maintenance Page',
    description: 'Shown during scheduled downtime',
    icon: <Wrench className="h-3.5 w-3.5 text-orange-500" />,
  },
  {
    key: 'mockedPage',
    label: 'Mocked / Sandbox Page',
    description: 'Used for testing flows in non-production',
    icon: <FlaskConical className="h-3.5 w-3.5 text-purple-500" />,
  },
];

function PageSlotCard({
  label,
  description,
  icon,
  slot,
  onChange,
}: {
  label: string;
  description: string;
  icon: React.ReactNode;
  slot: PageSlot;
  onChange: (updated: PageSlot) => void;
}) {
  const [mode, setMode] = useState<'idle' | 'assign' | 'ai'>('idle');
  const isConfigured = slot.isConfigured;

  const handleAssign = (pageId: string) => {
    const page = MOCK_AVAILABLE_PAGES.find((p) => p.id === pageId);
    if (!page) return;
    onChange({ pageId: page.id, pageName: page.name, configurationMethod: 'assigned', isConfigured: true });
    setMode('idle');
  };

  const handleAiGenerate = () => {
    // Mock AI generation
    const aiName = `${label.replace(/\s/g, '')}AI_v1`;
    onChange({ pageId: `ai-${Date.now()}`, pageName: aiName, configurationMethod: 'ai_generated', isConfigured: true });
    setMode('idle');
  };

  const handleRemove = () => {
    onChange({ pageId: null, pageName: null, isConfigured: false });
    setMode('idle');
  };

  return (
    <div className={`rounded-lg border-2 transition-all ${isConfigured ? 'border-green-200 bg-green-50/40' : 'border-gray-100 bg-white'}`}>
      {/* Card header */}
      <div className="px-3 py-2.5 flex items-start justify-between gap-2">
        <div className="flex items-start gap-2 flex-1 min-w-0">
          <div className="mt-0.5 flex-shrink-0">{icon}</div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-xs font-semibold text-gray-800">{label}</p>
              {isConfigured ? (
                <Badge variant="secondary" className="bg-green-100 text-green-700 text-[10px] px-1.5 py-0 h-4">
                  <CheckCircle2 className="h-2.5 w-2.5 mr-0.5" />
                  {slot.configurationMethod === 'ai_generated' ? 'AI Generated' : 'Assigned'}
                </Badge>
              ) : (
                <Badge variant="secondary" className="bg-gray-100 text-gray-500 text-[10px] px-1.5 py-0 h-4">
                  Not configured
                </Badge>
              )}
            </div>
            <p className="text-[10px] text-gray-400 leading-tight mt-0.5">{description}</p>
            {isConfigured && slot.pageName && (
              <p className="text-[11px] font-medium text-emerald-700 mt-1 truncate">{slot.pageName}</p>
            )}
          </div>
        </div>
        {/* Actions */}
        <div className="flex items-center gap-1 flex-shrink-0">
          {isConfigured ? (
            <Button variant="ghost" size="icon" className="h-6 w-6 text-gray-400 hover:text-red-500" onClick={handleRemove}>
              <X className="h-3 w-3" />
            </Button>
          ) : (
            <>
              <Button
                size="sm"
                variant="outline"
                className="h-6 text-[10px] px-2 border-blue-200 text-blue-600 hover:bg-blue-50"
                onClick={() => setMode(mode === 'assign' ? 'idle' : 'assign')}
              >
                Assign
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="h-6 text-[10px] px-2 border-purple-200 text-purple-600 hover:bg-purple-50"
                onClick={() => setMode(mode === 'ai' ? 'idle' : 'ai')}
              >
                <Sparkles className="h-2.5 w-2.5 mr-0.5" />
                AI
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Assign dropdown */}
      {mode === 'assign' && (
        <div className="px-3 pb-3 border-t border-dashed border-gray-200 pt-2.5 space-y-2">
          <Label className="text-[10px] text-gray-500 uppercase tracking-wide">Select existing page</Label>
          <Select onValueChange={handleAssign}>
            <SelectTrigger className="h-8 text-xs">
              <SelectValue placeholder="Choose a page..." />
            </SelectTrigger>
            <SelectContent>
              {MOCK_AVAILABLE_PAGES.map((page) => (
                <SelectItem key={page.id} value={page.id} className="text-xs">
                  {page.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="ghost" size="sm" className="h-6 text-[10px] text-gray-400 w-full" onClick={() => setMode('idle')}>
            Cancel
          </Button>
        </div>
      )}

      {/* AI Generate */}
      {mode === 'ai' && (
        <div className="px-3 pb-3 border-t border-dashed border-purple-200 pt-2.5 space-y-2">
          <div className="text-[11px] text-purple-700 bg-purple-50 rounded-md px-2.5 py-1.5 leading-relaxed">
            <Sparkles className="h-3 w-3 inline mr-1 text-purple-500" />
            AI will generate a <strong>{label}</strong> based on journey context and block configuration.
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              className="flex-1 h-7 text-[11px] bg-purple-600 hover:bg-purple-700 text-white"
              onClick={handleAiGenerate}
            >
              <Sparkles className="h-3 w-3 mr-1" />
              Generate
            </Button>
            <Button variant="ghost" size="sm" className="h-7 text-[10px] text-gray-400" onClick={() => setMode('idle')}>
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export function JourneySettingsPanel({ settings, onClose, onChange, onExport, onImport }: JourneySettingsPanelProps) {
  const configuredCount = Object.entries(settings)
    .filter(([k, v]) => k !== 'appConfigId' && (v as PageSlot)?.isConfigured)
    .length;

  const updateSlot = (key: keyof Omit<JourneySettings, 'appConfigId'>, slot: PageSlot) => {
    onChange({ ...settings, [key]: slot });
  };

  return (
    <div className="w-[420px] bg-white border-l border-gray-200 flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-200 bg-gradient-to-r from-slate-50 to-white flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-slate-800 flex items-center justify-center">
            <Settings2 className="h-3.5 w-3.5 text-white" />
          </div>
          <div>
            <h2 className="font-semibold text-sm text-gray-900">Journey Settings</h2>
            <p className="text-[10px] text-gray-400 leading-tight">
              {configuredCount} of {PAGE_SLOT_META.length} pages configured
            </p>
          </div>
        </div>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Body */}
      <ScrollArea className="flex-1 min-h-0">
        <div className="p-4">
          <Accordion type="multiple" defaultValue={['pages', 'app-config', 'import-export']}>

            {/* ── Pages ── */}
            <AccordionItem value="pages">
              <AccordionTrigger>
                <div className="flex items-center gap-2 flex-1 pr-2">
                  <FileText className="h-4 w-4 text-gray-500" />
                  <span>Pages</span>
                  {configuredCount > 0 && (
                    <Badge variant="secondary" className="bg-green-100 text-green-700 text-[10px] ml-auto">
                      {configuredCount}/{PAGE_SLOT_META.length}
                    </Badge>
                  )}
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-2 pt-1">
                  <p className="text-[11px] text-gray-400 mb-3">
                    Configure global journey pages. Each slot can be assigned from existing pages or generated using AI.
                  </p>
                  {PAGE_SLOT_META.map((meta) => (
                    <PageSlotCard
                      key={meta.key}
                      label={meta.label}
                      description={meta.description}
                      icon={meta.icon}
                      slot={settings[meta.key] as PageSlot}
                      onChange={(updated) => updateSlot(meta.key, updated)}
                    />
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* ── App Config ── */}
            <AccordionItem value="app-config">
              <AccordionTrigger>
                <div className="flex items-center gap-2">
                  <AppWindow className="h-4 w-4 text-gray-500" />
                  <span>App Config</span>
                  {settings.appConfigId && (
                    <Badge variant="secondary" className="bg-blue-100 text-blue-700 text-[10px] ml-2">
                      {MOCK_APP_CONFIGS.find((c) => c.id === settings.appConfigId)?.name ?? 'Set'}
                    </Badge>
                  )}
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-3 pt-1">
                  <p className="text-[11px] text-gray-400">
                    Select the app configuration object that governs theming, feature flags, and runtime behaviour for this journey.
                  </p>
                  <div>
                    <Label className="text-xs text-gray-600 mb-1 block">Select Configuration</Label>
                    <Select
                      value={settings.appConfigId ?? ''}
                      onValueChange={(v) => onChange({ ...settings, appConfigId: v || null })}
                    >
                      <SelectTrigger className="h-9 text-sm">
                        <SelectValue placeholder="Choose app config..." />
                      </SelectTrigger>
                      <SelectContent>
                        {MOCK_APP_CONFIGS.map((cfg) => (
                          <SelectItem key={cfg.id} value={cfg.id} className="text-sm">
                            {cfg.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {settings.appConfigId && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs text-gray-400 h-6 px-2"
                      onClick={() => onChange({ ...settings, appConfigId: null })}
                    >
                      <X className="h-3 w-3 mr-1" />
                      Clear
                    </Button>
                  )}
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* ── Import / Export ── */}
            <AccordionItem value="import-export">
              <AccordionTrigger>
                <div className="flex items-center gap-2">
                  <Download className="h-4 w-4 text-gray-500" />
                  <span>Import / Export</span>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-3 pt-1">
                  <p className="text-[11px] text-gray-400">
                    Export this journey as JSON to back it up or reuse in another project. Import a JSON file to restore or clone a journey.
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      variant="outline"
                      className="h-9 text-xs border-slate-200 hover:border-slate-400 flex items-center gap-2"
                      onClick={onExport}
                    >
                      <Download className="h-3.5 w-3.5" />
                      Export JSON
                    </Button>
                    <Button
                      variant="outline"
                      className="h-9 text-xs border-slate-200 hover:border-slate-400 flex items-center gap-2"
                      onClick={onImport}
                    >
                      <Upload className="h-3.5 w-3.5" />
                      Import JSON
                    </Button>
                  </div>
                  <div className="rounded-md bg-amber-50 border border-amber-200 px-3 py-2">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="h-3.5 w-3.5 text-amber-500 mt-0.5 flex-shrink-0" />
                      <p className="text-[10px] text-amber-700 leading-relaxed">
                        Importing a journey will replace the current canvas. This action cannot be undone.
                      </p>
                    </div>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

          </Accordion>
        </div>
      </ScrollArea>
    </div>
  );
}
