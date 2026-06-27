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

    // Inputs should exist and be filled with initial defaults from useEffect
    await waitFor(() => {
      expect(container.querySelector('input[name="fullName"]')).toHaveValue('John Doe');
      expect(container.querySelector('input[name="phone"]')).toHaveValue('+91 98765 43210');
      expect(container.querySelector('input[name="location"]')).toHaveValue('India');
      expect(container.querySelector('input[name="yearsOfExperience"]')).toHaveValue(3);
      expect(container.querySelector('input[name="portfolioUrl"]')).toHaveValue('https://portfolio.dev');
      expect(container.querySelector('input[name="githubUrl"]')).toHaveValue('https://github.com/developer');
      expect(container.querySelector('input[name="linkedinUrl"]')).toHaveValue('https://linkedin.com/in/developer');
    });
  });

  it('shows validation errors for empty required fields', async () => {
    const { container } = renderWithProviders(<Settings />);

    // Wait for the defaults to load first
    await waitFor(() => {
      expect(container.querySelector('input[name="fullName"]')).toHaveValue('John Doe');
    });

    // Clear required fields
    const fullNameInput = container.querySelector('input[name="fullName"]')!;
    const phoneInput = container.querySelector('input[name="phone"]')!;
    const locationInput = container.querySelector('input[name="location"]')!;
    const githubInput = container.querySelector('input[name="githubUrl"]')!;
    const linkedinInput = container.querySelector('input[name="linkedinUrl"]')!;

    fireEvent.change(fullNameInput, { target: { value: '' } });
    fireEvent.change(phoneInput, { target: { value: '' } });
    fireEvent.change(locationInput, { target: { value: '' } });
    fireEvent.change(githubInput, { target: { value: '' } });
    fireEvent.change(linkedinInput, { target: { value: '' } });

    const saveBtn = screen.getByRole('button', { name: /Save Presets/i });
    fireEvent.click(saveBtn);

    expect(await screen.findByText('Full name is required')).toBeInTheDocument();
    expect(await screen.findByText('Phone number is required')).toBeInTheDocument();
    expect(await screen.findByText('Location is required')).toBeInTheDocument();
    
    // Zod runs URL validation first and outputs "Please enter a valid URL" for empty inputs
    const urlErrors = await screen.findAllByText('Please enter a valid URL');
    expect(urlErrors).toHaveLength(2);
  });

  it('shows saving spinner when save mutation is pending', async () => {
    mockIsPending = true;
    renderWithProviders(<Settings />);

    const saveBtn = screen.getByRole('button', { name: /Saving/i });
    expect(saveBtn).toBeDisabled();
    expect(screen.getByText('Saving...')).toBeInTheDocument();
  });
});
