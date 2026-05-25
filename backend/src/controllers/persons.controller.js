const prisma = require('../utils/prisma');
const { aggregatePersons } = require('../utils/aggregation');

exports.getAll = async (req, res) => {
  try {
    const patients = await prisma.patient.findMany({ orderBy: { createdAt: 'desc' } });
    const consultations = await prisma.consultation.findMany({ orderBy: { createdAt: 'desc' } });
    
    const personsList = aggregatePersons(patients, consultations);
    
    res.json(personsList);
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error', details: error.message });
  }
};

exports.getById = async (req, res) => {
  try {
    const { personId } = req.params;
    
    const patients = await prisma.patient.findMany({ where: { personId }, orderBy: { createdAt: 'desc' } });
    const consultations = await prisma.consultation.findMany({ where: { personId }, orderBy: { createdAt: 'desc' } });
    const documents = await prisma.document.findMany({ 
      where: { personId }, 
      include: { uploader: { select: { username: true } } },
      orderBy: { createdAt: 'desc' } 
    });
    
    const personsList = aggregatePersons(patients, consultations);
    const personInfo = personsList.length > 0 ? personsList[0] : null;
    
    if (!personInfo) return res.status(404).json({ error: 'Person not found' });
    
    res.json({ ...personInfo, hospitalizations: patients, consultations: consultations, documents: documents });
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
};
