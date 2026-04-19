import React, { useState, useEffect } from 'react';
import { X, Settings2, Info, Sparkles, Zap, Terminal } from 'lucide-react';

const SCHEMA = {
  'trigger-manual':   [],
  'trigger-webhook':  [{ key: 'description', label: 'Description', type: 'text', placeholder: 'What triggers this webhook?' }],
  'trigger-schedule': [
    { key: 'cron', label: 'Cron Expression', type: 'text', placeholder: '0 9 * * 1', required: true, help: 'Standard cron format: min hour day month weekday' },
    { key: 'timezone', label: 'Timezone', type: 'text', placeholder: 'UTC' },
  ],
  'trigger-gmail': [
    { key: 'watchEmail', label: 'Watch Email', type: 'text', placeholder: 'you@gmail.com' },
    { key: 'labelFilter', label: 'Label Filter', type: 'text', placeholder: 'INBOX' },
  ],
  'ai-summarize': [
    { key: 'maxLength', label: 'Max Length', type: 'text', placeholder: '3 sentences' },
    { key: 'style', label: 'Style', type: 'select', options: ['concise', 'detailed', 'bullet-points'] },
  ],
  'ai-transform': [
    { key: 'instruction', label: 'Instruction', type: 'textarea', placeholder: 'Rewrite in a professional tone…', required: true, help: 'Describe exactly how to transform the input text' },
  ],
  'ai-classify': [
    { key: 'categories', label: 'Categories', type: 'text', placeholder: 'urgent, high, medium, low', required: true, help: 'Comma-separated list of possible categories' },
  ],
  'ai-extract': [
    { key: 'fields', label: 'Fields to Extract', type: 'text', placeholder: 'name, email, phone, company', required: true, help: 'Comma-separated field names to extract' },
  ],
  'action-slack': [
    { key: 'webhookUrl', label: 'Webhook URL', type: 'text', placeholder: 'https://hooks.slack.com/services/…' },
    { key: 'channel', label: 'Channel', type: 'text', placeholder: '#general' },
    { key: 'messageTemplate', label: 'Message Template', type: 'textarea', placeholder: '📬 New item: {{summary}}', help: 'Use {{fieldName}} for dynamic values from previous steps' },
  ],
  'action-email': [
    { key: 'to', label: 'To', type: 'text', placeholder: 'recipient@example.com', required: true },
    { key: 'subject', label: 'Subject', type: 'text', placeholder: 'Workflow Notification' },
    { key: 'bodyTemplate', label: 'Body', type: 'textarea', placeholder: '{{result}}' },
  ],
  'action-savedb': [{ key: 'table', label: 'Table Name', type: 'text', placeholder: 'results' }],
  'action-http': [
    { key: 'url', label: 'URL', type: 'text', placeholder: 'https://api.example.com/endpoint', required: true },
    { key: 'method', label: 'Method', type: 'select', options: ['POST', 'GET', 'PUT', 'PATCH', 'DELETE'] },
  ],
  'action-log': [],
};

const PANEL_META = {
  trigger: {
    color: '#34d399', border: 'rgba(52,211,153,0.18)', bg: 'rgba(52,211,153,0.06)',
    headerBg: 'linear-gradient(135deg, rgba(52,211,153,0.10) 0%, rgba(16,185,129,0.04) 100%)',
    label: 'TRIGGER', Icon: Zap,
  },
  ai: {
    color: '#a78bfa', border: 'rgba(167,139,250,0.18)', bg: 'rgba(167,139,250,0.06)',
    headerBg: 'linear-gradient(135deg, rgba(167,139,250,0.10) 0%, rgba(124,58,237,0.04) 100%)',
    label: 'AI STEP', Icon: Sparkles,
  },
  action: {
    color: '#fbbf24', border: 'rgba(251,191,36,0.18)', bg: 'rgba(251,191,36,0.06)',
    headerBg: 'linear-gradient(135deg, rgba(251,191,36,0.10) 0%, rgba(217,119,6,0.04) 100%)',
    label: 'ACTION', Icon: Terminal,
  },
};

