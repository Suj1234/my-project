import { NodeProps } from '@xyflow/react';

const BAND_COLORS: Record<string, { bg: string; border: string; label: string; numBg: string }> = {
  blue:   { bg: '#eff6ff', border: '#bfdbfe', label: '#1d4ed8', numBg: '#2563eb' },
  green:  { bg: '#f0fdf4', border: '#bbf7d0', label: '#15803d', numBg: '#16a34a' },
  purple: { bg: '#faf5ff', border: '#e9d5ff', label: '#7e22ce', numBg: '#9333ea' },
  orange: { bg: '#fff7ed', border: '#fed7aa', label: '#c2410c', numBg: '#f97316' },
  teal:   { bg: '#f0fdfa', border: '#99f6e4', label: '#0f766e', numBg: '#0d9488' },
};

interface LaneBandData {
  stepName: string;
  stepNumber: number;
  color: string;
  bandWidth: number;
  bandHeight: number;
}

export function LaneBandNode({ data }: NodeProps) {
  const d = data as unknown as LaneBandData;
  const c = BAND_COLORS[d.color] ?? BAND_COLORS['blue'];

  return (
    <div
      style={{
        width: d.bandWidth,
        height: d.bandHeight,
        background: c.bg,
        border: `1.5px solid ${c.border}`,
        borderRadius: 12,
        pointerEvents: 'none',
        userSelect: 'none',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px' }}>
        <div
          style={{
            width: 22,
            height: 22,
            borderRadius: '50%',
            background: c.numBg,
            color: '#fff',
            fontSize: 11,
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          {d.stepNumber}
        </div>
        <span style={{ fontSize: 12, fontWeight: 600, color: c.label, letterSpacing: 0.1 }}>
          {d.stepName}
        </span>
        <span
          style={{
            marginLeft: 'auto',
            fontSize: 9,
            fontWeight: 700,
            letterSpacing: 1.5,
            color: c.label,
            opacity: 0.5,
          }}
        >
          STEP
        </span>
      </div>
    </div>
  );
}
