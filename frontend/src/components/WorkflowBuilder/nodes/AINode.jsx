import React from 'react';
import { Handle, Position } from '@xyflow/react';
import { Sparkles, Tag, Database, Wand2 } from 'lucide-react';

const META = {
  'ai-summarize': { Icon: Sparkles, label: 'Summarize', glow: 'rgba(167,139,250,0.18)' },
  'ai-transform': { Icon: Wand2,    label: 'Transform', glow: 'rgba(167,139,250,0.18)' },
  'ai-classify':  { Icon: Tag,      label: 'Classify',  glow: 'rgba(167,139,250,0.18)' },
  'ai-extract':   { Icon: Database, label: 'Extract',   glow: 'rgba(167,139,250,0.18)' },
};

const C        = '#a78bfa';
const C_DIM    = 'rgba(167,139,250,0.15)';
const C_BORDER = 'rgba(167,139,250,0.22)';

export default function AINode({ data, selected }) {
  const meta = META[data.nodeType] || META['ai-summarize'];
  const { Icon } = meta;
  const config = data.config || {};

  const preview = config.instruction || config.categories || config.fields
    || (config.style ? `${config.style} · ${config.maxLength || '3 sentences'}` : null);

  return (
    <div
      className="rflow-node w-56"
      style={{
        background: 'linear-gradient(145deg, #13122a 0%, #100e20 100%)',
        border: `1.5px solid ${selected ? C : C_BORDER}`,
        borderRadius: 14,
        boxShadow: selected
          ? `0 0 0 3px rgba(167,139,250,0.15), 0 16px 48px rgba(0,0,0,0.7), 0 0 24px ${meta.glow}`
          : `0 4px 20px rgba(0,0,0,0.6), 0 0 12px rgba(167,139,250,0.05)`,
      }}
    >
      <Handle type="target" position={Position.Top}
        style={{ background: '#100e20', borderColor: C, top: -6, width: 12, height: 12 }} />

      {/* Gradient header */}
      <div
        style={{
          background: `linear-gradient(135deg, rgba(167,139,250,0.12) 0%, rgba(124,58,237,0.06) 100%)`,
          borderBottom: `1px solid rgba(167,139,250,0.12)`,
          borderRadius: '13px 13px 0 0',
          padding: '10px 12px',
        }}
        className="flex items-center gap-2.5"
      >
        {/* Icon bubble */}
        <div style={{ background: 'rgba(167,139,250,0.18)', borderRadius: 8, width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Icon size={13} color={C} strokeWidth={2.5} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.12em', color: C, textTransform: 'uppercase', marginBottom: 2 }}>
            AI STEP
          </div>
          <div style={{ fontSize: 12, fontWeight: 600, color: '#f1f5f9', lineHeight: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {data.label}
          </div>
        </div>
        {/* AI badge */}
        <div style={{ fontSize: 8, fontWeight: 800, letterSpacing: '0.1em', padding: '2px 6px', borderRadius: 6, background: 'rgba(167,139,250,0.18)', color: C, flexShrink: 0 }}>
          AI
        </div>
      </div>

      {/* Body */}
      <div style={{ padding: '8px 12px 10px', minHeight: 36 }}>
        {preview ? (
          <span style={{ fontSize: 11, fontFamily: 'JetBrains Mono, monospace', color: 'rgba(167,139,250,0.65)', display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {preview}
          </span>
        ) : (
          <span style={{ fontSize: 11, color: '#334155', fontStyle: 'italic' }}>Click to configure →</span>
        )}
      </div>

      <Handle type="source" position={Position.Bottom}
        style={{ background: '#100e20', borderColor: C, bottom: -6, width: 12, height: 12 }} />
    </div>
  );
}
