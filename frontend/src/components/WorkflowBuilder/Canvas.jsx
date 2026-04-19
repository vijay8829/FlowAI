import React, { useCallback, useRef, useState, useEffect } from 'react';
import {
  ReactFlow, Background, Controls, MiniMap, addEdge,
  useNodesState, useEdgesState, BackgroundVariant, MarkerType,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { v4 as uuidv4 } from '../../utils/uuid';

import TriggerNode from './nodes/TriggerNode';
import AINode from './nodes/AINode';
import ActionNode from './nodes/ActionNode';
import NodePalette from './NodePalette';
import NodeConfigPanel from './NodeConfigPanel';
import useWorkflowStore from '../../store/workflowStore';
import RunModal from './RunModal';

const NODE_COMPONENTS = {
  'trigger-manual': TriggerNode, 'trigger-webhook': TriggerNode,
  'trigger-schedule': TriggerNode, 'trigger-gmail': TriggerNode,
  'ai-summarize': AINode, 'ai-transform': AINode, 'ai-classify': AINode, 'ai-extract': AINode,
  'action-slack': ActionNode, 'action-email': ActionNode, 'action-savedb': ActionNode,
  'action-http': ActionNode, 'action-log': ActionNode,
};

const NODE_DEFAULT_LABELS = {
  'trigger-manual': 'Manual Trigger', 'trigger-webhook': 'Webhook', 'trigger-schedule': 'Schedule', 'trigger-gmail': 'New Email',
  'ai-summarize': 'Summarize', 'ai-transform': 'Transform', 'ai-classify': 'Classify', 'ai-extract': 'Extract Data',
  'action-slack': 'Send to Slack', 'action-email': 'Send Email', 'action-savedb': 'Save to DB',
  'action-http': 'HTTP Request', 'action-log': 'Log Output',
};

const EDGE_STYLE = {
  type: 'smoothstep',
  animated: true,
  style: { stroke: '#3b3f6a', strokeWidth: 1.5 },
  markerEnd: { type: MarkerType.ArrowClosed, color: '#4f5490', width: 12, height: 12 },
};

export default function Canvas({ onSaveRef, onRunRef }) {
  const wrapper = useRef(null);
  const [rfInstance, setRfInstance] = useState(null);
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedNode, setSelectedNode] = useState(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [showRunModal, setShowRunModal] = useState(false);

  const { activeWorkflow, saveWorkflow, runWorkflow, addToast, setView } = useWorkflowStore();

  // Load workflow into canvas when opened
  useEffect(() => {
    if (!activeWorkflow) return;
    const wfNodes = (activeWorkflow.nodes || []);
    const wfEdges = (activeWorkflow.edges || []).map(e => ({ ...EDGE_STYLE, ...e, style: EDGE_STYLE.style, animated: true }));
    setNodes(wfNodes);
    setEdges(wfEdges);
    setSelectedNode(null);
  }, [activeWorkflow?.id]);

  // Wire up save/run refs for Header buttons
  useEffect(() => {
    if (onSaveRef) onSaveRef.current = handleSave;
    if (onRunRef) onRunRef.current = () => setShowRunModal(true);
  });

  const onConnect = useCallback(
    (params) => setEdges(eds => addEdge({ ...EDGE_STYLE, ...params }, eds)),
    []
  );

  const onNodeClick = useCallback((_, node) => setSelectedNode(node), []);
  const onPaneClick = useCallback(() => setSelectedNode(null), []);
  const onDragOver = useCallback((e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; setIsDragOver(true); }, []);
  const onDragLeave = useCallback(() => setIsDragOver(false), []);

  const onDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragOver(false);
    const nodeType = e.dataTransfer.getData('application/reactflow-type');
    const nodeLabel = e.dataTransfer.getData('application/reactflow-label');
    if (!nodeType || !rfInstance) return;

    const bounds = wrapper.current.getBoundingClientRect();
    const position = rfInstance.screenToFlowPosition({
      x: e.clientX - bounds.left,
      y: e.clientY - bounds.top,
    });

    const newNode = {
      id: uuidv4(),
      type: nodeType,
      position,
      data: { nodeType, label: nodeLabel || NODE_DEFAULT_LABELS[nodeType] || nodeType, config: {} },
    };

    setNodes(nds => [...nds, newNode]);
    setSelectedNode(newNode);
  }, [rfInstance]);

  function updateNodeConfig(nodeId, config, label) {
    setNodes(nds => nds.map(n =>
      n.id === nodeId ? { ...n, data: { ...n.data, config, label } } : n
    ));
    setSelectedNode(prev => prev?.id === nodeId
      ? { ...prev, data: { ...prev.data, config, label } }
      : prev
    );
  }

  async function handleSave() {
    if (!activeWorkflow) return;
    try {
      await saveWorkflow(nodes, edges);
      addToast({ type: 'success', message: 'Workflow saved' });
    } catch (err) {
      addToast({ type: 'error', message: `Save failed: ${err.message}` });
    }
  }

  async function handleRun(triggerData = {}) {
    setShowRunModal(false);
    try {
      await saveWorkflow(nodes, edges);
      const execId = await runWorkflow(activeWorkflow.id, triggerData);
      addToast({ type: 'success', message: `Running · execution ${execId.slice(0, 8)}` });
      setView('logs');
    } catch (err) {
      addToast({ type: 'error', message: `Run failed: ${err.message}` });
    }
  }

  const nodeCount = nodes.length;

  return (
    <div className="flex flex-1 overflow-hidden relative">
      <NodePalette />

      {/* Canvas area */}
      <div
        ref={wrapper}
        className={`flex-1 relative ${isDragOver ? 'canvas-drop-active' : ''}`}
      >
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={NODE_COMPONENTS}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeClick={onNodeClick}
          onPaneClick={onPaneClick}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
          onInit={setRfInstance}
          fitView
          fitViewOptions={{ padding: 0.25, maxZoom: 1.2 }}
          deleteKeyCode="Delete"
          minZoom={0.25}
          maxZoom={2.5}
          snapToGrid
          snapGrid={[16, 16]}
          proOptions={{ hideAttribution: true }}
          defaultEdgeOptions={EDGE_STYLE}
        >
          <Background
            variant={BackgroundVariant.Dots}
            gap={24}
            size={1.2}
            color="#1e2130"
          />
          <Controls showInteractive={false} />
          <MiniMap
            nodeColor={n => {
              if (n.type?.startsWith('trigger')) return '#10b981';
              if (n.type?.startsWith('ai')) return '#8b5cf6';
              return '#f59e0b';
            }}
            nodeStrokeWidth={0}
            maskColor="rgba(8,10,16,0.8)"
          />
        </ReactFlow>

        {/* Empty state */}
        {nodeCount === 0 && !isDragOver && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="text-center anim-fade-in">
              <div className="w-16 h-16 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center mx-auto mb-4 float">
                <span className="text-2xl opacity-40">⚡</span>
              </div>
              <p className="text-sm font-medium text-slate-600 mb-1">Canvas is empty</p>
              <p className="text-xs text-slate-700">
                Drag nodes from the left panel to start building
              </p>
            </div>
          </div>
        )}

        {/* Drop hint */}
        {isDragOver && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="text-sm font-medium text-indigo-400 bg-indigo-500/10 px-4 py-2 rounded-lg border border-indigo-500/30 backdrop-blur-sm">
              Drop to add node
            </div>
          </div>
        )}

        {/* Node count badge */}
        {nodeCount > 0 && (
          <div className="absolute top-3 right-3 flex items-center gap-1.5 bg-panel/80 backdrop-blur-sm border border-white/[0.07] rounded-full px-2.5 py-1 text-[11px] text-slate-600 pointer-events-none">
            {nodeCount} node{nodeCount !== 1 ? 's' : ''} · {edges.length} connection{edges.length !== 1 ? 's' : ''}
          </div>
        )}
      </div>

      {/* Config panel */}
      <NodeConfigPanel
        selectedNode={selectedNode}
        onUpdate={updateNodeConfig}
        onClose={() => setSelectedNode(null)}
      />

      {/* Run modal */}
      {showRunModal && (
        <RunModal
          workflow={activeWorkflow}
          onRun={handleRun}
          onClose={() => setShowRunModal(false)}
        />
      )}
    </div>
  );
}
