import React, { useState } from 'react';
import {
  Zap, LayoutGrid, Activity, Plus, Settings,
  ChevronRight, Sparkles, Globe, BookOpen,
  Command, ExternalLink
} from 'lucide-react';
import useWorkflowStore from '../../store/workflowStore';

const NAV = [
  { id: 'list',    icon: LayoutGrid, label: 'Workflows',  shortcut: '1' },
  { id: 'logs',    icon: Activity,   label: 'Logs',       shortcut: '2' },
];

export default function Sidebar({ onCommandPalette }) {
  const { view, setView, workflows, createWorkflow, addToast } = useWorkflowStore();
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('');

  async function handleCreate(e) {
    e.preventDefault();
    if (!newName.trim()) return;
    try {
      await createWorkflow(newName.trim());
      setCreating(false);
      setNewName('');
    } catch (err) { addToast({ type: 'error', message: err.message }); }
  }

  const runningCount = 0; // could hook into execution store

  return (
    <aside className="sidebar-mesh w-56 flex flex-col border-r border-white/[0.06] shrink-0 relative overflow-hidden">
      {/* Logo */}
      <div className="px-5 py-5 flex items-center gap-3">
        <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 via-indigo-600 to-violet-700 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-900/50 shrink-0">
          <Zap size={15} className="text-white" strokeWidth={2.5} />
        </div>
        <div>
          <div className="text-[14px] font-bold tracking-tight text-white leading-none">
            Flow<span className="text-indigo-400">AI</span>
          </div>
          <div className="text-[9px] text-slate-600 tracking-widest uppercase mt-0.5">Workflow Engine</div>
        </div>
      </div>

      {/* Search / command */}
      <div className="px-3 mb-3">
        <button
          onClick={onCommandPalette}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.07] border border-white/[0.07] hover:border-white/[0.12] text-slate-500 hover:text-slate-400 transition-all duration-150 group"
        >
          <Command size={13} />
          <span className="text-xs flex-1 text-left">Quick search…</span>
          <kbd className="text-[10px] px-1.5 py-0.5 bg-white/[0.06] rounded-md font-mono text-slate-600 group-hover:text-slate-500">⌘K</kbd>
        </button>
      </div>

      {/* Nav */}
      <nav className="px-2 space-y-0.5">
        {NAV.map(({ id, icon: Icon, label, shortcut }) => {
          const active = view === id || (view === 'builder' && id === 'list');
          return (
            <button
              key={id}
              onClick={() => setView(id)}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-150 group ${
                active
                  ? 'bg-indigo-500/15 text-white shadow-glow-xs'
                  : 'text-slate-500 hover:text-slate-300 hover:bg-white/[0.05]'
              }`}
            >
              <Icon size={16} className={active ? 'text-indigo-400' : ''} />
              <span className="flex-1 text-left">{label}</span>
              <kbd className={`text-[10px] px-1.5 rounded font-mono opacity-0 group-hover:opacity-100 transition-opacity ${
                active ? 'bg-indigo-500/20 text-indigo-400' : 'bg-white/[0.06] text-slate-600'
              }`}>{shortcut}</kbd>
            </button>
          );
        })}
      </nav>

      {/* Recent workflows */}
      <div className="px-3 mt-5 mb-2">
        <div className="flex items-center justify-between mb-1.5 px-1">
          <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">Workflows</span>
          <button
            onClick={() => setCreating(true)}
            className="w-5 h-5 rounded-md flex items-center justify-center text-slate-600 hover:text-indigo-400 hover:bg-indigo-500/10 transition-all"
            title="New workflow"
          >
            <Plus size={12} />
          </button>
        </div>

        {creating && (
          <form onSubmit={handleCreate} className="mb-2 anim-fade-down">
            <input
              autoFocus
              className="input input-sm w-full text-[12px]"
              placeholder="Workflow name…"
              value={newName}
              onChange={e => setNewName(e.target.value)}
              onKeyDown={e => e.key === 'Escape' && setCreating(false)}
            />
          </form>
        )}

        <div className="space-y-0.5 max-h-48 overflow-y-auto">
          {workflows.slice(0, 8).map(wf => (
            <button
              key={wf.id}
              onClick={() => useWorkflowStore.getState().openWorkflow(wf.id)}
              className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-left transition-all group ${
                useWorkflowStore.getState().activeWorkflow?.id === wf.id && view === 'builder'
                  ? 'bg-white/[0.07] text-slate-200'
                  : 'text-slate-600 hover:text-slate-300 hover:bg-white/[0.04]'
              }`}
            >
              <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${wf.is_active ? 'bg-emerald-400' : 'bg-slate-700'}`} />
              <span className="text-[12px] truncate flex-1">{wf.name}</span>
              <ChevronRight size={11} className="opacity-0 group-hover:opacity-100 text-slate-600 shrink-0 transition-opacity" />
            </button>
          ))}
          {workflows.length === 0 && !creating && (
            <p className="text-[11px] text-slate-700 px-2 py-1">No workflows yet</p>
          )}
        </div>
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Footer */}
      <div className="px-3 pb-4 space-y-0.5">
        <div className="h-px bg-white/[0.05] mb-2 mx-1" />
        <div className="flex items-center gap-2.5 px-2 py-2 rounded-xl">
          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-indigo-400 to-violet-500 flex items-center justify-center shrink-0">
            <span className="text-[9px] font-bold text-white">U</span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[11px] font-medium text-slate-400 truncate">Your Workspace</div>
            <div className="text-[10px] text-slate-700">Free plan</div>
          </div>
        </div>
      </div>
    </aside>
  );
}
