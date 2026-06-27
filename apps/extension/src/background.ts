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

const API_URL = 'https://smartapply.up.railway.app';

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

// Relay messages between popup and content scripts
chrome.runtime.onMessage.addListener((
  message: any,
  sender: chrome.runtime.MessageSender,
  sendResponse: (response?: any) => void
) => {
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
    return true; // Keep message channel open for async response
  }
  
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

  if (message.type === 'UPDATE_STATUS_BY_URL') {
    fetch(`${API_URL}/applications/status-by-url`, {
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
});
