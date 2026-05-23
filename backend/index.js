const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const { PrismaClient } = require('@prisma/client');
const exceljs = require('exceljs');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 8080;
const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key-for-mis-change-in-prod';

// Middleware
app.use(cors({
  origin: true,
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());

// Логирование всех запросов
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    const status = res.statusCode;
    // Don't log static files fetching heavily
    if (req.originalUrl.startsWith('/assets/') || req.originalUrl === '/favicon.ico') return;

    if (status >= 400) {
      console.log(`[ОШИБКА] ${req.method} ${req.originalUrl} - Статус: ${status} (${duration}ms)`);
    } else {
      console.log(`[СИСТЕМА] ${req.method} ${req.originalUrl} - Статус: ${status} (${duration}ms)`);
    }
  });
  next();
});

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
    file.originalname = Buffer.from(file.originalname, 'latin1').toString('utf8');
    const sanitizedName = file.originalname.replace(/[^a-zA-Zа-яА-Я0-9.\-_ ]/g, '_');
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + sanitizedName);
  }
});
const upload = multer({ storage });

// --- AUTH MIDDLEWARE & UTILS ---

const authenticateToken = (req, res, next) => {
  const token = req.cookies.token || (req.headers['authorization'] && req.headers['authorization'].split(' ')[1]);
  if (!token) return res.status(401).json({ error: 'Unauthorized' });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Forbidden' });
    req.user = user;
    next();
  });
};

const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'ADMIN') return res.status(403).json({ error: 'Admin access required' });
  next();
};

const logAction = async (userId, action, entity, entityId, details) => {
  try {
    await prisma.auditLog.create({
      data: {
        userId,
        action,
        entity,
        entityId,
        details: details ? JSON.stringify(details) : null
      }
    });
  } catch (error) {
    console.error('Failed to log action:', error);
  }
};

// --- AUTH ROUTES ---

// Initial setup: Create first admin if no users exist
app.post('/api/auth/setup', async (req, res) => {
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
});

// Login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await prisma.user.findUnique({ where: { username } });
    
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
    
    res.cookie('token', token, {
      httpOnly: true,
      secure: false, // true in production with HTTPS
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });
    
    res.json({ token, user: { id: user.id, username: user.username, role: user.role } });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Logout
app.post('/api/auth/logout', (req, res) => {
  res.clearCookie('token');
  res.json({ success: true });
});

// Get current user profile
app.get('/api/auth/me', authenticateToken, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ id: user.id, username: user.username, role: user.role });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// --- ADMIN ROUTES ---

app.get('/api/users', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: { id: true, username: true, role: true, createdAt: true },
      orderBy: { createdAt: 'desc' }
    });
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/api/users', authenticateToken, requireAdmin, async (req, res) => {
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
});

app.put('/api/users/:id/role', authenticateToken, requireAdmin, async (req, res) => {
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
});

app.get('/api/logs', authenticateToken, requireAdmin, async (req, res) => {
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
});

// --- PATIENTS ---

// Check if setup is needed (public route just for routing)
app.get('/api/system/status', async (req, res) => {
  try {
    const count = await prisma.user.count();
    res.json({ needsSetup: count === 0 });
  } catch (err) {
    // If table doesn't exist yet, return true
    res.json({ needsSetup: true });
  }
});

