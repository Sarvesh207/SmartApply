import { useAuthStore } from '../../store/authStore';
import { UserProfile } from '@smartapply/shared';

declare const require: any;

describe('authStore', () => {
  const dummyUser: UserProfile = {
    id: 'user-123',
    email: 'test@example.com',
    createdAt: new Date(),
  };

  beforeEach(() => {
    useAuthStore.setState({ token: null, user: null });
    localStorage.clear();
  });

  it('should initialize with null state by default', () => {
    expect(useAuthStore.getState().token).toBeNull();
    expect(useAuthStore.getState().user).toBeNull();
    expect(useAuthStore.getState().isAuthenticated()).toBe(false);
  });

  it('should persist token and user to localStorage and state via setAuth()', () => {
    useAuthStore.getState().setAuth('dummy-token', dummyUser);

    expect(useAuthStore.getState().token).toBe('dummy-token');
    expect(useAuthStore.getState().user).toEqual(dummyUser);
    expect(useAuthStore.getState().isAuthenticated()).toBe(true);

    expect(localStorage.setItem).toHaveBeenCalledWith('sa_token', 'dummy-token');
    expect(localStorage.setItem).toHaveBeenCalledWith('sa_user', JSON.stringify(dummyUser));
  });

  it('should clear token, user, and localStorage via logout()', () => {
    // Set initial auth state
    useAuthStore.getState().setAuth('dummy-token', dummyUser);

    // Perform logout
    useAuthStore.getState().logout();

    expect(useAuthStore.getState().token).toBeNull();
    expect(useAuthStore.getState().user).toBeNull();
    expect(useAuthStore.getState().isAuthenticated()).toBe(false);

    expect(localStorage.removeItem).toHaveBeenCalledWith('sa_token');
    expect(localStorage.removeItem).toHaveBeenCalledWith('sa_user');
  });

  it('should initialize from localStorage on import/creation', () => {
    // Temporarily set items in localStorage mock
    const originalGetItem = localStorage.getItem;
    localStorage.getItem = jest.fn((key: string) => {
      if (key === 'sa_token') return 'saved-token';
      if (key === 'sa_user') return JSON.stringify(dummyUser);
      return null;
    });

    try {
      // Isolate modules to force re-evaluation of store initialization logic
      jest.isolateModules(() => {
        const { useAuthStore: newStore } = require('../../store/authStore');
        expect(newStore.getState().token).toBe('saved-token');
        expect(newStore.getState().user).toEqual(JSON.parse(JSON.stringify(dummyUser)));
        expect(newStore.getState().isAuthenticated()).toBe(true);
      });
    } finally {
      localStorage.getItem = originalGetItem;
    }
  });
});
