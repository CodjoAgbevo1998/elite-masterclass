const express = require('express');
const router = express.Router();
const masterclassController = require('../controllers/masterclassController');
const auth = require('../middleware/auth');

// Routes publiques
router.get('/', masterclassController.getMasterclassInfo);

// Routes protégées
router.put('/', auth, masterclassController.updateMasterclassInfo);

module.exports = router;