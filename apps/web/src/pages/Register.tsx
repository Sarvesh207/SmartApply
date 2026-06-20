import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { apiClient } from '../utils/api';
import { UserPlus, Key, Mail, Loader2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useMutation } from '@tanstack/react-query';

const registerSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string().min(1, 'Please confirm your password'),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

type RegisterInputs = z.infer<typeof registerSchema>;

export default function Register() {
  const setAuth = useAuthStore(state => state.setAuth);
  const navigate = useNavigate();

  const { register, handleSubmit, formState: { errors } } = useForm<RegisterInputs>({
    resolver: zodResolver(registerSchema),
  });

  const registerMutation = useMutation({
    mutationFn: async (data: RegisterInputs) => {
      const response = await apiClient.post('/auth/register', { 
        email: data.email, 
        password: data.password 
      });
      return response.data;
    },
    onSuccess: (data) => {
      setAuth(data.token, data.user);
      navigate('/');
    }
  });

  const onSubmit = (data: RegisterInputs) => {
    registerMutation.mutate(data);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-radial-gradient px-4 relative overflow-hidden">
      {/* Visual background lights */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-neutral-900/30 rounded-full filter blur-3xl -z-10 animate-pulse-subtle"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-neutral-900/10 rounded-full filter blur-3xl -z-10 animate-pulse-subtle" style={{ animationDelay: '1s' }}></div>
 
      <div className="w-full max-w-md glass-panel p-8 rounded-2xl border border-white/10 shadow-2xl animate-slide-up">
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 gradient-bg rounded-2xl flex items-center justify-center border border-white/10 shadow-lg shadow-white/5 mb-4">
            <UserPlus className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight gradient-text">Create Account</h1>
          <p className="text-muted-foreground text-sm mt-1">Get started with SmartApply</p>
        </div>
 
        {registerMutation.isError && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm p-3 rounded-lg mb-6">
            {registerMutation.error.message || 'Something went wrong'}
          </div>
        )}
 
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
              <input
                type="email"
                className={`w-full pl-10 pr-4 py-3 bg-muted border rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-1 transition-all text-sm ${
                  errors.email ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-card-border focus:border-white focus:ring-white/20'
                }`}
                placeholder="you@example.com"
                {...register('email')}
              />
            </div>
            {errors.email && (
              <span className="text-red-400 text-xs mt-1 block pl-1">{errors.email.message}</span>
            )}
          </div>
 
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Password</label>
            <div className="relative">
              <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
              <input
                type="password"
                className={`w-full pl-10 pr-4 py-3 bg-muted border rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-1 transition-all text-sm ${
                  errors.password ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-card-border focus:border-white focus:ring-white/20'
                }`}
                placeholder="•••••••• (Min 6 characters)"
                {...register('password')}
              />
            </div>
            {errors.password && (
              <span className="text-red-400 text-xs mt-1 block pl-1">{errors.password.message}</span>
            )}
          </div>
 
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Confirm Password</label>
            <div className="relative">
              <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
              <input
                type="password"
                className={`w-full pl-10 pr-4 py-3 bg-muted border rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-1 transition-all text-sm ${
                  errors.confirmPassword ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-card-border focus:border-white focus:ring-white/20'
                }`}
                placeholder="••••••••"
                {...register('confirmPassword')}
              />
            </div>
            {errors.confirmPassword && (
              <span className="text-red-400 text-xs mt-1 block pl-1">{errors.confirmPassword.message}</span>
            )}
          </div>
 
          <button
            type="submit"
            disabled={registerMutation.isPending}
            className="w-full py-3 px-4 btn-primary rounded-xl font-semibold flex items-center justify-center gap-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:glow-hover"
          >
            {registerMutation.isPending ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                Register
              </>
            )}
          </button>
        </form>
 
        <p className="text-center text-sm text-muted-foreground mt-6">
          Already have an account?{' '}
          <Link to="/login" className="text-white hover:text-neutral-300 underline underline-offset-4 transition-colors font-medium">
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
}
