import request from 'supertest';
import app from '../app';
import { prisma } from '@smartapply/database';

// Mock the database client
jest.mock('@smartapply/database', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    $connect: jest.fn(),
  },
}));

describe('SmartApply API Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /health', () => {
    it('should return 200 OK and health status', async () => {
      const res = await request(app).get('/health');
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('status', 'OK');
      expect(res.body).toHaveProperty('timestamp');
    });
  });

  describe('POST /auth/register', () => {
    it('should return 400 if validation fails (missing fields)', async () => {
      const res = await request(app)
        .post('/auth/register')
        .send({ email: 'test@example.com' }); // missing password
      expect(res.status).toBe(400);
    });

    it('should return 400 if user already exists', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'user-123',
        email: 'test@example.com',
      });

      const res = await request(app)
        .post('/auth/register')
        .send({ email: 'test@example.com', password: 'password123' });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('error', 'User with this email already exists');
    });
  });
});