export default function NodeConfigPanel({ selectedNode, onUpdate, onClose }) {
  const [values, setValues] = useState({});
  const [label, setLabel] = useState('');

  useEffect(() => {
    if (selectedNode) {
      setValues(selectedNode.data.config || {});
      setLabel(selectedNode.data.label || '');
    }
  }, [selectedNode?.id]);

  if (!selectedNode) return null;

  const nodeType = selectedNode.data.nodeType || selectedNode.type;
  const schema = SCHEMA[nodeType] || [];
  const category = nodeType.split('-')[0];
  const meta = PANEL_META[category] || PANEL_META.action;
  const { Icon } = meta;

  function handleChange(key, value) {
    const updated = { ...values, [key]: value };
    setValues(updated);
    onUpdate(selectedNode.id, updated, label);
  }

  function handleLabel(val) {
    setLabel(val);
    onUpdate(selectedNode.id, values, val);
  }

  return (
    <aside
      className="w-64 border-l overflow-y-auto shrink-0 anim-slide-left flex flex-col"
      style={{ borderColor: meta.border, background: 'linear-gradient(180deg, #0d0f1a 0%, #090b14 100%)' }}
    >
      {/* Header */}
      <div
        className="sticky top-0 z-10 flex items-center justify-between px-4 py-3 border-b shrink-0"
        style={{ borderColor: meta.border, background: meta.headerBg }}
      >
        <div className="flex items-center gap-2">
          <div style={{ background: `${meta.color}20`, borderRadius: 7, width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon size={11} color={meta.color} strokeWidth={2.5} />
          </div>
          <div>
            <div className="text-[9px] font-bold tracking-widest" style={{ color: meta.color }}>{meta.label}</div>
            <div className="text-[11px] font-semibold text-slate-300 leading-none truncate max-w-[130px]">{label || 'Configure Node'}</div>
          </div>
        </div>
        <button
          onClick={onClose}
          className="w-6 h-6 rounded-lg flex items-center justify-center text-slate-600 hover:text-slate-300 hover:bg-white/[0.08] transition-all"
        >
          <X size={13} />
        </button>
      </div>

      <div className="p-4 space-y-4 flex-1 overflow-y-auto">
        {/* Label */}
        <div>
          <label className="label">Node Label</label>
          <input
            className="input text-sm"
            value={label}
            onChange={e => handleLabel(e.target.value)}
            placeholder="Describe this step…"
          />
        </div>

        {/* Divider */}
        {schema.length > 0 && (
          <div className="flex items-center gap-2">
            <div className="flex-1 h-px" style={{ background: meta.border }} />
            <span className="text-[9px] font-bold tracking-widest" style={{ color: `${meta.color}60` }}>SETTINGS</span>
            <div className="flex-1 h-px" style={{ background: meta.border }} />
          </div>
        )}

        {/* No config message */}
        {schema.length === 0 && (
          <div className="flex items-start gap-2.5 p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <Info size={13} className="text-slate-600 mt-0.5 shrink-0" />
            <p className="text-[11px] text-slate-600 leading-relaxed">This node requires no additional configuration.</p>
          </div>
        )}

        {/* Config fields */}
        {schema.map(field => (
          <div key={field.key}>
            <label className="label flex items-center gap-1">
              {field.label}
              {field.required && <span style={{ color: '#f87171' }}>*</span>}
            </label>

            {field.type === 'select' ? (
              <select
                className="input text-sm"
                value={values[field.key] || ''}
                onChange={e => handleChange(field.key, e.target.value)}
              >
                <option value="">— Select —</option>
                {field.options.map(opt => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            ) : field.type === 'textarea' ? (
              <textarea
                className="input text-sm resize-none"
                rows={3}
                placeholder={field.placeholder}
                value={values[field.key] || ''}
                onChange={e => handleChange(field.key, e.target.value)}
              />
            ) : (
              <input
                className="input text-sm"
                placeholder={field.placeholder}
                value={values[field.key] || ''}
                onChange={e => handleChange(field.key, e.target.value)}
              />
            )}

            {field.help && (
              <p className="text-[10px] mt-1.5 leading-relaxed" style={{ color: 'rgba(100,116,139,0.8)' }}>{field.help}</p>
            )}
          </div>
        ))}

        {/* Node type tag */}
        <div className="pt-1">
          <code
            className="text-[10px] font-mono px-2 py-1 rounded-lg inline-block"
            style={{ color: `${meta.color}60`, background: `${meta.color}0d`, border: `1px solid ${meta.border}` }}
          >
            {nodeType}
          </code>
        </div>
      </div>
    </aside>
  );
}
