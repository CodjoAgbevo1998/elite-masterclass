const express = require('express');
const router = express.Router();
const subscriberController = require('../controllers/subscriberController');
const auth = require('../middleware/auth');

// Routes publiques
router.post('/', subscriberController.createSubscriber);

// Routes protégées (nécessitent une authentification)
router.get('/', auth, subscriberController.getAllSubscribers);
router.get('/:id', auth, subscriberController.getSubscriberById);
router.delete('/:id', auth, subscriberController.deleteSubscriber);

module.exports = router;