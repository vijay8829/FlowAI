require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const workflowRoutes = require('./routes/workflows');
const executionRoutes = require('./routes/executions');
const webhookRoutes = require('./routes/webhooks');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({ origin: '*', credentials: true }));
app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));

app.use('/api/workflows', workflowRoutes);
app.use('/api/executions', executionRoutes);
app.use('/api/webhooks', webhookRoutes);

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    aiConfigured: Boolean(process.env.ANTHROPIC_API_KEY && process.env.ANTHROPIC_API_KEY !== 'your_api_key_here'),
  });
});

app.get('/api/node-types', (req, res) => res.json(NODE_TYPES));

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: err.message || 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`\n⚡ FlowAI Backend  →  http://localhost:${PORT}/api`);
  console.log(`   AI (Claude):     ${process.env.ANTHROPIC_API_KEY && process.env.ANTHROPIC_API_KEY !== 'your_api_key_here' ? '✅ configured' : '⚠️  set ANTHROPIC_API_KEY in .env'}\n`);
});

const NODE_TYPES = {
  triggers: [
    { type: 'trigger-manual',   label: 'Manual Trigger', description: 'Start workflow manually via the Run button or API', icon: 'play',    color: '#10b981', configSchema: [] },
    { type: 'trigger-webhook',  label: 'Webhook',        description: 'Trigger via HTTP POST to a unique URL',             icon: 'webhook', color: '#10b981', configSchema: [{ key: 'description', label: 'Description', type: 'text', placeholder: 'What triggers this webhook?' }] },
    { type: 'trigger-schedule', label: 'Schedule',       description: 'Run automatically on a cron schedule',              icon: 'clock',   color: '#10b981', configSchema: [{ key: 'cron', label: 'Cron Expression', type: 'text', placeholder: '0 9 * * 1  (Mon 9am)', required: true }, { key: 'timezone', label: 'Timezone', type: 'text', placeholder: 'UTC' }] },
    { type: 'trigger-gmail',    label: 'New Email',      description: 'Trigger on incoming Gmail messages',                icon: 'mail',    color: '#10b981', configSchema: [{ key: 'watchEmail', label: 'Watch Email', type: 'text', placeholder: 'you@gmail.com' }, { key: 'labelFilter', label: 'Label Filter', type: 'text', placeholder: 'INBOX' }] },
  ],
  ai: [
    { type: 'ai-summarize', label: 'Summarize',    description: 'Condense text into a brief, clear summary',      icon: 'sparkles', color: '#8b5cf6', configSchema: [{ key: 'maxLength', label: 'Length', type: 'text', placeholder: '3 sentences' }, { key: 'style', label: 'Style', type: 'select', options: ['concise', 'detailed', 'bullet-points'] }] },
    { type: 'ai-transform', label: 'Transform',    description: 'Rewrite or restructure text with instructions',   icon: 'wand',     color: '#8b5cf6', configSchema: [{ key: 'instruction', label: 'Instruction', type: 'textarea', placeholder: 'Rewrite in a professional tone...', required: true }] },
    { type: 'ai-classify',  label: 'Classify',     description: 'Sort text into predefined categories',            icon: 'tag',      color: '#8b5cf6', configSchema: [{ key: 'categories', label: 'Categories', type: 'text', placeholder: 'urgent, high, medium, low', required: true }] },
    { type: 'ai-extract',   label: 'Extract Data', description: 'Pull structured fields from unstructured text',   icon: 'database', color: '#8b5cf6', configSchema: [{ key: 'fields', label: 'Fields to Extract', type: 'text', placeholder: 'name, email, phone, company', required: true }] },
  ],
  actions: [
    { type: 'action-slack',   label: 'Send to Slack',  description: 'Post a message to a Slack channel',      icon: 'message-square', color: '#f59e0b', configSchema: [{ key: 'webhookUrl', label: 'Slack Webhook URL', type: 'text', placeholder: 'https://hooks.slack.com/services/...' }, { key: 'channel', label: 'Channel', type: 'text', placeholder: '#general' }, { key: 'messageTemplate', label: 'Message', type: 'textarea', placeholder: 'New alert: {{summary}}' }] },
    { type: 'action-email',   label: 'Send Email',     description: 'Send an email notification',             icon: 'send',           color: '#f59e0b', configSchema: [{ key: 'to', label: 'To', type: 'text', placeholder: 'recipient@example.com', required: true }, { key: 'subject', label: 'Subject', type: 'text', placeholder: 'Workflow Notification' }, { key: 'bodyTemplate', label: 'Body', type: 'textarea', placeholder: '{{result}}' }] },
    { type: 'action-savedb',  label: 'Save to DB',     description: 'Persist workflow output to database',    icon: 'save',           color: '#f59e0b', configSchema: [{ key: 'table', label: 'Table Name', type: 'text', placeholder: 'results' }] },
    { type: 'action-http',    label: 'HTTP Request',   description: 'Call any external REST API',             icon: 'globe',          color: '#f59e0b', configSchema: [{ key: 'url', label: 'URL', type: 'text', placeholder: 'https://api.example.com/endpoint', required: true }, { key: 'method', label: 'Method', type: 'select', options: ['POST', 'GET', 'PUT', 'PATCH', 'DELETE'] }] },
    { type: 'action-log',     label: 'Log Output',     description: 'Write data to execution console',        icon: 'terminal',       color: '#f59e0b', configSchema: [] },
  ],
};
