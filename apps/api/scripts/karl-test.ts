// Test rapide session Karl — envoie un message simple sans base de données
//
// Usage:  npx tsx scripts/karl-test.ts

import Anthropic from '@anthropic-ai/sdk';

const apiKey = process.env.ANTHROPIC_API_KEY;
const agentId = process.env.KARL_AGENT_ID;
const environmentId = process.env.KARL_ENVIRONMENT_ID;

if (!apiKey || !agentId || !environmentId) {
  console.error('Missing env vars: ANTHROPIC_API_KEY, KARL_AGENT_ID, KARL_ENVIRONMENT_ID');
  process.exit(1);
}

const client = new Anthropic({ apiKey });

async function test() {
  console.log(`Agent : ${agentId}`);
  console.log(`Env   : ${environmentId}\n`);

  console.log('Creating session...');
  const session = await client.beta.sessions.create({
    agent: { type: 'agent', id: agentId! },
    environment_id: environmentId!,
    title: 'Karl test session',
  });
  console.log(`Session : ${session.id}\n`);

  const message =
    "Bonjour Karl ! Présente-toi brièvement et dis-moi ce que tu peux faire pour m'aider.";
  console.log(`User : ${message}\n`);
  console.log('Karl : ');

  const stream = await client.beta.sessions.events.stream(session.id);

  // Send message concurrently with streaming
  await client.beta.sessions.events.send(session.id, {
    events: [{ type: 'user.message', content: [{ type: 'text', text: message }] }],
  });

  let done = false;
  for await (const event of stream) {
    if (event.type === 'agent.message') {
      for (const block of event.content) {
        if (block.type === 'text') process.stdout.write(block.text);
      }
    } else if (event.type === 'agent.custom_tool_use') {
      console.log(`\n[tool call: ${event.name}]`);
    } else if (event.type === 'session.status_idle') {
      done = true;
      break;
    } else if (event.type === 'session.status_terminated') {
      break;
    }
  }

  console.log('\n');
  console.log(done ? '✓ Session terminée proprement' : '⚠ Session interrompue');

  // Clean up
  await client.beta.sessions.delete(session.id);
  console.log('Session supprimée.');
}

test().catch((err) => {
  console.error(err);
  process.exit(1);
});
