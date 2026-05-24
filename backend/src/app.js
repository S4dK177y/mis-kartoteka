const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const cookieParser = require('cookie-parser');
const prisma = require('./utils/prisma');

const authRoutes = require('./routes/auth.routes');
const adminRoutes = require('./routes/admin.routes');
const patientsRoutes = require('./routes/patients.routes');
const consultationsRoutes = require('./routes/consultations.routes');
const personsRoutes = require('./routes/persons.routes');
const documentsRoutes = require('./routes/documents.routes');
const exportRoutes = require('./routes/export.routes');

const app = express();

// Middleware
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(cookieParser());

// Request logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    const status = res.statusCode;
    if (req.originalUrl.startsWith('/assets/') || req.originalUrl === '/favicon.ico') return;

    if (status >= 400) {
      console.log(`[ОШИБКА] ${req.method} ${req.originalUrl} - Статус: ${status} (${duration}ms)`);
    } else {
      console.log(`[СИСТЕМА] ${req.method} ${req.originalUrl} - Статус: ${status} (${duration}ms)`);
    }
  });
  next();
});

// API Routes
app.get('/api/system/status', async (req, res) => {
  try {
    const count = await prisma.user.count();
    res.json({ needsSetup: count === 0 });
  } catch (err) {
    res.json({ needsSetup: true });
  }
});

app.use('/api/auth', authRoutes);
app.use('/api', adminRoutes);
app.use('/api/patients', patientsRoutes);
app.use('/api/consultations', consultationsRoutes);
app.use('/api/persons', personsRoutes);
app.use('/api', documentsRoutes); // mounts /patients/:patientId/documents and /documents/:id
app.use('/api', exportRoutes); // mounts /export/patients

// Background task to clean logs
const cleanLogs = async () => {
  try {
    const settings = await prisma.setting.findMany();
    const map = {};
    settings.forEach(s => map[s.key] = s.value);
    
    const retentionDays = parseInt(map.logRetentionDays) || 30;
    const maxLogSpaceMb = parseFloat(map.maxLogSpaceMb) || 50;
    
    const dateLimit = new Date();
    dateLimit.setDate(dateLimit.getDate() - retentionDays);
    
    await prisma.auditLog.deleteMany({
      where: { createdAt: { lt: dateLimit } }
    });
    
    // Size check
    const logs = await prisma.auditLog.findMany({ orderBy: { createdAt: 'desc' } });
    let currentBytes = 0;
    let cutOffIndex = -1;
    
    for (let i = 0; i < logs.length; i++) {
      const log = logs[i];
      currentBytes += Buffer.byteLength(log.id || '', 'utf8') + 
                      Buffer.byteLength(log.userId || '', 'utf8') + 
                      Buffer.byteLength(log.action || '', 'utf8') + 
                      Buffer.byteLength(log.entity || '', 'utf8') + 
                      Buffer.byteLength(log.entityId || '', 'utf8') + 
                      Buffer.byteLength(log.details || '', 'utf8') + 24;
      if (currentBytes > maxLogSpaceMb * 1024 * 1024) {
        cutOffIndex = i;
        break;
      }
    }
    
    if (cutOffIndex !== -1) {
      const logsToDelete = logs.slice(cutOffIndex).map(l => l.id);
      await prisma.auditLog.deleteMany({
        where: { id: { in: logsToDelete } }
      });
    }
  } catch (err) {
    console.error('Error cleaning logs:', err);
  }
};
setInterval(cleanLogs, 1000 * 60 * 60);
setTimeout(cleanLogs, 10000);

// Serve Frontend Static Files
const frontendDistPath = path.join(__dirname, '..', '..', 'frontend', 'dist');
app.use(express.static(frontendDistPath));

app.get(/.*/, (req, res) => {
  if (fs.existsSync(path.join(frontendDistPath, 'index.html'))) {
    res.sendFile(path.join(frontendDistPath, 'index.html'));
  } else {
    res.status(404).send('Frontend is not built. Please run "npm run build" in the frontend directory.');
  }
});

module.exports = app;
