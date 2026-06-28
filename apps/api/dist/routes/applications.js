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
    status: zod_1.z.enum(['Saved', 'Applied', 'Interview', 'Rejected', 'Offer', 'Expired']).optional(),
    notes: zod_1.z.string().optional(),
});
const updateApplicationSchema = zod_1.z.object({
    status: zod_1.z.enum(['Saved', 'Applied', 'Interview', 'Rejected', 'Offer', 'Expired']).optional(),
    notes: zod_1.z.string().optional(),
});
// GET /applications
router.get('/', auth_1.authenticateJWT, async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        // 1. Fetch all applications for the user
        const applications = await database_1.prisma.application.findMany({
            where: { userId },
            include: {
                job: true,
                screeningAnswers: true,
            },
        });
        // 2. Fetch all job matches for the user to enrich application list
        const matches = await database_1.prisma.jobMatch.findMany({
            where: {
                userId,
                jobId: { in: applications.map(app => app.jobId) },
            },
        });
        const matchMap = new Map(matches.map(m => [m.jobId, m]));
        // 3. Attach matchScore and matchDetails to the jobs
        const applicationsWithScores = applications.map(app => {
            const match = matchMap.get(app.jobId);
            return {
                ...app,
                job: {
                    ...app.job,
                    matchScore: match ? match.matchScore : null,
                    matchDetails: match ? {
                        matchScore: match.matchScore,
                        matchedSkills: match.matchedSkills,
                        missingSkills: match.missingSkills,
                        recommendation: match.recommendation,
                    } : null,
                }
            };
        });
        // If page and limit are not specified, return the full array for backward compatibility
        if (!req.query.page && !req.query.limit) {
            applicationsWithScores.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
            return res.json(applicationsWithScores);
        }
        // Parse query params for filtering/sorting/pagination
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const search = req.query.search || '';
        const status = req.query.status || '';
        const sort = req.query.sort || 'updatedAt';
        const order = req.query.order === 'asc' ? 'asc' : 'desc';
        const startDateStr = req.query.startDate || '';
        const endDateStr = req.query.endDate || '';
        // 5. Apply filtering
        let filtered = applicationsWithScores;
        if (status && status !== 'All') {
            filtered = filtered.filter(app => app.status === status);
        }
        if (search) {
            const searchLower = search.toLowerCase();
            filtered = filtered.filter(app => {
                return (app.job.title.toLowerCase().includes(searchLower) ||
                    app.job.company.toLowerCase().includes(searchLower) ||
                    app.job.location.toLowerCase().includes(searchLower) ||
                    (app.notes && app.notes.toLowerCase().includes(searchLower)));
            });
        }
        if (startDateStr) {
            const start = new Date(startDateStr);
            filtered = filtered.filter(app => {
                const date = app.appliedAt ? new Date(app.appliedAt) : new Date(app.createdAt);
                return date >= start;
            });
        }
        if (endDateStr) {
            const end = new Date(endDateStr);
            end.setHours(23, 59, 59, 999);
            filtered = filtered.filter(app => {
                const date = app.appliedAt ? new Date(app.appliedAt) : new Date(app.createdAt);
                return date <= end;
            });
        }
        // 6. Apply sorting
        filtered.sort((a, b) => {
            let valA;
            let valB;
            if (sort === 'title') {
                valA = a.job.title.toLowerCase();
                valB = b.job.title.toLowerCase();
            }
            else if (sort === 'company') {
                valA = a.job.company.toLowerCase();
                valB = b.job.company.toLowerCase();
            }
            else if (sort === 'location') {
                valA = a.job.location.toLowerCase();
                valB = b.job.location.toLowerCase();
            }
            else if (sort === 'scrapedAt') {
                valA = new Date(a.job.scrapedAt).getTime();
                valB = new Date(b.job.scrapedAt).getTime();
            }
            else if (sort === 'appliedAt') {
                valA = a.appliedAt ? new Date(a.appliedAt).getTime() : 0;
                valB = b.appliedAt ? new Date(b.appliedAt).getTime() : 0;
            }
            else if (sort === 'matchScore') {
                valA = a.job.matchScore || 0;
                valB = b.job.matchScore || 0;
            }
            else if (sort === 'createdAt') {
                valA = new Date(a.createdAt).getTime();
                valB = new Date(b.createdAt).getTime();
            }
            else {
                // default to updatedAt
                valA = new Date(a.updatedAt).getTime();
                valB = new Date(b.updatedAt).getTime();
            }
            if (valA < valB)
                return order === 'asc' ? -1 : 1;
            if (valA > valB)
                return order === 'asc' ? 1 : -1;
            return 0;
        });
        // 7. Paginate
        const total = filtered.length;
        const startIndex = (page - 1) * limit;
        const paginated = filtered.slice(startIndex, startIndex + limit);
        // 8. Return response matching the Jobs paginated API signature
        res.json({
            applications: paginated,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
            statusCounts: {
                Saved: applications.filter(app => app.status === 'Saved').length,
                Applied: applications.filter(app => app.status === 'Applied').length,
                Interview: applications.filter(app => app.status === 'Interview').length,
                Rejected: applications.filter(app => app.status === 'Rejected').length,
                Offer: applications.filter(app => app.status === 'Offer').length,
                Expired: applications.filter(app => app.status === 'Expired').length,
                All: applications.length,
            }
        });
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
            const updatedApplication = await database_1.prisma.application.update({
                where: { id: existing.id },
                data: {
                    status,
                    appliedAt: status === 'Applied' && !existing.appliedAt ? new Date() : existing.appliedAt,
                },
                include: {
                    job: true,
                },
            });
            return res.status(200).json(updatedApplication);
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
const updateStatusByUrlSchema = zod_1.z.object({
    url: zod_1.z.string().url(),
    status: zod_1.z.enum(['Saved', 'Applied', 'Interview', 'Rejected', 'Offer', 'Expired']),
});
// PATCH /applications/status-by-url
router.patch('/status-by-url', auth_1.authenticateJWT, async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        const { url, status } = updateStatusByUrlSchema.parse(req.body);
        const job = await database_1.prisma.job.findUnique({
            where: { jobUrl: url },
        });
        if (!job) {
            return res.status(404).json({ error: 'Job not found in database' });
        }
        const application = await database_1.prisma.application.findUnique({
            where: {
                userId_jobId: { userId, jobId: job.id },
            },
        });
        if (!application) {
            return res.status(404).json({ error: 'Application not found for this job' });
        }
        const updateData = { status };
        if (status === 'Applied' && !application.appliedAt) {
            updateData.appliedAt = new Date();
        }
        const updatedApplication = await database_1.prisma.application.update({
            where: { id: application.id },
            data: updateData,
            include: {
                job: true,
            },
        });
        res.json(updatedApplication);
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            return res.status(400).json({ error: error.errors[0].message });
        }
        console.error('Update application status by URL error:', error);
        res.status(500).json({ error: 'Failed to update application status by URL' });
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
// DELETE /applications/:id
router.delete('/:id', auth_1.authenticateJWT, async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        // Verify ownership
        const existing = await database_1.prisma.application.findUnique({
            where: { id },
        });
        if (!existing || existing.userId !== userId) {
            return res.status(404).json({ error: 'Application not found' });
        }
        await database_1.prisma.application.delete({
            where: { id },
        });
        res.json({ message: 'Application deleted successfully' });
    }
    catch (error) {
        console.error('Delete application error:', error);
        res.status(500).json({ error: 'Failed to delete application' });
    }
});
const createApplicationByUrlSchema = zod_1.z.object({
    url: zod_1.z.string().url(),
    title: zod_1.z.string().min(1),
    company: zod_1.z.string().min(1),
    location: zod_1.z.string().optional().default('Remote'),
    description: zod_1.z.string().optional().default('No description provided'),
    status: zod_1.z.enum(['Saved', 'Applied', 'Interview', 'Rejected', 'Offer', 'Expired']).optional().default('Saved'),
    notes: zod_1.z.string().optional().default(''),
    appliedAt: zod_1.z.string().optional().nullable(),
});
// POST /applications/by-url
router.post('/by-url', auth_1.authenticateJWT, async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        const { url, title, company, location, description, status, notes, appliedAt } = createApplicationByUrlSchema.parse(req.body);
        // 1. Check if job with this URL already exists, or create a new one
        let job = await database_1.prisma.job.findUnique({
            where: { jobUrl: url },
        });
        if (!job) {
            // Determine source from URL
            let source = 'other';
            if (url.toLowerCase().includes('linkedin.com')) {
                source = 'linkedin';
            }
            else if (url.toLowerCase().includes('indeed.com')) {
                source = 'indeed';
            }
            job = await database_1.prisma.job.create({
                data: {
                    title,
                    company,
                    location,
                    description,
                    source,
                    jobUrl: url,
                },
            });
            // Try to calculate match score immediately if user has a resume
            const resume = await database_1.prisma.resume.findUnique({
                where: { userId },
            });
            if (resume) {
                try {
                    const { matchJobWithResume } = await Promise.resolve().then(() => __importStar(require('@smartapply/ai')));
                    const resumeTyped = {
                        skills: resume.skills,
                        experience: resume.experience,
                        projects: resume.projects,
                        education: resume.education,
                    };
                    const matchResult = await matchJobWithResume(resumeTyped, description, location);
                    await database_1.prisma.jobMatch.create({
                        data: {
                            jobId: job.id,
                            userId,
                            resumeId: resume.id,
                            matchScore: matchResult.matchScore,
                            matchedSkills: matchResult.matchedSkills,
                            missingSkills: matchResult.missingSkills,
                            recommendation: matchResult.recommendation,
                        },
                    });
                }
                catch (matchErr) {
                    console.error('Failed to match new job from URL:', matchErr);
                }
            }
        }
        // 2. Check if application already exists for this user and job
        const existing = await database_1.prisma.application.findUnique({
            where: {
                userId_jobId: { userId, jobId: job.id },
            },
        });
        if (existing) {
            return res.status(400).json({ error: 'You have already added this job to your applications list' });
        }
        // Determine appliedAt date
        let appAppliedAt = null;
        if (status === 'Applied') {
            appAppliedAt = appliedAt ? new Date(appliedAt) : new Date();
        }
        else if (appliedAt) {
            appAppliedAt = new Date(appliedAt);
        }
        // 3. Create the application
        const application = await database_1.prisma.application.create({
            data: {
                userId,
                jobId: job.id,
                status,
                notes,
                appliedAt: appAppliedAt,
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
        console.error('Create application by url error:', error);
        res.status(500).json({ error: 'Failed to create application from URL' });
    }
});
exports.default = router;
//# sourceMappingURL=applications.js.map