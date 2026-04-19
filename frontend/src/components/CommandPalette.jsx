import React, { useState, useEffect, useRef } from 'react';
import {
  Search, Zap, Plus, Activity, LayoutGrid,
  Play, ArrowRight, Clock, Trash2, Sparkles
} from 'lucide-react';
import useWorkflowStore from '../store/workflowStore';

function Cmd({ item, active, onClick }) {
  const Icon = item.icon;
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-all duration-100 ${
        active ? 'bg-indigo-500/15' : 'hover:bg-white/[0.04]'
      }`}
    >
      <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
        active ? 'bg-indigo-500/20' : 'bg-white/[0.05]'
      }`}>
        <Icon size={15} className={active ? 'text-indigo-400' : 'text-slate-500'} />
      </div>
      <div className="flex-1 min-w-0">
        <div className={`text-sm font-medium truncate ${active ? 'text-white' : 'text-slate-300'}`}>
          {item.label}
        </div>
        {item.sub && (
          <div className="text-[11px] text-slate-600 truncate">{item.sub}</div>
        )}
      </div>
      {item.kbd && (
        <kbd className="text-[10px] px-1.5 py-0.5 bg-white/[0.06] rounded-md font-mono text-slate-600 shrink-0">{item.kbd}</kbd>
      )}
      <ArrowRight size={13} className={`shrink-0 transition-opacity ${active ? 'opacity-60 text-indigo-400' : 'opacity-0'}`} />
    </button>
  );
}

export default function CommandPalette({ onClose }) {
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const inputRef = useRef(null);
  const { workflows, setView, createWorkflow, openWorkflow, runWorkflow, addToast } = useWorkflowStore();

  useEffect(() => { inputRef.current?.focus(); }, []);

  const baseCommands = [
    { id: 'new',       icon: Plus,        label: 'New Workflow',          sub: 'Create a blank workflow',        action: async () => { const name = prompt('Workflow name:'); if (name) { await createWorkflow(name); } onClose(); } },
    { id: 'workflows', icon: LayoutGrid,  label: 'Go to Workflows',       sub: 'View all your workflows',        kbd: '1', action: () => { setView('list'); onClose(); } },
    { id: 'logs',      icon: Activity,    label: 'Go to Logs',            sub: 'View execution history',         kbd: '2', action: () => { setView('logs'); onClose(); } },
  ];

  const workflowCommands = workflows.slice(0, 5).flatMap(wf => [
    { id: `open-${wf.id}`,  icon: Zap,  label: `Open: ${wf.name}`,  sub: `${wf.nodes?.length || 0} nodes`,   action: () => { openWorkflow(wf.id); onClose(); } },
    { id: `run-${wf.id}`,   icon: Play, label: `Run: ${wf.name}`,   sub: 'Trigger manually with test data', action: async () => { onClose(); await runWorkflow(wf.id, { source: 'command-palette', timestamp: new Date().toISOString() }); addToast({ type: 'success', message: `Running ${wf.name}` }); setView('logs'); } },
  ]);

  const allCommands = [...baseCommands, ...workflowCommands];
  const filtered = query.trim()
    ? allCommands.filter(c => c.label.toLowerCase().includes(query.toLowerCase()) || c.sub?.toLowerCase().includes(query.toLowerCase()))
    : allCommands;

  useEffect(() => { setActive(0); }, [query]);

  function handleKey(e) {
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive(a => Math.min(a + 1, filtered.length - 1)); }
    if (e.key === 'ArrowUp')   { e.preventDefault(); setActive(a => Math.max(a - 1, 0)); }
    if (e.key === 'Enter' && filtered[active]) { filtered[active].action(); }
    if (e.key === 'Escape') onClose();
  }

  return (
    <div className="cmd-overlay" onClick={onClose}>
      <div className="cmd-box" onClick={e => e.stopPropagation()} onKeyDown={handleKey}>
        {/* Search input */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-white/[0.07]">
          <Search size={16} className="text-slate-500 shrink-0" />
          <input
            ref={inputRef}
            className="flex-1 bg-transparent text-sm text-slate-200 placeholder-slate-600 outline-none"
            placeholder="Search commands, workflows…"
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
          <kbd className="text-[10px] px-1.5 py-0.5 bg-white/[0.06] rounded font-mono text-slate-600">esc</kbd>
        </div>

        {/* Results */}
        <div className="max-h-80 overflow-y-auto">
          {filtered.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-slate-600">No results for "{query}"</div>
          ) : (
            <>
              {query === '' && (
                <div className="px-4 pt-3 pb-1">
                  <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">Quick Actions</span>
                </div>
              )}
              {filtered.map((item, i) => (
                <Cmd key={item.id} item={item} active={i === active} onClick={item.action} />
              ))}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2.5 border-t border-white/[0.06] flex items-center gap-4 text-[10px] text-slate-700">
          <span><kbd className="bg-white/[0.05] px-1 rounded">↑↓</kbd> navigate</span>
          <span><kbd className="bg-white/[0.05] px-1 rounded">↵</kbd> select</span>
          <span><kbd className="bg-white/[0.05] px-1 rounded">esc</kbd> close</span>
        </div>
      </div>
    </div>
  );
}
