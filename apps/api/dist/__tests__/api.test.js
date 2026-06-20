"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const supertest_1 = __importDefault(require("supertest"));
const app_1 = __importDefault(require("../app"));
const database_1 = require("@smartapply/database");
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
            const res = await (0, supertest_1.default)(app_1.default).get('/health');
            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('status', 'OK');
            expect(res.body).toHaveProperty('timestamp');
        });
    });
    describe('POST /auth/register', () => {
        it('should return 400 if validation fails (missing fields)', async () => {
            const res = await (0, supertest_1.default)(app_1.default)
                .post('/auth/register')
                .send({ email: 'test@example.com' }); // missing password
            expect(res.status).toBe(400);
        });
        it('should return 400 if user already exists', async () => {
            database_1.prisma.user.findUnique.mockResolvedValue({
                id: 'user-123',
                email: 'test@example.com',
            });
            const res = await (0, supertest_1.default)(app_1.default)
                .post('/auth/register')
                .send({ email: 'test@example.com', password: 'password123' });
            expect(res.status).toBe(400);
            expect(res.body).toHaveProperty('error', 'User with this email already exists');
        });
    });
});
//# sourceMappingURL=api.test.js.map