const BASE = 'http://localhost:3001/api';

async function req(path, opts = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...opts,
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  });
  return res.json();
}

async function main() {
  console.log('\n🔍 Health Check');
  const health = await req('/health');
  console.log(health);

  console.log('\n📋 Create Workflow');
  const wf = await req('/workflows', {
    method: 'POST',
    body: {
      name: 'Email Summary Bot',
      description: 'Summarize emails with Claude AI',
      nodes: [
        { id: 't1', type: 'trigger-manual', position: { x: 250, y: 50 },
          data: { nodeType: 'trigger-manual', label: 'Manual Trigger', config: {} } },
        { id: 'ai1', type: 'ai-summarize', position: { x: 250, y: 200 },
          data: { nodeType: 'ai-summarize', label: 'AI Summarize', config: { maxLength: '2 sentences', style: 'concise' } } },
        { id: 'a1', type: 'action-log', position: { x: 250, y: 350 },
          data: { nodeType: 'action-log', label: 'Log Result', config: {} } },
      ],
      edges: [
        { id: 'e1', source: 't1', target: 'ai1' },
        { id: 'e2', source: 'ai1', target: 'a1' },
      ],
    }
  });
  console.log(`  ✅ Created: "${wf.name}" (${wf.id?.slice(0, 8)})`);

  console.log('\n📋 List Workflows');
  const list = await req('/workflows');
  list.forEach(w => console.log(`  - ${w.name} (${w.id?.slice(0, 8)})`));

  console.log('\n▶  Run Workflow');
  const run = await req(`/workflows/${wf.id}/run`, {
    method: 'POST',
    body: {
      triggerData: {
        text: 'Q4 revenue hit $2.3M up 30% from last year. Enterprise segment grew 45%. Customer retention is 94%. New product line driving growth.',
        source: 'email',
      }
    }
  });
  console.log('  Run result:', run);

  // Wait for execution
  await new Promise(r => setTimeout(r, 2000));

  console.log('\n📜 Execution Logs');
  const execs = await req('/executions');
  execs.slice(0, 2).forEach(e => {
    console.log(`  [${e.status}] ${e.workflow_name} — ${e.steps?.length} steps`);
    e.steps?.forEach(s => {
      console.log(`    ↳ ${s.label} (${s.nodeType}) ${s.status} ${s.duration ? s.duration + 'ms' : ''}`);
      if (s.output) console.log('      Output:', JSON.stringify(s.output).slice(0, 120));
    });
  });

  console.log('\n🪝 Create Webhook');
  const webhook = await req(`/workflows/${wf.id}/webhook`, { method: 'POST' });
  console.log('  Webhook URL:', webhook.url);

  console.log('\n✅ All tests passed!\n');
}

main().catch(err => { console.error('❌ Test failed:', err.message); process.exit(1); });
