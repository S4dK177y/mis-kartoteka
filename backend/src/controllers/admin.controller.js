const bcrypt = require('bcryptjs');
const prisma = require('../utils/prisma');
const { logAction } = require('../utils/logger');

exports.getUsers = async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: { id: true, username: true, role: true, createdAt: true },
      orderBy: { createdAt: 'desc' }
    });
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

exports.createUser = async (req, res) => {
  try {
    const { username, password, role } = req.body;
    if (!username || !password) return res.status(400).json({ error: 'Missing credentials' });

    const hash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { username, passwordHash: hash, role: role || 'DOCTOR' },
      select: { id: true, username: true, role: true, createdAt: true }
    });
    
    await logAction(req.user.id, 'CREATE', 'User', user.id, { username, role });
    res.json(user);
  } catch (err) {
    res.status(400).json({ error: 'Username already exists' });
  }
};

exports.updateUserRole = async (req, res) => {
  try {
    const { role } = req.body;
    const user = await prisma.user.update({
      where: { id: req.params.id },
      data: { role },
      select: { id: true, username: true, role: true, createdAt: true }
    });
    await logAction(req.user.id, 'UPDATE', 'User', user.id, { newRole: role });
    res.json(user);
  } catch (err) {
    res.status(400).json({ error: 'Failed to update user role' });
  }
};

exports.getLogs = async (req, res) => {
  try {
    const logs = await prisma.auditLog.findMany({
      include: { user: { select: { username: true } } },
      orderBy: { createdAt: 'desc' },
      take: 200
    });
    res.json(logs);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

exports.getLogStats = async (req, res) => {
  try {
    const logs = await prisma.auditLog.findMany();
    let exactBytes = 0;
    logs.forEach(log => {
      exactBytes += Buffer.byteLength(log.id || '', 'utf8');
      exactBytes += Buffer.byteLength(log.userId || '', 'utf8');
      exactBytes += Buffer.byteLength(log.action || '', 'utf8');
      exactBytes += Buffer.byteLength(log.entity || '', 'utf8');
      exactBytes += Buffer.byteLength(log.entityId || '', 'utf8');
      exactBytes += Buffer.byteLength(log.details || '', 'utf8');
      exactBytes += 24; // timestamp approximate size
    });
    
    res.json({ totalLogs: logs.length, exactBytes });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

exports.getSettings = async (req, res) => {
  try {
    const settings = await prisma.setting.findMany();
    const map = {};
    settings.forEach(s => {
      try { map[s.key] = JSON.parse(s.value); } catch(e) { map[s.key] = s.value; }
    });
    res.json(map);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

exports.updateSettings = async (req, res) => {
  try {
    const updates = req.body;
    for (const key of Object.keys(updates)) {
      const value = typeof updates[key] === 'object' ? JSON.stringify(updates[key]) : updates[key].toString();
      await prisma.setting.upsert({
        where: { key },
        update: { value },
        create: { key, value }
      });
    }
    await logAction(req.user.id, 'UPDATE', 'Settings', 'global', updates);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update settings' });
  }
};
