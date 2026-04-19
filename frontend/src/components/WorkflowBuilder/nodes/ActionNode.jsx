import React from 'react';
import { Handle, Position } from '@xyflow/react';
import { MessageSquare, Send, Save, Globe, Terminal } from 'lucide-react';

const META = {
  'action-slack':  { Icon: MessageSquare, label: 'Slack',   glow: 'rgba(251,191,36,0.18)' },
  'action-email':  { Icon: Send,          label: 'Email',   glow: 'rgba(251,191,36,0.18)' },
  'action-savedb': { Icon: Save,          label: 'Save DB', glow: 'rgba(251,191,36,0.18)' },
  'action-http':   { Icon: Globe,         label: 'HTTP',    glow: 'rgba(251,191,36,0.18)' },
  'action-log':    { Icon: Terminal,      label: 'Log',     glow: 'rgba(251,191,36,0.18)' },
};

const C        = '#fbbf24';
const C_DIM    = 'rgba(251,191,36,0.15)';
const C_BORDER = 'rgba(251,191,36,0.22)';

export default function ActionNode({ data, selected }) {
  const meta = META[data.nodeType] || META['action-log'];
  const { Icon } = meta;
  const config = data.config || {};

  const preview = config.url || config.to || config.channel
    || (config.table ? `Table: ${config.table}` : null)
    || null;

  return (
    <div
      className="rflow-node w-56"
      style={{
        background: 'linear-gradient(145deg, #191408 0%, #140f04 100%)',
        border: `1.5px solid ${selected ? C : C_BORDER}`,
        borderRadius: 14,
        boxShadow: selected
          ? `0 0 0 3px rgba(251,191,36,0.15), 0 16px 48px rgba(0,0,0,0.7), 0 0 24px ${meta.glow}`
          : `0 4px 20px rgba(0,0,0,0.6), 0 0 12px rgba(251,191,36,0.05)`,
      }}
    >
      <Handle type="target" position={Position.Top}
        style={{ background: '#140f04', borderColor: C, top: -6, width: 12, height: 12 }} />

      {/* Gradient header */}
      <div
        style={{
          background: `linear-gradient(135deg, rgba(251,191,36,0.12) 0%, rgba(217,119,6,0.06) 100%)`,
          borderBottom: `1px solid rgba(251,191,36,0.12)`,
          borderRadius: '13px 13px 0 0',
          padding: '10px 12px',
        }}
        className="flex items-center gap-2.5"
      >
        {/* Icon bubble */}
        <div style={{ background: 'rgba(251,191,36,0.18)', borderRadius: 8, width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Icon size={13} color={C} strokeWidth={2.5} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.12em', color: C, textTransform: 'uppercase', marginBottom: 2 }}>
            ACTION
          </div>
          <div style={{ fontSize: 12, fontWeight: 600, color: '#f1f5f9', lineHeight: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {data.label}
          </div>
        </div>
      </div>

      {/* Body */}
      <div style={{ padding: '8px 12px 10px', minHeight: 36 }}>
        {preview ? (
          <span style={{ fontSize: 11, fontFamily: 'JetBrains Mono, monospace', color: 'rgba(251,191,36,0.65)', display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {preview}
          </span>
        ) : (
          <span style={{ fontSize: 11, color: '#334155', fontStyle: 'italic' }}>Click to configure →</span>
        )}
      </div>

      <Handle type="source" position={Position.Bottom}
        style={{ background: '#140f04', borderColor: C, bottom: -6, width: 12, height: 12 }} />
    </div>
  );
}
