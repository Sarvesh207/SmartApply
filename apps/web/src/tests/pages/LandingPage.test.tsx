import React from 'react';
import { renderWithProviders, screen } from '../utils/renderWithProviders';
import LandingPage from '../../pages/LandingPage';
import { useAuthStore } from '../../store/authStore';

// Mock framer-motion to bypass JSDOM animation issues
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    h1: ({ children, ...props }: any) => <h1 {...props}>{children}</h1>,
    p: ({ children, ...props }: any) => <p {...props}>{children}</p>,
    button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

describe('LandingPage Page', () => {
  beforeEach(() => {
    useAuthStore.setState({ token: null, user: null });
    jest.clearAllMocks();
  });

  it('renders hero headline text and main CTA buttons', () => {
    renderWithProviders(<LandingPage />);

    // Renders hero headers
    expect(screen.getByText(/Apply with agents\./i)).toBeInTheDocument();
    expect(screen.getByText(/Refine on the canvas\./i)).toBeInTheDocument();
    expect(screen.getByText(/Land on the table\./i)).toBeInTheDocument();

    // Renders CTA buttons
    expect(screen.getAllByRole('button', { name: /Get started for free/i })[0]).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Explore Job Board/i })).toBeInTheDocument();
  });

  it('renders workspace mockup with Run Agent Demo button', () => {
    renderWithProviders(<LandingPage />);

    expect(screen.getByText('workspace.smartapply.dev / agent-canvas')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Run Agent Demo/i })).toBeInTheDocument();
  });

  it('shows sign up and log in buttons when user is unauthenticated', () => {
    renderWithProviders(<LandingPage />);

    expect(screen.getByText('Log in')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Sign up/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Dashboard/i })).not.toBeInTheDocument();
  });

  it('shows dashboard button instead of auth buttons when user is authenticated', () => {
    useAuthStore.setState({
      token: 'active-token',
      user: { id: '1', email: 'test@test.com', createdAt: new Date() }
    });
    renderWithProviders(<LandingPage />);

    expect(screen.getByRole('button', { name: /Dashboard/i })).toBeInTheDocument();
    expect(screen.queryByText('Log in')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Sign up/i })).not.toBeInTheDocument();
  });
});
