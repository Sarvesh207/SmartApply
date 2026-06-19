import { Worker, Job as BullJob } from 'bullmq';
import ioredis from 'ioredis';
import { spawn } from 'child_process';
import path from 'path';
import dotenv from 'dotenv';
import { prisma } from '@smartapply/database';
import { matchJobWithResume } from '@smartapply/ai';
import { setupScheduler } from './scheduler';

// Initialize env
dotenv.config({ path: '../../.env' });
dotenv.config();

const REDIS_HOST = process.env.REDIS_HOST || 'localhost';
const REDIS_PORT = parseInt(process.env.REDIS_PORT || '6379', 10);

const connection = {
  host: REDIS_HOST,
  port: REDIS_PORT,
  maxRetriesPerRequest: null,
};

console.log(`Worker connecting to Redis at ${REDIS_HOST}:${REDIS_PORT}`);

// Initialize repeatable job scheduler
setupScheduler().catch(err => {
  console.error('Failed to initialize scheduler:', err);
});

const worker = new Worker(
  'smartapply-queue',
  async (job: BullJob) => {
    console.log(`Processing job ${job.id} [${job.name}]`);
    
    switch (job.name) {
      case 'scrape-jobs':
        await handleScrapeJobs();
        break;
      case 'calculate-match-scores':
        await handleCalculateMatchScores();
        break;
      case 'notify-user':
        await handleNotifyUser(job.data?.userId);
        break;
      default:
        console.warn(`Unknown job name: ${job.name}`);
    }
  },
  { connection }
);

worker.on('completed', (job) => {
  console.log(`Job ${job.id} [${job.name}] completed successfully`);
});

worker.on('failed', (job, err) => {
  console.error(`Job ${job?.id} [${job?.name}] failed:`, err);
});

// 1. Run Python scraper via child process
async function handleScrapeJobs(): Promise<void> {
  return new Promise((resolve, reject) => {
    const scraperScriptPath = path.resolve(__dirname, '../../../services/scraper/scraper.py');
    console.log(`Launching Python scraper at: ${scraperScriptPath}`);

    // Spawn python process
    // Pass DATABASE_URL as env to child process
    const pythonProcess = spawn('python', [scraperScriptPath], {
      env: {
        ...process.env,
        PYTHONUNBUFFERED: '1',
      },
    });

    pythonProcess.stdout.on('data', (data) => {
      console.log(`[Scraper Python STDOUT]: ${data.toString().trim()}`);
    });

    pythonProcess.stderr.on('data', (data) => {
      console.error(`[Scraper Python STDERR]: ${data.toString().trim()}`);
    });

    pythonProcess.on('close', async (code) => {
      console.log(`Python scraper process finished with exit code ${code}`);
      if (code === 0) {
        // Trigger matching computation after successful scrape
        console.log('Scraping successful. Enqueuing match score calculation...');
        await handleCalculateMatchScores();
        resolve();
      } else {
        reject(new Error(`Python scraper exited with code ${code}`));
      }
    });
  });
}

// 2. Compute matches for all users and jobs that don't have scores yet
async function handleCalculateMatchScores() {
  console.log('Calculating match scores...');
  const users = await prisma.user.findMany({
    include: { resume: true }
  });

  const jobs = await prisma.job.findMany();
  console.log(`Found ${users.length} users and ${jobs.length} total jobs.`);

  for (const user of users) {
    if (!user.resume) {
      console.log(`Skipping User ${user.email} (No resume uploaded)`);
      continue;
    }

    const resumeTyped = {
      skills: user.resume.skills as string[],
      experience: user.resume.experience as any[],
      projects: user.resume.projects as any[],
      education: user.resume.education as any[],
    };

    let calculatedCount = 0;

    for (const job of jobs) {
      // Check if match already exists
      const existingMatch = await prisma.jobMatch.findUnique({
        where: {
          jobId_userId: {
            jobId: job.id,
            userId: user.id
          }
        }
      });

      if (existingMatch) continue;

      try {
        const matchResult = await matchJobWithResume(resumeTyped, job.description, job.location);
        
        await prisma.jobMatch.create({
          data: {
            jobId: job.id,
            userId: user.id,
            resumeId: user.resume.id,
            matchScore: matchResult.matchScore,
            matchedSkills: matchResult.matchedSkills,
            missingSkills: matchResult.missingSkills,
            recommendation: matchResult.recommendation
          }
        });
        calculatedCount++;
      } catch (err) {
        console.error(`Failed to calculate score for User ${user.email} and Job ${job.id}:`, err);
      }
    }

    console.log(`Calculated ${calculatedCount} new match scores for User ${user.email}`);
    
    if (calculatedCount > 0) {
      // Notify user about top matches
      await handleNotifyUser(user.id);
    }
  }
}

// 3. Mock notification sender
async function handleNotifyUser(userId: string) {
  if (!userId) return;
  
  const user = await prisma.user.findUnique({
    where: { id: userId }
  });
  
  if (!user) return;

  // Find top matches for this user
  const topMatches = await prisma.jobMatch.findMany({
    where: {
      userId,
      matchScore: { gte: 80 }
    },
    include: { job: true },
    orderBy: { matchScore: 'desc' },
    take: 3
  });

  if (topMatches.length > 0) {
    console.log(`\n===== NOTIFICATION FOR USER ${user.email} =====`);
    console.log(`We found ${topMatches.length} new high-quality matches for you:`);
    topMatches.forEach(m => {
      console.log(`- [${m.matchScore}% Match] ${m.job.title} at ${m.job.company} (${m.job.location})`);
    });
    console.log(`================================================\n`);
  }
}
