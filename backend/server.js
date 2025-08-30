// backend/server.js
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
require('dotenv').config();

// Initialisation de l'application Express
const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(express.static(path.join(__dirname, '../frontend')));

// Configuration MongoDB Atlas
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://Aris:CodjoAgbevo1998@cluster0.vtdatdv.mongodb.net/elitemasterclass?retryWrites=true&w=majority';

// Schémas MongoDB
const subscriberSchema = new mongoose.Schema({
  firstName: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  createdAt: { type: Date, default: Date.now }
});

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true, minlength: 6 },
  createdAt: { type: Date, default: Date.now }
});

userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

const masterclassSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  date: { type: Date, required: true },
  description: { type: String, trim: true },
  updatedAt: { type: Date, default: Date.now }
});

const Subscriber = mongoose.models.Subscriber || mongoose.model('Subscriber', subscriberSchema);
const User = mongoose.models.User || mongoose.model('User', userSchema);
const Masterclass = mongoose.models.Masterclass || mongoose.model('Masterclass', masterclassSchema);

// Connexion à MongoDB Atlas
console.log('🔗 Tentative de connexion à MongoDB Atlas...');
mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 30000,
  connectTimeoutMS: 30000,
  socketTimeoutMS: 45000
})
.then(() => {
  console.log('✅ Connecté à MongoDB Atlas');
  createDefaultAdmin();
  createDefaultMasterclass();
})
.catch(err => {
  console.error('❌ Erreur de connexion à MongoDB Atlas:', err.message);
  console.log('📋 Mode simulation activé pour la base de données');
});

// Service Email
const createTransporter = () => {
  const emailUser = process.env.EMAIL_USER || 'aristidecoagbevo@gmail.com';
  const emailPassword = process.env.EMAIL_PASSWORD || 'wegrzlljzmwwzkjd';
  
  if (!emailUser || !emailPassword) {
    console.log('📧 Mode simulation activé pour les emails');
    return null;
  }

  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: emailUser,
      pass: emailPassword
    }
  });
};

const sendConfirmationEmail = async (subscriber) => {
  const transporter = createTransporter();
  
  if (!transporter) {
    console.log(`📧 [SIMULATION] Email de confirmation pour: ${subscriber.email}`);
    console.log(`📧 [SIMULATION] Lien Telegram: ${process.env.TELEGRAM_LINK || 'https://t.me/elitemasterclass'}`);
    return true;
  }

  const mailOptions = {
    from: process.env.EMAIL_FROM || 'EliteMasterClass <aristidecoagbevo@gmail.com>',
    to: subscriber.email,
    subject: 'Confirmation d\'inscription - EliteMasterClass',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #000000;">Bonjour ${subscriber.firstName},</h2>
        <p>Votre inscription à notre masterclass a bien été prise en compte.</p>
        <p>En attendant la date de la masterclass, nous vous invitons à rejoindre notre communauté sur Telegram:</p>
        <p style="text-align: center; margin: 30px 0;">
          <a href="${process.env.TELEGRAM_LINK || 'https://t.me/elitemasterclass'}" 
             style="background-color: #000000; color: white; padding: 12px 20px; text-decoration: none; border-radius: 4px; display: inline-block;">
            Rejoindre la communauté Telegram
          </a>
        </p>
        <p>À très bientôt,<br>L'équipe EliteMasterClass</p>
      </div>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`✅ Email de confirmation envoyé à: ${subscriber.email}`);
    return true;
  } catch (error) {
    console.error('❌ Erreur envoi email:', error.message);
    return false;
  }
};

// Fonctions d'initialisation
async function createDefaultAdmin() {
  try {
    const adminEmail = process.env.ADMIN_EMAIL || 'aristidecoagbevo@gmail.com';
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
    
    if (mongoose.connection.readyState !== 1) {
      console.log('📋 Admin simulé:', adminEmail);
      return;
    }
    
    const adminExists = await User.findOne({ email: adminEmail });
    if (!adminExists) {
      const hashedPassword = await bcrypt.hash(adminPassword, 12);
      const adminUser = new User({
        email: adminEmail,
        password: hashedPassword
      });
      await adminUser.save();
      console.log('✅ Admin créé:', adminEmail);
    } else {
      console.log('✅ Admin existe déjà:', adminEmail);
    }
  } catch (error) {
    console.error('❌ Erreur création admin:', error.message);
  }
}

