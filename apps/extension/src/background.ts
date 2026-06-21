// Background script for SmartApply Assistant

chrome.runtime.onInstalled.addListener(() => {
  console.log('SmartApply Assistant Installed.');
  // Initialize default options if not present
  chrome.storage.local.get(['autofillProfile'], (result: { [key: string]: any }) => {
    if (!result.autofillProfile) {
      chrome.storage.local.set({
        autofillProfile: {
          fullName: 'John Doe',
          email: 'user@example.com',
          phone: '+91 98765 43210',
          location: 'Delhi, India',
          yearsOfExperience: 3,
          portfolioUrl: 'https://portfolio.dev',
          githubUrl: 'https://github.com/developer',
          linkedinUrl: 'https://linkedin.com/in/developer'
        }
      });
    }
  });
});

// Relay messages between popup and content scripts
chrome.runtime.onMessage.addListener((
  message: any,
  sender: chrome.runtime.MessageSender,
  sendResponse: (response?: any) => void
) => {
  if (message.type === 'CHECK_AUTH') {
    // Check if user is logged into the local backend using cookies
    fetch('http://localhost:5000/auth/me')
      .then(async (response) => {
        if (response.ok) {
          const data = await response.json();
          sendResponse({ authenticated: true, user: data.user });
        } else {
          sendResponse({ authenticated: false });
        }
      })
      .catch((err) => {
        console.error('Auth check failed:', err);
        sendResponse({ authenticated: false, error: 'Could not connect to server' });
      });
    return true; // Keep message channel open for async response
  }
  
  if (message.type === 'FETCH_RESUME') {
    fetch('http://localhost:5000/resume')
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
});
