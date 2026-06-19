import { Router, Response } from 'express';
import { z } from 'zod';
import { prisma } from '@smartapply/database';
import { authenticateJWT, AuthenticatedRequest } from '../middleware/auth';

const router = Router();

const answerSchema = z.object({
  applicationId: z.string().uuid(),
  question: z.string().min(1),
  answer: z.string(),
});

const bulkAnswersSchema = z.object({
  answers: z.array(answerSchema),
});

// POST /screening-answers
router.post('/', authenticateJWT, async (req: AuthenticatedRequest, res: Response) => {
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
        const app = await prisma.application.findUnique({
          where: { id: answers[0].applicationId },
        });
        if (!app || app.userId !== userId) {
          return res.status(403).json({ error: 'Forbidden: Application does not belong to user' });
        }
      }

      const created = await prisma.screeningAnswer.createMany({
        data: answers.map(a => ({
          applicationId: a.applicationId,
          question: a.question,
          answer: a.answer,
        })),
      });

      res.status(201).json({ count: created.count });
    } else {
      const { applicationId, question, answer } = answerSchema.parse(req.body);

      // Verify ownership
      const app = await prisma.application.findUnique({
        where: { id: applicationId },
      });
      if (!app || app.userId !== userId) {
        return res.status(403).json({ error: 'Forbidden: Application does not belong to user' });
      }

      const screeningAnswer = await prisma.screeningAnswer.create({
        data: {
          applicationId,
          question,
          answer,
        },
      });

      res.status(201).json(screeningAnswer);
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors[0].message });
    }
    console.error('Create screening answer error:', error);
    res.status(500).json({ error: 'Failed to create screening answer(s)' });
  }
});

export default router;
