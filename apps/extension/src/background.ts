// Background script for SmartApply Assistant

chrome.runtime.onInstalled.addListener(() => {
  console.log('SmartApply Assistant Installed.');

  // Remove legacy demo presets so autofill only runs with user-owned data.
  chrome.storage.local.get(['autofillProfile'], (result: { [key: string]: any }) => {
    const profile = result.autofillProfile;
    if (profile?.email === 'user@example.com' || profile?.fullName === 'John Doe') {
      chrome.storage.local.remove('autofillProfile');
    }
  });
});

let API_URL = 'https://smartapply.up.railway.app';

// Load stored API URL dynamically on startup
chrome.storage.local.get(['apiUrl'], (result) => {
  if (result.apiUrl) {
    API_URL = result.apiUrl;
  }
});

// Watch for API URL updates from content script
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'local' && changes.apiUrl) {
    API_URL = changes.apiUrl.newValue || 'https://smartapply.up.railway.app';
  }
});

function getStoredSession(): Promise<any | null> {
  return new Promise((resolve) => {
    chrome.storage.local.get(['smartApplySession'], (result: { [key: string]: any }) => {
      resolve(result.smartApplySession || null);
    });
  });
}

async function fetchWithSession(path: string, init: RequestInit = {}) {
  const session = await getStoredSession();
  const headers = new Headers(init.headers || {});

  if (session?.token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${session.token}`);
  }

  return fetch(`${API_URL}${path}`, {
    ...init,
    headers,
    credentials: 'include'
  });
}

// Centralized session and profile synchronization handler
chrome.runtime.onMessage.addListener((
  message: any,
  sender: chrome.runtime.MessageSender,
  sendResponse: (response?: any) => void
) => {
  // Authentication verification message handler
  if (message.type === 'CHECK_AUTH') {
    fetchWithSession('/auth/me')
      .then(async (response) => {
        if (response.ok) {
          const data = await response.json();
          sendResponse({ authenticated: true, user: data.user });
        } else {
          const session = await getStoredSession();
          if (session?.user?.email && session?.token) {
            sendResponse({ authenticated: true, user: session.user });
          } else {
            sendResponse({ authenticated: false });
          }
        }
      })
      .catch((err) => {
        console.error('Auth check failed:', err);
        sendResponse({ authenticated: false, error: 'Could not connect to server' });
      });
    return true;
  }

  // Resume data fetch with synchronized authentication
  if (message.type === 'FETCH_RESUME') {
    fetchWithSession('/resume')
      .then(async (response) => {
        if (response.ok) {
          const data = await response.json();
          sendResponse({ success: true, resume: data });
        } else {
          sendResponse({ success: false });
        }
      })
      .catch((err: any) => {
        console.error('Fetch resume failed:', err);
        sendResponse({ success: false, error: err.message });
      });
    return true;
  }

  // Application status update using URL-based identification
  if (message.type === 'UPDATE_STATUS_BY_URL') {
    fetchWithSession('/applications/status-by-url', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        url: message.url,
        status: message.status
      })
    })
      .then(async (response) => {
        if (response.ok) {
          const data = await response.json();
          sendResponse({ success: true, application: data });
        } else {
          const errData = await response.json().catch(() => ({}));
          sendResponse({ success: false, error: errData.error || 'Server error' });
        }
      })
      .catch((err: any) => {
        console.error('Update status by URL failed:', err);
        sendResponse({ success: false, error: err.message });
      });
    return true;
  }

  // New: Handle AUTHENTICATED_PROFILE event from content script
  if (message.type === 'AUTHENTICATED_PROFILE') {
    const profile = message.profile;
    chrome.storage.local.get(['smartApplySession'], (result) => {
      const session = result.smartApplySession;
      if (session?.token && isUsableProfile(profile)) {
        chrome.storage.local.set({ autofillProfile: profile }, () => {
          console.log('SmartApply: Profile from content script synced to extension storage');
          sendResponse({ success: true });
        });
      } else {
        sendResponse({ success: false, error: 'Missing session or invalid profile' });
      }
    });
    return true;
  }

  // New: Handle UI_READY event from content script
  if (message.type === 'UI_READY') {
    chrome.storage.local.get(['autofillProfile'], (result) => {
      if (result.autofillProfile && isUsableProfile(result.autofillProfile) && sender.tab?.id) {
        chrome.tabs.sendMessage(sender.tab.id, {
          type: 'START_AUTOFILL',
          profile: result.autofillProfile
        });
      }
    });
    sendResponse({ success: true });
  }
});

// Helper function (defined after listeners to maintain scope)
function isUsableProfile(profile: any): boolean {
  if (!profile) return false;
  if (profile.email === 'user@example.com' || profile.fullName === 'John Doe') {
    return false;
  }
  return Boolean(profile.fullName || profile.email || profile.phone || profile.linkedinUrl || profile.githubUrl);
}
