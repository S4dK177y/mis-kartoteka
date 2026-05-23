const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const { PrismaClient } = require('@prisma/client');
const exceljs = require('exceljs');

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 8080;

// Middleware
app.use(cors());
app.use(express.json());

// Setup Storage Directory for uploaded files
const storageDir = path.join(__dirname, '..', 'data', 'storage');
if (!fs.existsSync(storageDir)) {
  fs.mkdirSync(storageDir, { recursive: true });
}

// Configure Multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const patientId = req.params.patientId || 'unassigned';
    const patientDir = path.join(storageDir, patientId);
    if (!fs.existsSync(patientDir)) {
      fs.mkdirSync(patientDir, { recursive: true });
    }
    cb(null, patientDir);
  },
  filename: (req, file, cb) => {
    // Decode original name from latin1 to utf8 (fix for Cyrillic filenames)
    file.originalname = Buffer.from(file.originalname, 'latin1').toString('utf8');
    
    // Sanitize filename
    const sanitizedName = file.originalname.replace(/[^a-zA-Zа-яА-Я0-9.\-_ ]/g, '_');
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + sanitizedName);
  }
});
const upload = multer({ storage });

// API Routes

// --- PATIENTS ---
// Get all patients
app.get('/api/patients', async (req, res) => {
  try {
    const patients = await prisma.patient.findMany({
      orderBy: { createdAt: 'desc' }
    });
    res.json(patients);
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Get a single patient
app.get('/api/patients/:id', async (req, res) => {
  try {
    const patient = await prisma.patient.findUnique({
      where: { id: req.params.id },
      include: { 
        documents: { orderBy: { createdAt: 'desc' } },
        transfers: { orderBy: { transferDate: 'desc' } }
      }
    });
    if (!patient) return res.status(404).json({ error: 'Patient not found' });
    res.json(patient);
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Create a new patient
app.post('/api/patients', async (req, res) => {
  try {
    const { tokenNumber, fullName, birthDate, address, diagnosis, department, admissionDate } = req.body;
    
    const newPatient = await prisma.patient.create({
      data: {
        tokenNumber,
        fullName,
        birthDate: new Date(birthDate),
        address,
        diagnosis,
        department,
        admissionDate: admissionDate ? new Date(admissionDate) : new Date(),
        status: 'На лечении',
        transfers: {
          create: {
            toDepartment: department,
            transferDate: admissionDate ? new Date(admissionDate) : new Date()
          }
        }
      }
    });
    res.status(201).json(newPatient);
  } catch (error) {
    res.status(400).json({ error: 'Bad Request', details: error.message });
  }
});

// Update a patient
app.put('/api/patients/:id', async (req, res) => {
  try {
    const { tokenNumber, fullName, birthDate, address, diagnosis, department, admissionDate, dischargeDate, dischargeDestination, status } = req.body;
    
    const updatedPatient = await prisma.patient.update({
      where: { id: req.params.id },
      data: {
        tokenNumber,
        fullName,
        birthDate: birthDate ? new Date(birthDate) : undefined,
        address,
        diagnosis,
        department,
        admissionDate: admissionDate ? new Date(admissionDate) : undefined,
        dischargeDate: dischargeDate ? new Date(dischargeDate) : null,
        dischargeDestination: dischargeDestination || null,
        status
      }
    });
    res.json(updatedPatient);
  } catch (error) {
    res.status(400).json({ error: 'Bad Request', details: error.message });
  }
});

// Transfer a patient
app.post('/api/patients/:id/transfer', async (req, res) => {
  try {
    const { toDepartment } = req.body;
    if (!toDepartment) return res.status(400).json({ error: 'toDepartment is required' });
    
    const patient = await prisma.patient.findUnique({ where: { id: req.params.id } });
    if (!patient) return res.status(404).json({ error: 'Patient not found' });
    
    const updatedPatient = await prisma.patient.update({
      where: { id: req.params.id },
      data: {
        department: toDepartment,
        transfers: {
          create: {
            fromDepartment: patient.department,
            toDepartment: toDepartment,
            transferDate: new Date()
          }
        }
      }
    });
    res.json(updatedPatient);
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Delete a patient
app.delete('/api/patients/:id', async (req, res) => {
  try {
    await prisma.patient.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// --- DOCUMENTS ---
// Upload document for a patient
app.post('/api/patients/:patientId/documents', upload.single('file'), async (req, res) => {
  try {
    const file = req.file;
    if (!file) return res.status(400).json({ error: 'No file uploaded' });

    const document = await prisma.document.create({
      data: {
        filename: file.filename,
        originalName: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
        patientId: req.params.patientId
      }
    });
    res.status(201).json(document);
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error', details: error.message });
  }
});

// Download/View document
app.get('/api/documents/:id', async (req, res) => {
  try {
    const document = await prisma.document.findUnique({ where: { id: req.params.id } });
    if (!document) return res.status(404).json({ error: 'Document not found' });

    const filePath = path.join(storageDir, document.patientId, document.filename);
    if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'File not found on disk' });

    res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(document.originalName)}"`);
    res.setHeader('Content-Type', document.mimeType);
    res.sendFile(filePath);
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Delete document
app.delete('/api/documents/:id', async (req, res) => {
  try {
    const document = await prisma.document.findUnique({ where: { id: req.params.id } });
    if (!document) return res.status(404).json({ error: 'Document not found' });

    const filePath = path.join(storageDir, document.patientId, document.filename);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    await prisma.document.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// --- EXCEL EXPORT ---
app.get('/api/export/patients', async (req, res) => {
  try {
    const patients = await prisma.patient.findMany({
      orderBy: { createdAt: 'desc' }
    });

    const workbook = new exceljs.Workbook();
    const worksheet = workbook.addWorksheet('Пациенты');

    worksheet.columns = [
      { header: 'Жетон', key: 'tokenNumber', width: 15 },
      { header: 'ФИО', key: 'fullName', width: 30 },
      { header: 'Дата рождения', key: 'birthDate', width: 15 },
      { header: 'Адрес', key: 'address', width: 30 },
      { header: 'Диагноз', key: 'diagnosis', width: 30 },
      { header: 'Отделение', key: 'department', width: 25 },
      { header: 'Дата поступления', key: 'admissionDate', width: 15 },
      { header: 'Статус', key: 'status', width: 15 },
      { header: 'Дата выписки', key: 'dischargeDate', width: 15 },
      { header: 'Куда выписан/переведен', key: 'dischargeDestination', width: 30 }
    ];

    patients.forEach(p => {
      worksheet.addRow({
        tokenNumber: p.tokenNumber || '',
        fullName: p.fullName,
        birthDate: p.birthDate.toISOString().split('T')[0],
        address: p.address || '',
        diagnosis: p.diagnosis || '',
        department: p.department,
        admissionDate: p.admissionDate.toISOString().split('T')[0],
        status: p.status,
        dischargeDate: p.dischargeDate ? p.dischargeDate.toISOString().split('T')[0] : '',
        dischargeDestination: p.dischargeDestination || ''
      });
    });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="patients.xlsx"');
    
    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Serve Frontend Static Files
const frontendDistPath = path.join(__dirname, '..', 'frontend', 'dist');
app.use(express.static(frontendDistPath));

// SPA Fallback: send index.html for any other request
app.get(/.*/, (req, res) => {
  if (fs.existsSync(path.join(frontendDistPath, 'index.html'))) {
    res.sendFile(path.join(frontendDistPath, 'index.html'));
  } else {
    res.status(404).send('Frontend is not built. Please run "npm run build" in the frontend directory.');
  }
});

// Start the server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Сервер запущен на порту ${PORT}`);
});
