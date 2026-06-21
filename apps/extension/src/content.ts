// SmartApply Assistant Content Script

console.log('SmartApply Assistant content script loaded.');

interface ProfileData {
  fullName: string;
  email: string;
  phone: string;
  location: string;
  yearsOfExperience: number;
  portfolioUrl?: string;
  githubUrl?: string;
  linkedinUrl?: string;
}

// 1. Define Selectors Dictionaries
const selectors = {
  fullName: [
    'input[name*="name" i]', 'input[id*="name" i]', 'input[placeholder*="name" i]',
    'input[autocomplete*="name" i]', 'input[aria-label*="name" i]'
  ],
  email: [
    'input[type="email"]', 'input[name*="email" i]', 'input[id*="email" i]',
    'input[placeholder*="email" i]', 'input[aria-label*="email" i]'
  ],
  phone: [
    'input[type="tel"]', 'input[name*="phone" i]', 'input[id*="phone" i]',
    'input[placeholder*="phone" i]', 'input[name*="mobile" i]', 'input[aria-label*="phone" i]'
  ],
  location: [
    'input[name*="location" i]', 'input[id*="location" i]', 'input[placeholder*="location" i]',
    'input[placeholder*="city" i]', 'input[name*="city" i]', 'input[aria-label*="location" i]'
  ],
  linkedin: [
    'input[name*="linkedin" i]', 'input[placeholder*="linkedin" i]',
    'input[id*="linkedin" i]', 'input[name*="social" i]'
  ],
  github: [
    'input[name*="github" i]', 'input[placeholder*="github" i]',
    'input[id*="github" i]'
  ],
  portfolio: [
    'input[name*="portfolio" i]', 'input[placeholder*="portfolio" i]',
    'input[id*="portfolio" i]', 'input[name*="website" i]'
  ],
  experience: [
    'input[name*="experience" i]', 'input[id*="experience" i]',
    'input[placeholder*="experience" i]', 'input[type="number"][name*="year" i]'
  ],
  file: [
    'input[type="file"][name*="resume" i]', 'input[type="file"][id*="resume" i]',
    'input[type="file"][class*="resume" i]', 'input[type="file"][accept*="pdf" i]',
    'input[type="file"]'
  ]
};

// 2. Identify Portal Type based on Location
function detectPortal(): string {
  const host = window.location.hostname.toLowerCase();
  if (host.includes('linkedin.com')) return 'LinkedIn';
  if (host.includes('indeed.com')) return 'Indeed';
  if (host.includes('lever.co')) return 'Lever';
  if (host.includes('greenhouse.io')) return 'Greenhouse';
  if (host.includes('myworkdayjobs.com')) return 'Workday';
  return 'General Web Page';
}

// 3. Scan for form presence
function isFormPresent(): boolean {
  const portal = detectPortal();
  
  if (portal === 'LinkedIn') {
    return document.querySelector('.jobs-easy-apply-modal, [class*="easy-apply"]') !== null;
  }
  if (portal === 'Indeed') {
    return document.querySelector('#indeed-apply-modal, [class*="indeed-apply"]') !== null || document.querySelector('form') !== null;
  }
  if (portal === 'Workday') {
    return document.querySelector('[data-automation-id="workdayInbox"]') !== null || document.querySelector('form') !== null;
  }
  
  return document.querySelector('form') !== null;
}

// 4. Fill text field using keyboard events to satisfy dynamic framework hooks (React, Vue)
function setInputValue(element: HTMLInputElement | HTMLTextAreaElement, value: string) {
  element.focus();
  element.value = value;
  
  // Dispatch standard change events
  element.dispatchEvent(new Event('input', { bubbles: true }));
  element.dispatchEvent(new Event('change', { bubbles: true }));
  element.blur();
}

// 5. General Autofill Runner
function executeAutofill(profile: ProfileData) {
  console.log('Autofill engine running with profile:', profile);
  let filledCount = 0;

  // Function helper to search selectors
  const fillField = (selectorsList: string[], value: string): boolean => {
    for (const selector of selectorsList) {
      const el = document.querySelector(selector) as HTMLInputElement | HTMLTextAreaElement | null;
      if (el && el.offsetParent !== null && !el.value) { // Must be visible and empty
        setInputValue(el, value);
        filledCount++;
        console.log(`Filled selector ${selector} with value: ${value}`);
        return true;
      }
    }
    return false;
  };

  // Fill standard fields
  fillField(selectors.fullName, profile.fullName);
  fillField(selectors.email, profile.email);
  fillField(selectors.phone, profile.phone);
  fillField(selectors.location, profile.location);
  fillField(selectors.linkedin, profile.linkedinUrl || '');
  fillField(selectors.github, profile.githubUrl || '');
  fillField(selectors.portfolio, profile.portfolioUrl || '');
  fillField(selectors.experience, String(profile.yearsOfExperience));

  // Note: File uploads cannot be fully automated with local paths directly from standard extension sandbox
  // due to browser security restrictions. We warn/instruct the user in the logs.
  const fileInput = document.querySelector(selectors.file.join(', ')) as HTMLInputElement | null;
  if (fileInput) {
    fileInput.style.border = '2px dashed #8B5CF6';
    fileInput.style.backgroundColor = 'rgba(139, 92, 246, 0.05)';
    console.log('File upload input highlighted for user action.');
  }

  return {
    success: true,
    portal: detectPortal(),
    filledCount
  };
}

// 6. Listen for runtime messages from the popup/background
chrome.runtime.onMessage.addListener((
  message: any,
  sender: chrome.runtime.MessageSender,
  sendResponse: (response?: any) => void
) => {
  if (message.type === 'GET_PAGE_STATUS') {
    sendResponse({
      portal: detectPortal(),
      formDetected: isFormPresent()
    });
  }
  
  if (message.type === 'START_AUTOFILL') {
    try {
      const result = executeAutofill(message.profile);
      sendResponse(result);
    } catch (err: any) {
      console.error('Autofill execution error:', err);
      sendResponse({ success: false, error: err.message });
    }
  }
});
