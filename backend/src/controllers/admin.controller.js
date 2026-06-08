const bcrypt = require('bcryptjs');
const prisma = require('../utils/prisma');
const { logAction } = require('../utils/logger');

exports.getUsers = async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: { id: true, username: true, fullName: true, role: true, createdAt: true },
      orderBy: { createdAt: 'desc' }
    });
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

exports.createUser = async (req, res) => {
  try {
    const { username, password, role, fullName } = req.body;
    if (!username || !password) return res.status(400).json({ error: 'Missing credentials' });

    const hash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { username, passwordHash: hash, fullName, role: role || 'DOCTOR' },
      select: { id: true, username: true, fullName: true, role: true, createdAt: true }
    });
    
    await logAction(req.user.id, 'CREATE', 'User', user.id, { username, role });
    res.json(user);
  } catch (err) {
    res.status(400).json({ error: 'Username already exists' });
  }
};

exports.updateUser = async (req, res) => {
  try {
    const { role, fullName } = req.body;
    const dataToUpdate = {};
    if (role !== undefined) dataToUpdate.role = role;
    if (fullName !== undefined) dataToUpdate.fullName = fullName;

    const user = await prisma.user.update({
      where: { id: req.params.id },
      data: dataToUpdate,
      select: { id: true, username: true, fullName: true, role: true, createdAt: true }
    });
    await logAction(req.user.id, 'UPDATE', 'User', user.id, dataToUpdate);
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

exports.migrateEncryption = async (req, res) => {
  try {
    const patients = await prisma.patient.findMany();
    let pCount = 0;
    for (const p of patients) {
      const dataToUpdate = {};
      const fields = ['fullName', 'address', 'phoneNumber', 'relativeFullName', 'relativePhone', 'relativeAddress', 'dischargeDestination', 'admissionDiagnosis', 'clinicalDiagnosis', 'finalDiagnosis', 'complications', 'rank', 'militaryUnit', 'relativeRelation', 'caseHistoryNumber', 'tokenNumber'];
      for (const f of fields) {
        if (p[f] !== undefined && p[f] !== null) dataToUpdate[f] = p[f];
      }
      if (Object.keys(dataToUpdate).length > 0) {
        await prisma.patient.update({ where: { id: p.id }, data: dataToUpdate });
        pCount++;
      }
    }

    const consultations = await prisma.consultation.findMany();
    let cCount = 0;
    for (const c of consultations) {
      const dataToUpdate = {};
      const fields = ['fullName', 'address', 'phoneNumber', 'relativeFullName', 'relativePhone', 'relativeAddress', 'diagnosis', 'notes', 'rank', 'militaryUnit', 'relativeRelation', 'tokenNumber'];
      for (const f of fields) {
        if (c[f] !== undefined && c[f] !== null) dataToUpdate[f] = c[f];
      }
      
      // Migrate REGULAR to PRIMARY
      if (c.type === 'REGULAR') {
        dataToUpdate.type = 'PRIMARY';
      }

      if (Object.keys(dataToUpdate).length > 0) {
        await prisma.consultation.update({ where: { id: c.id }, data: dataToUpdate });
        cCount++;
      }
    }

    const users = await prisma.user.findMany();
    let uCount = 0;
    for (const u of users) {
      if (u.username !== undefined && u.username !== null) {
        await prisma.user.update({ where: { id: u.id }, data: { username: u.username } });
        uCount++;
      }
    }

    const documents = await prisma.document.findMany();
    let dCount = 0;
    for (const d of documents) {
      const dataToUpdate = {};
      if (d.originalName !== undefined && d.originalName !== null) dataToUpdate.originalName = d.originalName;
      if (d.filename !== undefined && d.filename !== null) dataToUpdate.filename = d.filename;
      
      if (Object.keys(dataToUpdate).length > 0) {
        await prisma.document.update({ where: { id: d.id }, data: dataToUpdate });
        dCount++;
      }
    }

    const vvkConclusions = await prisma.vvkConclusion.findMany();
    let vCount = 0;
    for (const v of vvkConclusions) {
      const dataToUpdate = {};
      const fields = ['neurologistCategory', 'ophthalmologistCategory', 'dentistCategory', 'surgeonCategory', 'therapistCategory', 'finalCategory'];
      for (const f of fields) {
        if (v[f] !== undefined && v[f] !== null) dataToUpdate[f] = v[f];
      }
      if (Object.keys(dataToUpdate).length > 0) {
        await prisma.vvkConclusion.update({ where: { id: v.id }, data: dataToUpdate });
        vCount++;
      }
    }
    
    await logAction(req.user.id, 'SYSTEM', 'Migration', 'Encryption', { patientsMigrated: pCount, consultationsMigrated: cCount, usersMigrated: uCount, documentsMigrated: dCount, vvkConclusionsMigrated: vCount });
    res.json({ success: true, message: `Миграция завершена.\nПациентов: ${pCount}\nКонсультаций: ${cCount}\nВрачей: ${uCount}\nДокументов: ${dCount}\nВВК: ${vCount}` });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Migration failed.' });
  }
};
