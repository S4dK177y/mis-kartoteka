const request = require('supertest');
const app = require('../app');
const prisma = require('../utils/prisma');
const bcrypt = require('bcryptjs');

describe('Auth API', () => {
  beforeAll(async () => {
    // Ensure clean state before tests
    await prisma.auditLog.deleteMany();
    await prisma.user.deleteMany();
  });

  afterAll(async () => {
    await prisma.auditLog.deleteMany();
    await prisma.user.deleteMany();
  });

  let token = null;

  it('should setup the initial admin user', async () => {
    const res = await request(app)
      .post('/api/auth/setup')
      .send({
        username: 'admin',
        password: 'password123'
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);

    const user = await prisma.user.findUnique({ where: { username: 'admin' } });
    expect(user).toBeTruthy();
    expect(user.role).toBe('ADMIN');
  });

  it('should not allow setup if user already exists', async () => {
    const res = await request(app)
      .post('/api/auth/setup')
      .send({
        username: 'admin2',
        password: 'password123'
      });

    expect(res.statusCode).toBe(400);
    expect(res.body.error).toBe('System already setup');
  });

  it('should login with correct credentials', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        username: 'admin',
        password: 'password123'
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.username).toBe('admin');
    
    token = res.body.token; // Save for subsequent tests
  });

  it('should fail login with incorrect credentials', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        username: 'admin',
        password: 'wrongpassword'
      });

    expect(res.statusCode).toBe(401);
  });

  it('should get current user info with token', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Cookie', [`token=${token}`]);

    expect(res.statusCode).toBe(200);
    expect(res.body.username).toBe('admin');
  });

  it('should logout user', async () => {
    const res = await request(app)
      .post('/api/auth/logout')
      .set('Cookie', [`token=${token}`]);

    expect(res.statusCode).toBe(200);
    // Check that cookie is cleared in headers
    const setCookie = res.headers['set-cookie'] || [];
    expect(setCookie.some(cookie => cookie.startsWith('token=;'))).toBeTruthy();
  });
});
