const nodemailer = require('nodemailer');

let transporter;

// Transporter aus Umgebungsvariablen bauen (EMAIL_HOST muss gesetzt sein)
async function getTransporter() {
  if (transporter) return transporter;

  if (process.env.EMAIL_HOST && process.env.EMAIL_HOST !== 'smtp.example.com') {
    // Echte SMTP-Konfiguration aus .env
    transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: parseInt(process.env.EMAIL_PORT, 10),
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
  }
  return transporter;
}

async function sendVerificationEmail(to, token) {
  const t = await getTransporter();
  const link = `${process.env.BASE_URL}/api/auth/verify?token=${token}`;
  const info = await t.sendMail({
    from: process.env.EMAIL_USER || 'noreply@webshop.dev',
    to,
    subject: 'Bitte bestätige deine E-Mail-Adresse',
    html: `<p>Klicke auf den Link, um dein Konto zu bestätigen:</p>
           <a href="${link}">${link}</a>`,
  });
  console.log('Verifikationsmail:', nodemailer.getTestMessageUrl(info) || info.messageId);
}

async function sendMagicLink(to, token) {
  const t    = await getTransporter();
  const link = `${process.env.BASE_URL}/api/auth/magic-login?token=${token}`;
  const info = await t.sendMail({
    from: process.env.EMAIL_USER || 'noreply@webshop.dev',
    to,
    subject: 'Dein Anmeldelink',
    html: `<p>Klicke auf den Link, um dich einmalig anzumelden (gültig 15 Minuten):</p>
           <a href="${link}">${link}</a>
           <p>Oder verwende diesen Code: <strong>${token}</strong></p>`,
  });
  console.log('Magic-Link Mail:', nodemailer.getTestMessageUrl(info) || info.messageId);
}

async function sendOrderConfirmation(to, orderId, items) {
  const t    = await getTransporter();
  const rows = items.map(i =>
    `<tr><td>${i.name}</td><td>${i.quantity}</td><td>${parseFloat(i.price).toFixed(2)} €</td></tr>`
  ).join('');
  const total = items.reduce((s, i) => s + parseFloat(i.price) * i.quantity, 0);

  const info = await t.sendMail({
    from: process.env.EMAIL_USER || 'noreply@webshop.dev',
    to,
    subject: `Bestellbestätigung #${orderId}`,
    html: `<h2>Vielen Dank für deine Bestellung!</h2>
           <p>Bestellung #${orderId}</p>
           <table border="1" cellpadding="5">
             <thead><tr><th>Produkt</th><th>Menge</th><th>Preis</th></tr></thead>
             <tbody>${rows}</tbody>
           </table>
           <p><strong>Gesamt: ${total.toFixed(2)} €</strong></p>`,
  });
  console.log('Bestellbestätigung:', nodemailer.getTestMessageUrl(info) || info.messageId);
}

module.exports = { sendVerificationEmail, sendMagicLink, sendOrderConfirmation };
