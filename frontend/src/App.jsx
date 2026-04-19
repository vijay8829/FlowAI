import React, { useRef, useState, useEffect } from 'react';
import { CheckCircle, XCircle, Info, X, AlertTriangle } from 'lucide-react';
import Sidebar from './components/Layout/Sidebar';
import BuilderToolbar from './components/Layout/BuilderToolbar';
import WorkflowList from './components/WorkflowList/WorkflowList';
import Canvas from './components/WorkflowBuilder/Canvas';
import ExecutionLogs from './components/ExecutionLogs/ExecutionLogs';
import CommandPalette from './components/CommandPalette';
import useWorkflowStore from './store/workflowStore';

/* ── Toast ─────────────────────────────────────────────────── */
const TOAST_META = {
  success: { icon: CheckCircle, cls: 'border-emerald-500/25 bg-emerald-500/[0.07]', text: 'text-emerald-400' },
  error:   { icon: XCircle,    cls: 'border-red-500/25 bg-red-500/[0.07]',         text: 'text-red-400'     },
  warning: { icon: AlertTriangle, cls: 'border-amber-500/25 bg-amber-500/[0.07]',  text: 'text-amber-400'   },
  info:    { icon: Info,        cls: 'border-blue-500/25 bg-blue-500/[0.07]',       text: 'text-blue-400'    },
};

function Toast({ toast, onRemove }) {
  const { icon: Icon, cls, text } = TOAST_META[toast.type] || TOAST_META.info;
  const [leaving, setLeaving] = useState(false);

  function dismiss() {
    setLeaving(true);
    setTimeout(() => onRemove(toast.id), 200);
  }

  useEffect(() => {
    const t = setTimeout(dismiss, 4000);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className={`flex items-start gap-3 px-4 py-3 rounded-xl border shadow-card max-w-sm backdrop-blur-sm ${cls} ${leaving ? 'opacity-0 translate-x-2 transition-all duration-200' : 'anim-fade-up'}`}>
      <Icon size={14} className={`${text} mt-0.5 shrink-0`} />
      <p className="text-xs text-slate-200 flex-1 leading-relaxed">{toast.message}</p>
      <button onClick={dismiss} className={`${text} opacity-60 hover:opacity-100 transition-opacity mt-0.5`}>
        <X size={12} />
      </button>
    </div>
  );
}

/* ── App ──────────────────────────────────────────────────── */
export default function App() {
  const { view, toasts, removeToast, fetchWorkflows, fetchNodeTypes } = useWorkflowStore();
  const [saving, setSaving] = useState(false);
  const [cmdOpen, setCmdOpen] = useState(false);
  const saveRef = useRef(null);
  const runRef  = useRef(null);

  // Bootstrap
  useEffect(() => {
    fetchWorkflows();
    fetchNodeTypes();
  }, []);

  // Global keyboard shortcuts
  useEffect(() => {
    function onKey(e) {
      const isMac = navigator.platform.toUpperCase().includes('MAC');
      const meta = isMac ? e.metaKey : e.ctrlKey;
      if (meta && e.key === 'k') { e.preventDefault(); setCmdOpen(o => !o); }
      if (e.key === 'Escape' && cmdOpen) setCmdOpen(false);
      if (meta && e.key === 's') { e.preventDefault(); handleSave(); }
      // Quick nav shortcuts (only when not in an input)
      if (!e.target.closest('input, textarea, select')) {
        if (e.key === '1') useWorkflowStore.getState().setView('list');
        if (e.key === '2') useWorkflowStore.getState().setView('logs');
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [cmdOpen]);

  async function handleSave() {
    if (!saveRef.current) return;
    setSaving(true);
    try { await saveRef.current(); }
    finally { setSaving(false); }
  }

  async function handleRun() {
    if (runRef.current) await runRef.current();
  }

  return (
    <div className="flex h-screen bg-bg overflow-hidden">
      {/* Sidebar */}
      <Sidebar onCommandPalette={() => setCmdOpen(true)} />

      {/* Main content */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Builder toolbar — only in builder view */}
        {view === 'builder' && (
          <BuilderToolbar onSave={handleSave} onRun={handleRun} saving={saving} />
        )}

        {/* View area — add bottom padding on mobile for bottom nav */}
        <main className="flex flex-1 overflow-hidden pb-[56px] md:pb-0">
          {view === 'list' && (
            <div key="list" className="flex flex-1 overflow-hidden anim-fade-in">
              <WorkflowList />
            </div>
          )}
          {view === 'builder' && (
            <div key="builder" className="flex flex-1 overflow-hidden anim-fade-in">
              <Canvas onSaveRef={saveRef} onRunRef={runRef} />
            </div>
          )}
          {view === 'logs' && (
            <div key="logs" className="flex flex-1 overflow-hidden anim-fade-in">
              <ExecutionLogs />
            </div>
          )}
        </main>
      </div>

      {/* Command Palette overlay */}
      {cmdOpen && <CommandPalette onClose={() => setCmdOpen(false)} />}

      {/* Toast stack */}
      <div className="fixed bottom-5 right-5 z-[9999] flex flex-col gap-2 pointer-events-none items-end">
        {toasts.map(t => (
          <div key={t.id} className="pointer-events-auto">
            <Toast toast={t} onRemove={removeToast} />
          </div>
        ))}
      </div>
    </div>
  );
}
