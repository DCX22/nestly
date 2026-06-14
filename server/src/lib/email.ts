import * as Brevo from '@getbrevo/brevo'

const apiKey = process.env.BREVO_API_KEY
const fromEmail = process.env.BREVO_FROM_EMAIL ?? 'noreply@nestly.app'
const fromName = process.env.BREVO_FROM_NAME ?? 'Nestly'
const appUrl = process.env.APP_URL ?? 'http://localhost:5173'

export async function sendInviteEmail(
  toEmail: string,
  inviteToken: string,
  householdName: string,
): Promise<void> {
  if (!apiKey) {
    console.warn('BREVO_API_KEY not set — skipping invite email')
    return
  }

  const client = new Brevo.TransactionalEmailsApi()
  client.setApiKey(Brevo.TransactionalEmailsApiApiKeys.apiKey, apiKey)

  const inviteUrl = `${appUrl}?invite=${inviteToken}`

  const email = new Brevo.SendSmtpEmail()
  email.sender = { name: fromName, email: fromEmail }
  email.to = [{ email: toEmail }]
  email.subject = `You've been invited to join ${householdName} on Nestly`
  email.htmlContent = `
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
  `

  await client.sendTransacEmail(email)
}
