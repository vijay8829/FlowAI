const express = require('express');
const { v4: uuidv4 } = require('uuid');
const db = require('../db');
const { executeWorkflow } = require('../services/executionEngine');
const { scheduleWorkflow, stopWorkflow } = require('../services/scheduler');

const router = express.Router();

// GET /api/workflows
router.get('/', (req, res) => {
  res.json(db.getAllWorkflows());
});

// GET /api/workflows/:id
router.get('/:id', (req, res) => {
  const w = db.getWorkflow(req.params.id);
  if (!w) return res.status(404).json({ error: 'Workflow not found' });
  res.json(w);
});

// POST /api/workflows
router.post('/', (req, res) => {
  const { name, description = '', nodes = [], edges = [] } = req.body;
  if (!name) return res.status(400).json({ error: 'name is required' });

  const now = new Date().toISOString();
  const workflow = { id: uuidv4(), name, description, nodes, edges, is_active: true, created_at: now, updated_at: now };
  db.createWorkflow(workflow);
  autoSchedule(workflow.id, nodes);
  res.status(201).json(workflow);
});

// PUT /api/workflows/:id
router.put('/:id', (req, res) => {
  const existing = db.getWorkflow(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Workflow not found' });

  const updates = {};
  if (req.body.name !== undefined) updates.name = req.body.name;
  if (req.body.description !== undefined) updates.description = req.body.description;
  if (req.body.nodes !== undefined) updates.nodes = req.body.nodes;
  if (req.body.edges !== undefined) updates.edges = req.body.edges;
  if (req.body.is_active !== undefined) updates.is_active = req.body.is_active;
  updates.updated_at = new Date().toISOString();

  const updated = db.updateWorkflow(req.params.id, updates);

  stopWorkflow(req.params.id);
  if (updated.is_active) autoSchedule(req.params.id, updated.nodes || []);

  res.json(updated);
});

// DELETE /api/workflows/:id
router.delete('/:id', (req, res) => {
  const existing = db.getWorkflow(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Workflow not found' });
  stopWorkflow(req.params.id);
  db.deleteWorkflow(req.params.id);
  res.json({ deleted: true });
});

// POST /api/workflows/:id/run
router.post('/:id/run', (req, res) => {
  const w = db.getWorkflow(req.params.id);
  if (!w) return res.status(404).json({ error: 'Workflow not found' });

  // Generate ID upfront so we can return it immediately
  const executionId = uuidv4();

  // Fire-and-forget — respond instantly, run in background
  executeWorkflow(req.params.id, req.body.triggerData || {}, executionId)
    .catch(err => console.error('[run]', err.message));

  res.json({ executionId, message: 'Workflow triggered' });
});

// POST /api/workflows/:id/webhook
router.post('/:id/webhook', (req, res) => {
  const w = db.getWorkflow(req.params.id);
  if (!w) return res.status(404).json({ error: 'Workflow not found' });
  const token = uuidv4().replace(/-/g, '');
  db.createWebhookToken({ id: uuidv4(), workflow_id: req.params.id, token, created_at: new Date().toISOString() });
  res.json({
    token,
    url: `/api/webhooks/${token}`,
    fullUrl: `${req.protocol}://${req.get('host')}/api/webhooks/${token}`,
  });
});

function autoSchedule(workflowId, nodes) {
  const t = nodes.find(n => n.type === 'trigger-schedule');
  if (t?.data?.config?.cron) {
    try { scheduleWorkflow(workflowId, t.data.config.cron); } catch (e) { console.warn(e.message); }
  }
}

module.exports = router;
