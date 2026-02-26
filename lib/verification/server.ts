import { createServerSupabaseClient } from '../supabase/server'
import crypto from 'crypto'

export async function generateAndSendOtp(email: string) {
  const code = String(Math.floor(100000 + Math.random() * 900000))
  const expiresAt = new Date(Date.now() + 1000 * 60 * 10) // 10 minutes

  const supabase = await createServerSupabaseClient()
  await supabase.from('email_otps').insert({ email, code, expires_at: expiresAt.toISOString() })

  // Try preferred transactional providers in order: Resend, SendGrid, then fallback to console log
  const RESEND_API_KEY = process.env.RESEND_API_KEY
  const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY

  if (RESEND_API_KEY) {
    try {
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { Authorization: `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: 'MarketBridge <no-reply@marketbridge.com.ng>',
          to: [email],
          subject: 'Your MarketBridge verification code',
          text: `Your verification code is: ${code}`,
        }),
      })
    } catch (e) {
      console.error('Resend send failed', e)
    }
  } else if (SENDGRID_API_KEY) {
    try {
      const res = await fetch('https://api.sendgrid.com/v3/mail/send', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${SENDGRID_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          personalizations: [{ to: [{ email }], subject: 'Your MarketBridge verification code' }],
          from: { email: 'no-reply@marketbridge.com.ng', name: 'MarketBridge' },
          content: [{ type: 'text/plain', value: `Your verification code is: ${code}` }],
        }),
      })
      if (!res.ok) {
        console.error('SendGrid send failed', await res.text())
      }
    } catch (e) {
      console.error('SendGrid error', e)
    }
  } else {
    // In dev or without a provider, log the code so admins can copy it.
    console.log(`VERIFICATION CODE for ${email}: ${code}`)
  }

  return { success: true }
}

export async function verifyOtpAndCreateRequest(email: string, code: string, userId: string) {
  const supabase = await createServerSupabaseClient()
  const { data } = await supabase
    .from('email_otps')
    .select('*')
    .eq('email', email)
    .eq('code', code)
    .order('created_at', { ascending: false })
    .limit(1)

  const otp = data && data[0]
  if (!otp) return { error: 'Invalid code' }
  if (otp.used) return { error: 'Code already used' }
  if (new Date(otp.expires_at) < new Date()) return { error: 'Code expired' }

  await supabase.from('email_otps').update({ used: true }).eq('id', otp.id)

  // mark user's email_verified (soft) and create a pending verification request for admin
  await supabase.from('seller_verification_requests').insert({ user_id: userId, email, status: 'pending' })

  return { success: true }
}
