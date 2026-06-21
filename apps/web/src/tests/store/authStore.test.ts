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

  it('should persist token and user to state via setAuth()', () => {
    useAuthStore.getState().setAuth('dummy-token', dummyUser);

    expect(useAuthStore.getState().token).toBe('dummy-token');
    expect(useAuthStore.getState().user).toEqual(dummyUser);
    expect(useAuthStore.getState().isAuthenticated()).toBe(true);
  });

  it('should clear token and user in state via logout()', () => {
    // Set initial auth state
    useAuthStore.getState().setAuth('dummy-token', dummyUser);

    // Perform logout
    useAuthStore.getState().logout();

    expect(useAuthStore.getState().token).toBeNull();
    expect(useAuthStore.getState().user).toBeNull();
    expect(useAuthStore.getState().isAuthenticated()).toBe(false);
  });

  it('should initialize with null values on import/creation', () => {
    jest.isolateModules(() => {
      const { useAuthStore: newStore } = require('../../store/authStore');
      expect(newStore.getState().token).toBeNull();
      expect(newStore.getState().user).toBeNull();
      expect(newStore.getState().isAuthenticated()).toBe(false);
    });
  });
});
