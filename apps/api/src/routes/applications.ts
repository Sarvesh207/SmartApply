import { Router, Response } from 'express';
import { z } from 'zod';
import { prisma } from '@smartapply/database';
import { authenticateJWT, AuthenticatedRequest } from '../middleware/auth';

const router = Router();

const createApplicationSchema = z.object({
  jobId: z.string().uuid(),
  status: z.enum(['Saved', 'Applied', 'Interview', 'Rejected', 'Offer', 'Expired']).optional(),
  notes: z.string().optional(),
});

const updateApplicationSchema = z.object({
  status: z.enum(['Saved', 'Applied', 'Interview', 'Rejected', 'Offer', 'Expired']).optional(),
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

const updateStatusByUrlSchema = z.object({
  url: z.string().url(),
  status: z.enum(['Saved', 'Applied', 'Interview', 'Rejected', 'Offer', 'Expired']),
});

// PATCH /applications/status-by-url
router.patch('/status-by-url', authenticateJWT, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { url, status } = updateStatusByUrlSchema.parse(req.body);

    const job = await prisma.job.findUnique({
      where: { jobUrl: url },
    });

    if (!job) {
      return res.status(404).json({ error: 'Job not found in database' });
    }

    const application = await prisma.application.findUnique({
      where: {
        userId_jobId: { userId, jobId: job.id },
      },
    });

    if (!application) {
      return res.status(404).json({ error: 'Application not found for this job' });
    }

    const updateData: any = { status };
    if (status === 'Applied' && !application.appliedAt) {
      updateData.appliedAt = new Date();
    }

    const updatedApplication = await prisma.application.update({
      where: { id: application.id },
      data: updateData,
      include: {
        job: true,
      },
    });

    res.json(updatedApplication);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors[0].message });
    }
    console.error('Update application status by URL error:', error);
    res.status(500).json({ error: 'Failed to update application status by URL' });
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

// DELETE /applications/:id
router.delete('/:id', authenticateJWT, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Verify ownership
    const existing = await prisma.application.findUnique({
      where: { id },
    });

    if (!existing || existing.userId !== userId) {
      return res.status(404).json({ error: 'Application not found' });
    }

    await prisma.application.delete({
      where: { id },
    });

    res.json({ message: 'Application deleted successfully' });
  } catch (error) {
    console.error('Delete application error:', error);
    res.status(500).json({ error: 'Failed to delete application' });
  }
});

const createApplicationByUrlSchema = z.object({
  url: z.string().url(),
  title: z.string().min(1),
  company: z.string().min(1),
  location: z.string().optional().default('Remote'),
  description: z.string().optional().default('No description provided'),
  status: z.enum(['Saved', 'Applied', 'Interview', 'Rejected', 'Offer', 'Expired']).optional().default('Saved'),
  notes: z.string().optional().default(''),
  appliedAt: z.string().optional().nullable(),
});

// POST /applications/by-url
router.post('/by-url', authenticateJWT, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { 
      url, 
      title, 
      company, 
      location, 
      description, 
      status, 
      notes,
      appliedAt
    } = createApplicationByUrlSchema.parse(req.body);

    // 1. Check if job with this URL already exists, or create a new one
    let job = await prisma.job.findUnique({
      where: { jobUrl: url },
    });

    if (!job) {
      // Determine source from URL
      let source = 'other';
      if (url.toLowerCase().includes('linkedin.com')) {
        source = 'linkedin';
      } else if (url.toLowerCase().includes('indeed.com')) {
        source = 'indeed';
      }

      job = await prisma.job.create({
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
      const resume = await prisma.resume.findUnique({
        where: { userId },
      });

      if (resume) {
        try {
          const { matchJobWithResume } = await import('@smartapply/ai');
          const resumeTyped = {
            skills: resume.skills as string[],
            experience: resume.experience as any[],
            projects: resume.projects as any[],
            education: resume.education as any[],
          };
          const matchResult = await matchJobWithResume(resumeTyped, description, location);
          await prisma.jobMatch.create({
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
        } catch (matchErr) {
          console.error('Failed to match new job from URL:', matchErr);
        }
      }
    }

    // 2. Check if application already exists for this user and job
    const existing = await prisma.application.findUnique({
      where: {
        userId_jobId: { userId, jobId: job.id },
      },
    });

    if (existing) {
      return res.status(400).json({ error: 'You have already added this job to your applications list' });
    }

    // Determine appliedAt date
    let appAppliedAt: Date | null = null;
    if (status === 'Applied') {
      appAppliedAt = appliedAt ? new Date(appliedAt) : new Date();
    } else if (appliedAt) {
      appAppliedAt = new Date(appliedAt);
    }

    // 3. Create the application
    const application = await prisma.application.create({
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
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors[0].message });
    }
    console.error('Create application by url error:', error);
    res.status(500).json({ error: 'Failed to create application from URL' });
  }
});

export default router;
