const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../utils/prisma');
const { logAction } = require('../utils/logger');
const { JWT_SECRET } = require('../middlewares/auth');

exports.setup = async (req, res) => {
  try {
    const count = await prisma.user.count();
    if (count > 0) return res.status(400).json({ error: 'System already setup' });

    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: 'Missing credentials' });

    const hash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { username, passwordHash: hash, role: 'ADMIN' }
    });
    
    await logAction(user.id, 'CREATE', 'User', user.id, { username, role: 'ADMIN', note: 'Initial setup' });
    res.json({ success: true, message: 'Admin user created successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await prisma.user.findUnique({ where: { username } });
    
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
    
    res.cookie('token', token, {
      httpOnly: true,
      secure: false,
      maxAge: 7 * 24 * 60 * 60 * 1000
    });
    
    await logAction(user.id, 'LOGIN', 'User', user.id, { username: user.username, role: user.role });
    res.json({ token, user: { id: user.id, username: user.username, role: user.role } });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

exports.logout = async (req, res) => {
  try {
    if (req.user) {
      await logAction(req.user.id, 'LOGOUT', 'User', req.user.id, { username: req.user.username });
    }
  } catch (_) {}
  res.clearCookie('token');
  res.json({ success: true });
};

exports.getMe = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ id: user.id, username: user.username, role: user.role });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};
