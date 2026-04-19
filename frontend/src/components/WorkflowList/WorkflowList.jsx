import React, { useEffect, useState, useCallback } from 'react';
import {
  Plus, Zap, Play, CheckCircle, XCircle, Clock,
  ToggleLeft, ToggleRight, ChevronRight, Search,
  Loader, Sparkles, Webhook, Mail, MoreHorizontal,
  Trash2, TrendingUp, Activity, Database, AlertCircle,
  ArrowUpRight, Grid3X3
} from 'lucide-react';
import useWorkflowStore from '../../store/workflowStore';
import api from '../../services/api';

/* ── Helpers ─────────────────────────────────────────────── */
const TRIGGER_META = {
  'trigger-manual':   { label: 'Manual',    cls: 'badge-muted',   dot: '#64748b' },
  'trigger-webhook':  { label: 'Webhook',   cls: 'badge-blue',    dot: '#60a5fa' },
  'trigger-schedule': { label: 'Scheduled', cls: 'badge-purple',  dot: '#a78bfa' },
  'trigger-gmail':    { label: 'Email',     cls: 'badge-amber',   dot: '#fbbf24' },
};

function timeAgo(iso) {
  if (!iso) return '';
  const d = Date.now() - new Date(iso).getTime();
  if (d < 5000)  return 'just now';
  if (d < 60000) return `${Math.floor(d/1000)}s ago`;
  if (d < 3600000) return `${Math.floor(d/60000)}m ago`;
  if (d < 86400000) return `${Math.floor(d/3600000)}h ago`;
  return `${Math.floor(d/86400000)}d ago`;
}

