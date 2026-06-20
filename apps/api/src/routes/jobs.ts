import { Router, Response, Request } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '@smartapply/database';
import { matchJobWithResume } from '@smartapply/ai';
import { authenticateJWT, AuthenticatedRequest } from '../middleware/auth';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'smartapply-secret-key-12345';

// Helper to optionally get user ID from Authorization header
function getOptionalUserId(req: Request): string | null {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as { id: string };
      return decoded.id;
    } catch {
      return null;
    }
  }
  return null;
}

// GET /jobs
router.get('/', async (req: Request, res: Response) => {
  try {
    const userId = getOptionalUserId(req);
    
    // Parse query params
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = req.query.search as string || '';
    const source = req.query.source as string || '';
    const location = req.query.location as string || '';
    
    const skip = (page - 1) * limit;

    // Build prisma query filters
    const where: any = {};

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
    const [jobs, total] = await prisma.$transaction([
      prisma.job.findMany({
        where,
        skip,
        take: limit,
        orderBy: { datePosted: 'desc' },
      }),
      prisma.job.count({ where }),
    ]);

    // If user is logged in, attach their job matches
    let jobsWithScores = jobs.map(job => ({
      ...job,
      matchScore: null as number | null,
      matchDetails: null as any,
    }));

    if (userId) {
      const matches = await prisma.jobMatch.findMany({
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
  } catch (error) {
    console.error('Fetch jobs error:', error);
    res.status(500).json({ error: 'Failed to fetch jobs' });
  }
});

// GET /jobs/:id
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = getOptionalUserId(req);

    const job = await prisma.job.findUnique({
      where: { id },
    });

    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    let matchDetails = null;

    if (userId) {
      const match = await prisma.jobMatch.findUnique({
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
  } catch (error) {
    console.error('Fetch job detail error:', error);
    res.status(500).json({ error: 'Failed to fetch job details' });
  }
});

// POST /jobs/:id/match
router.post('/:id/match', authenticateJWT, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Get user resume
    const resume = await prisma.resume.findUnique({
      where: { userId },
    });

    if (!resume) {
      return res.status(400).json({ error: 'Please upload your resume before matching jobs.' });
    }

    // Get job details
    const job = await prisma.job.findUnique({
      where: { id },
    });

    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    // Parse resume Json properties
    const resumeTyped = {
      skills: resume.skills as string[],
      experience: resume.experience as any[],
      projects: resume.projects as any[],
      education: resume.education as any[],
    };

    // Calculate match
    const matchResult = await matchJobWithResume(resumeTyped, job.description, job.location);

    // Save to database
    const jobMatch = await prisma.jobMatch.upsert({
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
  } catch (error) {
    console.error('Job match error:', error);
    res.status(500).json({ error: 'Failed to match job' });
  }
});

// POST /jobs/trigger-scrape
router.post('/trigger-scrape', authenticateJWT, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { Queue } = await import('bullmq');

    const REDIS_HOST = process.env.REDIS_HOST || 'localhost';
    const REDIS_PORT = parseInt(process.env.REDIS_PORT || '6379', 10);

    const connection = {
      host: REDIS_HOST,
      port: REDIS_PORT,
      maxRetriesPerRequest: null,
    };

    const jobsQueue = new Queue('smartapply-queue', { connection });
    
    // Add scrape-jobs job immediately to trigger Python Scraper
    await jobsQueue.add('scrape-jobs', { immediate: true });
    
    // Disconnect connection inside BullMQ client safely
    await jobsQueue.close();

    res.json({ message: 'Scraper task triggered! Fetching jobs based on your profile in the background.' });
  } catch (error) {
    console.error('Trigger scrape error:', error);
    res.status(500).json({ error: 'Failed to trigger scraper task' });
  }
});

export default router;
