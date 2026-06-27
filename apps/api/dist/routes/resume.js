"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const multer_1 = __importDefault(require("multer"));
const pdf_parse_1 = __importDefault(require("pdf-parse"));
const database_1 = require("@smartapply/database");
const ai_1 = require("@smartapply/ai");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
const upload = (0, multer_1.default)({ storage: multer_1.default.memoryStorage() });
// POST /resume/upload
router.post('/upload', auth_1.authenticateJWT, upload.single('resume'), async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        if (!req.file) {
            return res.status(400).json({ error: 'No resume file uploaded' });
        }
        // Ensure it's a PDF
        if (req.file.mimetype !== 'application/pdf') {
            return res.status(400).json({ error: 'Only PDF resumes are supported' });
        }
        let rawText = '';
        try {
            const pdfData = await (0, pdf_parse_1.default)(req.file.buffer);
            rawText = pdfData.text;
        }
        catch (pdfErr) {
            console.warn('Could not extract text from PDF, running mock with empty buffer text. Error:', pdfErr);
            rawText = ''; // Heuristic fallback is implemented inside parseResume anyway
        }
        // Call the parsed resume logic
        const parsedData = await (0, ai_1.parseResume)(Buffer.from(rawText || req.file.buffer));
        // Store in PostgreSQL
        const resume = await database_1.prisma.resume.upsert({
            where: { userId },
            update: {
                skills: parsedData.skills,
                experience: parsedData.experience,
                projects: parsedData.projects,
                education: parsedData.education,
                rawText: rawText || 'Mock PDF Resume text placeholder',
            },
            create: {
                userId,
                skills: parsedData.skills,
                experience: parsedData.experience,
                projects: parsedData.projects,
                education: parsedData.education,
                rawText: rawText || 'Mock PDF Resume text placeholder',
            },
        });
        // Also let's trigger an automatic update of job match scores for this user in the background
        // We will build the worker to process this, but for now we return the parsed data
        res.json({
            message: 'Resume parsed and saved successfully',
            resume: {
                id: resume.id,
                skills: resume.skills,
                experience: resume.experience,
                projects: resume.projects,
                education: resume.education,
                contactInfo: resume.contactInfo,
                updatedAt: resume.updatedAt,
            },
        });
    }
    catch (error) {
        console.error('Resume upload error:', error);
        res.status(500).json({ error: 'Failed to process and upload resume' });
    }
});
// GET /resume
router.get('/', auth_1.authenticateJWT, async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        const resume = await database_1.prisma.resume.findUnique({
            where: { userId },
        });
        if (!resume) {
            return res.status(404).json({ error: 'No resume found for this user' });
        }
        res.json(resume);
    }
    catch (error) {
        console.error('Fetch resume error:', error);
        res.status(500).json({ error: 'Failed to fetch resume' });
    }
});
// PUT /resume
router.put('/', auth_1.authenticateJWT, async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        const { skills, experience, projects, education, contactInfo } = req.body;
        const existingResume = await database_1.prisma.resume.findUnique({
            where: { userId },
        });
        const resume = await database_1.prisma.resume.upsert({
            where: { userId },
            update: {
                ...(skills !== undefined ? { skills } : {}),
                ...(experience !== undefined ? { experience } : {}),
                ...(projects !== undefined ? { projects } : {}),
                ...(education !== undefined ? { education } : {}),
                ...(contactInfo !== undefined ? { contactInfo } : {}),
            },
            create: {
                userId,
                skills: skills ?? [],
                experience: experience ?? [],
                projects: projects ?? [],
                education: education ?? [],
                contactInfo: contactInfo ?? null,
                rawText: 'Profile created from SmartApply settings',
            },
        });
        if (existingResume && (skills !== undefined || experience !== undefined || projects !== undefined || education !== undefined)) {
            // Clear stale job matches so they can be re-evaluated against the updated resume.
            await database_1.prisma.jobMatch.deleteMany({
                where: { userId }
            });
        }
        res.json({
            message: 'Resume profile updated successfully',
            resume,
        });
    }
    catch (error) {
        console.error('Update resume error:', error);
        res.status(500).json({ error: 'Failed to update resume profile' });
    }
});
exports.default = router;
//# sourceMappingURL=resume.js.map