// Slack integration - posts to a Slack webhook URL
// In production: use Slack Web API with OAuth tokens

async function postMessage(config, input) {
  const webhookUrl = config.webhookUrl;
  const channel = config.channel || '#general';
  const text = config.messageTemplate
    ? interpolate(config.messageTemplate, input)
    : (typeof input === 'string' ? input : JSON.stringify(input, null, 2));

  if (!webhookUrl) {
    // Mock mode - log the message
    console.log(`[Slack Mock] Channel: ${channel}\nMessage: ${text}`);
    return { sent: true, mock: true, channel, message: text };
  }

  const response = await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, channel }),
  });

  if (!response.ok) {
    throw new Error(`Slack API error: ${response.status} ${await response.text()}`);
  }

  return { sent: true, channel, message: text };
}

function interpolate(template, data) {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => {
    const val = typeof data === 'object' ? data[key] : undefined;
    return val !== undefined ? String(val) : `{{${key}}}`;
  });
}

module.exports = { postMessage };
