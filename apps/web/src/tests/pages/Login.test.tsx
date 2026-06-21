import React from 'react';
import { renderWithProviders, screen, fireEvent, waitFor } from '../utils/renderWithProviders';
import Login from '../../pages/Login';

// Mock useMutation so we can control loading/error states in tests
const mockMutate = jest.fn();
let mockIsPending = false;
let mockIsError = false;
let mockError = { message: 'Invalid credentials' };

jest.mock('@tanstack/react-query', () => {
  const actual = jest.requireActual('@tanstack/react-query');
  return {
    ...actual,
    useMutation: (options: any) => {
      return {
        mutate: mockMutate,
        isPending: mockIsPending,
        isError: mockIsError,
        error: mockError,
      };
    },
  };
});

describe('Login Page', () => {
  beforeEach(() => {
    mockMutate.mockClear();
    mockIsPending = false;
    mockIsError = false;
    jest.clearAllMocks();
  });

  it('renders all form fields, headlines, and a register link', () => {
    renderWithProviders(<Login />);

    expect(screen.getByPlaceholderText('you@example.com')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('••••••••')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();

    const registerLink = screen.getByText('Register now').closest('a');
    expect(registerLink).toHaveAttribute('href', '/register');
  });

  it('shows zod validation errors for empty email and short password', async () => {
    renderWithProviders(<Login />);

    const submitBtn = screen.getByRole('button', { name: /sign in/i });
    fireEvent.click(submitBtn);

    // React Hook Form performs validations asynchronously
    expect(await screen.findByText('Please enter a valid email address')).toBeInTheDocument();
    expect(await screen.findByText('Password must be at least 6 characters')).toBeInTheDocument();
  });

  it('submits form with valid values and calls mutate', async () => {
    renderWithProviders(<Login />);

    const emailInput = screen.getByPlaceholderText('you@example.com');
    const passwordInput = screen.getByPlaceholderText('••••••••');
    const submitBtn = screen.getByRole('button', { name: /sign in/i });

    fireEvent.change(emailInput, { target: { value: 'user@test.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(mockMutate).toHaveBeenCalledWith({
        email: 'user@test.com',
        password: 'password123',
      });
    });
  });

  it('disables the submit button and shows loader when login is pending', () => {
    mockIsPending = true;
    renderWithProviders(<Login />);

    const submitBtn = screen.getByRole('button');
    expect(submitBtn).toBeDisabled();
    expect(submitBtn.querySelector('.animate-spin')).toBeInTheDocument();
  });

  it('displays API error banner when mutation is failed', () => {
    mockIsError = true;
    renderWithProviders(<Login />);

    expect(screen.getByText('Invalid credentials')).toBeInTheDocument();
  });
});
