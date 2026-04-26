import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic();

const SYSTEM_PROMPT = `You are an AI agent working for Outfit Now, an AI styling company.
Execute the given task and return a structured output.
Always respond in the same language as the brief (French or English).`;

export interface AgentRunResult {
  content: string;
  inputTokens: number;
  outputTokens: number;
}

export async function runClaudeAgent(
  agentName: string,
  agentRole: string,
  brief: string,
  retries = 3,
): Promise<AgentRunResult> {
  if (retries < 1) throw new Error('retries must be >= 1');
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const response = await anthropic.messages.create({
        model: 'claude-sonnet-4-6',
        max_tokens: 1024,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        system: [{ type: 'text', text: SYSTEM_PROMPT, cache_control: { type: 'ephemeral' } }] as any,
        messages: [
          {
            role: 'user',
            content: `Agent: ${agentName} (${agentRole})\n\nTask brief:\n${brief}`,
          },
        ],
      });

      const text = response.content
        .filter((b): b is Anthropic.Messages.TextBlock => b.type === 'text')
        .map((b) => b.text)
        .join('');

      return {
        content: text,
        inputTokens: response.usage.input_tokens,
        outputTokens: response.usage.output_tokens,
      };
    } catch (err) {
      if (attempt === retries) throw err;
      console.warn(`[claude-agent] ${agentName} attempt ${attempt}/${retries} failed:`, err instanceof Error ? err.message : err);
      await new Promise((r) => setTimeout(r, 1000 * 2 ** (attempt - 1) + Math.random() * 250));
    }
  }
  // unreachable — retries >= 1 guard above ensures the loop always throws or returns
  throw new Error('Claude agent failed after retries');
}
