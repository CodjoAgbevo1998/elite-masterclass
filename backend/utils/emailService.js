// backend/utils/emailService.js
const nodemailer = require('nodemailer');

// Configuration du transporteur email
let transporter = null;

// Initialiser le transporteur seulement si la configuration email est disponible
if (process.env.EMAIL_USER && process.env.EMAIL_PASSWORD) {
  transporter = nodemailer.createTransport({
    service: process.env.EMAIL_SERVICE || 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD
    }
  });
  
  // Vérifier la configuration
  transporter.verify(function(error, success) {
    if (error) {
      console.error('❌ Erreur configuration email:', error);
    } else {
      console.log('✅ Configuration email prête pour envoi');
    }
  });
} else {
  console.warn('⚠️  Configuration email manquante. Mode simulation activé.');
}

// Fonction pour envoyer l'email de confirmation
const sendConfirmationEmail = async (subscriber) => {
  // Si l'email n'est pas configuré, mode simulation
  if (!transporter) {
    console.log(`📧 [SIMULATION] Email de confirmation pour: ${subscriber.email}`);
    console.log(`📧 [SIMULATION] Lien Telegram: ${process.env.TELEGRAM_LINK || 'https://t.me/elitemasterclass'}`);
    return true;
  }

  const mailOptions = {
    from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
    to: subscriber.email,
    subject: 'Confirmation d\'inscription à la Masterclass EliteBusiness',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #000000; color: white; padding: 20px; text-align: center; }
          .content { background-color: #f9f9f9; padding: 20px; border-radius: 0 0 5px 5px; }
          .button { display: inline-block; background-color: #000000; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; margin: 15px 0; }
          .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>EliteMasterClass</h1>
        </div>
        <div class="content">
          <h2>Bonjour ${subscriber.firstName},</h2>
          <p>Votre inscription à notre masterclass a bien été prise en compte !</p>
          <p>Nous sommes ravis de vous compter parmi nous pour cette formation exclusive.</p>
          
          <p><strong>Prochaine étape :</strong></p>
          <p>Rejoignez dès maintenant notre communauté Telegram pour ne rien manquer :</p>
          
          <p style="text-align: center;">
            <a href="${process.env.TELEGRAM_LINK || 'https://t.me/elitemasterclass'}" class="button">
              Rejoindre la communauté Telegram
            </a>
          </p>
          
          <p>Vous y recevrez :</p>
          <ul>
            <li>Les rappels et accès à la masterclass</li>
            <li>Du contenu exclusif en avant-première</li>
            <li>Des conseils supplémentaires</li>
            <li>Un espace d'échange avec les autres participants</li>
          </ul>
          
          <p>À très bientôt,<br>
          <strong>L'équipe EliteMasterClass</strong></p>
        </div>
        <div class="footer">
          <p>© 2025 EliteMasterClass. Tous droits réservés.</p>
          <p>Si vous avez des questions, répondez simplement à cet email.</p>
        </div>
      </body>
      </html>
    `
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ Email envoyé à: ${subscriber.email}`);
    console.log(`📧 Message ID: ${info.messageId}`);
    return true;
  } catch (error) {
    console.error('❌ Erreur envoi email:', error);
    
    // Fallback vers le mode simulation en cas d'erreur
    console.log(`📧 [FALLBACK] Email simulé pour: ${subscriber.email}`);
    return true;
  }
};

module.exports = { sendConfirmationEmail, transporter };