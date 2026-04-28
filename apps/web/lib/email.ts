import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function addToWaitlist(email: string): Promise<{ alreadySubscribed: boolean }> {
  const audienceId = process.env.RESEND_AUDIENCE_ID;
  if (!audienceId) throw new Error('RESEND_AUDIENCE_ID not set');

  const { error: contactErr } = await resend.contacts.create({
    email,
    audienceId,
    unsubscribed: false,
  });

  // 'validation_error' = contact already exists → skip welcome email (dedup)
  if (contactErr) {
    if (contactErr.name === 'validation_error') {
      return { alreadySubscribed: true };
    }
    throw new Error(`Resend contacts error: ${contactErr.message}`);
  }

  const { error: emailErr } = await resend.emails.send({
    from: 'Outfit Now <hello@outfitnow.app>',
    to: email,
    subject: 'Tu es sur la liste — bienvenue chez Outfit Now',
    text: "Bienvenue sur la liste d'attente Outfit Now. Tu es parmi les premiers à rejoindre. Karl a hâte de te rencontrer. Nous te contacterons en avant-première dès l'ouverture de la bêta.",
    html: `
      <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto; padding: 32px; background: #fff;">
        <h1 style="color: #0A0F1E; font-size: 24px; margin-bottom: 16px;">Bienvenue sur la liste d'attente !</h1>
        <p style="color: #64748B; line-height: 1.6;">Tu es parmi les premiers à rejoindre Outfit Now. Karl a hâte de te rencontrer.</p>
        <p style="color: #64748B; line-height: 1.6; margin-top: 16px;">Nous te contacterons en avant-première dès l'ouverture de la bêta.</p>
        <p style="margin-top: 32px; color: #94A3B8; font-size: 12px;">© 2026 Outfit Now · Paris</p>
      </div>
    `,
    headers: {
      'List-Unsubscribe': `<mailto:unsubscribe@outfitnow.app>, <https://outfitnow.app/unsubscribe?email=${encodeURIComponent(email)}>`,
      'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
    },
  });

  if (emailErr) throw new Error(`Resend email error: ${emailErr.message}`);

  return { alreadySubscribed: false };
}
