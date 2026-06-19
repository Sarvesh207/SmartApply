import { Router, Response } from 'express';
import { z } from 'zod';
import { prisma } from '@smartapply/database';
import { authenticateJWT, AuthenticatedRequest } from '../middleware/auth';

const router = Router();

const createApplicationSchema = z.object({
  jobId: z.string().uuid(),
  status: z.enum(['Saved', 'Applied', 'Interview', 'Rejected', 'Offer']).optional(),
  notes: z.string().optional(),
});

const updateApplicationSchema = z.object({
  status: z.enum(['Saved', 'Applied', 'Interview', 'Rejected', 'Offer']).optional(),
  notes: z.string().optional(),
});

// GET /applications
router.get('/', authenticateJWT, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const applications = await prisma.application.findMany({
      where: { userId },
      include: {
        job: true,
        screeningAnswers: true,
      },
      orderBy: { updatedAt: 'desc' },
    });

    res.json(applications);
  } catch (error) {
    console.error('Fetch applications error:', error);
    res.status(500).json({ error: 'Failed to fetch applications' });
  }
});

// POST /applications
router.post('/', authenticateJWT, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { jobId, status = 'Saved', notes = '' } = createApplicationSchema.parse(req.body);

    // Verify job exists
    const jobExists = await prisma.job.findUnique({ where: { id: jobId } });
    if (!jobExists) {
      return res.status(404).json({ error: 'Job not found' });
    }

    // Check if application already exists for this user and job
    const existing = await prisma.application.findUnique({
      where: {
        userId_jobId: { userId, jobId },
      },
    });

    if (existing) {
      return res.status(400).json({ error: 'You have already added this job to your applications list' });
    }

    const application = await prisma.application.create({
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
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors[0].message });
    }
    console.error('Create application error:', error);
    res.status(500).json({ error: 'Failed to create application' });
  }
});

// PATCH /applications/:id
router.patch('/:id', authenticateJWT, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { status, notes } = updateApplicationSchema.parse(req.body);

    // Verify ownership
    const existing = await prisma.application.findUnique({
      where: { id },
    });

    if (!existing || existing.userId !== userId) {
      return res.status(404).json({ error: 'Application not found' });
    }

    const updateData: any = {};
    if (status !== undefined) {
      updateData.status = status;
      if (status === 'Applied' && !existing.appliedAt) {
        updateData.appliedAt = new Date();
      }
    }
    if (notes !== undefined) {
      updateData.notes = notes;
    }

    const application = await prisma.application.update({
      where: { id },
      data: updateData,
      include: {
        job: true,
      },
    });

    res.json(application);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors[0].message });
    }
    console.error('Update application error:', error);
    res.status(500).json({ error: 'Failed to update application' });
  }
});

// POST /applications/:id/autofill
router.post('/:id/autofill', authenticateJWT, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const application = await prisma.application.findUnique({
      where: { id },
      include: { job: true },
    });

    if (!application || application.userId !== userId) {
      return res.status(404).json({ error: 'Application not found' });
    }

    // Dynamic import to avoid holding execution if there are library issues
    const { runAutofill } = await import('../services/automation');
    const result = await runAutofill(application.job.jobUrl, userId);
    
    res.json(result);
  } catch (error) {
    console.error('Autofill error:', error);
    res.status(500).json({ error: 'Failed to start autofill automation' });
  }
});

export default router;
