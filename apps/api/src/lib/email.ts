const RESEND_API = 'https://api.resend.com/emails'

interface EmailPayload {
  to: string
  subject: string
  html: string
}

async function sendEmail(payload: EmailPayload): Promise<void> {
  const apiKey = process.env['RESEND_API_KEY']
  const from = process.env['RESEND_FROM_EMAIL'] ?? 'AthletiQLab <no-reply@athletiqlab.com>'

  if (!apiKey) {
    console.warn('[email] RESEND_API_KEY não configurado, e-mail não enviado:', payload.subject)
    return
  }

  const res = await fetch(RESEND_API, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({ from, to: payload.to, subject: payload.subject, html: payload.html }),
  })

  if (!res.ok) {
    console.error('[email] falha ao enviar e-mail:', res.status, await res.text())
  }
}

export async function sendWelcomeEmail(email: string, name: string): Promise<void> {
  const dashboardUrl = `${process.env['APP_URL'] ?? 'https://athletiqlab.com'}/dashboard`
  await sendEmail({
    to: email,
    subject: 'Boas-vindas ao AthletiQLab!',
    html: `
<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:Inter,Arial,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:40px 0">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden">
        <tr><td style="background:#111827;padding:32px 40px">
          <h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:700">AthletiQLab</h1>
        </td></tr>
        <tr><td style="padding:40px">
          <h2 style="margin:0 0 16px;color:#111827;font-size:20px">Olá, ${name}! 👋</h2>
          <p style="margin:0 0 16px;color:#374151;font-size:15px;line-height:1.6">
            Seja bem-vindo ao AthletiQLab. Sua conta foi criada com sucesso e você está no período de trial de <strong>14 dias</strong> no plano Pro.
          </p>
          <p style="margin:0 0 24px;color:#374151;font-size:15px;line-height:1.6">
            Com o AthletiQLab você pode criar treinos personalizados em conversa com IA, acompanhar seus alunos e muito mais.
          </p>
          <a href="${dashboardUrl}" style="display:inline-block;background:#111827;color:#ffffff;text-decoration:none;padding:12px 24px;border-radius:8px;font-size:15px;font-weight:600">
            Acessar o painel →
          </a>
          <hr style="border:none;border-top:1px solid #e5e7eb;margin:32px 0">
          <p style="margin:0;color:#9ca3af;font-size:13px">
            Dúvidas? Fale conosco pelo chat no painel ou responda este e-mail.<br>
            AthletiQLab — feito para profissionais de Ed. Física e saúde física.
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`,
  })
}

export async function sendPaymentFailedEmail(
  email: string,
  name: string,
  plan: string,
): Promise<void> {
  const billingUrl = `${process.env['APP_URL'] ?? 'https://athletiqlab.com'}/dashboard/billing`
  const planLabel = plan === 'pro' ? 'Pro' : plan === 'elite' ? 'Elite' : plan

  await sendEmail({
    to: email,
    subject: 'Problema com seu pagamento — AthletiQLab',
    html: `
<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:Inter,Arial,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:40px 0">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden">
        <tr><td style="background:#111827;padding:32px 40px">
          <h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:700">AthletiQLab</h1>
        </td></tr>
        <tr><td style="padding:40px">
          <div style="background:#fef3c7;border:1px solid #fcd34d;border-radius:8px;padding:16px;margin-bottom:24px">
            <p style="margin:0;color:#92400e;font-size:14px;font-weight:600">⚠️ Pagamento não processado</p>
          </div>
          <h2 style="margin:0 0 16px;color:#111827;font-size:20px">Olá, ${name}</h2>
          <p style="margin:0 0 16px;color:#374151;font-size:15px;line-height:1.6">
            Não conseguimos processar o pagamento da sua assinatura <strong>${planLabel}</strong>. Isso pode ter ocorrido por saldo insuficiente, cartão vencido ou limite excedido.
          </p>
          <p style="margin:0 0 24px;color:#374151;font-size:15px;line-height:1.6">
            Acesse a página de billing para atualizar seu método de pagamento e reativar sua assinatura.
          </p>
          <a href="${billingUrl}" style="display:inline-block;background:#111827;color:#ffffff;text-decoration:none;padding:12px 24px;border-radius:8px;font-size:15px;font-weight:600">
            Atualizar pagamento →
          </a>
          <hr style="border:none;border-top:1px solid #e5e7eb;margin:32px 0">
          <p style="margin:0;color:#9ca3af;font-size:13px">
            Precisa de ajuda? Fale conosco pelo chat no painel.<br>
            AthletiQLab — feito para profissionais de Ed. Física e saúde física.
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`,
  })
}

export async function sendSubscriptionCancelledEmail(email: string, name: string): Promise<void> {
  const billingUrl = `${process.env['APP_URL'] ?? 'https://athletiqlab.com'}/dashboard/billing`

  await sendEmail({
    to: email,
    subject: 'Sua assinatura foi cancelada — AthletiQLab',
    html: `
<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:Inter,Arial,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:40px 0">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden">
        <tr><td style="background:#111827;padding:32px 40px">
          <h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:700">AthletiQLab</h1>
        </td></tr>
        <tr><td style="padding:40px">
          <h2 style="margin:0 0 16px;color:#111827;font-size:20px">Olá, ${name}</h2>
          <p style="margin:0 0 16px;color:#374151;font-size:15px;line-height:1.6">
            Sua assinatura do AthletiQLab foi cancelada. Você voltou automaticamente para o plano Starter.
          </p>
          <p style="margin:0 0 16px;color:#374151;font-size:15px;line-height:1.6">
            Seus dados, alunos e treinos estão seguros — apenas os recursos exclusivos dos planos pagos ficarão indisponíveis.
          </p>
          <p style="margin:0 0 24px;color:#374151;font-size:15px;line-height:1.6">
            Se mudou de ideia, você pode reativar sua assinatura a qualquer momento.
          </p>
          <a href="${billingUrl}" style="display:inline-block;background:#111827;color:#ffffff;text-decoration:none;padding:12px 24px;border-radius:8px;font-size:15px;font-weight:600">
            Reativar assinatura →
          </a>
          <hr style="border:none;border-top:1px solid #e5e7eb;margin:32px 0">
          <p style="margin:0;color:#9ca3af;font-size:13px">
            Sentimos sua falta. Fale conosco se precisar de ajuda.<br>
            AthletiQLab — feito para profissionais de Ed. Física e saúde física.
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`,
  })
}
