"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const zod_1 = require("zod");
const database_1 = require("@smartapply/database");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
const answerSchema = zod_1.z.object({
    applicationId: zod_1.z.string().uuid(),
    question: zod_1.z.string().min(1),
    answer: zod_1.z.string(),
});
const bulkAnswersSchema = zod_1.z.object({
    answers: zod_1.z.array(answerSchema),
});
// POST /screening-answers
router.post('/', auth_1.authenticateJWT, async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        // Support single and bulk insertions
        const isBulk = Array.isArray(req.body.answers);
        if (isBulk) {
            const { answers } = bulkAnswersSchema.parse(req.body);
            // Verify application ownership for first item (assumed same for bulk)
            if (answers.length > 0) {
                const app = await database_1.prisma.application.findUnique({
                    where: { id: answers[0].applicationId },
                });
                if (!app || app.userId !== userId) {
                    return res.status(403).json({ error: 'Forbidden: Application does not belong to user' });
                }
            }
            const created = await database_1.prisma.screeningAnswer.createMany({
                data: answers.map(a => ({
                    applicationId: a.applicationId,
                    question: a.question,
                    answer: a.answer,
                })),
            });
            res.status(201).json({ count: created.count });
        }
        else {
            const { applicationId, question, answer } = answerSchema.parse(req.body);
            // Verify ownership
            const app = await database_1.prisma.application.findUnique({
                where: { id: applicationId },
            });
            if (!app || app.userId !== userId) {
                return res.status(403).json({ error: 'Forbidden: Application does not belong to user' });
            }
            const screeningAnswer = await database_1.prisma.screeningAnswer.create({
                data: {
                    applicationId,
                    question,
                    answer,
                },
            });
            res.status(201).json(screeningAnswer);
        }
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            return res.status(400).json({ error: error.errors[0].message });
        }
        console.error('Create screening answer error:', error);
        res.status(500).json({ error: 'Failed to create screening answer(s)' });
    }
});
exports.default = router;
//# sourceMappingURL=screening.js.map