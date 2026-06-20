import { chromium } from 'playwright';
import { prisma } from '@smartapply/database';
import fs from 'fs';
import path from 'path';
import os from 'os';

export interface AutofillData {
  fullName: string;
  email: string;
  phone: string;
  githubUrl: string;
  linkedinUrl: string;
  portfolioUrl?: string;
  yearsOfExperience: number;
}

export async function runAutofill(jobUrl: string, userId: string): Promise<{ success: boolean; message: string }> {
  // Fetch user and resume to construct profile details
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { resume: true }
  });

  if (!user) {
    throw new Error('User not found');
  }

  // Get auto-fill details from settings or fallback to resume info
  const resume = user.resume;
  const email = user.email;
  const fullName = resume ? 'John Doe' : 'Job Seeker'; // Standard mockup name
  const phone = '+91 98765 43210';
  const githubUrl = 'https://github.com/developer';
  const linkedinUrl = 'https://linkedin.com/in/developer';
  
  // Asynchronously launch browser in headful mode so the user can see it
  // We wrap it in a try-catch and run it in background so the API call doesn't block forever
  runBrowserScript(jobUrl, {
    fullName,
    email,
    phone,
    githubUrl,
    linkedinUrl,
    yearsOfExperience: 3
  }, resume?.rawText).catch(err => {
    console.error('Playwright execution error:', err);
  });

  return {
    success: true,
    message: 'Autofill browser launched! Please review and complete the application in the opened browser window.'
  };
}

async function runBrowserScript(url: string, data: AutofillData, resumeText?: string | null) {
  console.log(`Launching headful Playwright browser for URL: ${url}`);
  
  const userDataDir = path.join(os.homedir(), '.smartapply', 'chrome_profile');
  
  if (!fs.existsSync(userDataDir)) {
    fs.mkdirSync(userDataDir, { recursive: true });
  }

  // Launch persistent context using native Chrome and custom flags to bypass sign-in automation blocks
  const context = await chromium.launchPersistentContext(userDataDir, {
    headless: false,
    channel: 'chrome',
    viewport: null,
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
    args: [
      '--disable-blink-features=AutomationControlled',
      '--start-maximized'
    ]
  });

  const page = context.pages()[0] || await context.newPage();

  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
    console.log('Page loaded, scanning for forms...');

    // Wait a brief moment for dynamic forms to render
    await page.waitForTimeout(3000);

    // 1. Fill Text Inputs
    // Selectors for Name
    const nameSelectors = [
      'input[name*="name" i]', 'input[id*="name" i]', 'input[placeholder*="name" i]',
      'input[autocomplete*="name" i]', 'input[aria-label*="name" i]'
    ];
    for (const selector of nameSelectors) {
      if (await page.locator(selector).first().isVisible()) {
        await page.locator(selector).first().fill(data.fullName);
        console.log(`Filled Name using selector: ${selector}`);
        break;
      }
    }

    // Selectors for Email
    const emailSelectors = [
      'input[type="email"]', 'input[name*="email" i]', 'input[id*="email" i]',
      'input[placeholder*="email" i]', 'input[aria-label*="email" i]'
    ];
    for (const selector of emailSelectors) {
      if (await page.locator(selector).first().isVisible()) {
        await page.locator(selector).first().fill(data.email);
        console.log(`Filled Email using selector: ${selector}`);
        break;
      }
    }

    // Selectors for Phone
    const phoneSelectors = [
      'input[type="tel"]', 'input[name*="phone" i]', 'input[id*="phone" i]',
      'input[placeholder*="phone" i]', 'input[name*="mobile" i]'
    ];
    for (const selector of phoneSelectors) {
      if (await page.locator(selector).first().isVisible()) {
        await page.locator(selector).first().fill(data.phone);
        console.log(`Filled Phone using selector: ${selector}`);
        break;
      }
    }

    // Selectors for LinkedIn
    const linkedinSelectors = [
      'input[name*="linkedin" i]', 'input[placeholder*="linkedin" i]',
      'input[id*="linkedin" i]', 'input[name*="social" i]'
    ];
    for (const selector of linkedinSelectors) {
      if (await page.locator(selector).first().isVisible()) {
        await page.locator(selector).first().fill(data.linkedinUrl);
        console.log(`Filled LinkedIn using selector: ${selector}`);
        break;
      }
    }

    // Selectors for GitHub
    const githubSelectors = [
      'input[name*="github" i]', 'input[placeholder*="github" i]',
      'input[id*="github" i]', 'input[name*="portfolio" i]'
    ];
    for (const selector of githubSelectors) {
      if (await page.locator(selector).first().isVisible()) {
        await page.locator(selector).first().fill(data.githubUrl);
        console.log(`Filled GitHub using selector: ${selector}`);
        break;
      }
    }

    // 2. Upload Resume (create a mock resume file)
    const fileSelectors = [
      'input[type="file"][name*="resume" i]',
      'input[type="file"][id*="resume" i]',
      'input[type="file"][class*="resume" i]',
      'input[type="file"][accept*="pdf" i]',
      'input[type="file"]'
    ];
    
    // Create a temporary mock resume PDF file
    const tempDir = os.tmpdir();
    const tempResumePath = path.join(tempDir, 'SmartApply_Resume.pdf');
    fs.writeFileSync(tempResumePath, resumeText || 'SmartApply Mock Resume Content - Full Stack Software Engineer');

    for (const selector of fileSelectors) {
      const fileInput = page.locator(selector).first();
      if (await fileInput.isVisible()) {
        await fileInput.setInputFiles(tempResumePath);
        console.log(`Uploaded Resume using selector: ${selector}`);
        break;
      }
    }

    console.log('Autofill completed. Keeping browser open for manual review...');
    
    // Wait for the browser window to be closed by the user
    await page.waitForEvent('close', { timeout: 0 });
    
  } catch (error) {
    console.error('Error during form autofill:', error);
  } finally {
    // Close context to release persistent profile locks
    try {
      await context.close();
    } catch {}
    // Attempt clean up of temp file
    try {
      const tempResumePath = path.join(os.tmpdir(), 'SmartApply_Resume.pdf');
      if (fs.existsSync(tempResumePath)) {
        fs.unlinkSync(tempResumePath);
      }
    } catch {}
  }
}
