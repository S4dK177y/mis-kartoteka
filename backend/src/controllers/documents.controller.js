const fs = require('fs');
const path = require('path');
const jwt = require('jsonwebtoken');
const prisma = require('../utils/prisma');
const { logAction } = require('../utils/logger');
const { JWT_SECRET } = require('../middlewares/auth');
const { storageDir } = require('../middlewares/upload');

exports.upload = async (req, res) => {
  try {
    const file = req.file;
    if (!file) return res.status(400).json({ error: 'No file uploaded' });

    const patient = await prisma.patient.findUnique({ where: { id: req.params.patientId }});

    const document = await prisma.document.create({
      data: {
        filename: file.filename,
        originalName: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
        patientId: req.params.patientId,
        personId: patient ? patient.personId : null,
        uploadedById: req.user.id
      }
    });

    await logAction(req.user.id, 'UPLOAD', 'Document', document.id, { originalName: file.originalname, patientId: req.params.patientId });
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

    const filePath = path.join(storageDir, document.patientId, document.filename);
    if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'File not found on disk' });

    const inline = req.query.inline === 'true';
    const disposition = inline ? 'inline' : 'attachment';

    res.setHeader('Content-Disposition', `${disposition}; filename="${encodeURIComponent(document.originalName)}"`);
    res.setHeader('Content-Type', document.mimeType);
    res.sendFile(filePath);
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

exports.remove = async (req, res) => {
  try {
    const document = await prisma.document.findUnique({ where: { id: req.params.id } });
    if (!document) return res.status(404).json({ error: 'Document not found' });

    const filePath = path.join(storageDir, document.patientId, document.filename);
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
