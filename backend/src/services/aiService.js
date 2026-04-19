const Anthropic = require('@anthropic-ai/sdk');

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || '',
});

const MODEL = 'claude-sonnet-4-6';

async function runAIStep(nodeType, config, input) {
  const text = typeof input === 'string' ? input : JSON.stringify(input, null, 2);

  switch (nodeType) {
    case 'ai-summarize':
      return summarize(text, config);
    case 'ai-transform':
      return transform(text, config);
    case 'ai-classify':
      return classify(text, config);
    case 'ai-extract':
      return extract(text, config);
    default:
      throw new Error(`Unknown AI node type: ${nodeType}`);
  }
}

async function summarize(text, config = {}) {
  const maxLength = config.maxLength || '3 sentences';
  const style = config.style || 'concise';

  const message = await client.messages.create({
    model: MODEL,
    max_tokens: 512,
    system: `You are a professional summarizer. Produce ${style} summaries in ${maxLength}.`,
    messages: [
      { role: 'user', content: `Summarize the following:\n\n${text}` }
    ],
  });

  return {
    summary: message.content[0].text,
    input_tokens: message.usage.input_tokens,
    output_tokens: message.usage.output_tokens,
  };
}

async function transform(text, config = {}) {
  const instruction = config.instruction || 'Rewrite this text in a more professional tone.';

  const message = await client.messages.create({
    model: MODEL,
    max_tokens: 1024,
    system: 'You are a text transformation expert. Apply transformations precisely as instructed. Return only the transformed text.',
    messages: [
      { role: 'user', content: `Instruction: ${instruction}\n\nText to transform:\n${text}` }
    ],
  });

  return {
    result: message.content[0].text,
    instruction,
    input_tokens: message.usage.input_tokens,
    output_tokens: message.usage.output_tokens,
  };
}

async function classify(text, config = {}) {
  const categories = config.categories || ['positive', 'negative', 'neutral'];
  const categoryList = Array.isArray(categories)
    ? categories
    : categories.split(',').map(c => c.trim());

  const message = await client.messages.create({
    model: MODEL,
    max_tokens: 256,
    system: `You are a text classifier. Classify text into exactly one of these categories: ${categoryList.join(', ')}. Respond in JSON with: { "category": "<chosen>", "confidence": 0.0-1.0, "reasoning": "<brief>" }`,
    messages: [
      { role: 'user', content: text }
    ],
  });

  try {
    const raw = message.content[0].text.trim();
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    return jsonMatch ? JSON.parse(jsonMatch[0]) : { category: raw, confidence: 1.0, reasoning: '' };
  } catch {
    return { category: message.content[0].text.trim(), confidence: 1.0, reasoning: '' };
  }
}

async function extract(text, config = {}) {
  const fields = config.fields || 'name, email, phone';

  const message = await client.messages.create({
    model: MODEL,
    max_tokens: 512,
    system: `You are a data extraction expert. Extract structured information from text. Return a JSON object with the requested fields. If a field is not found, use null.`,
    messages: [
      { role: 'user', content: `Extract the following fields: ${fields}\n\nFrom this text:\n${text}` }
    ],
  });

  try {
    const raw = message.content[0].text.trim();
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    return jsonMatch ? JSON.parse(jsonMatch[0]) : { raw: message.content[0].text };
  } catch {
    return { raw: message.content[0].text };
  }
}

module.exports = { runAIStep };
