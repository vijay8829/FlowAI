const cron = require('node-cron');
const { executeWorkflow } = require('./executionEngine');

const scheduledJobs = new Map(); // workflowId -> cron task

function scheduleWorkflow(workflowId, cronExpression) {
  stopWorkflow(workflowId);

  if (!cron.validate(cronExpression)) {
    throw new Error(`Invalid cron expression: ${cronExpression}`);
  }

  const task = cron.schedule(cronExpression, async () => {
    console.log(`[Scheduler] Triggering workflow ${workflowId} (${cronExpression})`);
    try {
      await executeWorkflow(workflowId, {
        triggeredBy: 'schedule',
        cronExpression,
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      console.error(`[Scheduler] Workflow ${workflowId} failed:`, err.message);
    }
  });

  scheduledJobs.set(workflowId, task);
  console.log(`[Scheduler] Scheduled workflow ${workflowId} with: ${cronExpression}`);
}

function stopWorkflow(workflowId) {
  const existing = scheduledJobs.get(workflowId);
  if (existing) {
    existing.stop();
    scheduledJobs.delete(workflowId);
  }
}

function stopAll() {
  for (const [id, task] of scheduledJobs) {
    task.stop();
    scheduledJobs.delete(id);
  }
}

function getScheduledWorkflows() {
  return Array.from(scheduledJobs.keys());
}

module.exports = { scheduleWorkflow, stopWorkflow, stopAll, getScheduledWorkflows };
