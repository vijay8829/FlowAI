import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  Activity, CheckCircle, XCircle, Clock, Loader,
  ChevronDown, ChevronRight, Trash2, RefreshCw,
  Terminal, Zap, Play, Circle, AlertTriangle
} from 'lucide-react';
import api from '../../services/api';
import useWorkflowStore from '../../store/workflowStore';

/* ── Helpers ─────────────────────────────────────────────── */
function timeAgo(iso) {
  if (!iso) return '';
  const diff = Date.now() - new Date(iso).getTime();
  if (diff < 5000) return 'just now';
  if (diff < 60000) return `${Math.floor(diff / 1000)}s ago`;
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function fmtDuration(ms) {
  if (!ms && ms !== 0) return '';
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
}

function nodeColor(type = '') {
  if (type.startsWith('trigger')) return { text: 'text-emerald-400', bg: 'bg-emerald-400', dot: '#10b981', ring: 'ring-emerald-500/30' };
  if (type.startsWith('ai'))      return { text: 'text-violet-400',  bg: 'bg-violet-400',  dot: '#8b5cf6', ring: 'ring-violet-500/30' };
  return                                  { text: 'text-amber-400',  bg: 'bg-amber-400',   dot: '#f59e0b', ring: 'ring-amber-500/30'  };
}

const STATUS = {
  running: { icon: Loader,       color: 'text-blue-400',    bg: 'bg-blue-500/10 border-blue-500/20',   label: 'Running',  spin: true },
  success: { icon: CheckCircle,  color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20', label: 'Success' },
  failed:  { icon: XCircle,      color: 'text-red-400',     bg: 'bg-red-500/10 border-red-500/20',     label: 'Failed'  },
};

/* ── JSON viewer ─────────────────────────────────────────── */
function JsonViewer({ data }) {
  const text = JSON.stringify(data, null, 2);
  const highlighted = text
    .replace(/("[\w]+"):/g, '<span class="json-key">$1</span>:')
    .replace(/: (".*?")/g, ': <span class="json-string">$1</span>')
    .replace(/: (\d+\.?\d*)/g, ': <span class="json-number">$1</span>')
    .replace(/: (true|false)/g, ': <span class="json-bool">$1</span>')
    .replace(/: (null)/g, ': <span class="json-null">$1</span>');

  return (
    <div className="json-viewer bg-[#080a10] rounded-lg border border-white/[0.06] p-3 max-h-56 overflow-y-auto">
      <pre className="whitespace-pre-wrap break-words text-slate-400"
           dangerouslySetInnerHTML={{ __html: highlighted }} />
    </div>
  );
}

/* ── Step row ────────────────────────────────────────────── */
function StepRow({ step, isLast }) {
  const [open, setOpen] = useState(false);
  const nc = nodeColor(step.nodeType);
  const hasOutput = step.output && Object.keys(step.output).length > 0;
  const hasError = !!step.error;

  return (
    <div className={`step-row relative pl-10 pb-4 ${isLast ? '' : ''}`}>
      {/* Timeline line */}
      {!isLast && (
        <div className="absolute left-[17px] top-7 bottom-0 w-px bg-gradient-to-b from-white/10 to-transparent" />
      )}

      {/* Status dot */}
      <div className={`absolute left-2.5 top-1.5 w-5 h-5 rounded-full flex items-center justify-center ring-2 ring-offset-2 ring-offset-[#0d0f17] ${
        step.status === 'success' ? 'bg-emerald-500/20 ring-emerald-500/30' :
        step.status === 'error'   ? 'bg-red-500/20 ring-red-500/30' :
                                    'bg-blue-500/20 ring-blue-500/30'
      }`}>
        {step.status === 'success' && <CheckCircle size={11} className="text-emerald-400" />}
        {step.status === 'error'   && <XCircle size={11} className="text-red-400" />}
        {step.status === 'running' && <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />}
      </div>

      {/* Content */}
      <div
        className={`rounded-lg border transition-all ${
          hasOutput || hasError ? 'cursor-pointer hover:border-white/10' : ''
        } ${open ? 'border-white/[0.1] bg-white/[0.02]' : 'border-white/[0.05]'}`}
        onClick={() => (hasOutput || hasError) && setOpen(o => !o)}
      >
        <div className="flex items-center gap-2.5 px-3 py-2.5">
          {/* Node type badge */}
          <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: nc.dot }} />
          <span className="text-xs font-medium text-slate-200 flex-1 truncate">{step.label || step.nodeType}</span>
          <code className="text-[10px] px-1.5 py-0.5 rounded bg-white/[0.04] text-slate-600">{step.nodeType}</code>
          {step.duration !== undefined && (
            <span className="text-[10px] text-slate-700">{fmtDuration(step.duration)}</span>
          )}
          {(hasOutput || hasError) && (
            <span className="text-slate-700">
              {open ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
            </span>
          )}
        </div>

        {/* Error */}
        {hasError && (
          <div className="px-3 pb-2.5 flex items-start gap-2">
            <AlertTriangle size={12} className="text-red-400 mt-0.5 shrink-0" />
            <p className="text-[11px] text-red-400 font-mono break-all">{step.error}</p>
          </div>
        )}

        {/* Expanded output */}
        {open && hasOutput && (
          <div className="px-3 pb-3 anim-fade-in">
            <p className="text-[10px] font-semibold text-slate-600 uppercase tracking-widest mb-2">Output</p>
            <JsonViewer data={step.output} />
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Execution detail ────────────────────────────────────── */
function ExecutionDetail({ execution, onClose, showBack }) {
  const [steps, setSteps]   = useState(execution.steps || []);
  const [status, setStatus] = useState(execution.status);
  const esRef = useRef(null);

  useEffect(() => {
    setSteps(execution.steps || []);
    setStatus(execution.status);

    if (execution.status === 'running') {
      const es = new EventSource(`/api/executions/${execution.id}/stream`);
      esRef.current = es;

      es.addEventListener('step_done', e => {
        const s = JSON.parse(e.data);
        setSteps(prev => prev.find(x => x.stepId === s.stepId) ? prev.map(x => x.stepId === s.stepId ? s : x) : [...prev, s]);
      });
      es.addEventListener('step_error', e => {
        const s = JSON.parse(e.data);
        setSteps(prev => [...prev, s]);
        setStatus('failed');
      });
      es.addEventListener('success', () => setStatus('success'));
      es.addEventListener('failed',  () => setStatus('failed'));
      es.onerror = () => es.close();
      return () => es.close();
    }
  }, [execution.id]);

  const meta = STATUS[status] || STATUS.running;
  const Icon = meta.icon;
  const totalMs = steps.reduce((a, s) => a + (s.duration || 0), 0);
  const hasTriggerData = execution.trigger_data && Object.keys(execution.trigger_data).length > 0;

  return (
    <div className="flex-1 overflow-y-auto anim-fade-in">
      {/* Sticky header */}
      <div className="sticky top-0 z-10 bg-[#0d0f17]/95 backdrop-blur-sm border-b border-white/[0.06] px-5 py-3.5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Icon size={14} className={`${meta.color} shrink-0 ${meta.spin ? 'spinner' : ''}`} />
              <span className="text-sm font-semibold text-white truncate">{execution.workflow_name}</span>
              <span className={`badge text-[10px] border ${meta.bg} ${meta.color} shrink-0`}>{meta.label}</span>
            </div>
            <div className="flex items-center gap-3 text-[11px] text-slate-600">
              <code className="font-mono">{execution.id.slice(0, 12)}…</code>
              <span>·</span>
              <span>{timeAgo(execution.started_at)}</span>
              {totalMs > 0 && <><span>·</span><span>{fmtDuration(totalMs)} total</span></>}
              <span>·</span>
              <span>{steps.length} step{steps.length !== 1 ? 's' : ''}</span>
            </div>
          </div>
          <button onClick={onClose} className="btn btn-ghost btn-xs text-slate-600">
            {showBack ? <span className="md:hidden">← Back</span> : null}
            <span className={showBack ? 'hidden md:inline' : ''}>✕</span>
          </button>
        </div>
      </div>

      <div className="p-5">
        {/* Trigger data */}
        {hasTriggerData && (
          <div className="mb-6">
            <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest mb-2">Trigger Input</p>
            <JsonViewer data={execution.trigger_data} />
          </div>
        )}

        {/* Steps */}
        <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest mb-4">
          Execution Steps
        </p>

        {steps.length === 0 && status === 'running' && (
          <div className="flex items-center gap-3 text-sm text-slate-600 py-4">
            <Loader size={16} className="spinner text-blue-400" />
            Starting execution…
          </div>
        )}

        <div>
          {steps.map((step, i) => (
            <StepRow key={step.stepId || i} step={step} isLast={i === steps.length - 1} />
          ))}
        </div>

        {/* Error summary */}
        {execution.error && (
          <div className="mt-4 p-3.5 bg-red-500/[0.07] border border-red-500/20 rounded-xl">
            <div className="flex items-center gap-2 mb-1.5">
              <XCircle size={13} className="text-red-400" />
              <span className="text-xs font-semibold text-red-400">Execution Failed</span>
            </div>
            <p className="text-xs font-mono text-red-400/80">{execution.error}</p>
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Execution list item ─────────────────────────────────── */
function ExecItem({ exec, selected, onClick }) {
  const meta = STATUS[exec.status] || STATUS.running;
  const Icon = meta.icon;

  return (
    <button
      onClick={() => onClick(exec)}
      className={`w-full text-left px-3 py-3 rounded-lg transition-all border ${
        selected
          ? 'bg-indigo-500/[0.08] border-indigo-500/25 shadow-glow-sm'
          : 'border-transparent hover:bg-white/[0.03] hover:border-white/[0.06]'
      }`}
    >
      <div className="flex items-center gap-2.5 mb-1.5">
        <Icon size={13} className={`${meta.color} shrink-0 ${meta.spin ? 'spinner' : ''}`} />
        <span className="text-xs font-medium text-slate-200 flex-1 truncate">{exec.workflow_name}</span>
      </div>
      <div className="flex items-center gap-2 ml-5">
        <span className={`text-[10px] ${meta.color}`}>{meta.label}</span>
        <span className="text-[10px] text-slate-700">·</span>
        <span className="text-[10px] text-slate-700">{exec.steps?.length || 0} steps</span>
        <span className="text-[10px] text-slate-700 ml-auto">{timeAgo(exec.started_at)}</span>
      </div>
    </button>
  );
}

/* ── Main component ─────────────────────────────────────── */
export default function ExecutionLogs() {
  const { addToast } = useWorkflowStore();
  const [executions, setExecutions] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [selected, setSelected]     = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter]         = useState('all'); // all | success | failed | running

  async function load(silent = false) {
    if (!silent) setLoading(true);
    try {
      const data = await api.getExecutions(null, 100);
      setExecutions(data);
      // Auto-select the most recent running execution
      const running = data.find(e => e.status === 'running');
      if (running && !selected) setSelected(running);
    } catch (err) {
      addToast({ type: 'error', message: err.message });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  // Poll for running executions
  useEffect(() => {
    const hasRunning = executions.some(e => e.status === 'running');
    if (!hasRunning) return;
    const t = setInterval(() => load(true), 3000);
    return () => clearInterval(t);
  }, [executions.some(e => e.status === 'running')]);

  async function handleRefresh() {
    setRefreshing(true);
    await load(true);
    setRefreshing(false);
  }

  async function handleClear() {
    if (!confirm('Clear all execution logs?')) return;
    await api.clearExecutions();
    setExecutions([]);
    setSelected(null);
    addToast({ type: 'success', message: 'Logs cleared' });
  }

  const filtered = executions.filter(e => filter === 'all' || e.status === filter);
  const counts = { all: executions.length, success: executions.filter(e => e.status === 'success').length, failed: executions.filter(e => e.status === 'failed').length, running: executions.filter(e => e.status === 'running').length };

  return (
    <div className="flex flex-1 overflow-hidden flex-col md:flex-row">
      {/* Sidebar — full width on mobile when no selection, else hidden */}
      <div className={`${selected ? 'hidden md:flex' : 'flex'} md:w-72 w-full border-r border-white/[0.06] flex-col bg-panel shrink-0`}>
        {/* Header */}
        <div className="px-4 py-3 border-b border-white/[0.06] flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-white">Execution Logs</h2>
            <p className="text-[11px] text-slate-600">{executions.length} total runs</p>
          </div>
          <div className="flex items-center gap-1">
            <button onClick={handleRefresh} className="w-7 h-7 rounded-md flex items-center justify-center text-slate-600 hover:text-slate-300 hover:bg-white/[0.06] transition-all" title="Refresh">
              <RefreshCw size={13} className={refreshing ? 'spinner' : ''} />
            </button>
            <button onClick={handleClear} className="w-7 h-7 rounded-md flex items-center justify-center text-slate-600 hover:text-red-400 hover:bg-red-500/10 transition-all" title="Clear all">
              <Trash2 size={13} />
            </button>
          </div>
        </div>

        {/* Filter tabs */}
        <div className="px-3 pt-2.5 pb-1 flex gap-1 flex-wrap">
          {[
            { key: 'all',     label: `All (${counts.all})` },
            { key: 'success', label: `✓ ${counts.success}` },
            { key: 'failed',  label: `✗ ${counts.failed}` },
            { key: 'running', label: `⟳ ${counts.running}` },
          ].map(f => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`text-[10px] px-2 py-0.5 rounded-md border transition-all font-medium ${
                filter === f.key
                  ? 'bg-indigo-500/15 border-indigo-500/30 text-indigo-400'
                  : 'bg-white/[0.03] border-white/[0.06] text-slate-600 hover:text-slate-400'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-2">
          {loading ? (
            <div className="flex justify-center py-10">
              <Loader size={18} className="spinner text-slate-700" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-14 px-4">
              <Activity size={24} className="text-slate-700 mx-auto mb-3" />
              <p className="text-xs text-slate-600">
                {filter === 'all' ? 'No executions yet' : `No ${filter} executions`}
              </p>
              <p className="text-[11px] text-slate-700 mt-1">Run a workflow to see logs</p>
            </div>
          ) : (
            <div className="space-y-1">
              {filtered.map(exec => (
                <ExecItem
                  key={exec.id}
                  exec={exec}
                  selected={selected?.id === exec.id}
                  onClick={setSelected}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Detail pane */}
      {selected ? (
        <ExecutionDetail
          key={selected.id}
          execution={selected}
          onClose={() => setSelected(null)}
          showBack={true}
        />
      ) : (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center anim-fade-in">
            <div className="w-14 h-14 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center mx-auto mb-3 float">
              <Terminal size={22} className="text-slate-700" />
            </div>
            <p className="text-sm font-medium text-slate-600 mb-1">Select a run to inspect</p>
            <p className="text-xs text-slate-700">Click any execution from the list</p>
          </div>
        </div>
      )}
    </div>
  );
}
