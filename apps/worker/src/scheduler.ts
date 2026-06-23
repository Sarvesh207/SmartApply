import { Queue } from 'bullmq';
import ioredis from 'ioredis';
import dotenv from 'dotenv';

// Initialize env
dotenv.config({ path: '../../.env' });
dotenv.config();

const REDIS_HOST = process.env.REDIS_HOST || 'localhost';
const REDIS_PORT = parseInt(process.env.REDIS_PORT || '6379', 10);

const connection = REDIS_HOST.startsWith('redis://') || REDIS_HOST.startsWith('rediss://')
  ? new ioredis(REDIS_HOST, { maxRetriesPerRequest: null })
  : {
      host: REDIS_HOST,
      port: REDIS_PORT,
      maxRetriesPerRequest: null,
    };

const jobsQueue = new Queue('smartapply-queue', { connection: connection as any });

async function setupScheduler() {
  console.log('Setting up BullMQ cron schedules...');

  try {
    // Remove existing repeatable jobs to avoid duplicates
    const repeatableJobs = await jobsQueue.getRepeatableJobs();
    for (const job of repeatableJobs) {
      await jobsQueue.removeRepeatableByKey(job.key);
      console.log(`Removed old repeatable job key: ${job.key}`);
    }

    // Schedule job for every 12 hours: '0 */12 * * *'
    // For easy MVP verification, we also run it once immediately on startup if queue is empty
    await jobsQueue.add(
      'scrape-jobs',
      {},
      {
        repeat: {
          pattern: '0 */12 * * *', // Every 12 hours
        },
      }
    );
    console.log('Scheduled job: "scrape-jobs" every 12 hours.');

    // Trigger an immediate scraping job for MVP manual testing, if not already running
    const activeJobs = await jobsQueue.getActive();
    const alreadyQueued = activeJobs.some(j => j.name === 'scrape-jobs');
    
    if (!alreadyQueued) {
      console.log('No active scrape job found. Adding immediate "scrape-jobs" task for testing.');
      await jobsQueue.add('scrape-jobs', { immediate: true });
    }
  } finally {
    // Clean up connections once setup is complete
    await jobsQueue.close();
    if (connection instanceof ioredis) {
      await connection.quit();
    }
  }
}

// If run directly, set up scheduler
if (require.main === module) {
  setupScheduler()
    .then(() => {
      console.log('Scheduler setup successful. Exiting.');
      process.exit(0);
    })
    .catch((err) => {
      console.error('Failed to set up scheduler:', err);
      process.exit(1);
    });
}

export { setupScheduler };
