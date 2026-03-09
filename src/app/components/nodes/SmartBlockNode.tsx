import { Handle, Position } from '@xyflow/react';
import { FlowNodeData } from '../../types/journey';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Plus, X, CreditCard, Fingerprint, Camera, Building, TrendingUp, Landmark, FileText, FileCheck, PenTool, User } from 'lucide-react';
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
};

export function SmartBlockNode({ data, selected }: SmartBlockNodeProps) {
  const [showDelete, setShowDelete] = useState(false);
  const Icon = data.blockTypeId ? iconMap[getIconForBlockType(data.blockTypeId)] : CreditCard;

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
      className={`relative bg-white rounded-lg shadow-md min-w-[280px] transition-all ${
        selected ? 'ring-2 ring-blue-500 scale-105' : ''
      }`}
      onMouseEnter={() => setShowDelete(true)}
      onMouseLeave={() => setShowDelete(false)}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="!bg-gray-400 !w-3 !h-3 !border-2 !border-white"
      />

      {showDelete && data.onDelete && (
        <Button
          variant="ghost"
          size="icon"
          className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-red-500 hover:bg-red-600 text-white"
          onClick={handleDeleteClick}
        >
          <X className="h-3 w-3" />
        </Button>
      )}

      <div
        className="border-l-4 border-blue-500 p-4 cursor-pointer"
        onClick={() => data.onConfigure?.(data.id)}
      >
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex items-center gap-2">
            <Icon className="h-5 w-5 text-blue-500" />
            <h3 className="font-semibold text-sm">{data.name}</h3>
          </div>
          <Badge variant="secondary" className="bg-blue-100 text-blue-700 text-xs">
            SMART
          </Badge>
        </div>
        <p className="text-xs text-gray-600 mb-3">
          {data.blockTypeId ? getShortDescription(data.blockTypeId) : data.description}
        </p>
        {data.provider && (
          <p className="text-xs text-gray-500 mb-3">Provider: {data.provider}</p>
        )}
        <div className="flex justify-center">
          <Badge
            variant={data.configured ? 'default' : 'secondary'}
            className={
              data.configured
                ? 'bg-green-100 text-green-700'
                : 'bg-amber-100 text-amber-700'
            }
          >
            {data.configured ? '✓ Configured' : 'Not Configured'}
          </Badge>
        </div>
      </div>

      <Handle
        type="source"
        position={Position.Bottom}
        className="!bg-gray-400 !w-3 !h-3 !border-2 !border-white"
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
  };
  return iconMapping[blockTypeId] || 'CreditCard';
}