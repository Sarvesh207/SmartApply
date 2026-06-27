// SmartApply Assistant Popup Script

document.addEventListener('DOMContentLoaded', async () => {
  const connectionStatusEl = document.getElementById('connection-status')!;
  const currentPortalEl = document.getElementById('current-portal')!;
  const formStatusEl = document.getElementById('form-status')!;
  const autofillBtn = document.getElementById('autofill-btn') as HTMLButtonElement;
  const feedbackEl = document.getElementById('feedback-msg')!;
  const powerToggle = document.getElementById('power-toggle') as HTMLInputElement;
  
  let userProfile: any = null;
  let activeTabId: number | null = null;

  // Initialize Enable/Disable Toggle from Storage
  chrome.storage.local.get(['extensionEnabled'], (result) => {
    const enabled = result.extensionEnabled !== false;
    powerToggle.checked = enabled;
    updateUI(enabled);
  });

  powerToggle.addEventListener('change', () => {
    const enabled = powerToggle.checked;
    chrome.storage.local.set({ extensionEnabled: enabled }, () => {
      updateUI(enabled);
    });
  });

  function updateUI(enabled: boolean) {
    const contentEl = document.querySelector('.content') as HTMLElement;
    if (enabled) {
      contentEl.style.opacity = '1';
      contentEl.style.pointerEvents = 'auto';
      initializeAssistant();
    } else {
      contentEl.style.opacity = '0.5';
      contentEl.style.pointerEvents = 'none';
      
      connectionStatusEl.textContent = 'Assistant Disabled';
      connectionStatusEl.parentElement?.querySelector('.dot')?.classList.remove('active', 'warning');
      currentPortalEl.textContent = 'Offline';
      formStatusEl.textContent = 'Disabled';
      formStatusEl.className = 'value warning';
      autofillBtn.disabled = true;
      feedbackEl.textContent = '';
    }
  }

  // 1. Check Server Connection & Authentication
  function checkAuth() {
    chrome.runtime.sendMessage({ type: 'CHECK_AUTH' }, (response: any) => {
      if (chrome.runtime.lastError) {
        console.warn('Background worker connection failed:', chrome.runtime.lastError);
        connectionStatusEl.textContent = 'Server Offline (Local Presets)';
        connectionStatusEl.parentElement?.querySelector('.dot')?.classList.remove('active');
        connectionStatusEl.parentElement?.querySelector('.dot')?.classList.add('warning');
        return;
      }

      if (response && response.authenticated) {
        userProfile = response.user;
        connectionStatusEl.textContent = `Connected: ${userProfile.email}`;
        connectionStatusEl.parentElement?.querySelector('.dot')?.classList.remove('warning');
        connectionStatusEl.parentElement?.querySelector('.dot')?.classList.add('active');
        // Sync local profile with backend if available
        syncProfileWithBackend();
      } else {
        connectionStatusEl.textContent = 'Guest Mode (Local Presets)';
        connectionStatusEl.parentElement?.querySelector('.dot')?.classList.remove('active');
        connectionStatusEl.parentElement?.querySelector('.dot')?.classList.add('warning');
      }
    });
  }

  // 2. Query Active Tab status
  async function checkPageStatus() {
    const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (activeTab && activeTab.id) {
      activeTabId = activeTab.id;
      
      // Send message to Content Script on active tab to check page status
      chrome.tabs.sendMessage(activeTab.id, { type: 'GET_PAGE_STATUS' }, (response: any) => {
        if (chrome.runtime.lastError) {
          // Content script didn't load (unsupported scheme like chrome:// or extension context)
          currentPortalEl.textContent = 'Unsupported Page';
          formStatusEl.textContent = 'Scanner Unavailable';
          autofillBtn.disabled = true;
          return;
        }

        if (response) {
          currentPortalEl.textContent = response.portal || 'Unknown';
          
          if (response.formDetected) {
            formStatusEl.textContent = 'Form Detected';
            formStatusEl.className = 'value success';
            autofillBtn.disabled = false;
          } else {
            formStatusEl.textContent = 'No form detected';
            formStatusEl.className = 'value warning';
            // Enable autofill anyway so users can force try it on general pages
            autofillBtn.disabled = false;
          }
        }
      });
    }
  }

  function initializeAssistant() {
    checkAuth();
    checkPageStatus();
  }

  // 3. Sync profile with backend data
  function syncProfileWithBackend() {
    chrome.runtime.sendMessage({ type: 'FETCH_RESUME' }, (response: any) => {
      if (response && response.success && response.resume) {
        const resume = response.resume;
        chrome.storage.local.get(['autofillProfile'], (result: { [key: string]: any }) => {
          const current = result.autofillProfile || {};
          const updated = {
            ...current,
            ...resume.contactInfo,
            email: userProfile?.email || resume.contactInfo?.email || current.email,
            // Simple mapping from parsed skills if available
            location: resume.contactInfo?.location || resume.location || current.location || 'India',
          };
          chrome.storage.local.set({ autofillProfile: updated }, () => {
            console.log('SmartApply: Synced profile presets from backend database');
          });
        });
      }
    });
  }

  // 4. Handle Autofill click
  autofillBtn.addEventListener('click', () => {
    if (!activeTabId) return;

    autofillBtn.disabled = true;
    feedbackEl.textContent = 'Scanning and filling fields...';
    feedbackEl.className = 'feedback';

    chrome.storage.local.get(['autofillProfile'], (result: { [key: string]: any }) => {
      const profile = result.autofillProfile;
      if (!profile) {
        feedbackEl.textContent = 'No profile presets found.';
        feedbackEl.className = 'feedback error';
        autofillBtn.disabled = false;
        return;
      }

      chrome.tabs.sendMessage(activeTabId!, { type: 'START_AUTOFILL', profile }, (response: any) => {
        autofillBtn.disabled = false;
        
        if (chrome.runtime.lastError) {
          feedbackEl.textContent = 'Could not communicate with tab.';
          feedbackEl.className = 'feedback error';
          return;
        }

        if (response && response.success) {
          feedbackEl.textContent = `Autofilled ${response.filledCount} fields!`;
          feedbackEl.className = 'feedback success';
        } else {
          feedbackEl.textContent = response?.error || 'Autofill failed.';
          feedbackEl.className = 'feedback error';
        }
      });
    });
  });
});