// Get all patients
app.get('/api/patients', authenticateToken, async (req, res) => {
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
app.get('/api/patients/:id', authenticateToken, async (req, res) => {
  try {
    const patient = await prisma.patient.findUnique({
      where: { id: req.params.id },
      include: { 
        transfers: { orderBy: { transferDate: 'desc' } }
      }
    });
    if (!patient) return res.status(404).json({ error: 'Patient not found' });

    let docWhere = { patientId: patient.id };
    if (patient.personId) {
      docWhere = { personId: patient.personId };
    }
    
    const documents = await prisma.document.findMany({
      where: docWhere,
      orderBy: { createdAt: 'desc' },
      include: { uploader: { select: { username: true } } }
    });

    patient.documents = documents;

    // Fetch history of hospitalizations
    let history = [];
    if (patient.personId) {
      history = await prisma.patient.findMany({
        where: { 
          personId: patient.personId,
          id: { not: patient.id }
        },
        orderBy: { admissionDate: 'desc' },
        select: { 
          id: true, 
          admissionDate: true, 
          dischargeDate: true, 
          caseHistoryNumber: true, 
          finalDiagnosis: true, 
          clinicalDiagnosis: true,
          status: true,
          department: true
        }
      });
    }
    patient.history = history;

    res.json(patient);
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Create a new patient
app.post('/api/patients', authenticateToken, async (req, res) => {
  try {
    const { 
      tokenNumber, caseHistoryNumber, rank, militaryUnit, militaryStatus, isSvoParticipant, fullName, birthDate, address, 
      admissionDiagnosis, clinicalDiagnosis, finalDiagnosis, complications,
      department, admissionDate, personId
    } = req.body;
    
    let finalPersonId = personId;
    
    if (!finalPersonId) {
      // Ищем существующего пациента по жетону или ФИО+Дата рождения
      const matchConditions = [];
      if (tokenNumber && tokenNumber.trim() !== '') {
        matchConditions.push({ tokenNumber: tokenNumber.trim() });
      }
      if (fullName && birthDate) {
        // Убираем лишние пробелы и приводим к нижнему регистру не получится легко в Prisma SQLite без raw,
        // поэтому ищем точное совпадение
        matchConditions.push({
          fullName: fullName.trim(),
          birthDate: new Date(birthDate)
        });
      }

      if (matchConditions.length > 0) {
        const existingPatient = await prisma.patient.findFirst({
          where: { OR: matchConditions },
          orderBy: { createdAt: 'desc' }
        });
        if (existingPatient && existingPatient.personId) {
          finalPersonId = existingPatient.personId;
        }
      }
    }
    
    const newPatient = await prisma.patient.create({
      data: {
        personId: finalPersonId || undefined,
        tokenNumber,
        caseHistoryNumber,
        rank,
        militaryUnit,
        militaryStatus,
        isSvoParticipant: Boolean(isSvoParticipant),
        fullName,
        birthDate: new Date(birthDate),
        address,
        admissionDiagnosis,
        clinicalDiagnosis,
        finalDiagnosis,
        complications,
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

    await logAction(req.user.id, 'CREATE', 'Patient', newPatient.id, { fullName: newPatient.fullName, caseHistoryNumber });
    res.status(201).json(newPatient);
  } catch (error) {
    res.status(400).json({ error: 'Bad Request', details: error.message });
  }
});

// Update a patient
app.put('/api/patients/:id', authenticateToken, async (req, res) => {
  try {
    const { 
      tokenNumber, caseHistoryNumber, rank, militaryUnit, militaryStatus, isSvoParticipant, fullName, birthDate, address, 
      admissionDiagnosis, clinicalDiagnosis, finalDiagnosis, complications,
      department, admissionDate, dischargeDate, dischargeDestination, status 
    } = req.body;
    
    const existingPatient = await prisma.patient.findUnique({ where: { id: req.params.id } });
    if (!existingPatient) return res.status(404).json({ error: 'Patient not found' });

    const updatedPatient = await prisma.patient.update({
      where: { id: req.params.id },
      data: {
        tokenNumber,
        caseHistoryNumber,
        rank,
        militaryUnit,
        militaryStatus,
        isSvoParticipant: Boolean(isSvoParticipant),
        fullName,
        birthDate: birthDate ? new Date(birthDate) : undefined,
        address,
        admissionDiagnosis,
        clinicalDiagnosis,
        finalDiagnosis,
        complications,
        department,
        admissionDate: admissionDate ? new Date(admissionDate) : undefined,
        dischargeDate: dischargeDate ? new Date(dischargeDate) : null,
        dischargeDestination: dischargeDestination || null,
        status
      }
    });

    const diff = {};
    const checkFields = ['tokenNumber', 'caseHistoryNumber', 'rank', 'militaryUnit', 'militaryStatus', 'isSvoParticipant', 'fullName', 'address', 'admissionDiagnosis', 'clinicalDiagnosis', 'finalDiagnosis', 'complications', 'department', 'status', 'dischargeDestination'];
    checkFields.forEach(field => {
      if (existingPatient[field] !== updatedPatient[field]) {
        if (existingPatient[field] || updatedPatient[field]) {
          diff[field] = { old: existingPatient[field], new: updatedPatient[field] };
        }
      }
    });
    
    // Also check dates safely
    if (existingPatient.birthDate?.getTime() !== updatedPatient.birthDate?.getTime()) {
      diff.birthDate = { old: existingPatient.birthDate, new: updatedPatient.birthDate };
    }
    if (existingPatient.admissionDate?.getTime() !== updatedPatient.admissionDate?.getTime()) {
      diff.admissionDate = { old: existingPatient.admissionDate, new: updatedPatient.admissionDate };
    }
    if (existingPatient.dischargeDate?.getTime() !== updatedPatient.dischargeDate?.getTime()) {
      diff.dischargeDate = { old: existingPatient.dischargeDate, new: updatedPatient.dischargeDate };
    }

    if (Object.keys(diff).length > 0) {
      await logAction(req.user.id, 'UPDATE', 'Patient', updatedPatient.id, { changes: diff });
    }

    res.json(updatedPatient);
  } catch (error) {
    res.status(400).json({ error: 'Bad Request', details: error.message });
  }
});

// Transfer a patient
app.post('/api/patients/:id/transfer', authenticateToken, async (req, res) => {
  try {
    const { toDepartment, transferDate } = req.body;
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
            transferDate: transferDate ? new Date(transferDate) : new Date()
          }
        }
      }
    });

    await logAction(req.user.id, 'TRANSFER', 'Patient', updatedPatient.id, { from: patient.department, to: toDepartment });
    res.json(updatedPatient);
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Delete a patient
app.delete('/api/patients/:id', authenticateToken, async (req, res) => {
  try {
    await prisma.patient.delete({ where: { id: req.params.id } });
    await logAction(req.user.id, 'DELETE', 'Patient', req.params.id, null);
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// --- DOCUMENTS ---
// Upload document
app.post('/api/patients/:patientId/documents', authenticateToken, upload.single('file'), async (req, res) => {
  try {
    const file = req.file;
    if (!file) return res.status(400).json({ error: 'No file uploaded' });

    // Find patient to link personId
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
});

// Download/View document
app.get('/api/documents/:id', async (req, res) => {
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
});

// Delete document
app.delete('/api/documents/:id', authenticateToken, async (req, res) => {
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
});

// --- EXCEL EXPORT ---
app.get('/api/export/patients', authenticateToken, async (req, res) => {
  try {
    const patients = await prisma.patient.findMany({
      orderBy: { createdAt: 'desc' }
    });

    const workbook = new exceljs.Workbook();
    const worksheet = workbook.addWorksheet('Пациенты');

    worksheet.columns = [
      { header: '№ ИБ', key: 'caseHistoryNumber', width: 15 },
      { header: 'Дата поступления', key: 'admissionDate', width: 20 },
      { header: 'Статус службы', key: 'militaryStatus', width: 15 },
      { header: 'Участник СВО', key: 'isSvoParticipant', width: 15 },
      { header: 'Звание', key: 'rank', width: 15 },
      { header: 'ФИО', key: 'fullName', width: 30 },
      { header: 'Дата рождения', key: 'birthDate', width: 15 },
      { header: 'Жетон', key: 'tokenNumber', width: 15 },
      { header: '№ в/ч', key: 'militaryUnit', width: 15 },
      { header: 'Д/з при поступлении', key: 'admissionDiagnosis', width: 30 },
      { header: 'Клинический Д/з', key: 'clinicalDiagnosis', width: 30 },
      { header: 'Осложнения', key: 'complications', width: 30 },
      { header: 'Заключительный Д/з', key: 'finalDiagnosis', width: 30 },
      { header: 'Отделение', key: 'department', width: 25 },
      { header: 'Статус', key: 'status', width: 15 },
      { header: 'Дата выписки', key: 'dischargeDate', width: 20 },
      { header: 'Куда выписан/переведен', key: 'dischargeDestination', width: 30 }
    ];

    patients.forEach(p => {
      worksheet.addRow({
        caseHistoryNumber: p.caseHistoryNumber || '',
        admissionDate: p.admissionDate.toISOString().replace('T', ' ').substring(0, 16),
        militaryStatus: p.militaryStatus || '',
        isSvoParticipant: p.isSvoParticipant ? 'Да' : 'Нет',
        rank: p.rank || '',
        fullName: p.fullName,
        birthDate: p.birthDate.toISOString().split('T')[0],
        tokenNumber: p.tokenNumber || '',
        militaryUnit: p.militaryUnit || '',
        admissionDiagnosis: p.admissionDiagnosis || '',
        clinicalDiagnosis: p.clinicalDiagnosis || '',
        complications: p.complications || '',
        finalDiagnosis: p.finalDiagnosis || '',
        department: p.department,
        status: p.status,
        dischargeDate: p.dischargeDate ? p.dischargeDate.toISOString().replace('T', ' ').substring(0, 16) : '',
        dischargeDestination: p.dischargeDestination || ''
      });
    });

    worksheet.autoFilter = {
      from: 'A1',
      to: 'Q1'
    };

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="patients.xlsx"');
    
    await logAction(req.user.id, 'EXPORT', 'Patient', null, { format: 'Excel' });
    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Serve Frontend Static Files
const frontendDistPath = path.join(__dirname, '..', 'frontend', 'dist');
app.use(express.static(frontendDistPath));

app.get(/.*/, (req, res) => {
  if (fs.existsSync(path.join(frontendDistPath, 'index.html'))) {
    res.sendFile(path.join(frontendDistPath, 'index.html'));
  } else {
    res.status(404).send('Frontend is not built. Please run "npm run build" in the frontend directory.');
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Сервер запущен на порту ${PORT}`);
});
