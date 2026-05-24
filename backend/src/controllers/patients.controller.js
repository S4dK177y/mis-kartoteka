const prisma = require('../utils/prisma');
const { logAction } = require('../utils/logger');

exports.getStatus = async (req, res) => {
  try {
    const count = await prisma.user.count();
    res.json({ needsSetup: count === 0 });
  } catch (err) {
    res.json({ needsSetup: true });
  }
};

exports.getAll = async (req, res) => {
  try {
    const patients = await prisma.patient.findMany({
      orderBy: { createdAt: 'desc' }
    });
    res.json(patients);
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

exports.getById = async (req, res) => {
  try {
    const patient = await prisma.patient.findUnique({
      where: { id: req.params.id },
      include: { transfers: { orderBy: { transferDate: 'desc' } } }
    });
    if (!patient) return res.status(404).json({ error: 'Patient not found' });

    let docWhere = patient.personId ? { personId: patient.personId } : { patientId: patient.id };
    
    patient.documents = await prisma.document.findMany({
      where: docWhere,
      orderBy: { createdAt: 'desc' },
      include: { uploader: { select: { username: true } } }
    });

    let history = [];
    let consultations = [];
    if (patient.personId) {
      history = await prisma.patient.findMany({
        where: { personId: patient.personId, id: { not: patient.id } },
        orderBy: { admissionDate: 'desc' },
        select: { id: true, admissionDate: true, dischargeDate: true, caseHistoryNumber: true, finalDiagnosis: true, clinicalDiagnosis: true, status: true, department: true }
      });
      consultations = await prisma.consultation.findMany({
        where: { personId: patient.personId },
        orderBy: { consultationDate: 'desc' }
      });
    }
    patient.history = history;
    patient.consultations = consultations;

    res.json(patient);
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

exports.create = async (req, res) => {
  try {
    const { 
      tokenNumber, caseHistoryNumber, rank, militaryUnit, militaryStatus, isSvoParticipant, fullName, birthDate, address, 
      phoneNumber, relativeRelation, relativeFullName, relativePhone, relativeAddress,
      admissionDiagnosis, clinicalDiagnosis, finalDiagnosis, complications,
      department, admissionDate, personId
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
    }
    
    const newPatient = await prisma.patient.create({
      data: {
        personId: finalPersonId || undefined,
        tokenNumber, caseHistoryNumber, rank, militaryUnit, militaryStatus, isSvoParticipant: Boolean(isSvoParticipant),
        fullName, birthDate: new Date(birthDate), address, phoneNumber, relativeRelation, relativeFullName, relativePhone, relativeAddress,
        admissionDiagnosis, clinicalDiagnosis, finalDiagnosis, complications, department,
        admissionDate: admissionDate ? new Date(admissionDate) : new Date(), status: 'На лечении',
        transfers: { create: { toDepartment: department, transferDate: admissionDate ? new Date(admissionDate) : new Date() } }
      }
    });

    await logAction(req.user.id, 'CREATE', 'Patient', newPatient.id, { fullName: newPatient.fullName, caseHistoryNumber });
    res.status(201).json(newPatient);
  } catch (error) {
    res.status(400).json({ error: 'Bad Request', details: error.message });
  }
};

exports.update = async (req, res) => {
  try {
    const { 
      tokenNumber, caseHistoryNumber, rank, militaryUnit, militaryStatus, isSvoParticipant, fullName, birthDate, address, 
      phoneNumber, relativeRelation, relativeFullName, relativePhone, relativeAddress,
      admissionDiagnosis, clinicalDiagnosis, finalDiagnosis, complications,
      department, admissionDate, dischargeDate, dischargeDestination, status 
    } = req.body;
    
    const existingPatient = await prisma.patient.findUnique({ where: { id: req.params.id } });
    if (!existingPatient) return res.status(404).json({ error: 'Patient not found' });

    const updatedPatient = await prisma.patient.update({
      where: { id: req.params.id },
      data: {
        tokenNumber, caseHistoryNumber, rank, militaryUnit, militaryStatus, isSvoParticipant: Boolean(isSvoParticipant),
        fullName, birthDate: birthDate ? new Date(birthDate) : undefined, address, phoneNumber, relativeRelation, relativeFullName, relativePhone, relativeAddress,
        admissionDiagnosis, clinicalDiagnosis, finalDiagnosis, complications, department,
        admissionDate: admissionDate ? new Date(admissionDate) : undefined, dischargeDate: dischargeDate ? new Date(dischargeDate) : null, dischargeDestination: dischargeDestination || null, status
      }
    });

    const diff = {};
    const checkFields = ['tokenNumber', 'caseHistoryNumber', 'rank', 'militaryUnit', 'militaryStatus', 'isSvoParticipant', 'fullName', 'address', 'admissionDiagnosis', 'clinicalDiagnosis', 'finalDiagnosis', 'complications', 'department', 'status', 'dischargeDestination'];
    checkFields.forEach(field => {
      if (existingPatient[field] !== updatedPatient[field]) {
        if (existingPatient[field] || updatedPatient[field]) diff[field] = { old: existingPatient[field], new: updatedPatient[field] };
      }
    });
    
    if (existingPatient.birthDate?.getTime() !== updatedPatient.birthDate?.getTime()) diff.birthDate = { old: existingPatient.birthDate, new: updatedPatient.birthDate };
    if (existingPatient.admissionDate?.getTime() !== updatedPatient.admissionDate?.getTime()) diff.admissionDate = { old: existingPatient.admissionDate, new: updatedPatient.admissionDate };
    if (existingPatient.dischargeDate?.getTime() !== updatedPatient.dischargeDate?.getTime()) diff.dischargeDate = { old: existingPatient.dischargeDate, new: updatedPatient.dischargeDate };

    if (Object.keys(diff).length > 0) await logAction(req.user.id, 'UPDATE', 'Patient', updatedPatient.id, { changes: diff });

    res.json(updatedPatient);
  } catch (error) {
    res.status(400).json({ error: 'Bad Request', details: error.message });
  }
};

exports.transfer = async (req, res) => {
  try {
    const { toDepartment, transferDate } = req.body;
    if (!toDepartment) return res.status(400).json({ error: 'toDepartment is required' });
    
    const patient = await prisma.patient.findUnique({ where: { id: req.params.id } });
    if (!patient) return res.status(404).json({ error: 'Patient not found' });
    
    const updatedPatient = await prisma.patient.update({
      where: { id: req.params.id },
      data: {
        department: toDepartment,
        transfers: { create: { fromDepartment: patient.department, toDepartment: toDepartment, transferDate: transferDate ? new Date(transferDate) : new Date() } }
      }
    });

    await logAction(req.user.id, 'TRANSFER', 'Patient', updatedPatient.id, { from: patient.department, to: toDepartment });
    res.json(updatedPatient);
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

exports.remove = async (req, res) => {
  try {
    await prisma.patient.delete({ where: { id: req.params.id } });
    await logAction(req.user.id, 'DELETE', 'Patient', req.params.id, null);
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
};
