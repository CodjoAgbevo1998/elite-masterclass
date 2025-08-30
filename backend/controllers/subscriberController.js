const Subscriber = require('../models/Subscriber');
const { sendConfirmationEmail } = require('../utils/emailService');

exports.createSubscriber = async (req, res) => {
  try {
    const { firstName, email } = req.body;
    
    // Vérifier si l'email existe déjà
    const existingSubscriber = await Subscriber.findOne({ email });
    if (existingSubscriber) {
      return res.status(400).json({ message: 'Cet email est déjà inscrit' });
    }
    
    // Créer un nouvel inscrit
    const subscriber = new Subscriber({ firstName, email });
    await subscriber.save();
    
    // Envoyer l'email de confirmation
    try {
      await sendConfirmationEmail(subscriber);
    } catch (emailError) {
      console.error('Erreur lors de l\'envoi de l\'email:', emailError);
      // Ne pas renvoyer d'erreur car l'inscription est réussie
    }
    
    res.status(201).json({ 
      message: 'Inscription réussie! Un email de confirmation a été envoyé.',
      subscriber 
    });
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de l\'inscription', error: error.message });
  }
};

exports.getAllSubscribers = async (req, res) => {
  try {
    const subscribers = await Subscriber.find().sort({ createdAt: -1 });
    res.json(subscribers);
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la récupération des inscrits', error: error.message });
  }
};

exports.getSubscriberById = async (req, res) => {
  try {
    const subscriber = await Subscriber.findById(req.params.id);
    if (!subscriber) {
      return res.status(404).json({ message: 'Inscrit non trouvé' });
    }
    res.json(subscriber);
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la récupération de l\'inscrit', error: error.message });
  }
};

exports.deleteSubscriber = async (req, res) => {
  try {
    const subscriber = await Subscriber.findByIdAndDelete(req.params.id);
    if (!subscriber) {
      return res.status(404).json({ message: 'Inscrit non trouvé' });
    }
    res.json({ message: 'Inscrit supprimé avec succès' });
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la suppression de l\'inscrit', error: error.message });
  }
};