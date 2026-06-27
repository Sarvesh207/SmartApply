import '@testing-library/jest-dom';

// Polyfill import.meta.env for Jest testing
(globalThis as any).import = {
  meta: {
    env: {
      VITE_API_URL: 'http://localhost:5000',
    },
  },
};
process.env.VITE_API_URL = 'http://localhost:5000';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: jest.fn((key: string) => store[key] || null),
    setItem: jest.fn((key: string, value: string) => {
      store[key] = value.toString();
    }),
    removeItem: jest.fn((key: string) => {
      delete store[key];
    }),
    clear: jest.fn(() => {
      store = {};
    }),
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
  writable: true,
});

beforeEach(() => {
  window.localStorage.clear();
  jest.clearAllMocks();
});

// Suppress console.error if needed
const originalError = console.error;
beforeAll(() => {
  console.error = (...args) => {
    if (
      args[0] &&
      typeof args[0] === 'string' &&
      (args[0].includes('Warning: React does not recognize the') ||
        args[0].includes('Warning: An update to') ||
        args[0].includes('Error: Not implemented: navigation'))
    ) {
      return;
    }
    originalError(...args);
  };
});

afterAll(() => {
  console.error = originalError;
});
