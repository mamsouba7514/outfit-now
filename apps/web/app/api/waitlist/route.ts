import { type NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { addToWaitlist } from '@/lib/email';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const schema = z.object({
  email: z.string().email(),
  website: z.string().max(0, 'bot_detected').optional(), // honeypot
});

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    const isBotTrap = parsed.error.issues.some((i) => i.message === 'bot_detected');
    if (isBotTrap) {
      // Return 200 to bots — don't reveal the trap
      return NextResponse.json({ success: true });
    }
    return NextResponse.json({ error: 'Invalid email' }, { status: 400 });
  }

  try {
    await addToWaitlist(parsed.data.email);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[waitlist]', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
