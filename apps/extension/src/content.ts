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
  currentCtc?: string;
  expectedCtc?: string;
  noticePeriod?: string;
  onNoticePeriod?: boolean;
  lastWorkingDay?: string;
  openToRelocate?: boolean;
  customQuestions?: { keyword: string; answer: string }[];
}

// 1. Define Selectors Dictionaries
const selectors = {
  fullName: [
    'input[id="name_field"]',
    'input[name*="name" i]', 'input[id*="name" i]', 'input[placeholder*="name" i]',
    'input[autocomplete*="name" i]', 'input[aria-label*="name" i]'
  ],
  email: [
    'input[id="email_field"]',
    'input[type="email"]', 'input[name*="email" i]', 'input[id*="email" i]',
    'input[placeholder*="email" i]', 'input[aria-label*="email" i]'
  ],
  phone: [
    'input[id="phone_number_field_number"]',
    'input[id="whatsapp_number_field_number"]',
    'input[type="tel"]', 'input[name*="phone" i]', 'input[id*="phone" i]',
    'input[placeholder*="phone" i]', 'input[name*="mobile" i]', 'input[aria-label*="phone" i]',
    'input[id*="whatsapp" i]', 'input[placeholder*="whatsapp" i]', 'input[name*="whatsapp" i]'
  ],
  location: [
    'input[id="current_city_field"]',
    'input[name*="location" i]', 'input[id*="location" i]', 'input[placeholder*="location" i]',
    'input[placeholder*="city" i]', 'input[name*="city" i]', 'input[aria-label*="location" i]',
    'input[id*="city" i]'
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
  currentCtc: [
    'input[id="current_ctc_field"]',
    'input[name*="current_ctc" i]', 'input[id*="current_ctc" i]',
    'input[name*="current_salary" i]', 'input[id*="current_salary" i]',
    'input[placeholder*="current ctc" i]', 'input[placeholder*="current salary" i]',
    'input[name*="ctc" i]', 'input[id*="ctc" i]'
  ],
  expectedCtc: [
    'input[id="expected_ctc_field"]',
    'input[name*="expected_ctc" i]', 'input[id*="expected_ctc" i]',
    'input[name*="expected_salary" i]', 'input[id*="expected_salary" i]',
    'input[placeholder*="expected ctc" i]', 'input[placeholder*="expected salary" i]'
  ],
  noticePeriod: [
    'input[id="notice_period_field"]',
    'input[name*="notice_period" i]', 'input[id*="notice_period" i]',
    'input[placeholder*="notice period" i]', 'input[name*="notice" i]',
    'input[id*="notice" i]'
  ],
  lastWorkingDay: [
    'input[name*="last_day" i]', 'input[name*="last_worked" i]', 'input[name*="last_working" i]',
    'input[placeholder*="last working" i]', 'input[placeholder*="last worked" i]',
    'input[id*="last_day" i]', 'input[id*="last_working" i]'
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
  if (host.includes('recrew.ai')) return 'Recrew AI';
  
  // Clean up hostname for generic sites (e.g. "careers.stripe.com" -> "Stripe")
  const parts = host.replace('www.', '').split('.');
  if (parts.length >= 2) {
    const mainDomain = parts[parts.length - 2];
    return mainDomain.charAt(0).toUpperCase() + mainDomain.slice(1);
  }
  
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
  
  return document.querySelector('form') !== null || document.querySelectorAll('input[type="text"], input[type="email"], input[type="tel"]').length > 0;
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

const radioSelectors = {
  onNoticePeriod: {
    yes: [
      'input[id="is_on_notice_period_field_option_1"]', // Recrew AI
      'input[type="radio"][id*="notice" i][id*="yes" i]',
      'input[type="radio"][name*="notice" i][value="yes" i]',
      'input[type="radio"][name*="notice" i][value="true" i]'
    ],
    no: [
      'input[id="is_on_notice_period_field_option_2"]', // Recrew AI
      'input[type="radio"][id*="notice" i][id*="no" i]',
      'input[type="radio"][name*="notice" i][value="no" i]',
      'input[type="radio"][name*="notice" i][value="false" i]'
    ]
  },
  openToRelocate: {
    yes: [
      'input[id="radio_select_field_1_option_1"]', // Recrew AI
      'input[type="radio"][id*="relocate" i][id*="yes" i]',
      'input[type="radio"][name*="relocate" i][value="yes" i]',
      'input[type="radio"][name*="relocate" i][value="true" i]'
    ],
    no: [
      'input[id="radio_select_field_1_option_2"]', // Recrew AI
      'input[type="radio"][id*="relocate" i][id*="no" i]',
      'input[type="radio"][name*="relocate" i][value="no" i]',
      'input[type="radio"][name*="relocate" i][value="false" i]'
    ]
  }
};

// 5. General Autofill Runner
function executeAutofill(profile: ProfileData) {
  console.log('Autofill engine running with profile:', profile);
  let filledCount = 0;
  const filledElements = new Set<HTMLElement>();

  // Function helper to search selectors and fill all matching visible elements
  const fillField = (selectorsList: string[], value: string | undefined): boolean => {
    if (!value || value.trim() === '') return false;
    let filled = false;
    for (const selector of selectorsList) {
      const elements = document.querySelectorAll(selector);
      for (const el of Array.from(elements) as (HTMLInputElement | HTMLTextAreaElement)[]) {
        // Ensure element is visible, empty/partially empty, and hasn't been filled in this run
        if (el && el.offsetParent !== null && (!el.value || el.value.trim() === '') && !filledElements.has(el)) {
          setInputValue(el, value);
          filledCount++;
          filledElements.add(el);
          console.log(`Filled selector ${selector} with value: ${value}`);
          filled = true;
        }
      }
    }
    return filled;
  };

  const fillRadioField = (value: boolean | string | undefined, yesSelectors: string[], noSelectors: string[]): boolean => {
    if (value === undefined || value === null || value === '') return false;
    const isYes = value === true || String(value).toLowerCase() === 'yes' || String(value).toLowerCase() === 'true';
    const targetSelectors = isYes ? yesSelectors : noSelectors;
    
    for (const selector of targetSelectors) {
      const elements = document.querySelectorAll(selector);
      for (const el of Array.from(elements) as HTMLInputElement[]) {
        if (el && el.offsetParent !== null && !el.checked && !filledElements.has(el)) {
          el.click();
          el.dispatchEvent(new Event('change', { bubbles: true }));
          filledCount++;
          filledElements.add(el);
          console.log(`Selected radio button selector: ${selector}`);
          return true;
        }
      }
    }
    return false;
  };

  // Fill standard fields
  fillField(selectors.fullName, profile.fullName);
  fillField(selectors.email, profile.email);
  fillField(selectors.phone, profile.phone);
  fillField(selectors.location, profile.location);
  fillField(selectors.linkedin, profile.linkedinUrl);
  fillField(selectors.github, profile.githubUrl);
  fillField(selectors.portfolio, profile.portfolioUrl);
  fillField(selectors.experience, String(profile.yearsOfExperience));
  fillField(selectors.currentCtc, profile.currentCtc);
  fillField(selectors.expectedCtc, profile.expectedCtc);
  fillField(selectors.noticePeriod, profile.noticePeriod);
  fillField(selectors.lastWorkingDay, profile.lastWorkingDay);

  // Fill radio choice fields
  fillRadioField(profile.onNoticePeriod, radioSelectors.onNoticePeriod.yes, radioSelectors.onNoticePeriod.no);
  fillRadioField(profile.openToRelocate, radioSelectors.openToRelocate.yes, radioSelectors.openToRelocate.no);

  // Fill custom Q&A questions (relocation, dob, gender, veteran status, etc.)
  if (profile.customQuestions && profile.customQuestions.length > 0) {
    for (const q of profile.customQuestions) {
      if (!q.keyword || !q.answer) continue;
      const keywordLower = q.keyword.toLowerCase().trim();
      const ansLower = q.answer.toLowerCase().trim();

      const allInputs = document.querySelectorAll('input, select, textarea');
      for (const el of Array.from(allInputs) as (HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement)[]) {
        if (el.type === 'hidden' || el.type === 'submit' || el.type === 'button' || filledElements.has(el)) {
          continue;
        }

        let matches = false;
        const placeholder = 'placeholder' in el ? (el as any).placeholder : '';
        const attrs = [el.id, el.name, placeholder, el.getAttribute('autocomplete'), el.getAttribute('aria-label')];
        for (const attr of attrs) {
          if (attr && attr.toLowerCase().includes(keywordLower)) {
            matches = true;
            break;
          }
        }

        if (!matches) {
          let labelText = '';
          if (el.id) {
            const labelEl = document.querySelector(`label[for="${el.id}"]`);
            if (labelEl) labelText = labelEl.textContent || '';
          }
          if (!labelText) {
            const parentLabel = el.closest('label');
            if (parentLabel) labelText = parentLabel.textContent || '';
          }
          if (!labelText && el.parentElement) {
            labelText = el.parentElement.textContent || '';
          }
          if (labelText && labelText.toLowerCase().includes(keywordLower)) {
            matches = true;
          }
        }

        if (matches && el.offsetParent !== null && (!el.value || el.value.trim() === '')) {
          if (el.tagName === 'SELECT') {
            const selectEl = el as HTMLSelectElement;
            let matchedOption = false;
            for (let i = 0; i < selectEl.options.length; i++) {
              const opt = selectEl.options[i];
              if (opt.value.toLowerCase().includes(ansLower) || opt.text.toLowerCase().includes(ansLower)) {
                selectEl.selectedIndex = i;
                selectEl.dispatchEvent(new Event('change', { bubbles: true }));
                filledCount++;
                filledElements.add(el);
                matchedOption = true;
                break;
              }
            }
            if (!matchedOption && selectEl.options.length > 1 && selectEl.value === '') {
              if (ansLower === 'yes' || ansLower === 'no') {
                for (let i = 0; i < selectEl.options.length; i++) {
                  const opt = selectEl.options[i];
                  if (opt.text.toLowerCase().startsWith(ansLower) || opt.value.toLowerCase().startsWith(ansLower)) {
                    selectEl.selectedIndex = i;
                    selectEl.dispatchEvent(new Event('change', { bubbles: true }));
                    filledCount++;
                    filledElements.add(el);
                    break;
                  }
                }
              }
            }
          } else if (el.type === 'radio') {
            const radioEl = el as HTMLInputElement;
            let radioLabelText = '';
            if (radioEl.id) {
              const rLabel = document.querySelector(`label[for="${radioEl.id}"]`);
              if (rLabel) radioLabelText = rLabel.textContent || '';
            }
            if (!radioLabelText) {
              const parentLabel = radioEl.closest('label');
              if (parentLabel) radioLabelText = parentLabel.textContent || '';
            }
            const matchesRadioAnswer = radioEl.value.toLowerCase().includes(ansLower) || 
                                       radioLabelText.toLowerCase().includes(ansLower) ||
                                       (ansLower === 'yes' && (radioEl.value === 'true' || radioEl.value === '1')) ||
                                       (ansLower === 'no' && (radioEl.value === 'false' || radioEl.value === '0'));
            if (matchesRadioAnswer) {
              radioEl.click();
              radioEl.dispatchEvent(new Event('change', { bubbles: true }));
              filledCount++;
              filledElements.add(el);
            }
          } else if (el.type === 'checkbox') {
            const checkboxEl = el as HTMLInputElement;
            const shouldCheck = ansLower === 'yes' || ansLower === 'true' || ansLower === '1';
            if (checkboxEl.checked !== shouldCheck) {
              checkboxEl.click();
              checkboxEl.dispatchEvent(new Event('change', { bubbles: true }));
              filledCount++;
              filledElements.add(el);
            }
          } else {
            setInputValue(el as HTMLInputElement | HTMLTextAreaElement, q.answer);
            filledCount++;
            filledElements.add(el);
          }
        }
      }
    }
  }

  // Trigger file upload selector automatically
  const fileInput = document.querySelector(selectors.file.join(', ')) as HTMLInputElement | null;
  if (fileInput) {
    fileInput.style.border = '2px dashed #8B5CF6';
    fileInput.style.backgroundColor = 'rgba(139, 92, 246, 0.05)';
    console.log('SmartApply: File upload input highlighted for user action.');
    try {
      fileInput.click();
    } catch (e) {
      console.warn('Could not programmatically trigger file upload selection dialog:', e);
    }
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
    chrome.storage.local.get(['extensionEnabled'], (result) => {
      if (result.extensionEnabled === false) {
        sendResponse({
          portal: detectPortal(),
          formDetected: false
        });
        return;
      }
      sendResponse({
        portal: detectPortal(),
        formDetected: isFormPresent()
      });
    });
    return true; // Keep message channel open for async response
  }
  
  if (message.type === 'START_AUTOFILL') {
    chrome.storage.local.get(['extensionEnabled'], (result) => {
      if (result.extensionEnabled === false) {
        sendResponse({ success: false, error: 'Extension is disabled' });
        return;
      }
      try {
        const result = executeAutofill(message.profile);
        sendResponse(result);
      } catch (err: any) {
        console.error('Autofill execution error:', err);
        sendResponse({ success: false, error: err.message });
      }
    });
    return true; // Keep message channel open for async response
  }
});

// 7. Auto-detect Expired / Applied Statuses
const sentUpdates = new Map<string, string>();

function checkApplicationStatus() {
  chrome.storage.local.get(['extensionEnabled'], (result) => {
    if (result.extensionEnabled === false) return;

    const url = window.location.href;
    const portal = detectPortal();
    const pageText = document.body.innerText || '';

  const checkAndSend = (status: 'Expired' | 'Applied') => {
    if (sentUpdates.get(url) === status) return;
    
    // Optimistic cache set to prevent repeated requests
    sentUpdates.set(url, status);
    
    console.log(`SmartApply: Detected job is ${status}. Syncing...`);
    chrome.runtime.sendMessage({
      type: 'UPDATE_STATUS_BY_URL',
      url,
      status
    }, (response: any) => {
      if (response && response.success) {
        console.log(`SmartApply: Successfully synced status to database: ${status}`);
      } else {
        console.warn('SmartApply: Sync status failed:', response?.error);
        // Clear cache entry on failure to permit retries
        sentUpdates.delete(url);
      }
    });
  };

  // --- A. Detect Expired Status ---
  if (portal === 'LinkedIn') {
    const hasClosedText = pageText.includes('No longer accepting applications') || 
                          document.querySelector('.jobs-details__closed-indicator') !== null ||
                          document.querySelector('.artdeco-inline-feedback--error')?.textContent?.includes('No longer accepting applications');
    if (hasClosedText) {
      checkAndSend('Expired');
      return;
    }
  } else if (portal === 'Indeed') {
    const hasExpiredText = pageText.includes('This job has expired') || 
                           document.querySelector('.jobsearch-JobMetadataFooter')?.textContent?.includes('expired');
    if (hasExpiredText) {
      checkAndSend('Expired');
      return;
    }
  }

  // --- B. Detect Applied Status ---
  if (portal === 'LinkedIn') {
    const modalText = document.querySelector('.artdeco-modal, [role="dialog"]')?.textContent || '';
    const isSubmitted = modalText.includes('Application submitted') || 
                        modalText.includes('Your application was sent to') ||
                        pageText.includes('Application submitted') && document.querySelector('.post-apply-state') !== null;
    if (isSubmitted) {
      checkAndSend('Applied');
      return;
    }
  } else if (portal === 'Indeed') {
    const hasSubmittedText = pageText.includes('Application submitted') || 
                             document.querySelector('.ia-BasePage-heading')?.textContent?.includes('submitted') ||
                             window.location.href.includes('indeed.com/apply/congrats');
    if (hasSubmittedText) {
      checkAndSend('Applied');
      return;
    }
  }
  });
}

// Run scanner every 3 seconds
setInterval(checkApplicationStatus, 3000);

// 8. Auto-Sync Settings Presets from Web Application Origin
if (window.location.hostname.includes('smartapply') || window.location.port === '5173') {
  const syncLocalSettings = () => {
    const profileStr = window.localStorage.getItem('sa_autofill_profile');
    if (profileStr) {
      try {
        const profile = JSON.parse(profileStr);
        chrome.storage.local.set({ autofillProfile: profile }, () => {
          console.log('SmartApply: Synced profile presets from web app localStorage to extension storage');
        });
      } catch (err) {
        console.error('SmartApply: Local sync error:', err);
      }
    }
  };

  // Sync on load
  syncLocalSettings();

  // Sync when localStorage is updated
  window.addEventListener('storage', (e) => {
    if (e.key === 'sa_autofill_profile') {
      syncLocalSettings();
    }
  });

  // Also sync on click interactions within the page (as fallback when storage event doesn't fire on same frame)
  document.addEventListener('click', () => {
    setTimeout(syncLocalSettings, 500);
  });
}