async function createDefaultMasterclass() {
  try {
    if (mongoose.connection.readyState !== 1) {
      console.log('📋 Masterclass simulée');
      return;
    }
    
    const masterclassExists = await Masterclass.findOne();
    if (!masterclassExists) {
      const masterclass = new Masterclass({
        title: 'EliteMasterclass 2025 - Business en Ligne',
        date: new Date('2025-09-15T19:00:00'),
        description: 'Devenez Libre Financièrement avec Votre Business en Ligne'
      });
      await masterclass.save();
      console.log('✅ Configuration masterclass créée');
    }
  } catch (error) {
    console.error('❌ Erreur création masterclass:', error.message);
  }
}

// Middleware d'authentification
const authMiddleware = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: 'Accès non autorisé. Token manquant.' });
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'elitemasterclass_2025_prod_secret_@r1st1d3_C0dj0_$3cur3');
    
    // Mode simulation
    if (decoded.userId === 'simulated-admin') {
      req.user = decoded;
      return next();
    }
    
    // Mode MongoDB connecté
    if (mongoose.connection.readyState === 1) {
      const user = await User.findById(decoded.userId).select('-password');
      if (!user) {
        return res.status(401).json({ error: 'Token invalide.' });
      }
      req.user = user;
    } else {
      req.user = decoded;
    }
    
    next();
  } catch (error) {
    res.status(401).json({ error: 'Token invalide.' });
  }
};

// Routes d'authentification
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email et mot de passe requis' });
    }
    
    const adminEmail = process.env.ADMIN_EMAIL || 'aristidecoagbevo@gmail.com';
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
    
    // Mode simulation si MongoDB déconnecté
    if (mongoose.connection.readyState !== 1) {
      if (email === adminEmail && password === adminPassword) {
        const token = jwt.sign(
          { userId: 'simulated-admin', email: email },
          process.env.JWT_SECRET || 'elitemasterclass_2025_prod_secret_@r1st1d3_C0dj0_$3cur3',
          { expiresIn: '24h' }
        );
        
        return res.json({ 
          success: true, 
          message: 'Connexion réussie (mode simulation)',
          token,
          user: { id: 'simulated-admin', email: email }
        });
      }
      return res.status(401).json({ error: 'Email ou mot de passe incorrect' });
    }
    
    // Mode MongoDB connecté
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: 'Email ou mot de passe incorrect' });
    }
    
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Email ou mot de passe incorrect' });
    }
    
    const token = jwt.sign(
      { userId: user._id, email: user.email },
      process.env.JWT_SECRET || 'elitemasterclass_2025_prod_secret_@r1st1d3_C0dj0_$3cur3',
      { expiresIn: '24h' }
    );
    
    res.json({ 
      success: true, 
      message: 'Connexion réussie',
      token,
      user: { id: user._id, email: user.email }
    });
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur: ' + error.message });
  }
});

// Routes API publiques
app.post('/api/subscribers', async (req, res) => {
  try {
    const { firstName, email } = req.body;
    
    if (!firstName || !email) {
      return res.status(400).json({ error: 'Prénom et email requis' });
    }
    
    // Validation email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Format d\'email invalide' });
    }
    
    if (mongoose.connection.readyState !== 1) {
      console.log('📧 Inscription simulée:', email);
      await sendConfirmationEmail({ firstName, email });
      return res.json({ 
        success: true, 
        message: 'Inscription réussie!',
        subscriber: { firstName, email, createdAt: new Date() }
      });
    }
    
    const existing = await Subscriber.findOne({ email });
    if (existing) {
      return res.status(400).json({ error: 'Email déjà inscrit' });
    }
    
    const newSubscriber = new Subscriber({ firstName, email });
    await newSubscriber.save();
    
    await sendConfirmationEmail(newSubscriber);
    
    console.log('✅ Nouvel inscrit:', email);
    res.json({ 
      success: true, 
      message: 'Inscription réussie! Un email de confirmation a été envoyé.',
      subscriber: newSubscriber
    });
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur: ' + error.message });
  }
});

app.get('/api/masterclass', async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.json({
        title: 'EliteMasterclass 2025 - Business en Ligne',
        date: '2025-09-15T19:00:00',
        description: 'Devenez Libre Financièrement avec Votre Business en Ligne'
      });
    }
    
    let masterclass = await Masterclass.findOne();
    if (!masterclass) {
      masterclass = {
        title: 'EliteMasterclass 2025 - Business en Ligne',
        date: new Date('2025-09-15T19:00:00'),
        description: 'Devenez Libre Financièrement avec Votre Business en Ligne'
      };
    }
    
    res.json(masterclass);
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Routes protégées
app.get('/api/admin/subscribers', authMiddleware, async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.json([]);
    }
    
    const subscribers = await Subscriber.find().sort({ createdAt: -1 });
    res.json(subscribers);
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// CORRECTION: Route de suppression des inscrits
app.delete('/api/admin/subscribers/:id', authMiddleware, async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.json({ success: true, message: 'Inscrit supprimé (mode simulation)' });
    }
    
    // Vérification que l'ID est valide
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: 'ID d\'inscrit invalide' });
    }
    
    const subscriber = await Subscriber.findByIdAndDelete(req.params.id);
    if (!subscriber) {
      return res.status(404).json({ error: 'Inscrit non trouvé' });
    }
    
    res.json({ success: true, message: 'Inscrit supprimé avec succès' });
  } catch (error) {
    console.error('Erreur suppression:', error);
    res.status(500).json({ error: 'Erreur serveur lors de la suppression' });
  }
});

