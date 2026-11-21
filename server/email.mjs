import nodemailer from 'nodemailer'

const DEFAULT_RECIPIENT = 'kg109867@gmail.com'

export function createContactEmailSender(environment = process.env) {
  const username = environment.SMTP_USER?.trim()
  const password = environment.SMTP_APP_PASSWORD
  if (!username || !password) return null

  const host = environment.SMTP_HOST?.trim() || 'smtp.gmail.com'
  const port = Number(environment.SMTP_PORT || 465)
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error('SMTP_PORT debe ser un puerto válido.')
  }

  const secureSetting = environment.SMTP_SECURE?.toLowerCase()
  if (secureSetting && !['true', 'false'].includes(secureSetting)) {
    throw new Error('SMTP_SECURE debe ser true o false.')
  }

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: secureSetting ? secureSetting === 'true' : port === 465,
    auth: { user: username, pass: password },
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
    socketTimeout: 20_000,
  })
  const recipient = environment.CONTACT_TO_EMAIL?.trim() || DEFAULT_RECIPIENT

  return async (contactMessage) => {
    await transporter.sendMail({
      from: { name: 'Mundo Fungi', address: username },
      to: recipient,
      replyTo: contactMessage.email,
      subject: 'Nuevo mensaje de contacto - Mundo Fungi',
      text: [
        'Recibiste un nuevo mensaje desde el formulario de Mundo Fungi.',
        '',
        `Nombre: ${contactMessage.name}`,
        `Correo: ${contactMessage.email}`,
        `Fecha: ${contactMessage.createdAt}`,
        '',
        'Mensaje:',
        contactMessage.message,
      ].join('\n'),
    })
  }
}
