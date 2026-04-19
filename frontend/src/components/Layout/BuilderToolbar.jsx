import React, { useState } from 'react';
import {
  ArrowLeft, Save, Play, Trash2, Link2,
  Loader, ToggleLeft, ToggleRight, ChevronDown
} from 'lucide-react';
import useWorkflowStore from '../../store/workflowStore';
import api from '../../services/api';

export default function BuilderToolbar({ onSave, onRun, saving }) {
  const { activeWorkflow, setView, deleteWorkflow, toggleWorkflowActive, addToast } = useWorkflowStore();
  const [webhookLoading, setWebhookLoading] = useState(false);

  if (!activeWorkflow) return null;

  async function handleDelete() {
    if (!confirm(`Delete "${activeWorkflow.name}"?\nThis cannot be undone.`)) return;
    await deleteWorkflow(activeWorkflow.id);
    addToast({ type: 'success', message: `"${activeWorkflow.name}" deleted` });
  }

  async function handleWebhook() {
    setWebhookLoading(true);
    try {
      const { fullUrl } = await api.createWebhook(activeWorkflow.id);
      await navigator.clipboard.writeText(fullUrl).catch(() => {});
      addToast({ type: 'success', message: 'Webhook URL copied to clipboard' });
    } catch (err) {
      addToast({ type: 'error', message: err.message });
    } finally { setWebhookLoading(false); }
  }

  return (
    <div className="h-12 border-b border-white/[0.06] flex items-center px-3 gap-1.5 shrink-0 bg-panel/60 backdrop-blur-sm">
      <button onClick={() => setView('list')} className="btn-sm btn-ghost gap-1.5 shrink-0">
        <ArrowLeft size={13} /> <span className="hidden sm:inline">Back</span>
      </button>

      <div className="h-4 w-px bg-white/[0.07]" />

      {/* Workflow name + status */}
      <div className="flex items-center gap-1.5 flex-1 min-w-0 px-1">
        <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${activeWorkflow.is_active ? 'bg-emerald-400 glow-pulse' : 'bg-slate-700'}`} />
        <span className="text-sm font-medium text-slate-200 truncate">{activeWorkflow.name}</span>
        <button onClick={() => toggleWorkflowActive(activeWorkflow.id, !activeWorkflow.is_active)} className="shrink-0">
          {activeWorkflow.is_active
            ? <ToggleRight size={16} className="text-emerald-400 hover:text-emerald-300 transition-colors" />
            : <ToggleLeft  size={16} className="text-slate-600 hover:text-slate-400 transition-colors" />}
        </button>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1">
        <button onClick={handleWebhook} disabled={webhookLoading} className="btn-xs btn-ghost hidden sm:flex">
          {webhookLoading ? <Loader size={11} className="spinner" /> : <Link2 size={11} />}
          <span className="hidden md:inline">Webhook</span>
        </button>

        <button onClick={handleDelete} className="btn-xs btn-danger hidden sm:flex">
          <Trash2 size={11} /> <span className="hidden md:inline">Delete</span>
        </button>

        <div className="h-3 w-px bg-white/[0.08] mx-0.5 hidden sm:block" />

        <button onClick={onSave} disabled={saving} className="btn-sm btn-secondary">
          {saving ? <Loader size={12} className="spinner" /> : <Save size={12} />}
          <span className="hidden sm:inline">{saving ? 'Saving…' : 'Save'}</span>
        </button>

        <button onClick={onRun} className="btn-sm btn-glow btn-primary">
          <Play size={12} fill="currentColor" /> <span className="hidden sm:inline">Run</span>
        </button>
      </div>
    </div>
  );
}
