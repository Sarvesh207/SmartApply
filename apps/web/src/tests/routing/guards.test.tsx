import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { renderWithProviders, screen } from '../utils/renderWithProviders';
import { ProtectedRoute, PublicRoute } from '../../App';
import { useAuthStore } from '../../store/authStore';

describe('Route Guards', () => {
  beforeEach(() => {
    useAuthStore.setState({ token: null, user: null });
    jest.clearAllMocks();
  });

  describe('ProtectedRoute', () => {
    it('redirects to /login when user is unauthenticated', () => {
      renderWithProviders(
        <Routes>
          <Route
            path="/protected"
            element={
              <ProtectedRoute>
                <div data-testid="protected-content">Protected Content</div>
              </ProtectedRoute>
            }
          />
          <Route path="/login" element={<div data-testid="login-page">Login Page</div>} />
        </Routes>,
        { initialEntries: ['/protected'] }
      );

      expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
      expect(screen.getByTestId('login-page')).toBeInTheDocument();
    });

    it('renders child components when user is authenticated', () => {
      useAuthStore.setState({ token: 'active-token' });

      renderWithProviders(
        <Routes>
          <Route
            path="/protected"
            element={
              <ProtectedRoute>
                <div data-testid="protected-content">Protected Content</div>
              </ProtectedRoute>
            }
          />
        </Routes>,
        { initialEntries: ['/protected'] }
      );

      expect(screen.getByTestId('protected-content')).toBeInTheDocument();
    });
  });

  describe('PublicRoute', () => {
    it('redirects to /dashboard when user is already authenticated', () => {
      useAuthStore.setState({ token: 'active-token' });

      renderWithProviders(
        <Routes>
          <Route
            path="/login"
            element={
              <PublicRoute>
                <div data-testid="login-content">Login Form</div>
              </PublicRoute>
            }
          />
          <Route path="/dashboard" element={<div data-testid="dashboard-page">Dashboard Page</div>} />
        </Routes>,
        { initialEntries: ['/login'] }
      );

      expect(screen.queryByTestId('login-content')).not.toBeInTheDocument();
      expect(screen.getByTestId('dashboard-page')).toBeInTheDocument();
    });

    it('renders child components when user is unauthenticated', () => {
      renderWithProviders(
        <Routes>
          <Route
            path="/login"
            element={
              <PublicRoute>
                <div data-testid="login-content">Login Form</div>
              </PublicRoute>
            }
          />
        </Routes>,
        { initialEntries: ['/login'] }
      );

      expect(screen.getByTestId('login-content')).toBeInTheDocument();
    });
  });
});
