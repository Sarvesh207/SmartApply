import { Router, Response } from 'express';
import { prisma } from '@smartapply/database';
import { authenticateJWT, AuthenticatedRequest } from '../middleware/auth';

const router = Router();

// GET /dashboard/stats
router.get('/stats', authenticateJWT, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // 1. Jobs Scraped (Total jobs available in database)
    const jobsScraped = await prisma.job.count();

    // 2. Jobs Matched (Total jobs matched for the user)
    const jobsMatched = await prisma.jobMatch.count({
      where: { userId },
    });

    // 3. Application status breakdown
    const applications = await prisma.application.findMany({
      where: { userId },
    });

    const statusCounts = {
      Saved: 0,
      Applied: 0,
      Interview: 0,
      Rejected: 0,
      Offer: 0,
      Expired: 0,
    };

    applications.forEach(app => {
      const status = app.status as keyof typeof statusCounts;
      if (statusCounts[status] !== undefined) {
        statusCounts[status]++;
      }
    });

    // Applications Sent (Applied + Interview + Rejected + Offer)
    const applicationsSent = statusCounts.Applied + statusCounts.Interview + statusCounts.Rejected + statusCounts.Offer;

    // Interview Rate: Interviews / Total Applications Sent
    const interviewRate = applicationsSent > 0 
      ? Math.round((statusCounts.Interview / applicationsSent) * 100) 
      : 0;

    // Offer Rate: Offers / Total Applications Sent
    const offerRate = applicationsSent > 0 
      ? Math.round((statusCounts.Offer / applicationsSent) * 100) 
      : 0;

    res.json({
      jobsScraped,
      jobsMatched,
      applicationsSent,
      interviewRate,
      offerRate,
      statusCounts,
    });
  } catch (error) {
    console.error('Fetch dashboard stats error:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard stats' });
  }
});

export default router;
