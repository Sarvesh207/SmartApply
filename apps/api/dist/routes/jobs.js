"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const database_1 = require("@smartapply/database");
const ai_1 = require("@smartapply/ai");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
const JWT_SECRET = process.env.JWT_SECRET || 'smartapply-secret-key-12345';
// Helper to optionally get user ID from Authorization header
function getOptionalUserId(req) {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.split(' ')[1];
        try {
            const decoded = jsonwebtoken_1.default.verify(token, JWT_SECRET);
            return decoded.id;
        }
        catch {
            return null;
        }
    }
    return null;
}
// GET /jobs
router.get('/', async (req, res) => {
    try {
        const userId = getOptionalUserId(req);
        // Parse query params
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const search = req.query.search || '';
        const source = req.query.source || '';
        const location = req.query.location || '';
        const skip = (page - 1) * limit;
        // Build prisma query filters
        const where = {};
        if (search) {
            where.OR = [
                { title: { contains: search, mode: 'insensitive' } },
                { company: { contains: search, mode: 'insensitive' } },
                { description: { contains: search, mode: 'insensitive' } },
            ];
        }
        if (source) {
            where.source = source;
        }
        if (location) {
            where.location = { contains: location, mode: 'insensitive' };
        }
        // Fetch jobs
        const [jobs, total] = await database_1.prisma.$transaction([
            database_1.prisma.job.findMany({
                where,
                skip,
                take: limit,
                orderBy: { datePosted: 'desc' },
            }),
            database_1.prisma.job.count({ where }),
        ]);
        // If user is logged in, attach their job matches
        let jobsWithScores = jobs.map(job => ({
            ...job,
            matchScore: null,
            matchDetails: null,
        }));
        if (userId) {
            const matches = await database_1.prisma.jobMatch.findMany({
                where: {
                    userId,
                    jobId: { in: jobs.map(j => j.id) },
                },
            });
            const matchMap = new Map(matches.map(m => [m.jobId, m]));
            jobsWithScores = jobs.map(job => {
                const match = matchMap.get(job.id);
                return {
                    ...job,
                    matchScore: match ? match.matchScore : null,
                    matchDetails: match ? {
                        matchScore: match.matchScore,
                        matchedSkills: match.matchedSkills,
                        missingSkills: match.missingSkills,
                        recommendation: match.recommendation,
                    } : null,
                };
            });
        }
        res.json({
            jobs: jobsWithScores,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        });
    }
    catch (error) {
        console.error('Fetch jobs error:', error);
        res.status(500).json({ error: 'Failed to fetch jobs' });
    }
});
// GET /jobs/:id
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const userId = getOptionalUserId(req);
        const job = await database_1.prisma.job.findUnique({
            where: { id },
        });
        if (!job) {
            return res.status(404).json({ error: 'Job not found' });
        }
        let matchDetails = null;
        if (userId) {
            const match = await database_1.prisma.jobMatch.findUnique({
                where: {
                    jobId_userId: {
                        jobId: id,
                        userId,
                    },
                },
            });
            if (match) {
                matchDetails = {
                    matchScore: match.matchScore,
                    matchedSkills: match.matchedSkills,
                    missingSkills: match.missingSkills,
                    recommendation: match.recommendation,
                };
            }
        }
        res.json({
            ...job,
            matchDetails,
        });
    }
    catch (error) {
        console.error('Fetch job detail error:', error);
        res.status(500).json({ error: 'Failed to fetch job details' });
    }
});
// POST /jobs/:id/match
router.post('/:id/match', auth_1.authenticateJWT, async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        // Get user resume
        const resume = await database_1.prisma.resume.findUnique({
            where: { userId },
        });
        if (!resume) {
            return res.status(400).json({ error: 'Please upload your resume before matching jobs.' });
        }
        // Get job details
        const job = await database_1.prisma.job.findUnique({
            where: { id },
        });
        if (!job) {
            return res.status(404).json({ error: 'Job not found' });
        }
        // Parse resume Json properties
        const resumeTyped = {
            skills: resume.skills,
            experience: resume.experience,
            projects: resume.projects,
            education: resume.education,
        };
        // Calculate match
        const matchResult = await (0, ai_1.matchJobWithResume)(resumeTyped, job.description, job.location);
        // Save to database
        const jobMatch = await database_1.prisma.jobMatch.upsert({
            where: {
                jobId_userId: {
                    jobId: id,
                    userId,
                },
            },
            update: {
                resumeId: resume.id,
                matchScore: matchResult.matchScore,
                matchedSkills: matchResult.matchedSkills,
                missingSkills: matchResult.missingSkills,
                recommendation: matchResult.recommendation,
            },
            create: {
                jobId: id,
                userId,
                resumeId: resume.id,
                matchScore: matchResult.matchScore,
                matchedSkills: matchResult.matchedSkills,
                missingSkills: matchResult.missingSkills,
                recommendation: matchResult.recommendation,
            },
        });
        res.json(jobMatch);
    }
    catch (error) {
        console.error('Job match error:', error);
        res.status(500).json({ error: 'Failed to match job' });
    }
});
exports.default = router;
//# sourceMappingURL=jobs.js.map