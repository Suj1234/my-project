import { Handle, Position } from '@xyflow/react';
import { FlowNodeData, EndBlockType } from '../../types/journey';
import { Button } from '../ui/button';
import { X, CheckCircle2, XCircle, Clock, Mail, MessageSquare, Webhook } from 'lucide-react';
import { useState } from 'react';
import type React from 'react';

interface EndNodeProps {
  data: FlowNodeData;
  selected: boolean;
}

const TYPE_CONFIG: Record<EndBlockType, {
  label: string;
  badge: string;
  headerClass: string;
  borderClass: string;
  badgeClass: string;
  icon: React.ReactNode;
}> = {
  success: {
    label: 'Success',
    badge: 'SUCCESS',
    headerClass: 'from-emerald-500 via-green-500 to-emerald-600',
    borderClass: 'border-emerald-400',
    badgeClass: 'text-emerald-100 bg-white/15 border-white/20',
    icon: <CheckCircle2 className="h-3.5 w-3.5 text-white" />,
  },
  rejection: {
    label: 'Rejection',
    badge: 'REJECTED',
    headerClass: 'from-red-500 via-rose-500 to-red-600',
    borderClass: 'border-red-400',
    badgeClass: 'text-red-100 bg-white/15 border-white/20',
    icon: <XCircle className="h-3.5 w-3.5 text-white" />,
  },
  manual_review: {
    label: 'Manual Review',
    badge: 'REVIEW',
    headerClass: 'from-amber-500 via-yellow-500 to-amber-600',
    borderClass: 'border-amber-400',
    badgeClass: 'text-amber-100 bg-white/15 border-white/20',
    icon: <Clock className="h-3.5 w-3.5 text-white" />,
  },
};

const BODY_BG: Record<EndBlockType, string> = {
  success: 'from-white to-emerald-50/30',
  rejection: 'from-white to-red-50/30',
  manual_review: 'from-white to-amber-50/30',
};

const SELECTED_RING: Record<EndBlockType, string> = {
  success: 'border-emerald-500 shadow-2xl shadow-emerald-100/60',
  rejection: 'border-red-500 shadow-2xl shadow-red-100/60',
  manual_review: 'border-amber-500 shadow-2xl shadow-amber-100/60',
};

const HOVER_RING: Record<EndBlockType, string> = {
  success: 'hover:border-emerald-400',
  rejection: 'hover:border-red-400',
  manual_review: 'hover:border-amber-400',
};

export function EndNode({ data, selected }: EndNodeProps) {
  const [showDelete, setShowDelete] = useState(false);
  const endType: EndBlockType = data.endType ?? 'success';
  const cfg = TYPE_CONFIG[endType];

  const hasEmail = data.emailTrigger?.enabled;
  const hasSms = data.smsTrigger?.enabled;
  const hasWebhook = data.webhookTrigger?.enabled;

  const outcomePageName = data.pages?.[0]?.assignedPageId
    ? data.pages[0].assignedPageId
    : data.pages?.[0]?.isConfigured
    ? data.pages[0].name
    : null;

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    data.onDelete?.(data.id);
  };

  return (
    <div
      className="relative transition-all duration-150"
      onMouseEnter={() => setShowDelete(true)}
      onMouseLeave={() => setShowDelete(false)}
    >
      {/* Delete button */}
      {showDelete && data.onDelete && (
        <Button
          variant="ghost"
          size="icon"
          className="absolute -top-2.5 -right-2.5 h-6 w-6 rounded-full bg-gray-700 hover:bg-gray-900 text-white z-10 shadow"
          onClick={handleDeleteClick}
        >
          <X className="h-3 w-3" />
        </Button>
      )}

      {/* Card */}
      <div
        className={`w-[260px] rounded-xl overflow-hidden bg-white cursor-pointer transition-all duration-150 border-2 ${
          selected
            ? `${SELECTED_RING[endType]}`
            : `${cfg.borderClass} shadow-lg ${HOVER_RING[endType]} hover:shadow-xl`
        }`}
        onClick={() => data.onConfigure?.(data.id)}
      >
        {/* Header */}
        <div className={`bg-gradient-to-r ${cfg.headerClass} px-3.5 py-2.5 flex items-center justify-between`}>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-white/25 flex items-center justify-center shadow-inner">
              {cfg.icon}
            </div>
            <div>
              <p className="text-white font-semibold text-xs leading-tight tracking-wide">JOURNEY END</p>
              <p className="text-white/70 text-[10px] leading-tight">{data.name || cfg.label}</p>
            </div>
          </div>
          <span className={`text-[9px] font-bold tracking-widest px-1.5 py-0.5 rounded-full border ${cfg.badgeClass}`}>
            {cfg.badge}
          </span>
        </div>

        {/* Body */}
        <div className={`px-3.5 py-2.5 space-y-1.5 bg-gradient-to-b ${BODY_BG[endType]}`}>
          {/* Outcome page */}
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-gray-500 font-medium">Outcome Page</span>
            {outcomePageName ? (
              <span className="text-[11px] font-semibold text-gray-700 bg-gray-100 px-2 py-0.5 rounded-md border border-gray-200 max-w-[130px] truncate">
                {outcomePageName}
              </span>
            ) : (
              <span className="text-[11px] text-gray-400 italic">Not assigned</span>
            )}
          </div>

          {/* Message preview */}
          {data.messageTitle && (
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-gray-500 font-medium">Message</span>
              <span className="text-[11px] font-medium text-gray-700 max-w-[130px] truncate">{data.messageTitle}</span>
            </div>
          )}

          {/* Notification badges */}
          {(hasEmail || hasSms || hasWebhook) && (
            <div className="flex gap-1.5 pt-0.5 flex-wrap border-t border-gray-100">
              {hasEmail && (
                <span className="inline-flex items-center gap-1 text-[10px] font-medium bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full border border-blue-100">
                  <Mail className="h-2.5 w-2.5" />
                  Email
                </span>
              )}
              {hasSms && (
                <span className="inline-flex items-center gap-1 text-[10px] font-medium bg-green-50 text-green-600 px-2 py-0.5 rounded-full border border-green-100">
                  <MessageSquare className="h-2.5 w-2.5" />
                  SMS
                </span>
              )}
              {hasWebhook && (
                <span className="inline-flex items-center gap-1 text-[10px] font-medium bg-orange-50 text-orange-600 px-2 py-0.5 rounded-full border border-orange-100">
                  <Webhook className="h-2.5 w-2.5" />
                  Webhook
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Target handle */}
      <Handle
        type="target"
        position={Position.Top}
        className="!bg-gray-400 !w-3 !h-3 !border-2 !border-white !shadow"
      />
    </div>
  );
}