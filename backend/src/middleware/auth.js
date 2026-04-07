const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret';

// Role store (in production: DB)
const roleStore = new Map();

function requireAuth(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth?.startsWith('Bearer ')) return res.status(401).json({ error: 'Missing token' });
  try {
    req.user = jwt.verify(auth.slice(7), JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
}

function requireRole(...roles) {
  return (req, res, next) => {
    const role = roleStore.get(req.user?.publicKey) || 'student';
    if (!roles.includes(role)) return res.status(403).json({ error: 'Forbidden' });
    req.role = role;
    next();
  };
}

function setRole(publicKey, role) {
  roleStore.set(publicKey, role);
}

function getRole(publicKey) {
  return roleStore.get(publicKey) || 'student';
}

module.exports = { requireAuth, requireRole, setRole, getRole };
