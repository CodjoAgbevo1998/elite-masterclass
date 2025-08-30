const Masterclass = require('../models/Masterclass');

exports.getMasterclassInfo = async (req, res) => {
  try {
    let masterclass = await Masterclass.findOne();
    
    // Si aucune information n'existe, renvoyer des valeurs par défaut
    if (!masterclass) {
      masterclass = {
        title: 'EliteMasterclass 2025 - Business en Ligne',
        date: new Date('2025-09-15T19:00:00'),
        description: 'Devenez Libre Financièrement avec Votre Business en Ligne'
      };
    }
    
    res.json(masterclass);
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la récupération des informations', error: error.message });
  }
};

exports.updateMasterclassInfo = async (req, res) => {
  try {
    const { title, date, description } = req.body;
    
    let masterclass = await Masterclass.findOne();
    
    if (masterclass) {
      // Mettre à jour les informations existantes
      masterclass.title = title || masterclass.title;
      masterclass.date = date || masterclass.date;
      masterclass.description = description || masterclass.description;
      await masterclass.save();
    } else {
      // Créer de nouvelles informations
      masterclass = new Masterclass({ title, date, description });
      await masterclass.save();
    }
    
    res.json({ message: 'Informations mises à jour avec succès', masterclass });
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la mise à jour des informations', error: error.message });
  }
};