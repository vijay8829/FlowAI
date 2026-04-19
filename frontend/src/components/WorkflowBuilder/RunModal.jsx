import React, { useState } from 'react';
import { X, Play, AlertCircle, Loader } from 'lucide-react';

const SAMPLE_DATA = {
  email: '{\n  "subject": "Q4 Revenue Report",\n  "body": "Our Q4 revenue was $2.3M, up 30% YoY. Enterprise segment grew 45%. Customer retention improved to 94%.",\n  "from": "cfo@example.com"\n}',
  ticket: '{\n  "ticket": "The app keeps crashing when exporting reports. This is blocking our entire team.",\n  "user": "alice@corp.com",\n  "category": "bug"\n}',
  text: '{\n  "text": "Hello, I am interested in your enterprise plan. Can you send pricing details? My name is John Smith from Acme Corp.",\n  "source": "contact-form"\n}',
  empty: '{}',
};

export default function RunModal({ workflow, onRun, onClose }) {
  const [json, setJson] = useState(SAMPLE_DATA.email);
  const [error, setError] = useState('');
  const [running, setRunning] = useState(false);

  function validate(val) {
    try { JSON.parse(val); setError(''); return true; }
    catch (e) { setError('Invalid JSON: ' + e.message.split('\n')[0]); return false; }
  }

  async function handleRun() {
    if (!validate(json)) return;
    setRunning(true);
    try { await onRun(JSON.parse(json)); }
    finally { setRunning(false); }
  }

  function handleKeyDown(e) {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') handleRun();
    if (e.key === 'Escape') onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onKeyDown={handleKeyDown}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full max-w-lg bg-panel border border-white/[0.08] rounded-2xl shadow-card anim-fade-up">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.07]">
          <div>
            <h2 className="text-sm font-semibold text-white">Run Workflow</h2>
            <p className="text-[11px] text-slate-600 mt-0.5">{workflow?.name}</p>
          </div>
          <button onClick={onClose} className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-600 hover:text-white hover:bg-white/[0.06] transition-all">
            <X size={15} />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Sample presets */}
          <div>
            <label className="label mb-2">Trigger data (JSON)</label>
            <div className="flex gap-1.5 mb-2 flex-wrap">
              {Object.entries({ Email: 'email', Ticket: 'ticket', Text: 'text', Empty: 'empty' }).map(([label, key]) => (
                <button
                  key={key}
                  onClick={() => { setJson(SAMPLE_DATA[key]); setError(''); }}
                  className="text-[10px] px-2 py-0.5 rounded-md bg-white/[0.04] hover:bg-white/[0.08] text-slate-500 hover:text-slate-300 border border-white/[0.07] transition-all"
                >
                  {label}
                </button>
              ))}
            </div>
            <textarea
              className={`input font-mono text-[12px] resize-none leading-relaxed ${error ? 'border-red-500/50 focus:border-red-500/60' : ''}`}
              rows={9}
              value={json}
              onChange={e => { setJson(e.target.value); if (error) validate(e.target.value); }}
              spellCheck={false}
            />
            {error && (
              <div className="flex items-start gap-1.5 mt-1.5">
                <AlertCircle size={12} className="text-red-400 mt-0.5 shrink-0" />
                <p className="text-[11px] text-red-400">{error}</p>
              </div>
            )}
          </div>

          {/* Info */}
          <div className="p-3 rounded-lg bg-white/[0.03] border border-white/[0.05] text-[11px] text-slate-600">
            This data will be available in your workflow as <code className="text-indigo-400 bg-indigo-500/10 px-1 rounded">trigger</code> and <code className="text-indigo-400 bg-indigo-500/10 px-1 rounded">lastOutput</code>. Results appear in the Logs tab.
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 pt-1">
            <button onClick={handleRun} disabled={running || !!error} className="btn btn-primary flex-1">
              {running ? <Loader size={14} className="spinner" /> : <Play size={14} fill="currentColor" />}
              {running ? 'Starting…' : 'Run Workflow'}
            </button>
            <button onClick={onClose} className="btn btn-secondary">Cancel</button>
          </div>
          <p className="text-[10px] text-slate-700 text-center">
            ⌘ + Enter to run · Esc to close
          </p>
        </div>
      </div>
    </div>
  );
}
