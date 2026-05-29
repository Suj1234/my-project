import { Handle, Position } from '@xyflow/react';
import { FlowNodeData, BlockCategory } from '../../types/journey';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Plus, X, CreditCard, Fingerprint, Camera, Building, TrendingUp, Landmark, FileText, FileCheck, PenTool, User, Users, Award, ShieldCheck } from 'lucide-react';
import { useState } from 'react';
import type React from 'react';
import { getShortDescription } from '../../data/blockDefinitions';

interface SmartBlockNodeProps {
  data: FlowNodeData;
  selected: boolean;
}

const iconMap: Record<string, any> = {
  CreditCard,
  Fingerprint,
  Camera,
  Building,
  TrendingUp,
  Landmark,
  FileText,
  FileCheck,
  PenTool,
  User,
  Users,
  Award,
  ShieldCheck,
};

// Gradient + accent colors per category
const CATEGORY_STYLE: Record<BlockCategory | 'default', { gradient: string; badge: string; handle: string }> = {
  identity:        { gradient: 'from-blue-500 via-blue-500 to-blue-600',     badge: 'bg-blue-100 text-blue-700',    handle: '!bg-blue-500' },
  financial:       { gradient: 'from-emerald-500 via-green-500 to-emerald-600', badge: 'bg-emerald-100 text-emerald-700', handle: '!bg-emerald-500' },
  documents:       { gradient: 'from-amber-500 via-orange-400 to-amber-600',  badge: 'bg-amber-100 text-amber-700',  handle: '!bg-amber-500' },
  profile:         { gradient: 'from-purple-500 via-violet-500 to-purple-600', badge: 'bg-purple-100 text-purple-700', handle: '!bg-purple-500' },
  fulfilment:      { gradient: 'from-teal-500 via-cyan-500 to-teal-600',      badge: 'bg-teal-100 text-teal-700',    handle: '!bg-teal-500' },
  decision:        { gradient: 'from-orange-500 via-orange-400 to-orange-600', badge: 'bg-orange-100 text-orange-700', handle: '!bg-orange-500' },
  data_collection: { gradient: 'from-indigo-500 via-blue-500 to-indigo-600',  badge: 'bg-indigo-100 text-indigo-700', handle: '!bg-indigo-500' },
  default:         { gradient: 'from-blue-500 via-blue-500 to-blue-600',      badge: 'bg-blue-100 text-blue-700',    handle: '!bg-blue-500' },
};

export function SmartBlockNode({ data, selected }: SmartBlockNodeProps) {
  const [showDelete, setShowDelete] = useState(false);
  const Icon = data.blockTypeId ? iconMap[getIconForBlockType(data.blockTypeId)] : CreditCard;
  const style = CATEGORY_STYLE[data.category ?? 'default'] ?? CATEGORY_STYLE.default;

  const handleAddClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    data.onAddBlock?.(data.id);
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    data.onDelete?.(data.id);
  };

  return (
    <div
      className={`relative transition-all duration-150 ${selected ? 'drop-shadow-xl' : ''}`}
      onMouseEnter={() => setShowDelete(true)}
      onMouseLeave={() => setShowDelete(false)}
    >
      <Handle
        type="target"
        position={Position.Top}
        className={`${style.handle} !w-3 !h-3 !border-2 !border-white !shadow`}
      />

      {showDelete && data.onDelete && (
        <Button
          variant="ghost"
          size="icon"
          className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-red-500 hover:bg-red-600 text-white z-10 shadow"
          onClick={handleDeleteClick}
        >
          <X className="h-3 w-3" />
        </Button>
      )}

      {/* Card */}
      <div
        className={`w-[240px] rounded-xl overflow-hidden bg-white cursor-pointer transition-all duration-150 border-2 ${
          selected
            ? 'border-gray-400 shadow-2xl'
            : 'border-gray-200 shadow-lg hover:border-gray-400 hover:shadow-xl'
        }`}
        onClick={() => data.onConfigure?.(data.id)}
      >
        {/* Gradient header */}
        <div className={`bg-gradient-to-r ${style.gradient} px-3.5 py-2.5 flex items-center justify-between`}>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-white/25 flex items-center justify-center shadow-inner">
              <Icon className="h-3.5 w-3.5 text-white" />
            </div>
            <div>
              <p className="text-white font-semibold text-xs leading-tight tracking-wide truncate max-w-[120px]">{data.name}</p>
              {data.provider && (
                <p className="text-white/70 text-[10px] leading-tight">{data.provider}</p>
              )}
            </div>
          </div>
          <span className="text-[9px] font-bold tracking-widest text-white/90 bg-white/15 px-1.5 py-0.5 rounded-full border border-white/20 flex-shrink-0">
            SMART
          </span>
        </div>

        {/* Body */}
        <div className="px-3.5 py-2.5 bg-gradient-to-b from-white to-gray-50/30">
          <p className="text-[11px] text-gray-500 leading-snug mb-2 line-clamp-2">
            {data.blockTypeId ? getShortDescription(data.blockTypeId) : data.description}
          </p>
          <div className="flex items-center justify-between">
            <Badge
              variant="secondary"
              className={`text-[10px] px-2 py-0 h-4 ${style.badge}`}
            >
              {data.category ?? 'smart'}
            </Badge>
            <Badge
              variant="secondary"
              className={data.configured ? 'bg-green-100 text-green-700 text-[10px]' : 'bg-amber-100 text-amber-700 text-[10px]'}
            >
              {data.configured ? '✓ Configured' : 'Not Configured'}
            </Badge>
          </div>
        </div>
      </div>

      <Handle
        type="source"
        position={Position.Bottom}
        className={`${style.handle} !w-3 !h-3 !border-2 !border-white !shadow`}
      />

      <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2">
        <Button
          variant="ghost"
          size="sm"
          className="h-6 px-2 text-xs bg-white shadow-sm border"
          onClick={handleAddClick}
        >
          <Plus className="h-3 w-3 mr-1" />
          Add
        </Button>
      </div>
    </div>
  );
}

function getIconForBlockType(blockTypeId: string): string {
  const iconMapping: Record<string, string> = {
    pan_verification: 'CreditCard',
    aadhaar_verification: 'Fingerprint',
    liveness_selfie: 'Camera',
    bank_statement: 'Building',
    offer_generation: 'TrendingUp',
    bank_account_selection: 'Landmark',
    kfs_document: 'FileText',
    sanction_letter: 'FileCheck',
    esign: 'PenTool',
    profile_address: 'User',
    udyam_verification: 'Award',
    nominee_details: 'Users',
    ckyc_verification: 'ShieldCheck',
  };
  return iconMapping[blockTypeId] || 'CreditCard';
}
