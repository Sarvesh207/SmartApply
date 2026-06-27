import React from 'react';
import { renderWithProviders, screen, fireEvent, waitFor } from '../utils/renderWithProviders';
import Settings from '../../pages/Settings';
import { useAuthStore } from '../../store/authStore';

const mockMutate = jest.fn();
let mockIsPending = false;

jest.mock('@tanstack/react-query', () => {
  const actual = jest.requireActual('@tanstack/react-query');
  return {
    ...actual,
    useMutation: (options: any) => {
      return {
        mutate: mockMutate,
        isPending: mockIsPending,
      };
    },
  };
});

describe('Settings Page', () => {
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
    mockMutate.mockClear();
    mockIsPending = false;
    localStorage.clear();
    jest.clearAllMocks();
  });

  it('renders all profile fields with default values', async () => {
    const { container } = renderWithProviders(<Settings />);

    // Renders the page title
    expect(screen.getByText('Settings')).toBeInTheDocument();

    // Inputs should exist and start with blank user-owned defaults from useEffect
    await waitFor(() => {
      expect(container.querySelector('input[name="fullName"]')).toHaveValue('');
      expect(container.querySelector('input[name="phone"]')).toHaveValue('');
      expect(container.querySelector('input[name="location"]')).toHaveValue('');
      expect(container.querySelector('input[name="yearsOfExperience"]')).toHaveValue(0);
      expect(container.querySelector('input[name="portfolioUrl"]')).toHaveValue('');
      expect(container.querySelector('input[name="githubUrl"]')).toHaveValue('');
      expect(container.querySelector('input[name="linkedinUrl"]')).toHaveValue('');
    });
  });

  it('shows validation errors for empty required fields', async () => {
    const { container } = renderWithProviders(<Settings />);

    // Wait for the defaults to load first
    await waitFor(() => {
      expect(container.querySelector('input[name="fullName"]')).toHaveValue('');
    });

    // Clear required fields
    const fullNameInput = container.querySelector('input[name="fullName"]')!;
    const phoneInput = container.querySelector('input[name="phone"]')!;
    const locationInput = container.querySelector('input[name="location"]')!;
    const githubInput = container.querySelector('input[name="githubUrl"]')!;
    const linkedinInput = container.querySelector('input[name="linkedinUrl"]')!;

    fireEvent.change(fullNameInput, { target: { value: 'Test User' } });
    fireEvent.change(phoneInput, { target: { value: '+91 99999 99999' } });
    fireEvent.change(locationInput, { target: { value: 'Delhi' } });
    fireEvent.change(githubInput, { target: { value: 'https://github.com/test-user' } });
    fireEvent.change(linkedinInput, { target: { value: 'https://linkedin.com/in/test-user' } });

    fireEvent.change(fullNameInput, { target: { value: '' } });
    fireEvent.change(phoneInput, { target: { value: '' } });
    fireEvent.change(locationInput, { target: { value: '' } });
    fireEvent.change(githubInput, { target: { value: '' } });
    fireEvent.change(linkedinInput, { target: { value: '' } });

    const saveBtn = screen.getByRole('button', { name: /Save Presets/i });
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(mockMutate).not.toHaveBeenCalled();
    });
  });

  it('shows saving spinner when save mutation is pending', async () => {
    mockIsPending = true;
    renderWithProviders(<Settings />);

    const saveBtn = screen.getByRole('button', { name: /Saving/i });
    expect(saveBtn).toBeDisabled();
    expect(screen.getByText('Saving...')).toBeInTheDocument();
  });
});
