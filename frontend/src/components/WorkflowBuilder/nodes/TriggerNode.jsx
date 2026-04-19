import React from 'react';
import { Handle, Position } from '@xyflow/react';
import { Play, Clock, Webhook, Mail, Zap } from 'lucide-react';

const META = {
  'trigger-manual':   { Icon: Play,    label: 'Manual',    glow: 'rgba(52,211,153,0.18)' },
  'trigger-webhook':  { Icon: Webhook, label: 'Webhook',   glow: 'rgba(52,211,153,0.18)' },
  'trigger-schedule': { Icon: Clock,   label: 'Schedule',  glow: 'rgba(52,211,153,0.18)' },
  'trigger-gmail':    { Icon: Mail,    label: 'Email',     glow: 'rgba(52,211,153,0.18)' },
};

const C = '#34d399';
const C_DIM = 'rgba(52,211,153,0.15)';
const C_BORDER = 'rgba(52,211,153,0.22)';

export default function TriggerNode({ data, selected }) {
  const meta = META[data.nodeType] || META['trigger-manual'];
  const { Icon } = meta;
  const config = data.config || {};
  const preview = config.cron || config.watchEmail || config.description || null;

  return (
    <div
      className="rflow-node w-56"
      style={{
        background: 'linear-gradient(145deg, #131625 0%, #0f1121 100%)',
        border: `1.5px solid ${selected ? C : C_BORDER}`,
        borderRadius: 14,
        boxShadow: selected
          ? `0 0 0 3px rgba(52,211,153,0.15), 0 16px 48px rgba(0,0,0,0.7), 0 0 24px ${meta.glow}`
          : `0 4px 20px rgba(0,0,0,0.6), 0 0 12px rgba(52,211,153,0.05)`,
      }}
    >
      {/* Gradient header */}
      <div
        style={{
          background: `linear-gradient(135deg, rgba(52,211,153,0.12) 0%, rgba(16,185,129,0.06) 100%)`,
          borderBottom: `1px solid rgba(52,211,153,0.12)`,
          borderRadius: '13px 13px 0 0',
          padding: '10px 12px',
        }}
        className="flex items-center gap-2.5"
      >
        {/* Icon bubble */}
        <div style={{ background: 'rgba(52,211,153,0.18)', borderRadius: 8, width: 28, height: 28, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
          <Icon size={13} color={C} strokeWidth={2.5} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.12em', color: C, textTransform:'uppercase', marginBottom: 2 }}>
            TRIGGER
          </div>
          <div style={{ fontSize: 12, fontWeight: 600, color: '#f1f5f9', lineHeight: 1, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>
            {data.label}
          </div>
        </div>
        {/* Live dot */}
        <div style={{ width: 7, height: 7, borderRadius:'50%', background: C, flexShrink: 0, boxShadow:`0 0 6px ${C}` }} className="pulse-dot" />
      </div>

      {/* Body */}
      <div style={{ padding: '8px 12px 10px', minHeight: 36 }}>
        {preview ? (
          <span style={{ fontSize: 11, fontFamily:'JetBrains Mono, monospace', color: 'rgba(52,211,153,0.65)', display:'block', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>
            {preview}
          </span>
        ) : (
          <span style={{ fontSize: 11, color: '#334155', fontStyle:'italic' }}>Click to configure →</span>
        )}
      </div>

      <Handle type="source" position={Position.Bottom}
        style={{ background:'#0f1121', borderColor: C, bottom:-6, width:12, height:12 }} />
    </div>
  );
}
