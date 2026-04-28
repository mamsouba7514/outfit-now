import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { z } from 'zod';

import { addToWaitlist } from '@/lib/email';

const schema = z.object({
  email: z.string().email(),
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