/* ── Stats banner ────────────────────────────────────────── */
function StatsBanner({ workflows, stats }) {
  const totalRuns    = Object.values(stats).reduce((a, s) => a + (s.total || 0), 0);
  const totalSuccess = Object.values(stats).reduce((a, s) => a + (s.success || 0), 0);
  const activeWfs    = workflows.filter(w => w.is_active).length;
  const rate         = totalRuns > 0 ? Math.round((totalSuccess / totalRuns) * 100) : null;

  const cards = [
    { label: 'Total Workflows', value: workflows.length,  icon: Grid3X3,    color: 'text-indigo-400',  bg: 'bg-indigo-500/10'  },
    { label: 'Active',          value: activeWfs,          icon: Zap,         color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
    { label: 'Total Runs',      value: totalRuns,          icon: Activity,    color: 'text-blue-400',    bg: 'bg-blue-500/10'    },
    { label: 'Success Rate',    value: rate !== null ? `${rate}%` : '—', icon: TrendingUp, color: rate >= 90 ? 'text-emerald-400' : rate >= 70 ? 'text-amber-400' : 'text-red-400', bg: rate >= 90 ? 'bg-emerald-500/10' : rate >= 70 ? 'bg-amber-500/10' : 'bg-red-500/10' },
  ];

  return (
    <div className="grid grid-cols-4 gap-3 mb-6 stagger">
      {cards.map(({ label, value, icon: Icon, color, bg }) => (
        <div key={label} className="stat-card anim-fade-up">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-600 uppercase tracking-wider">{label}</span>
            <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${bg}`}>
              <Icon size={13} className={color} />
            </div>
          </div>
          <div className={`text-2xl font-bold tracking-tight ${color}`}>{value}</div>
        </div>
      ))}
    </div>
  );
}

/* ── Workflow card ───────────────────────────────────────── */
function WorkflowCard({ workflow, stat, onOpen, onRun, onDelete, onToggle, running }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const nodes = workflow.nodes || [];
  const trigger = nodes.find(n => n.type?.startsWith('trigger'));
  const aiCount = nodes.filter(n => n.type?.startsWith('ai')).length;
  const tm = TRIGGER_META[trigger?.type] || TRIGGER_META['trigger-manual'];
  const rate = stat?.total > 0 ? Math.round((stat.success / stat.total) * 100) : null;

  return (
    <div
      className="card-hover group relative overflow-hidden cursor-pointer anim-fade-up"
      onClick={() => onOpen(workflow.id)}
    >
      {/* Gradient shimmer on hover */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
           style={{ background: 'radial-gradient(ellipse 80% 80% at 50% -20%, rgba(99,102,241,0.06) 0%, transparent 70%)' }} />

      {/* Top status bar */}
      <div className={`h-[2px] w-full ${workflow.is_active ? 'bg-gradient-to-r from-indigo-500 via-violet-500 to-purple-600 gradient-x' : 'bg-white/[0.06]'}`} />

      <div className="p-5">
        {/* Header row */}
        <div className="flex items-start gap-3 mb-4">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-all duration-300 ${
            workflow.is_active ? 'bg-indigo-500/15 group-hover:bg-indigo-500/22' : 'bg-white/[0.04]'
          }`}>
            <Zap size={18} className={workflow.is_active ? 'text-indigo-400' : 'text-slate-600'} strokeWidth={2} />
          </div>

          <div className="flex-1 min-w-0 pt-0.5">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-sm font-semibold text-slate-100 group-hover:text-white transition-colors truncate">
                {workflow.name}
              </h3>
            </div>
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className={tm.cls}>{tm.label}</span>
              {aiCount > 0 && (
                <span className="badge-purple gap-1">
                  <Sparkles size={9} /> {aiCount} AI
                </span>
              )}
              {!workflow.is_active && (
                <span className="badge-muted">Inactive</span>
              )}
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all duration-200">
            <button
              onClick={e => { e.stopPropagation(); onRun(e, workflow.id); }}
              disabled={running}
              className="btn-ico btn-ghost hover:bg-indigo-500/15 hover:text-indigo-400"
              title="Run now"
            >
              {running ? <Loader size={13} className="spinner" /> : <Play size={13} fill="currentColor" />}
            </button>
            <button
              onClick={e => { e.stopPropagation(); onToggle(workflow.id, !workflow.is_active); }}
              className="btn-ico btn-ghost"
              title={workflow.is_active ? 'Deactivate' : 'Activate'}
            >
              {workflow.is_active
                ? <ToggleRight size={16} className="text-emerald-400" />
                : <ToggleLeft  size={16} className="text-slate-600" />}
            </button>
            <div className="relative">
              <button
                onClick={e => { e.stopPropagation(); setMenuOpen(m => !m); }}
                className="btn-ico btn-ghost"
              ><MoreHorizontal size={14} /></button>
              {menuOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={e => { e.stopPropagation(); setMenuOpen(false); }} />
                  <div className="absolute right-0 top-9 z-50 w-40 bg-panel border border-white/[0.09] rounded-xl shadow-card py-1 anim-scale-in" onClick={e => e.stopPropagation()}>
                    <button
                      onClick={() => { onDelete(workflow.id); setMenuOpen(false); }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-red-400 hover:bg-red-500/10 transition-colors"
                    >
                      <Trash2 size={12} /> Delete workflow
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Description */}
        {workflow.description && (
          <p className="text-xs text-slate-600 mb-4 line-clamp-1">{workflow.description}</p>
        )}

        {/* Stats row */}
        <div className="flex items-center gap-0 border border-white/[0.06] rounded-xl overflow-hidden bg-white/[0.02]">
          <div className="flex-1 px-3 py-2 border-r border-white/[0.06]">
            <div className="text-[10px] text-slate-700 mb-0.5">Nodes</div>
            <div className="text-sm font-semibold text-slate-400">{nodes.length}</div>
          </div>
          <div className="flex-1 px-3 py-2 border-r border-white/[0.06]">
            <div className="text-[10px] text-slate-700 mb-0.5">Runs</div>
            <div className="text-sm font-semibold text-slate-400">{stat?.total || 0}</div>
          </div>
          <div className="flex-1 px-3 py-2 border-r border-white/[0.06]">
            <div className="text-[10px] text-slate-700 mb-0.5">Success</div>
            <div className={`text-sm font-semibold ${rate === null ? 'text-slate-600' : rate === 100 ? 'text-emerald-400' : rate >= 70 ? 'text-amber-400' : 'text-red-400'}`}>
              {rate !== null ? `${rate}%` : '—'}
            </div>
          </div>
          <div className="flex-1 px-3 py-2">
            <div className="text-[10px] text-slate-700 mb-0.5">Last run</div>
            <div className="text-[11px] font-medium text-slate-600 truncate">{stat?.last ? timeAgo(stat.last.started_at) : '—'}</div>
          </div>
        </div>
      </div>

      {/* Arrow */}
      <div className="absolute right-4 bottom-4 opacity-0 group-hover:opacity-100 transition-all duration-200 group-hover:translate-x-0.5 translate-x-0">
        <ArrowUpRight size={14} className="text-indigo-400" />
      </div>
    </div>
  );
}

/* ── Templates ───────────────────────────────────────────── */
const TEMPLATES = [
  { name: 'Email Summarizer',   desc: 'Summarize emails with Claude AI', icon: '✉️',  color: 'from-blue-500/10 to-indigo-500/10',   border: 'border-blue-500/20'   },
  { name: 'Support Classifier', desc: 'Auto-triage support tickets',     icon: '🎫',  color: 'from-violet-500/10 to-purple-500/10', border: 'border-violet-500/20' },
  { name: 'Content Rewriter',   desc: 'Rewrite for any audience',        icon: '✍️',  color: 'from-emerald-500/10 to-teal-500/10',  border: 'border-emerald-500/20'},
  { name: 'Data Extractor',     desc: 'Pull fields from documents',      icon: '📊',  color: 'from-amber-500/10 to-orange-500/10',  border: 'border-amber-500/20'  },
];

function Skeleton() {
  return (
    <div className="card p-5 space-y-4">
      <div className="flex gap-3">
        <div className="skeleton w-10 h-10 rounded-xl" />
        <div className="flex-1 space-y-2 pt-1">
          <div className="skeleton h-3.5 w-3/5" />
          <div className="skeleton h-2.5 w-2/5" />
        </div>
      </div>
      <div className="skeleton h-14 w-full rounded-xl" />
    </div>
  );
}

/* ── Main ────────────────────────────────────────────────── */
export default function WorkflowList() {
  const { workflows, workflowsLoading, fetchWorkflows, createWorkflow, openWorkflow, runWorkflow, toggleWorkflowActive, deleteWorkflow, addToast } = useWorkflowStore();
  const [search, setSearch] = useState('');
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [runningId, setRunningId] = useState(null);
  const [stats, setStats] = useState({});

  useEffect(() => { fetchWorkflows(); }, []);

  useEffect(() => {
    if (!workflows.length) return;
    Promise.all(
      workflows.map(w =>
        api.getExecutions(w.id, 50)
          .then(execs => ({ id: w.id, total: execs.length, success: execs.filter(e => e.status === 'success').length, last: execs[0] || null }))
          .catch(() => ({ id: w.id, total: 0, success: 0, last: null }))
      )
    ).then(r => { const m = {}; r.forEach(x => { m[x.id] = x; }); setStats(m); });
  }, [workflows.map(w => w.id).join(',')]);

  async function handleCreate(e) {
    e.preventDefault();
    if (!newName.trim()) return;
    try { await createWorkflow(newName.trim(), newDesc.trim()); setCreating(false); setNewName(''); setNewDesc(''); }
    catch (err) { addToast({ type: 'error', message: err.message }); }
  }

  async function handleTemplate(t) {
    try { await createWorkflow(t.name, t.desc); }
    catch (err) { addToast({ type: 'error', message: err.message }); }
  }

  async function handleRun(e, id) {
    e.stopPropagation();
    setRunningId(id);
    try { await runWorkflow(id); addToast({ type: 'success', message: 'Triggered — check Logs' }); }
    catch (err) { addToast({ type: 'error', message: err.message }); }
    finally { setRunningId(null); }
  }

  async function handleDelete(id) {
    const w = workflows.find(x => x.id === id);
    if (!confirm(`Delete "${w?.name}"?`)) return;
    await deleteWorkflow(id);
    addToast({ type: 'success', message: 'Deleted' });
  }

  const filtered = workflows.filter(w =>
    !search || w.name.toLowerCase().includes(search.toLowerCase()) || w.description?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-4xl mx-auto px-6 py-6">

        {/* Page header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-xl font-bold text-white mb-0.5 tracking-tight">Workflows</h1>
            <p className="text-sm text-slate-600">
              {workflows.length > 0 ? `${workflows.length} workflow${workflows.length !== 1 ? 's' : ''}` : 'Build AI-powered automations'}
            </p>
          </div>
          <button onClick={() => setCreating(true)} className="btn-md btn-glow btn-primary">
            <Plus size={16} /> New Workflow
          </button>
        </div>

        {/* Stats */}
        {workflows.length > 0 && <StatsBanner workflows={workflows} stats={stats} />}

        {/* Create form */}
        {creating && (
          <div className="card p-5 mb-5 anim-scale-in border-indigo-500/20">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-7 h-7 bg-indigo-500/15 rounded-lg flex items-center justify-center">
                <Plus size={14} className="text-indigo-400" />
              </div>
              <h3 className="text-sm font-semibold text-white">New Workflow</h3>
            </div>
            <form onSubmit={handleCreate} className="space-y-3">
              <div>
                <label className="label">Name *</label>
                <input autoFocus className="input" placeholder="e.g. Customer Email Summarizer" value={newName} onChange={e => setNewName(e.target.value)} />
              </div>
              <div>
                <label className="label">Description</label>
                <input className="input" placeholder="What does this workflow automate?" value={newDesc} onChange={e => setNewDesc(e.target.value)} />
              </div>
              <div className="flex gap-2 pt-1">
                <button type="submit" className="btn-sm btn-primary">Create & Open Builder</button>
                <button type="button" onClick={() => { setCreating(false); setNewName(''); setNewDesc(''); }} className="btn-sm btn-ghost">Cancel</button>
              </div>
            </form>
          </div>
        )}

        {/* Empty state */}
        {workflows.length === 0 && !creating && (
          <div className="py-8">
            <div className="text-center mb-10">
              <div className="w-20 h-20 mx-auto mb-5 float relative">
                <div className="w-20 h-20 bg-gradient-to-br from-indigo-500/20 to-violet-500/20 rounded-2xl border border-indigo-500/20 flex items-center justify-center">
                  <Zap size={32} className="text-indigo-400" strokeWidth={1.5} />
                </div>
                <div className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center shadow-lg">
                  <Sparkles size={10} className="text-white" />
                </div>
              </div>
              <h2 className="text-lg font-bold text-white mb-2">Build your first AI workflow</h2>
              <p className="text-sm text-slate-600 max-w-sm mx-auto leading-relaxed">
                Connect triggers, AI steps, and actions to automate your work. No code required.
              </p>
              <button onClick={() => setCreating(true)} className="btn-md btn-glow btn-primary mt-5">
                <Plus size={16} /> Create Workflow
              </button>
            </div>

            <p className="text-[11px] font-bold text-slate-600 uppercase tracking-widest text-center mb-4">Start from a template</p>
            <div className="grid grid-cols-2 gap-3 stagger">
              {TEMPLATES.map(t => (
                <button key={t.name} onClick={() => handleTemplate(t)}
                  className={`text-left p-4 rounded-2xl border bg-gradient-to-br ${t.color} ${t.border} hover:brightness-125 transition-all duration-200 anim-fade-up group`}>
                  <div className="text-2xl mb-2">{t.icon}</div>
                  <div className="text-sm font-semibold text-slate-200 group-hover:text-white mb-0.5 transition-colors">{t.name}</div>
                  <div className="text-[11px] text-slate-600">{t.desc}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Search */}
        {workflows.length > 2 && (
          <div className="relative mb-4">
            <Search size={13} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-600" />
            <input className="input pl-9 input-sm" placeholder="Filter workflows…" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        )}

        {/* Grid */}
        {filtered.length > 0 && (
          <div className={`grid gap-3 ${filtered.length === 1 ? 'grid-cols-1 max-w-sm' : 'grid-cols-1 md:grid-cols-2'} stagger`}>
            {filtered.map(w => (
              <WorkflowCard
                key={w.id}
                workflow={w}
                stat={stats[w.id]}
                onOpen={openWorkflow}
                onRun={handleRun}
                onDelete={handleDelete}
                onToggle={toggleWorkflowActive}
                running={runningId === w.id}
              />
            ))}
          </div>
        )}

        {workflows.length > 0 && filtered.length === 0 && (
          <div className="text-center py-16 text-sm text-slate-600">
            No workflows match "<span className="text-slate-400">{search}</span>"
          </div>
        )}
      </div>
    </div>
  );
}
