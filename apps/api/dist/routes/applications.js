"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const zod_1 = require("zod");
const database_1 = require("@smartapply/database");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
const createApplicationSchema = zod_1.z.object({
    jobId: zod_1.z.string().uuid(),
    status: zod_1.z.enum(['Saved', 'Applied', 'Interview', 'Rejected', 'Offer']).optional(),
    notes: zod_1.z.string().optional(),
});
const updateApplicationSchema = zod_1.z.object({
    status: zod_1.z.enum(['Saved', 'Applied', 'Interview', 'Rejected', 'Offer']).optional(),
    notes: zod_1.z.string().optional(),
});
// GET /applications
router.get('/', auth_1.authenticateJWT, async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        const applications = await database_1.prisma.application.findMany({
            where: { userId },
            include: {
                job: true,
                screeningAnswers: true,
            },
            orderBy: { updatedAt: 'desc' },
        });
        res.json(applications);
    }
    catch (error) {
        console.error('Fetch applications error:', error);
        res.status(500).json({ error: 'Failed to fetch applications' });
    }
});
// POST /applications
router.post('/', auth_1.authenticateJWT, async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        const { jobId, status = 'Saved', notes = '' } = createApplicationSchema.parse(req.body);
        // Verify job exists
        const jobExists = await database_1.prisma.job.findUnique({ where: { id: jobId } });
        if (!jobExists) {
            return res.status(404).json({ error: 'Job not found' });
        }
        // Check if application already exists for this user and job
        const existing = await database_1.prisma.application.findUnique({
            where: {
                userId_jobId: { userId, jobId },
            },
        });
        if (existing) {
            return res.status(400).json({ error: 'You have already added this job to your applications list' });
        }
        const application = await database_1.prisma.application.create({
            data: {
                userId,
                jobId,
                status,
                notes,
                appliedAt: status === 'Applied' ? new Date() : null,
            },
            include: {
                job: true,
            },
        });
        res.status(201).json(application);
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            return res.status(400).json({ error: error.errors[0].message });
        }
        console.error('Create application error:', error);
        res.status(500).json({ error: 'Failed to create application' });
    }
});
// PATCH /applications/:id
router.patch('/:id', auth_1.authenticateJWT, async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        const { status, notes } = updateApplicationSchema.parse(req.body);
        // Verify ownership
        const existing = await database_1.prisma.application.findUnique({
            where: { id },
        });
        if (!existing || existing.userId !== userId) {
            return res.status(404).json({ error: 'Application not found' });
        }
        const updateData = {};
        if (status !== undefined) {
            updateData.status = status;
            if (status === 'Applied' && !existing.appliedAt) {
                updateData.appliedAt = new Date();
            }
        }
        if (notes !== undefined) {
            updateData.notes = notes;
        }
        const application = await database_1.prisma.application.update({
            where: { id },
            data: updateData,
            include: {
                job: true,
            },
        });
        res.json(application);
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            return res.status(400).json({ error: error.errors[0].message });
        }
        console.error('Update application error:', error);
        res.status(500).json({ error: 'Failed to update application' });
    }
});
// POST /applications/:id/autofill
router.post('/:id/autofill', auth_1.authenticateJWT, async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        const application = await database_1.prisma.application.findUnique({
            where: { id },
            include: { job: true },
        });
        if (!application || application.userId !== userId) {
            return res.status(404).json({ error: 'Application not found' });
        }
        // Dynamic import to avoid holding execution if there are library issues
        const { runAutofill } = await Promise.resolve().then(() => __importStar(require('../services/automation')));
        const result = await runAutofill(application.job.jobUrl, userId);
        res.json(result);
    }
    catch (error) {
        console.error('Autofill error:', error);
        res.status(500).json({ error: 'Failed to start autofill automation' });
    }
});
exports.default = router;
//# sourceMappingURL=applications.js.map