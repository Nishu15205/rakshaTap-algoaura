import nodemailer from 'nodemailer'

// Gmail SMTP transporter
let transporter: nodemailer.Transporter | null = null

function getTransporter(): nodemailer.Transporter | null {
  if (transporter) return transporter

  const email = process.env.SMTP_EMAIL
  const pass = process.env.SMTP_PASSWORD

  if (!email || !pass || email === 'your-email@gmail.com' || pass === 'your-app-password') {
    console.warn('[EMAIL] SMTP not configured. Set SMTP_EMAIL and SMTP_PASSWORD in .env with real Gmail App Password. Emails will be logged to console only.')
    return null
  }

  transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: email,
      pass: pass,
    },
  })

  return transporter
}

export interface EmailOptions {
  to: string
  subject: string
  html: string
  text?: string
}

export async function sendEmail({ to, subject, html, text }: EmailOptions): Promise<boolean> {
  const transport = getTransporter()

  const plainText = text || html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim()

  if (!transport) {
    // Fallback: log email to console + save as notification
    console.log(`\n[EMAIL] To: ${to}`)
    console.log(`[EMAIL] Subject: ${subject}`)
    console.log(`[EMAIL] Body (text): ${plainText}\n`)
    return false
  }

  try {
    const info = await transport.sendMail({
      from: `"MUMAA" <${process.env.SMTP_EMAIL}>`,
      to,
      subject,
      html,
      text: plainText,
    })
    console.log(`[EMAIL] Sent to ${to}: ${info.messageId}`)
    return true
  } catch (err) {
    console.error(`[EMAIL] Failed to send to ${to}:`, err)
    return false
  }
}

// ─── Pre-built Email Templates ────────────────────────────────────────

export async function sendOTPEmail(to: string, otp: string, name: string): Promise<boolean> {
  const html = `
    <div style="max-width:480px;margin:0 auto;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
      <div style="background:linear-gradient(135deg,#f59e0b,#f97316);padding:32px 24px;border-radius:16px 16px 0 0;text-align:center;">
        <div style="font-size:28px;font-weight:800;color:white;letter-spacing:-0.5px;">MUMAA</div>
        <div style="font-size:13px;color:rgba(255,255,255,0.85);margin-top:4px;">Password Reset</div>
      </div>
      <div style="background:white;padding:32px 24px;border:1px solid #e7e5e4;border-top:none;border-radius:0 0 16px 16px;">
        <p style="font-size:15px;color:#44403c;margin:0 0 20px;">Hi <strong>${name}</strong>,</p>
        <p style="font-size:15px;color:#44403c;margin:0 0 20px;">We received a request to reset your password. Use the verification code below:</p>
        <div style="background:#fffbeb;border:2px dashed #fbbf24;border-radius:12px;padding:20px;text-align:center;margin:0 0 20px;">
          <div style="font-size:32px;font-weight:800;color:#92400e;letter-spacing:8px;font-family:monospace;">${otp}</div>
        </div>
        <p style="font-size:13px;color:#78716c;margin:0 0 8px;">This code expires in <strong>5 minutes</strong>.</p>
        <p style="font-size:13px;color:#78716c;margin:0 0 20px;">If you didn't request this, you can safely ignore this email.</p>
        <div style="border-top:1px solid #e7e5e4;padding-top:16px;text-align:center;">
          <p style="font-size:12px;color:#a8a29e;margin:0;">&copy; 2025 MUMAA. All rights reserved.</p>
        </div>
      </div>
    </div>
  `
  return sendEmail({ to, subject: 'MUMAA — Password Reset Code', html })
}

export async function sendWelcomeEmail(to: string, name: string, role: string): Promise<boolean> {
  const html = `
    <div style="max-width:480px;margin:0 auto;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
      <div style="background:linear-gradient(135deg,#f59e0b,#f97316);padding:32px 24px;border-radius:16px 16px 0 0;text-align:center;">
        <div style="font-size:28px;font-weight:800;color:white;letter-spacing:-0.5px;">MUMAA</div>
        <div style="font-size:13px;color:rgba(255,255,255,0.85);margin-top:4px;">Welcome to the family</div>
      </div>
      <div style="background:white;padding:32px 24px;border:1px solid #e7e5e4;border-top:none;border-radius:0 0 16px 16px;">
        <p style="font-size:15px;color:#44403c;margin:0 0 20px;">Hi <strong>${name}</strong>,</p>
        <p style="font-size:15px;color:#44403c;margin:0 0 20px;">
          ${role === 'parent'
            ? 'Welcome to MUMAA! Your <strong>30-day free trial</strong> has started. You can now book unlimited video consultations with our certified childcare experts.'
            : 'Welcome to MUMAA! Your expert profile is being reviewed by our team. We\'ll notify you once it\'s approved.'
          }
        </p>
        ${role === 'parent' ? `
        <div style="background:#f0fdf4;border-radius:12px;padding:16px;margin:0 0 20px;">
          <div style="font-size:14px;font-weight:600;color:#166534;margin:0 0 4px;">What you get with your free trial:</div>
          <ul style="font-size:13px;color:#44403c;margin:8px 0 0;padding-left:20px;">
            <li>Unlimited video consultations</li>
            <li>Access to all expert specialists</li>
            <li>In-call chat support</li>
            <li>Call history & session summaries</li>
          </ul>
        </div>
        ` : ''}
        <div style="border-top:1px solid #e7e5e4;padding-top:16px;text-align:center;">
          <p style="font-size:12px;color:#a8a29e;margin:0;">&copy; 2025 MUMAA. All rights reserved.</p>
        </div>
      </div>
    </div>
  `
  return sendEmail({ to, subject: `Welcome to MUMAA, ${name}!`, html })
}

export async function sendPasswordChangedEmail(to: string, name: string): Promise<boolean> {
  const html = `
    <div style="max-width:480px;margin:0 auto;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
      <div style="background:linear-gradient(135deg,#f59e0b,#f97316);padding:32px 24px;border-radius:16px 16px 0 0;text-align:center;">
        <div style="font-size:28px;font-weight:800;color:white;letter-spacing:-0.5px;">MUMAA</div>
        <div style="font-size:13px;color:rgba(255,255,255,0.85);margin-top:4px;">Security Alert</div>
      </div>
      <div style="background:white;padding:32px 24px;border:1px solid #e7e5e4;border-top:none;border-radius:0 0 16px 16px;">
        <p style="font-size:15px;color:#44403c;margin:0 0 20px;">Hi <strong>${name}</strong>,</p>
        <p style="font-size:15px;color:#44403c;margin:0 0 20px;">Your MUMAA account password has been changed successfully. If you did not make this change, please contact us immediately.</p>
        <div style="border-top:1px solid #e7e5e4;padding-top:16px;text-align:center;">
          <p style="font-size:12px;color:#a8a29e;margin:0;">&copy; 2025 MUMAA. All rights reserved.</p>
        </div>
      </div>
    </div>
  `
  return sendEmail({ to, subject: 'MUMAA — Password Changed Successfully', html })
}
