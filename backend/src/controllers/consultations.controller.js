const prisma = require('../utils/prisma');
const { logAction } = require('../utils/logger');

exports.getAll = async (req, res) => {
  try {
    const consultations = await prisma.consultation.findMany({ 
      include: {
        documents: {
          include: { uploader: { select: { username: true } } },
          orderBy: { createdAt: 'desc' }
        },
        vvkConclusion: true
      },
      orderBy: { consultationDate: 'desc' } 
    });
    res.json(consultations);
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

exports.getById = async (req, res) => {
  try {
    const consultation = await prisma.consultation.findUnique({
      where: { id: req.params.id },
      include: {
        documents: {
          include: { uploader: { select: { username: true } } },
          orderBy: { createdAt: 'desc' }
        },
        vvkConclusion: true
      }
    });

    if (!consultation) return res.status(404).json({ error: 'Consultation not found' });

    consultation.archiveDocuments = [];
    if (consultation.personId) {
      const pastHosp = await prisma.patient.findMany({
        where: { personId: consultation.personId, admissionDate: { lt: consultation.consultationDate } },
        select: { id: true }
      });
      const pastCons = await prisma.consultation.findMany({
        where: { personId: consultation.personId, id: { not: consultation.id }, consultationDate: { lt: consultation.consultationDate } },
        select: { id: true }
      });

      const orConditions = [];
      if (pastHosp.length > 0) orConditions.push({ patientId: { in: pastHosp.map(h => h.id) } });
      if (pastCons.length > 0) orConditions.push({ consultationId: { in: pastCons.map(c => c.id) } });

      if (orConditions.length > 0) {
        consultation.archiveDocuments = await prisma.document.findMany({
          where: { OR: orConditions },
          orderBy: { createdAt: 'desc' },
          include: { uploader: { select: { username: true } } }
        });
      }
    }

    res.json(consultation);
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

exports.create = async (req, res) => {
  try {
    const {
      personId, tokenNumber, rank, militaryUnit, militaryStatus, isSvoParticipant,
      fullName, birthDate, address, phoneNumber, relativeRelation, relativeFullName, relativePhone, relativeAddress,
      diagnosis, consultationDate, nextConsultationDate, notes, type, vvkConclusion
    } = req.body;

    let finalPersonId = personId;
    if (!finalPersonId) {
      if (tokenNumber && tokenNumber.trim() !== '') {
        let existing = await prisma.patient.findFirst({ where: { tokenNumber: tokenNumber.trim() }, orderBy: { createdAt: 'desc' } });
        if (!existing) existing = await prisma.consultation.findFirst({ where: { tokenNumber: tokenNumber.trim() }, orderBy: { createdAt: 'desc' } });
        if (existing && existing.personId) finalPersonId = existing.personId;
      }
      
      if (!finalPersonId && fullName && birthDate) {
        const bd = new Date(birthDate);
        let existingPatients = await prisma.patient.findMany({ where: { birthDate: bd }, orderBy: { createdAt: 'desc' } });
        let existing = existingPatients.find(p => p.fullName === fullName.trim());
        
        if (!existing) {
          let existingCons = await prisma.consultation.findMany({ where: { birthDate: bd }, orderBy: { createdAt: 'desc' } });
          existing = existingCons.find(c => c.fullName === fullName.trim());
        }
        
        if (existing && existing.personId) finalPersonId = existing.personId;
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
        notes, doctorId: req.user.id, type: type || 'REGULAR',
        ...(type === 'VVK' && vvkConclusion ? {
          vvkConclusion: {
            create: {
              status: vvkConclusion.status || 'IN_PROGRESS',
              neurologistCategory: vvkConclusion.neurologistCategory || null,
              ophthalmologistCategory: vvkConclusion.ophthalmologistCategory || null,
              dentistCategory: vvkConclusion.dentistCategory || null,
              surgeonCategory: vvkConclusion.surgeonCategory || null,
              therapistCategory: vvkConclusion.therapistCategory || null,
              finalCategory: vvkConclusion.finalCategory || null,
              medicalLeaveDays: vvkConclusion.medicalLeaveDays || null
            }
          }
        } : {})
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
      diagnosis, consultationDate, nextConsultationDate, notes, type, vvkConclusion
    } = req.body;

    const consult = await prisma.consultation.update({
      where: { id: req.params.id },
      data: {
        tokenNumber, rank, militaryUnit, militaryStatus, isSvoParticipant: Boolean(isSvoParticipant),
        fullName, birthDate: birthDate ? new Date(birthDate) : undefined, address, phoneNumber, relativeRelation, relativeFullName, relativePhone, relativeAddress,
        diagnosis, consultationDate: consultationDate ? new Date(consultationDate) : undefined, nextConsultationDate: nextConsultationDate ? new Date(nextConsultationDate) : null, notes,
        type: type || 'REGULAR',
        ...(type === 'VVK' && vvkConclusion ? {
          vvkConclusion: {
            upsert: {
              create: {
                status: vvkConclusion.status || 'IN_PROGRESS',
                neurologistCategory: vvkConclusion.neurologistCategory || null,
                ophthalmologistCategory: vvkConclusion.ophthalmologistCategory || null,
                dentistCategory: vvkConclusion.dentistCategory || null,
                surgeonCategory: vvkConclusion.surgeonCategory || null,
                therapistCategory: vvkConclusion.therapistCategory || null,
                finalCategory: vvkConclusion.finalCategory || null,
                medicalLeaveDays: vvkConclusion.medicalLeaveDays || null
              },
              update: {
                status: vvkConclusion.status || 'IN_PROGRESS',
                neurologistCategory: vvkConclusion.neurologistCategory || null,
                ophthalmologistCategory: vvkConclusion.ophthalmologistCategory || null,
                dentistCategory: vvkConclusion.dentistCategory || null,
                surgeonCategory: vvkConclusion.surgeonCategory || null,
                therapistCategory: vvkConclusion.therapistCategory || null,
                finalCategory: vvkConclusion.finalCategory || null,
                medicalLeaveDays: vvkConclusion.medicalLeaveDays || null
              }
            }
          }
        } : {})
      }
    });

    await logAction(req.user.id, 'UPDATE', 'Consultation', consult.id, { fullName: consult.fullName, diagnosis: consult.diagnosis });
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
