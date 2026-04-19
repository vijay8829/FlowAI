import React, { useState } from 'react';
import {
  Zap, LayoutGrid, Activity, ArrowLeft,
  Save, Play, Trash2, Link2, ChevronDown,
  CheckCircle, AlertCircle, Loader
} from 'lucide-react';
import useWorkflowStore from '../../store/workflowStore';
import api from '../../services/api';

export default function Header({ onSave, onRun, saving }) {
  const { view, setView, activeWorkflow, deleteWorkflow, addToast } = useWorkflowStore();
  const [webhookLoading, setWebhookLoading] = useState(false);

  async function handleDelete() {
    if (!activeWorkflow) return;
    if (!confirm(`Delete "${activeWorkflow.name}"?\n\nThis cannot be undone.`)) return;
    await deleteWorkflow(activeWorkflow.id);
    addToast({ type: 'success', message: `"${activeWorkflow.name}" deleted` });
  }

  async function handleWebhook() {
    if (!activeWorkflow) return;
    setWebhookLoading(true);
    try {
      const { fullUrl, token } = await api.createWebhook(activeWorkflow.id);
      await navigator.clipboard.writeText(fullUrl).catch(() => {});
      addToast({ type: 'success', message: `Webhook URL copied to clipboard` });
    } catch (err) {
      addToast({ type: 'error', message: err.message });
    } finally {
      setWebhookLoading(false);
    }
  }

  return (
    <header className="h-13 border-b border-white/[0.06] flex items-center px-4 gap-3 shrink-0 z-50 bg-panel/80 backdrop-blur-sm"
            style={{ height: 52 }}>
      {/* Logo */}
      <div className="flex items-center gap-2.5 mr-2">
        <div className="w-7 h-7 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-900/40">
          <Zap size={13} className="text-white" strokeWidth={2.5} />
        </div>
        <div className="flex flex-col leading-none">
          <span className="text-[13px] font-semibold tracking-tight text-white">Flow<span className="text-indigo-400">AI</span></span>
          <span className="text-[9px] text-slate-600 tracking-widest uppercase">Workflow Engine</span>
        </div>
      </div>

      <div className="w-px h-5 bg-white/[0.06] mx-1" />

      {/* Nav */}
      <nav className="flex items-center gap-0.5">
        {[
          { id: 'list',  label: 'Workflows', icon: LayoutGrid },
          { id: 'logs',  label: 'Logs',      icon: Activity },
        ].map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setView(id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
              view === id
                ? 'bg-white/[0.08] text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-300 hover:bg-white/[0.04]'
            }`}
          >
            <Icon size={13} />
            {label}
          </button>
        ))}
      </nav>

      <div className="flex-1" />

      {/* Builder toolbar */}
      {view === 'builder' && activeWorkflow && (
        <div className="flex items-center gap-2 anim-fade-in">
          <button onClick={() => setView('list')} className="btn btn-ghost btn-xs gap-1.5">
            <ArrowLeft size={12} /> Workflows
          </button>

          <div className="w-px h-4 bg-white/[0.06]" />

          <div className="max-w-[180px] truncate">
            <span className="text-xs font-medium text-slate-300">{activeWorkflow.name}</span>
          </div>

          <div className="w-px h-4 bg-white/[0.06]" />

          <button
            onClick={handleWebhook}
            disabled={webhookLoading}
            className="btn btn-ghost btn-xs gap-1.5 tooltip"
            data-tip="Copy webhook URL"
          >
            {webhookLoading ? <Loader size={12} className="spinner" /> : <Link2 size={12} />}
            Webhook
          </button>

          <button onClick={handleDelete} className="btn btn-danger btn-xs">
            <Trash2 size={12} /> Delete
          </button>

          <button onClick={onSave} disabled={saving} className="btn btn-secondary btn-xs">
            {saving ? <Loader size={12} className="spinner" /> : <Save size={12} />}
            {saving ? 'Saving…' : 'Save'}
          </button>

          <button onClick={onRun} className="btn btn-primary btn-xs">
            <Play size={12} fill="currentColor" /> Run
          </button>
        </div>
      )}
    </header>
  );
}
