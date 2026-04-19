import { create } from 'zustand';
import api from '../services/api';

const useWorkflowStore = create((set, get) => ({
  // ── Views ──────────────────────────────────────────
  view: 'list', // 'list' | 'builder' | 'logs'
  setView: (view) => set({ view }),

  // ── Workflows ──────────────────────────────────────
  workflows: [],
  workflowsLoading: false,
  activeWorkflow: null, // the one being edited

  fetchWorkflows: async () => {
    set({ workflowsLoading: true });
    try {
      const workflows = await api.getWorkflows();
      set({ workflows, workflowsLoading: false });
    } catch (err) {
      set({ workflowsLoading: false });
      throw err;
    }
  },

  setActiveWorkflow: (workflow) => set({ activeWorkflow: workflow }),

  openWorkflow: async (id) => {
    const workflow = await api.getWorkflow(id);
    set({ activeWorkflow: workflow, view: 'builder' });
  },

  createWorkflow: async (name, description = '') => {
    const workflow = await api.createWorkflow({ name, description, nodes: [], edges: [] });
    set(s => ({ workflows: [workflow, ...s.workflows], activeWorkflow: workflow, view: 'builder' }));
    return workflow;
  },

  saveWorkflow: async (nodes, edges) => {
    const { activeWorkflow } = get();
    if (!activeWorkflow) return;
    const updated = await api.updateWorkflow(activeWorkflow.id, { nodes, edges });
    set(s => ({
      activeWorkflow: updated,
      workflows: s.workflows.map(w => w.id === updated.id ? updated : w),
    }));
    return updated;
  },

  deleteWorkflow: async (id) => {
    await api.deleteWorkflow(id);
    set(s => ({
      workflows: s.workflows.filter(w => w.id !== id),
      activeWorkflow: s.activeWorkflow?.id === id ? null : s.activeWorkflow,
      view: s.activeWorkflow?.id === id ? 'list' : s.view,
    }));
  },

  toggleWorkflowActive: async (id, isActive) => {
    const updated = await api.updateWorkflow(id, { is_active: isActive });
    set(s => ({
      workflows: s.workflows.map(w => w.id === id ? { ...w, is_active: isActive } : w),
      activeWorkflow: s.activeWorkflow?.id === id ? { ...s.activeWorkflow, is_active: isActive } : s.activeWorkflow,
    }));
  },

  // ── Executions ─────────────────────────────────────
  executions: [],
  executionsLoading: false,
  runningExecutionId: null,

  fetchExecutions: async (workflowId) => {
    set({ executionsLoading: true });
    try {
      const executions = await api.getExecutions(workflowId);
      set({ executions, executionsLoading: false });
    } catch {
      set({ executionsLoading: false });
    }
  },

  runWorkflow: async (id, triggerData = {}) => {
    const { executionId } = await api.runWorkflow(id, triggerData);
    set({ runningExecutionId: executionId });
    return executionId;
  },

  setRunningExecution: (id) => set({ runningExecutionId: id }),

  // ── Node Types ─────────────────────────────────────
  nodeTypes: null,
  fetchNodeTypes: async () => {
    if (get().nodeTypes) return;
    const types = await api.getNodeTypes();
    set({ nodeTypes: types });
  },

  // ── Toast notifications ────────────────────────────
  toasts: [],
  addToast: (toast) => {
    const id = Date.now();
    set(s => ({ toasts: [...s.toasts, { id, ...toast }] }));
    setTimeout(() => {
      set(s => ({ toasts: s.toasts.filter(t => t.id !== id) }));
    }, 4000);
  },
  removeToast: (id) => set(s => ({ toasts: s.toasts.filter(t => t.id !== id) })),
}));

export default useWorkflowStore;
