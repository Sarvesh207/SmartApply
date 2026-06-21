import React from 'react';
import { renderWithProviders, screen, fireEvent } from '../utils/renderWithProviders';
import Navbar from '../../components/Navbar';
import { useAuthStore } from '../../store/authStore';

const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

describe('Navbar Component', () => {
  const dummyUser = {
    id: 'user-123',
    email: 'sarvesh@example.com',
    createdAt: new Date(),
  };

  beforeEach(() => {
    useAuthStore.setState({
      token: 'active-token',
      user: dummyUser,
    });
    mockNavigate.mockClear();
    jest.clearAllMocks();
  });

  it('renders brand name and all 5 navigation links', () => {
    renderWithProviders(<Navbar />);

    expect(screen.getByText('SmartApply')).toBeInTheDocument();
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Job Board')).toBeInTheDocument();
    expect(screen.getByText('Resume Manager')).toBeInTheDocument();
    expect(screen.getByText('Applications Board')).toBeInTheDocument();
    expect(screen.getByText('Settings')).toBeInTheDocument();
  });

  it('displays the logged in user email in the footer', () => {
    renderWithProviders(<Navbar />);
    expect(screen.getByText('sarvesh@example.com')).toBeInTheDocument();
  });

  it('highlights the active link correctly', () => {
    // If the path is /jobs, Job Board should have active class names
    renderWithProviders(<Navbar />, { initialEntries: ['/jobs'] });

    const jobBoardLink = screen.getByText('Job Board').closest('a');
    const dashboardLink = screen.getByText('Dashboard').closest('a');

    expect(jobBoardLink).toHaveClass('bg-white/10');
    expect(dashboardLink).not.toHaveClass('bg-white/10');
  });

  it('calls logout() and navigates to /login when clicking sign out', () => {
    const logoutSpy = jest.spyOn(useAuthStore.getState(), 'logout');
    renderWithProviders(<Navbar />);

    const signOutButton = screen.getByRole('button', { name: /sign out/i });
    fireEvent.click(signOutButton);

    expect(logoutSpy).toHaveBeenCalled();
    expect(mockNavigate).toHaveBeenCalledWith('/login');
    expect(useAuthStore.getState().token).toBeNull();
  });
});
