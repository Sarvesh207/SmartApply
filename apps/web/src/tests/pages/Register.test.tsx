import React from 'react';
import { renderWithProviders, screen, fireEvent, waitFor } from '../utils/renderWithProviders';
import Register from '../../pages/Register';

const mockMutate = jest.fn();
let mockIsPending = false;
let mockIsError = false;
let mockError = { message: 'Registration failed' };

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

describe('Register Page', () => {
  beforeEach(() => {
    mockMutate.mockClear();
    mockIsPending = false;
    mockIsError = false;
    jest.clearAllMocks();
  });

  it('renders all form fields, headings, and sign in link', () => {
    renderWithProviders(<Register />);

    expect(screen.getByPlaceholderText('you@example.com')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('•••••••• (Min 6 characters)')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('••••••••')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /register/i })).toBeInTheDocument();

    const signInLink = screen.getByText('Sign In').closest('a');
    expect(signInLink).toHaveAttribute('href', '/login');
  });

  it('shows zod validation error for mismatched passwords', async () => {
    renderWithProviders(<Register />);

    const emailInput = screen.getByPlaceholderText('you@example.com');
    const passwordInput = screen.getByPlaceholderText('•••••••• (Min 6 characters)');
    const confirmPasswordInput = screen.getByPlaceholderText('••••••••');
    const submitBtn = screen.getByRole('button', { name: /register/i });

    fireEvent.change(emailInput, { target: { value: 'user@test.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.change(confirmPasswordInput, { target: { value: 'password456' } }); // mismatched
    fireEvent.click(submitBtn);

    expect(await screen.findByText('Passwords do not match')).toBeInTheDocument();
    expect(mockMutate).not.toHaveBeenCalled();
  });

  it('submits form with valid values', async () => {
    renderWithProviders(<Register />);

    const emailInput = screen.getByPlaceholderText('you@example.com');
    const passwordInput = screen.getByPlaceholderText('•••••••• (Min 6 characters)');
    const confirmPasswordInput = screen.getByPlaceholderText('••••••••');
    const submitBtn = screen.getByRole('button', { name: /register/i });

    fireEvent.change(emailInput, { target: { value: 'user@test.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.change(confirmPasswordInput, { target: { value: 'password123' } }); // matching
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(mockMutate).toHaveBeenCalledWith({
        email: 'user@test.com',
        password: 'password123',
        confirmPassword: 'password123',
      });
    });
  });
});