app.put('/api/admin/masterclass', authMiddleware, async (req, res) => {
  try {
    const { title, date, description } = req.body;
    
    if (mongoose.connection.readyState !== 1) {
      return res.json({ 
        success: true, 
        message: 'Masterclass mise à jour (mode simulation)',
        masterclass: { title, date, description }
      });
    }
    
    let masterclass = await Masterclass.findOne();
    if (masterclass) {
      masterclass.title = title || masterclass.title;
      masterclass.date = date ? new Date(date) : masterclass.date;
      masterclass.description = description || masterclass.description;
      masterclass.updatedAt = new Date();
      await masterclass.save();
    } else {
      masterclass = new Masterclass({
        title: title || 'EliteMasterclass 2025 - Business en Ligne',
        date: date ? new Date(date) : new Date('2025-09-15T19:00:00'),
        description: description || 'Devenez Libre Financièrement avec Votre Business en Ligne'
      });
      await masterclass.save();
    }
    
    res.json({ 
      success: true, 
      message: 'Informations masterclass mises à jour',
      masterclass 
    });
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Routes pages - CORRIGÉ pour la structure de dossiers
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// Servir les fichiers statiques du dossier frontend
app.use(express.static(path.join(__dirname, '../frontend')));

// Routes API
app.post('/api/subscribers', async (req, res) => {
  // ... code existant pour l'inscription
});

app.get('/api/masterclass', async (req, res) => {
  // ... code existant pour récupérer les infos masterclass
});

// Routes d'authentification
app.post('/api/auth/login', async (req, res) => {
  // ... code existant pour la connexion admin
});

// Routes protégées (nécessitent une authentification)
app.get('/api/admin/subscribers', authMiddleware, async (req, res) => {
  // ... code existant pour récupérer la liste des inscrits
});

app.delete('/api/admin/subscribers/:id', authMiddleware, async (req, res) => {
  // ... code existant pour supprimer un inscrit
});

app.put('/api/admin/masterclass', authMiddleware, async (req, res) => {
  // ... code existant pour mettre à jour la masterclass
});

// Routes pages admin
app.get('/admin/login', (req, res) => {
  res.sendFile(path.join(__dirname, './views/admin-login.html'));
});

app.get('/admin/dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, './views/dashboard.html'));
});

app.get('/admin', (req, res) => {
  res.redirect('/admin/login');
});

// Servir les fichiers statiques pour les pages admin
app.use('/admin/static', express.static(path.join(__dirname, '../frontend')));

// Route de santé
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    database: mongoose.connection.readyState === 1 ? 'Connected to MongoDB Atlas' : 'Simulation Mode',
    email: process.env.EMAIL_USER ? 'Configured' : 'Not configured',
    timestamp: new Date().toISOString()
  });
});

// Gestion des erreurs 404
app.use('*', (req, res) => {
  res.status(404).json({ message: 'Route non trouvée' });
});

// Gestionnaire d'erreurs global
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Une erreur interne est survenue' });
});
// Route de santé
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    database: mongoose.connection.readyState === 1 ? 'Connected to MongoDB Atlas' : 'Simulation Mode',
    email: process.env.EMAIL_USER ? 'Configured' : 'Not configured',
    timestamp: new Date().toISOString()
  });
});

// Gestion des erreurs
app.use('*', (req, res) => {
  res.status(404).json({ message: 'Route non trouvée' });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Une erreur interne est survenue' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Serveur démarré sur le port ${PORT}`);
  console.log(`📊 Mode Base de données: ${mongoose.connection.readyState === 1 ? 'MongoDB Atlas' : 'Simulation'}`);
  console.log(`📧 Emails: ${process.env.EMAIL_USER ? 'Activés' : 'Désactivés'}`);
  console.log(`🔐 Admin: https://elitemasterclass-2025.onrender.com/admin`);
  console.log(`🌐 Site: https://elitemasterclass-2025.onrender.com`);
});