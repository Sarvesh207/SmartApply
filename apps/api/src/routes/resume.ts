import { Router, Response } from 'express';
import multer from 'multer';
import pdfParse from 'pdf-parse';
import { prisma } from '@smartapply/database';
import { parseResume } from '@smartapply/ai';
import { authenticateJWT, AuthenticatedRequest } from '../middleware/auth';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

// POST /resume/upload
router.post('/upload', authenticateJWT, upload.single('resume'), async (req: AuthenticatedRequest, res: Response) => {
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
      const pdfData = await pdfParse(req.file.buffer);
      rawText = pdfData.text;
    } catch (pdfErr) {
      console.warn('Could not extract text from PDF, running mock with empty buffer text. Error:', pdfErr);
      rawText = ''; // Heuristic fallback is implemented inside parseResume anyway
    }

    // Call the parsed resume logic
    const parsedData = await parseResume(Buffer.from(rawText || req.file.buffer));

    // Store in PostgreSQL
    const resume = await prisma.resume.upsert({
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
        updatedAt: resume.updatedAt,
      },
    });
  } catch (error) {
    console.error('Resume upload error:', error);
    res.status(500).json({ error: 'Failed to process and upload resume' });
  }
});

// GET /resume
router.get('/', authenticateJWT, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const resume = await prisma.resume.findUnique({
      where: { userId },
    });

    if (!resume) {
      return res.status(404).json({ error: 'No resume found for this user' });
    }

    res.json(resume);
  } catch (error) {
    console.error('Fetch resume error:', error);
    res.status(500).json({ error: 'Failed to fetch resume' });
  }
});

// PUT /resume
router.put('/', authenticateJWT, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { skills, experience, projects, education } = req.body;

    const resume = await prisma.resume.update({
      where: { userId },
      data: {
        skills,
        experience,
        projects,
        education,
      },
    });

    // Clear stale job matches so they can be re-evaluated against the updated profile
    await prisma.jobMatch.deleteMany({
      where: { userId }
    });

    res.json({
      message: 'Resume profile updated successfully',
      resume,
    });
  } catch (error) {
    console.error('Update resume error:', error);
    res.status(500).json({ error: 'Failed to update resume profile' });
  }
});

export default router;
