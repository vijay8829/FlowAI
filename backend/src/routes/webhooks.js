const express = require('express');
const db = require('../db');
const { executeWorkflow } = require('../services/executionEngine');

const router = express.Router();

// POST /api/webhooks/:token
router.post('/:token', async (req, res) => {
  const tokenRow = db.getWebhookToken(req.params.token);
  if (!tokenRow) return res.status(404).json({ error: 'Invalid webhook token' });

  const workflow = db.getWorkflow(tokenRow.workflow_id);
  if (!workflow || !workflow.is_active) return res.status(404).json({ error: 'Workflow not found or inactive' });

  const triggerData = {
    ...req.body,
    _webhook: { token: req.params.token, timestamp: new Date().toISOString() },
  };

  try {
    const executionId = await executeWorkflow(tokenRow.workflow_id, triggerData);
    res.json({ received: true, executionId, workflowId: tokenRow.workflow_id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/webhooks/:token
router.get('/:token', (req, res) => {
  const tokenRow = db.getWebhookToken(req.params.token);
  if (!tokenRow) return res.status(404).json({ error: 'Invalid webhook token' });
  res.json({ valid: true, workflowId: tokenRow.workflow_id });
});

module.exports = router;
