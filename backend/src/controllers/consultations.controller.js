const prisma = require('../utils/prisma');
const { logAction } = require('../utils/logger');

exports.getAll = async (req, res) => {
  try {
    const consultations = await prisma.consultation.findMany({ 
      include: {
        documents: {
          include: { uploader: { select: { username: true } } },
          orderBy: { createdAt: 'desc' }
        }
      },
      orderBy: { consultationDate: 'desc' } 
    });
    res.json(consultations);
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

exports.create = async (req, res) => {
  try {
    const {
      personId, tokenNumber, rank, militaryUnit, militaryStatus, isSvoParticipant,
      fullName, birthDate, address, phoneNumber, relativeRelation, relativeFullName, relativePhone, relativeAddress,
      diagnosis, consultationDate, nextConsultationDate, notes
    } = req.body;

    let finalPersonId = personId;
    if (!finalPersonId) {
      const matchConditions = [];
      if (tokenNumber && tokenNumber.trim() !== '') matchConditions.push({ tokenNumber: tokenNumber.trim() });
      if (fullName && birthDate) matchConditions.push({ fullName: fullName.trim(), birthDate: new Date(birthDate) });
      if (matchConditions.length > 0) {
        let existing = await prisma.patient.findFirst({ where: { OR: matchConditions }, orderBy: { createdAt: 'desc' } });
        if (existing && existing.personId) finalPersonId = existing.personId;
        else {
          existing = await prisma.consultation.findFirst({ where: { OR: matchConditions }, orderBy: { createdAt: 'desc' } });
          if (existing && existing.personId) finalPersonId = existing.personId;
        }
      }
      if (!finalPersonId) {
        const crypto = require('crypto');
        finalPersonId = crypto.randomUUID();
      }
    }

    const consult = await prisma.consultation.create({
      data: {
        personId: finalPersonId, tokenNumber, rank, militaryUnit, militaryStatus, isSvoParticipant: Boolean(isSvoParticipant),
        fullName, birthDate: birthDate ? new Date(birthDate) : undefined, address, phoneNumber, relativeRelation, relativeFullName, relativePhone, relativeAddress,
        diagnosis, consultationDate: consultationDate ? new Date(consultationDate) : new Date(), nextConsultationDate: nextConsultationDate ? new Date(nextConsultationDate) : null,
        notes, doctorId: req.user.id
      }
    });

    await logAction(req.user.id, 'CREATE', 'Consultation', consult.id, { fullName });
    res.status(201).json(consult);
  } catch (error) {
    res.status(400).json({ error: 'Bad Request', details: error.message });
  }
};

exports.update = async (req, res) => {
  try {
    const {
      tokenNumber, rank, militaryUnit, militaryStatus, isSvoParticipant,
      fullName, birthDate, address, phoneNumber, relativeRelation, relativeFullName, relativePhone, relativeAddress,
      diagnosis, consultationDate, nextConsultationDate, notes
    } = req.body;

    const consult = await prisma.consultation.update({
      where: { id: req.params.id },
      data: {
        tokenNumber, rank, militaryUnit, militaryStatus, isSvoParticipant: Boolean(isSvoParticipant),
        fullName, birthDate: birthDate ? new Date(birthDate) : undefined, address, phoneNumber, relativeRelation, relativeFullName, relativePhone, relativeAddress,
        diagnosis, consultationDate: consultationDate ? new Date(consultationDate) : undefined, nextConsultationDate: nextConsultationDate ? new Date(nextConsultationDate) : null, notes
      }
    });

    await logAction(req.user.id, 'UPDATE', 'Consultation', consult.id, null);
    res.json(consult);
  } catch (error) {
    res.status(400).json({ error: 'Bad Request' });
  }
};

exports.remove = async (req, res) => {
  try {
    await prisma.consultation.delete({ where: { id: req.params.id } });
    await logAction(req.user.id, 'DELETE', 'Consultation', req.params.id, null);
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
};
