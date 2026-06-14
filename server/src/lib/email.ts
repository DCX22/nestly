import nodemailer from 'nodemailer'

const fromEmail = process.env.BREVO_FROM_EMAIL ?? 'noreply@nestly.app'
const fromName = process.env.BREVO_FROM_NAME ?? 'Nestly'
const appUrl = process.env.APP_URL ?? 'http://localhost:5173'

function createTransport() {
  const host = process.env.BREVO_SMTP_HOST
  const user = process.env.BREVO_SMTP_USER
  const pass = process.env.BREVO_SMTP_PASS
  if (!host || !user || !pass) throw new Error('BREVO_SMTP_HOST, BREVO_SMTP_USER and BREVO_SMTP_PASS must be set')
  return nodemailer.createTransport({
    host,
    port: Number(process.env.BREVO_SMTP_PORT ?? 587),
    secure: false,
    auth: { user, pass },
  })
}

export async function sendInviteEmail(
  toEmail: string,
  inviteToken: string,
  householdName: string,
): Promise<void> {
  const transport = createTransport()
  const inviteUrl = `${appUrl}?invite=${inviteToken}`

  await transport.sendMail({
    from: `"${fromName}" <${fromEmail}>`,
    to: toEmail,
    subject: `You've been invited to join ${householdName} on Nestly`,
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h2 style="color: #7c6dfa;">You're invited to Nestly</h2>
        <p>You've been invited to join <strong>${householdName}</strong> on Nestly — a shared household planner for shopping, recipes, meal planning, and to-dos.</p>
        <p style="margin: 2rem 0;">
          <a href="${inviteUrl}"
             style="background: #7c6dfa; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 600;">
            Accept Invite
          </a>
        </p>
        <p style="color: #888; font-size: 0.875rem;">Or copy this link: ${inviteUrl}</p>
        <p style="color: #888; font-size: 0.875rem;">This invite was sent to ${toEmail}. If you weren't expecting it, you can ignore this email.</p>
      </div>
    `,
  })

  console.log(`Invite email sent to ${toEmail}`)
}

export async function sendTestEmail(toEmail: string): Promise<void> {
  const transport = createTransport()

  await transport.sendMail({
    from: `"${fromName}" <${fromEmail}>`,
    to: toEmail,
    subject: 'Nestly email test',
    html: '<p>If you received this, SMTP is configured correctly.</p>',
  })
}
