const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');
const path = require('path');
const fs = require('fs');

const DATA_DIR = path.join(__dirname, '../data');
fs.mkdirSync(DATA_DIR, { recursive: true });

const adapter = new FileSync(path.join(DATA_DIR, 'db.json'));
const ldb = low(adapter);

// Initialize collections
ldb.defaults({
  workflows: [],
  executions: [],
  webhook_tokens: [],
  workflow_data: [],
}).write();

// ── Workflows ──────────────────────────────────────────────
const db = {
  // Workflows
  getAllWorkflows() {
    return ldb.get('workflows').orderBy('updated_at', 'desc').value();
  },
  getWorkflow(id) {
    return ldb.get('workflows').find({ id }).value() || null;
  },
  createWorkflow(data) {
    ldb.get('workflows').push(data).write();
    return data;
  },
  updateWorkflow(id, updates) {
    ldb.get('workflows').find({ id }).assign(updates).write();
    return this.getWorkflow(id);
  },
  deleteWorkflow(id) {
    ldb.get('workflows').remove({ id }).write();
    ldb.get('webhook_tokens').remove({ workflow_id: id }).write();
    ldb.get('executions').remove({ workflow_id: id }).write();
  },

  // Executions
  getAllExecutions(workflowId, limit = 100) {
    let q = ldb.get('executions').orderBy('started_at', 'desc');
    if (workflowId) q = q.filter({ workflow_id: workflowId });
    return q.take(limit).value();
  },
  getExecution(id) {
    return ldb.get('executions').find({ id }).value() || null;
  },
  createExecution(data) {
    ldb.get('executions').push(data).write();
    return data;
  },
  updateExecution(id, updates) {
    ldb.get('executions').find({ id }).assign(updates).write();
    return this.getExecution(id);
  },
  deleteExecution(id) {
    ldb.get('executions').remove({ id }).write();
  },
  clearExecutions(workflowId) {
    if (workflowId) {
      ldb.get('executions').remove({ workflow_id: workflowId }).write();
    } else {
      ldb.set('executions', []).write();
    }
  },

  // Webhook tokens
  getWebhookToken(token) {
    return ldb.get('webhook_tokens').find({ token }).value() || null;
  },
  getWebhookTokenByWorkflow(workflowId) {
    return ldb.get('webhook_tokens').find({ workflow_id: workflowId }).value() || null;
  },
  createWebhookToken(data) {
    ldb.get('webhook_tokens').remove({ workflow_id: data.workflow_id }).write();
    ldb.get('webhook_tokens').push(data).write();
    return data;
  },

  // Workflow data (generic key/value store)
  saveWorkflowData(record) {
    ldb.get('workflow_data').push(record).write();
    return record;
  },
};

module.exports = db;
