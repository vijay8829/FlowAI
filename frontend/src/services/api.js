const BASE = '/api';

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || `HTTP ${res.status}`);
  }

  return res.json();
}

// Workflows
export const api = {
  // Workflows
  getWorkflows: () => request('/workflows'),
  getWorkflow: (id) => request(`/workflows/${id}`),
  createWorkflow: (data) => request('/workflows', { method: 'POST', body: data }),
  updateWorkflow: (id, data) => request(`/workflows/${id}`, { method: 'PUT', body: data }),
  deleteWorkflow: (id) => request(`/workflows/${id}`, { method: 'DELETE' }),
  runWorkflow: (id, triggerData = {}) => request(`/workflows/${id}/run`, { method: 'POST', body: { triggerData } }),
  createWebhook: (id) => request(`/workflows/${id}/webhook`, { method: 'POST' }),

  // Executions
  getExecutions: (workflowId, limit = 50) =>
    request(`/executions${workflowId ? `?workflowId=${workflowId}&limit=${limit}` : `?limit=${limit}`}`),
  getExecution: (id) => request(`/executions/${id}`),
  deleteExecution: (id) => request(`/executions/${id}`, { method: 'DELETE' }),
  clearExecutions: (workflowId) =>
    request(`/executions${workflowId ? `?workflowId=${workflowId}` : ''}`, { method: 'DELETE' }),

  // Node types
  getNodeTypes: () => request('/node-types'),

  // Health
  getHealth: () => request('/health'),
};

export default api;
