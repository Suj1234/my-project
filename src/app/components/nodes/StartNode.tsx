import { Handle, Position } from '@xyflow/react';
import { Button } from '../ui/button';
import { Plus, Play, Shield, Zap, Globe, Smartphone, Building2, Code2 } from 'lucide-react';
import { FlowNodeData } from '../../types/journey';
import type React from 'react';

interface StartNodeProps {
  data: FlowNodeData;
  selected: boolean;
}

const ENTRY_ICONS: Record<string, React.ReactNode> = {
  web: <Globe className="h-3 w-3" />,
  mobile_sdk: <Smartphone className="h-3 w-3" />,
  branch: <Building2 className="h-3 w-3" />,
  api: <Code2 className="h-3 w-3" />,
};

const ENTRY_LABELS: Record<string, string> = {
  web: 'Web',
  mobile_sdk: 'Mobile SDK',
  branch: 'Branch',
  api: 'API',
};

const AUTH_LABELS: Record<string, string> = {
  otp: 'OTP',
  password: 'Password',
  biometric: 'Biometric',
  none: 'No Auth',
};

export function StartNode({ data, selected }: StartNodeProps) {
  const entrySource = data.entrySource ?? 'web';
  const authMethod = data.authMethod ?? 'otp';
  const hasConsent = data.collectConsent ?? false;
  const hasWebhook = data.startWebhookEnabled ?? false;

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    data.onConfigure?.(data.id);
  };

  return (
    <div className={`relative transition-all duration-150 ${selected ? 'drop-shadow-xl' : ''}`}>
      {/* Card */}
      <div
        className={`w-[260px] rounded-xl overflow-hidden bg-white cursor-pointer transition-all duration-150 border-2 ${
          selected
            ? 'border-emerald-500 shadow-2xl shadow-emerald-100/60'
            : 'border-emerald-200 shadow-lg hover:border-emerald-400 hover:shadow-xl'
        }`}
        onClick={handleClick}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 px-3.5 py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-white/25 flex items-center justify-center shadow-inner">
              <Play className="h-3 w-3 text-white fill-white" />
            </div>
            <div>
              <p className="text-white font-semibold text-xs leading-tight tracking-wide">JOURNEY START</p>
              <p className="text-emerald-100/80 text-[10px] leading-tight">Entry point</p>
            </div>
          </div>
          <span className="text-[9px] font-bold tracking-widest text-emerald-100 bg-white/15 px-1.5 py-0.5 rounded-full border border-white/20">
            START
          </span>
        </div>

        {/* Body */}
        <div className="px-3.5 py-2.5 space-y-2 bg-gradient-to-b from-white to-emerald-50/30">
          {/* Entry channel */}
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-gray-500 font-medium">Entry via</span>
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
              {ENTRY_ICONS[entrySource]}
              {ENTRY_LABELS[entrySource]}
            </span>
          </div>

          {/* Auth method */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1 text-[11px] text-gray-500 font-medium">
              <Shield className="h-3 w-3" />
              Auth
            </div>
            <span className="text-[11px] font-semibold text-gray-700 bg-gray-100 px-2 py-0.5 rounded-md border border-gray-200">
              {AUTH_LABELS[authMethod]}
            </span>
          </div>

          {/* Consent / Webhook badges */}
          {(hasConsent || hasWebhook) && (
            <div className="flex gap-1.5 pt-0.5 flex-wrap border-t border-gray-100">
              {hasConsent && (
                <span className="inline-flex items-center gap-1 text-[10px] font-medium bg-violet-50 text-violet-600 px-2 py-0.5 rounded-full border border-violet-100">
                  <Shield className="h-2.5 w-2.5" />
                  Consent
                </span>
              )}
              {hasWebhook && (
                <span className="inline-flex items-center gap-1 text-[10px] font-medium bg-orange-50 text-orange-600 px-2 py-0.5 rounded-full border border-orange-100">
                  <Zap className="h-2.5 w-2.5" />
                  Webhook
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Source handle */}
      <Handle
        type="source"
        position={Position.Bottom}
        className="!bg-emerald-500 !w-3 !h-3 !border-2 !border-white !shadow"
      />

      {/* Add button */}
      <div className="absolute -bottom-9 left-1/2 transform -translate-x-1/2">
        <Button
          variant="ghost"
          size="sm"
          className="h-7 px-3 text-xs bg-white shadow border border-gray-200 hover:bg-emerald-50 hover:border-emerald-300 hover:text-emerald-700 transition-colors"
          onClick={(e) => { e.stopPropagation(); data.onAddBlock?.(data.id); }}
        >
          <Plus className="h-3 w-3 mr-1" />
          Add
        </Button>
      </div>
    </div>
  );
}