// Gmail integration - mock for demo; production uses Gmail API with OAuth2
// Real integration: https://developers.google.com/gmail/api

async function sendEmail(config, input) {
  const to = config.to || (typeof input === 'object' ? input.to : '');
  const subject = config.subject
    ? interpolate(config.subject, input)
    : 'AI Workflow Notification';
  const body = config.bodyTemplate
    ? interpolate(config.bodyTemplate, input)
    : (typeof input === 'string' ? input : JSON.stringify(input, null, 2));

  // Mock mode (no real SMTP configured)
  console.log(`[Gmail Mock] To: ${to}\nSubject: ${subject}\nBody: ${body}`);
  return {
    sent: true,
    mock: true,
    to,
    subject,
    preview: body.substring(0, 200),
  };
}

async function readEmails(config) {
  // Mock: returns simulated email data for trigger testing
  return [
    {
      id: `email_${Date.now()}`,
      from: 'sender@example.com',
      to: config.watchEmail || 'inbox@example.com',
      subject: 'Test Email Trigger',
      body: 'This is a mock email body for testing the AI workflow trigger.',
      timestamp: new Date().toISOString(),
    }
  ];
}

function interpolate(template, data) {
  if (!data || typeof data !== 'object') return template;
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => {
    const val = data[key];
    return val !== undefined ? String(val) : `{{${key}}}`;
  });
}

module.exports = { sendEmail, readEmails };
