const express = require('express');
const db = require('../db');
const { registerSSEClient, unregisterSSEClient } = require('../services/executionEngine');

const router = express.Router();

// GET /api/executions
router.get('/', (req, res) => {
  const { workflowId, limit = 50 } = req.query;
  res.json(db.getAllExecutions(workflowId, Number(limit)));
});

// GET /api/executions/:id
router.get('/:id', (req, res) => {
  const exec = db.getExecution(req.params.id);
  if (!exec) return res.status(404).json({ error: 'Execution not found' });
  res.json(exec);
});

// GET /api/executions/:id/stream  (SSE)
router.get('/:id/stream', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.flushHeaders();

  const executionId = req.params.id;
  registerSSEClient(executionId, res);

  const exec = db.getExecution(executionId);
  if (exec) {
    res.write(`event: current_state\ndata: ${JSON.stringify(exec)}\n\n`);
    if (exec.status !== 'running') {
      res.write(`event: ${exec.status}\ndata: ${JSON.stringify({ done: true })}\n\n`);
    }
  }

  const heartbeat = setInterval(() => {
    try { res.write(': heartbeat\n\n'); } catch (_) {}
  }, 15000);

  req.on('close', () => {
    clearInterval(heartbeat);
    unregisterSSEClient(executionId, res);
  });
});

// DELETE /api/executions/:id
router.delete('/:id', (req, res) => {
  db.deleteExecution(req.params.id);
  res.json({ deleted: true });
});

// DELETE /api/executions
router.delete('/', (req, res) => {
  db.clearExecutions(req.query.workflowId);
  res.json({ deleted: true });
});

module.exports = router;
