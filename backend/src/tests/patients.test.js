const request = require('supertest');
const app = require('../app');
const prisma = require('../utils/prisma');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { JWT_SECRET } = require('../middlewares/auth');

// Mock crypto module to bypass GOST encryption and lock checks during API testing
jest.mock('../utils/crypto', () => ({
  isInitialized: () => true,
  isUnlocked: () => true,
  encryptText: (t) => t,
  decryptText: (t) => t,
  encryptDeterministic: (t) => t,
  encryptBufferAsync: async (b) => b,
  decryptBufferAsync: async (b) => b,
}));

describe('Patients API', () => {
  let token = null;
  let adminId = null;

  beforeAll(async () => {
    await prisma.patient.deleteMany();
    await prisma.auditLog.deleteMany();
    await prisma.user.deleteMany();

    const hash = await bcrypt.hash('password123', 10);
    const user = await prisma.user.create({
      data: { username: 'testadmin', passwordHash: hash, role: 'ADMIN' }
    });
    adminId = user.id;

    token = jwt.sign({ id: user.id, username: user.username, role: user.role }, JWT_SECRET, { expiresIn: '1h' });
  });

  afterAll(async () => {
    await prisma.patient.deleteMany();
    await prisma.auditLog.deleteMany();
    await prisma.user.deleteMany();
  });

  let patientId = null;

  it('should create a new patient', async () => {
    const res = await request(app)
      .post('/api/patients')
      .set('Cookie', [`token=${token}`])
      .send({
        fullName: 'Иванов Иван Иванович',
        birthDate: '1990-01-01',
        caseHistoryNumber: '12345',
        department: 'Хирургия'
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.fullName).toBe('Иванов Иван Иванович');
    expect(res.body.id).toBeDefined();
    
    patientId = res.body.id;
  });

  it('should get all patients', async () => {
    const res = await request(app)
      .get('/api/patients')
      .set('Cookie', [`token=${token}`]);

    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
    expect(res.body[0].fullName).toBe('Иванов Иван Иванович');
  });

  it('should get patient by id', async () => {
    const res = await request(app)
      .get(`/api/patients/${patientId}`)
      .set('Cookie', [`token=${token}`]);

    expect(res.statusCode).toBe(200);
    expect(res.body.id).toBe(patientId);
    expect(res.body.fullName).toBe('Иванов Иван Иванович');
  });

  it('should update a patient', async () => {
    const res = await request(app)
      .put(`/api/patients/${patientId}`)
      .set('Cookie', [`token=${token}`])
      .send({
        fullName: 'Иванов Иван Петрович', // changed patronymic
        status: 'Выписан'
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.fullName).toBe('Иванов Иван Петрович');
    expect(res.body.status).toBe('Выписан');
  });

  it('should transfer a patient', async () => {
    const res = await request(app)
      .post(`/api/patients/${patientId}/transfer`)
      .set('Cookie', [`token=${token}`])
      .send({
        toDepartment: 'Терапия'
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.department).toBe('Терапия');
  });

  it('should delete a patient', async () => {
    const res = await request(app)
      .delete(`/api/patients/${patientId}`)
      .set('Cookie', [`token=${token}`]);

    expect(res.statusCode).toBe(204);

    // Verify deletion
    const getRes = await request(app)
      .get(`/api/patients/${patientId}`)
      .set('Cookie', [`token=${token}`]);
    
    expect(getRes.statusCode).toBe(404);
  });
});
