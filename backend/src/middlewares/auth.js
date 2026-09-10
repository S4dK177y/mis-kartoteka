const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const JWT_SECRET = process.env.JWT_SECRET || crypto.randomBytes(64).toString('hex');

const authenticateToken = (req, res, next) => {
  const token = req.cookies.token || (req.headers['authorization'] && req.headers['authorization'].split(' ')[1]);
  if (!token) return res.status(401).json({ error: 'Unauthorized' });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Forbidden' });

    if (user.username === 'demo') {
      if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method)) {
        if (req.originalUrl !== '/api/auth/logout') {
          return res.status(403).json({ error: 'В демо-аккаунте изменение данных запрещено. Доступен только просмотр.' });
        }
      }
    }

    req.user = user;
    next();
  });
};

const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'ADMIN') return res.status(403).json({ error: 'Admin access required' });
  next();
};

module.exports = {
  authenticateToken,
  requireAdmin,
  JWT_SECRET
};
