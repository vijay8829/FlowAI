import React, { useEffect, useState } from 'react';
import {
  Play, Clock, Webhook, Mail,
  Sparkles, Tag, Database, Wand2,
  MessageSquare, Send, Save, Globe, Terminal,
  ChevronDown, ChevronRight, Search, GripVertical,
} from 'lucide-react';
import useWorkflowStore from '../../store/workflowStore';

const ICON_MAP = {
  play: Play, clock: Clock, webhook: Webhook, mail: Mail,
  sparkles: Sparkles, tag: Tag, database: Database, wand: Wand2,
  'message-square': MessageSquare, send: Send, save: Save, globe: Globe, terminal: Terminal,
};

const SECTION_META = {
  triggers: {
    color: '#34d399', bg: 'rgba(52,211,153,0.08)', border: 'rgba(52,211,153,0.15)',
    hoverBg: 'rgba(52,211,153,0.12)', label: 'Triggers', dot: '#34d399',
  },
  ai: {
    color: '#a78bfa', bg: 'rgba(167,139,250,0.08)', border: 'rgba(167,139,250,0.15)',
    hoverBg: 'rgba(167,139,250,0.12)', label: 'AI Steps', dot: '#a78bfa',
  },
  actions: {
    color: '#fbbf24', bg: 'rgba(251,191,36,0.08)', border: 'rgba(251,191,36,0.15)',
    hoverBg: 'rgba(251,191,36,0.12)', label: 'Actions', dot: '#fbbf24',
  },
};

function NodeItem({ node, color, bg, border, hoverBg }) {
  const Icon = ICON_MAP[node.icon] || Play;
  const [hovered, setHovered] = useState(false);

  function onDragStart(e) {
    e.dataTransfer.setData('application/reactflow-type', node.type);
    e.dataTransfer.setData('application/reactflow-label', node.label);
    e.dataTransfer.effectAllowed = 'move';
  }

  return (
    <div
      draggable
      onDragStart={onDragStart}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="flex items-start gap-2.5 p-2.5 rounded-xl cursor-grab active:cursor-grabbing select-none transition-all duration-150 active:scale-95 group"
      style={{
        background: hovered ? hoverBg : bg,
        border: `1px solid ${hovered ? color + '40' : border}`,
      }}
      title={node.description}
    >
      <div style={{ background: `${color}20`, borderRadius: 7, width: 26, height: 26, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>
        <Icon size={12} color={color} strokeWidth={2.5} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-[12px] font-medium text-slate-200 leading-tight truncate">{node.label}</div>
        <div className="text-[10px] leading-tight mt-0.5 line-clamp-1" style={{ color: `${color}60` }}>
          {node.description}
        </div>
      </div>
      <GripVertical size={11} className="opacity-0 group-hover:opacity-40 transition-opacity shrink-0 mt-1" style={{ color }} />
    </div>
  );
}

function SkeletonItem() {
  return (
    <div className="flex items-start gap-2.5 p-2.5 rounded-xl animate-pulse" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
      <div className="w-6 h-6 rounded-lg bg-white/[0.06] shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0 space-y-1.5 pt-0.5">
        <div className="h-2.5 bg-white/[0.06] rounded w-3/4" />
        <div className="h-2 bg-white/[0.04] rounded w-full" />
      </div>
    </div>
  );
}

export default function NodePalette() {
  const { nodeTypes, fetchNodeTypes } = useWorkflowStore();
  const [collapsed, setCollapsed] = useState({});
  const [query, setQuery] = useState('');

  useEffect(() => { fetchNodeTypes(); }, []);

  const filterItems = (items) => {
    if (!query.trim()) return items;
    const q = query.toLowerCase();
    return items.filter(n => n.label.toLowerCase().includes(q) || n.description?.toLowerCase().includes(q));
  };

  return (
    <aside className="w-52 border-r border-white/[0.06] overflow-y-auto shrink-0 flex flex-col"
           style={{ background: 'linear-gradient(180deg, #0b0c18 0%, #09091a 100%)' }}>

      {/* Header */}
      <div className="px-3 pt-3 pb-2 border-b border-white/[0.05]">
        <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest mb-2 px-1">Node Library</p>

        {/* Search */}
        <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.07]">
          <Search size={11} className="text-slate-600 shrink-0" />
          <input
            className="flex-1 bg-transparent text-[11px] text-slate-300 placeholder-slate-700 outline-none"
            placeholder="Search nodes…"
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="p-2.5 flex-1 overflow-y-auto">
        {!nodeTypes ? (
          <div className="space-y-1.5">
            {[1, 2, 3, 4, 5].map(i => <SkeletonItem key={i} />)}
          </div>
        ) : (
          Object.entries(nodeTypes).map(([section, items]) => {
            const meta = SECTION_META[section] || SECTION_META.actions;
            const filtered = filterItems(items);
            if (filtered.length === 0) return null;
            const isCollapsed = collapsed[section];

            return (
              <div key={section} className="mb-3">
                {/* Section header */}
                <button
                  onClick={() => setCollapsed(s => ({ ...s, [section]: !s[section] }))}
                  className="flex items-center gap-2 w-full px-1.5 py-1.5 rounded-lg mb-1 hover:bg-white/[0.03] transition-colors group"
                >
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: meta.dot, flexShrink: 0, boxShadow: `0 0 6px ${meta.dot}` }} />
                  <span className="text-[10px] font-bold uppercase tracking-widest flex-1 text-left" style={{ color: meta.color }}>
                    {meta.label}
                  </span>
                  <span className="text-[10px] text-slate-700 mr-1">{filtered.length}</span>
                  {isCollapsed
                    ? <ChevronRight size={10} style={{ color: meta.color }} />
                    : <ChevronDown size={10} style={{ color: meta.color }} />}
                </button>

                {!isCollapsed && (
                  <div className="space-y-1">
                    {filtered.map(node => (
                      <NodeItem key={node.type} node={node} {...meta} />
                    ))}
                  </div>
                )}
              </div>
            );
          })
        )}

        {/* Tip */}
        {nodeTypes && (
          <div className="mt-2 p-2.5 rounded-xl" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
            <p className="text-[10px] text-slate-700 leading-relaxed">
              Drag nodes onto the canvas. Connect by dragging from handle to handle. Press{' '}
              <kbd className="bg-white/[0.08] px-1 rounded text-[9px] text-slate-500">Del</kbd> to remove.
            </p>
          </div>
        )}
      </div>
    </aside>
  );
}
