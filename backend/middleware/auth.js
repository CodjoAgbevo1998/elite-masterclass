const jwt = require('jsonwebtoken');

const auth = (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ message: 'Accès refusé. Token manquant.' });
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'elitemasterclass_secret_jwt_2025');
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Token invalide.' });
  }
};

module.exports = auth;