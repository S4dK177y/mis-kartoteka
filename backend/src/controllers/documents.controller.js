const fs = require('fs');
const path = require('path');
const jwt = require('jsonwebtoken');
const prisma = require('../utils/prisma');
const { logAction } = require('../utils/logger');
const { JWT_SECRET } = require('../middlewares/auth');
const { storageDir } = require('../middlewares/upload');
const cryptoUtil = require('../utils/crypto');
const crypto = require('crypto');

exports.upload = async (req, res) => {
  try {
    const file = req.file;
    if (!file) return res.status(400).json({ error: 'No file uploaded' });
    
    file.originalname = Buffer.from(file.originalname, 'latin1').toString('utf8');
    const sanitizedName = file.originalname.replace(/[^a-zA-Zа-яА-Я0-9.\-_ ]/g, '_');
    const filename = Date.now() + '-' + Math.round(Math.random() * 1E9) + '-' + sanitizedName;

    let personId = null;
    if (req.params.patientId) {
      const patient = await prisma.patient.findUnique({ where: { id: req.params.patientId }});
      personId = patient ? patient.personId : null;
    } else if (req.params.consultationId) {
      const consultation = await prisma.consultation.findUnique({ where: { id: req.params.consultationId }});
      personId = consultation ? consultation.personId : null;
    }

    const document = await prisma.document.create({
      data: {
        filename: filename,
        originalName: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
        patientId: req.params.patientId || null,
        consultationId: req.params.consultationId || null,
        personId: personId,
        uploadedById: req.user.id
      }
    });

    const entityId = req.params.patientId || req.params.consultationId || 'unassigned';
    
    const entityDir = path.join(storageDir, entityId);
    if (!fs.existsSync(entityDir)) fs.mkdirSync(entityDir, { recursive: true });
    
    const filePath = path.join(entityDir, filename);
    const finalBuffer = await cryptoUtil.encryptBufferAsync(file.buffer);
    fs.writeFileSync(filePath, finalBuffer);

    await logAction(req.user.id, 'UPLOAD', 'Document', document.id, { originalName: file.originalname, entityId });
    res.status(201).json(document);
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error', details: error.message });
  }
};

exports.uploadVvk = async (req, res) => {
  try {
    const file = req.file;
    if (!file) return res.status(400).json({ error: 'No file uploaded' });
    
    file.originalname = Buffer.from(file.originalname, 'latin1').toString('utf8');
    const sanitizedName = file.originalname.replace(/[^a-zA-Zа-яА-Я0-9.\-_ ]/g, '_');
    const filename = Date.now() + '-' + Math.round(Math.random() * 1E9) + '-' + sanitizedName;

    const consultationId = req.params.consultationId;
    const consultation = await prisma.consultation.findUnique({ where: { id: consultationId }, include: { vvkConclusion: true }});
    if (!consultation) {
      return res.status(404).json({ error: 'Consultation not found' });
    }

    if (consultation.type !== 'VVK') {
      await prisma.consultation.update({ where: { id: consultationId }, data: { type: 'VVK' } });
    }

    const document = await prisma.document.create({
      data: {
        filename: filename,
        originalName: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
        consultationId: consultationId,
        personId: consultation.personId,
        uploadedById: req.user.id
      }
    });

    await prisma.vvkConclusion.upsert({
      where: { consultationId: consultationId },
      create: {
        consultationId: consultationId,
        status: 'IN_PROGRESS',
        documentId: document.id
      },
      update: {
        documentId: document.id
      }
    });

    const entityDir = path.join(storageDir, consultationId);
    if (!fs.existsSync(entityDir)) fs.mkdirSync(entityDir, { recursive: true });
    const filePath = path.join(entityDir, filename);
    
    const finalBuffer = await cryptoUtil.encryptBufferAsync(file.buffer);
    fs.writeFileSync(filePath, finalBuffer);

    await logAction(req.user.id, 'UPLOAD', 'Document VVK', document.id, { originalName: file.originalname, consultationId });
    res.status(201).json(document);
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error', details: error.message });
  }
};

exports.download = async (req, res) => {
  try {
    const token = req.cookies.token || req.query.token;
    if (!token) return res.status(401).json({ error: 'Unauthorized' });

    try {
      jwt.verify(token, JWT_SECRET);
    } catch(err) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const document = await prisma.document.findUnique({ where: { id: req.params.id } });
    if (!document) return res.status(404).json({ error: 'Document not found' });

    const entityId = document.patientId || document.consultationId || 'unassigned';
    const filePath = path.join(storageDir, entityId, document.filename);
    if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'File not found on disk' });

    const inline = req.query.inline === 'true';
    const disposition = inline ? 'inline' : 'attachment';

    res.setHeader('Content-Disposition', `${disposition}; filename="${encodeURIComponent(document.originalName)}"`);
    res.setHeader('Content-Type', document.mimeType);
    
    // Read and Decrypt
    const fileBuffer = fs.readFileSync(filePath);
    
    // Very basic heuristic: if it's too small to contain IV and AuthTag or not encrypted, just send it (migration fallback)
    if (fileBuffer.length < 28) {
      return res.send(fileBuffer);
    }
    
    // To properly differentiate between migrated encrypted files and raw files,
    // we can either assume it's encrypted (if encryption is initialized) or check a magic signature.
    // Assuming all new files are encrypted:
    try {
      const decrypted = await cryptoUtil.decryptBufferAsync(fileBuffer);
      res.send(decrypted);
    } catch (err) {
      // Fallback for unencrypted files
      res.sendFile(filePath);
    }
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

exports.remove = async (req, res) => {
  try {
    const document = await prisma.document.findUnique({ where: { id: req.params.id } });
    if (!document) return res.status(404).json({ error: 'Document not found' });

    const entityId = document.patientId || document.consultationId || 'unassigned';
    const filePath = path.join(storageDir, entityId, document.filename);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    await prisma.document.delete({ where: { id: req.params.id } });
    await logAction(req.user.id, 'DELETE', 'Document', req.params.id, { originalName: document.originalName });
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
};
