const { v4: uuidv4 } = require('uuid');
const db = require('../db');
const { runAIStep } = require('./aiService');
const slack = require('./integrations/slack');
const gmail = require('./integrations/gmail');

// SSE clients for real-time log streaming
const sseClients = new Map(); // executionId -> [res, ...]

function registerSSEClient(executionId, res) {
  if (!sseClients.has(executionId)) sseClients.set(executionId, []);
  sseClients.get(executionId).push(res);
}

function unregisterSSEClient(executionId, res) {
  const clients = sseClients.get(executionId) || [];
  sseClients.set(executionId, clients.filter(c => c !== res));
}

function broadcastSSE(executionId, event, data) {
  const clients = sseClients.get(executionId) || [];
  const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
  clients.forEach(res => { try { res.write(payload); } catch (_) {} });
}

// Topological sort of workflow nodes
function topoSort(nodes, edges) {
  const nodeMap = new Map(nodes.map(n => [n.id, n]));
  const inDegree = new Map(nodes.map(n => [n.id, 0]));
  const adj = new Map(nodes.map(n => [n.id, []]));

  for (const edge of edges) {
    if (adj.has(edge.source)) adj.get(edge.source).push(edge.target);
    inDegree.set(edge.target, (inDegree.get(edge.target) || 0) + 1);
  }

  const queue = [];
  for (const [id, deg] of inDegree) {
    if (deg === 0) queue.push(id);
  }

  const sorted = [];
  while (queue.length) {
    const id = queue.shift();
    const node = nodeMap.get(id);
    if (node) sorted.push(node);
    for (const next of (adj.get(id) || [])) {
      const newDeg = inDegree.get(next) - 1;
      inDegree.set(next, newDeg);
      if (newDeg === 0) queue.push(next);
    }
  }

  return sorted;
}

async function executeWorkflow(workflowId, triggerData = {}, preGeneratedId = null) {
  const workflow = db.getWorkflow(workflowId);
  if (!workflow) throw new Error(`Workflow ${workflowId} not found`);

  const executionId = preGeneratedId || uuidv4();
  const steps = [];
  const now = new Date().toISOString();

  db.createExecution({
    id: executionId,
    workflow_id: workflowId,
    workflow_name: workflow.name,
    status: 'running',
    trigger_data: triggerData,
    steps: [],
    error: null,
    started_at: now,
    finished_at: null,
  });

  const sortedNodes = topoSort(workflow.nodes || [], workflow.edges || []);
  const context = { trigger: triggerData, lastOutput: triggerData };

  broadcastSSE(executionId, 'start', { executionId, workflowId, workflowName: workflow.name });

  try {
    for (const node of sortedNodes) {
      const stepStart = Date.now();
      const stepId = uuidv4();
      const nodeType = node.type;
      const config = node.data?.config || {};

      broadcastSSE(executionId, 'step_start', {
        stepId, nodeId: node.id, nodeType, label: node.data?.label
      });

      let output;
      try {
        output = await executeNode(nodeType, config, context);
      } catch (err) {
        const step = {
          stepId, nodeId: node.id, nodeType,
          label: node.data?.label, status: 'error',
          error: err.message,
          duration: Date.now() - stepStart,
          timestamp: new Date().toISOString(),
        };
        steps.push(step);
        db.updateExecution(executionId, { steps, status: 'failed', error: err.message, finished_at: new Date().toISOString() });
        broadcastSSE(executionId, 'step_error', step);
        broadcastSSE(executionId, 'failed', { error: err.message });
        return executionId;
      }

      context[node.id] = output;
      context.lastOutput = output;

      const step = {
        stepId, nodeId: node.id, nodeType,
        label: node.data?.label, status: 'success',
        output, duration: Date.now() - stepStart,
        timestamp: new Date().toISOString(),
      };
      steps.push(step);
      db.updateExecution(executionId, { steps });
      broadcastSSE(executionId, 'step_done', step);
    }

    db.updateExecution(executionId, { status: 'success', steps, finished_at: new Date().toISOString() });
    broadcastSSE(executionId, 'success', { executionId, steps: steps.length });

  } catch (err) {
    db.updateExecution(executionId, { status: 'failed', steps, error: err.message, finished_at: new Date().toISOString() });
    broadcastSSE(executionId, 'failed', { error: err.message });
  }

  return executionId;
}

async function executeNode(nodeType, config, context) {
  const input = context.lastOutput;

  switch (nodeType) {
    case 'trigger-webhook':
    case 'trigger-manual':
      return context.trigger;

    case 'trigger-schedule':
      return { triggeredAt: new Date().toISOString(), schedule: config.cron };

    case 'trigger-gmail':
      return gmail.readEmails(config);

    case 'ai-summarize':
    case 'ai-transform':
    case 'ai-classify':
    case 'ai-extract':
      return runAIStep(nodeType, config, input);

    case 'action-slack':
      return slack.postMessage(config, input);

    case 'action-email':
      return gmail.sendEmail(config, input);

    case 'action-http': {
      const url = config.url;
      if (!url) throw new Error('HTTP action requires a URL');
      const method = config.method || 'POST';
      const body = method !== 'GET' ? JSON.stringify(input) : undefined;
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', ...(config.headers || {}) },
        body,
      });
      const data = await res.text();
      return { status: res.status, body: data, url };
    }

    case 'action-savedb': {
      const record = {
        id: uuidv4(),
        table: config.table || 'workflow_data',
        data: input,
        created_at: new Date().toISOString(),
      };
      db.saveWorkflowData(record);
      return { saved: true, id: record.id, table: record.table };
    }

    case 'action-log':
      console.log('[Workflow Log]', JSON.stringify(input, null, 2));
      return { logged: true, data: input };

    default:
      throw new Error(`Unknown node type: ${nodeType}`);
  }
}

module.exports = { executeWorkflow, registerSSEClient, unregisterSSEClient };
