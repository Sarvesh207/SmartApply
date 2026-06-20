import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { Save, User, Phone, Globe, Github, Linkedin, Cog, Check, Loader2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useMutation } from '@tanstack/react-query';

const settingsSchema = z.object({
  fullName: z.string().min(1, 'Full name is required'),
  email: z.string().email('Please enter a valid email address'),
  phone: z.string().min(1, 'Phone number is required'),
  location: z.string().min(1, 'Location is required'),
  yearsOfExperience: z.number({ invalid_type_error: 'Experience must be a positive number' }).min(0, 'Experience must be a positive number'),
  portfolioUrl: z.string().url('Please enter a valid URL').or(z.string().length(0)).optional().nullable(),
  githubUrl: z.string().url('Please enter a valid URL').min(1, 'GitHub URL is required'),
  linkedinUrl: z.string().url('Please enter a valid URL').min(1, 'LinkedIn URL is required'),
});

type SettingsInputs = z.infer<typeof settingsSchema>;

export default function Settings() {
  const user = useAuthStore(state => state.user);
  const [showSavedMsg, setShowSavedMsg] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<SettingsInputs>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      fullName: '',
      email: user?.email || '',
      phone: '',
      location: '',
      yearsOfExperience: 0,
      portfolioUrl: '',
      githubUrl: '',
      linkedinUrl: '',
    }
  });

  useEffect(() => {
    const savedProfile = localStorage.getItem('sa_autofill_profile');
    if (savedProfile) {
      try {
        const parsed = JSON.parse(savedProfile);
        reset(parsed);
      } catch {}
    } else if (user?.email) {
      reset({
        fullName: 'John Doe',
        email: user.email,
        phone: '+91 98765 43210',
        location: 'India',
        yearsOfExperience: 3,
        portfolioUrl: 'https://portfolio.dev',
        githubUrl: 'https://github.com/developer',
        linkedinUrl: 'https://linkedin.com/in/developer',
      });
    }
  }, [user, reset]);

  const saveMutation = useMutation({
    mutationFn: async (data: SettingsInputs) => {
      // Simulate minor delay to verify loading spinner
      await new Promise(resolve => setTimeout(resolve, 300));
      localStorage.setItem('sa_autofill_profile', JSON.stringify(data));
    },
    onSuccess: () => {
      setShowSavedMsg(true);
      setTimeout(() => setShowSavedMsg(false), 3000);
    }
  });

  const onSubmit = (data: SettingsInputs) => {
    saveMutation.mutate(data);
  };

  return (
    <div className="space-y-8 animate-fade-in p-6 max-w-2xl mx-auto">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight gradient-text">Settings</h1>
        <p className="text-muted-foreground text-sm mt-1">Configure your preset auto-fill profile details.</p>
      </div>

      <div className="glass-panel p-8 rounded-2xl border border-white/5 shadow-xl">
        <div className="flex items-center gap-2 mb-6 border-b border-white/5 pb-4">
          <Cog className="w-5 h-5 text-neutral-400" />
          <h2 className="text-lg font-semibold text-white">Autofill Profile Presets</h2>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-2">Full Name</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  type="text"
                  className={`w-full pl-9 pr-4 py-2.5 bg-muted border rounded-xl text-white text-sm focus:outline-none focus:ring-1 transition-all ${
                    errors.fullName ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-card-border focus:border-white focus:ring-white/20'
                  }`}
                  {...register('fullName')}
                />
              </div>
              {errors.fullName && (
                <span className="text-red-400 text-[10px] mt-1 block pl-1">{errors.fullName.message}</span>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-2">Phone Number</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  type="text"
                  className={`w-full pl-9 pr-4 py-2.5 bg-muted border rounded-xl text-white text-sm focus:outline-none focus:ring-1 transition-all ${
                    errors.phone ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-card-border focus:border-white focus:ring-white/20'
                  }`}
                  {...register('phone')}
                />
              </div>
              {errors.phone && (
                <span className="text-red-400 text-[10px] mt-1 block pl-1">{errors.phone.message}</span>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-2">Location</label>
              <input
                type="text"
                className={`w-full px-4 py-2.5 bg-muted border rounded-xl text-white text-sm focus:outline-none focus:ring-1 transition-all ${
                  errors.location ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-card-border focus:border-white focus:ring-white/20'
                }`}
                {...register('location')}
              />
              {errors.location && (
                <span className="text-red-400 text-[10px] mt-1 block pl-1">{errors.location.message}</span>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-2">Years of Experience</label>
              <input
                type="number"
                min="0"
                className={`w-full px-4 py-2.5 bg-muted border rounded-xl text-white text-sm focus:outline-none focus:ring-1 transition-all ${
                  errors.yearsOfExperience ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-card-border focus:border-white focus:ring-white/20'
                }`}
                {...register('yearsOfExperience', { valueAsNumber: true })}
              />
              {errors.yearsOfExperience && (
                <span className="text-red-400 text-[10px] mt-1 block pl-1">{errors.yearsOfExperience.message}</span>
              )}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-400 mb-2">Portfolio / Website Link</label>
            <div className="relative">
              <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="text"
                className={`w-full pl-9 pr-4 py-2.5 bg-muted border rounded-xl text-white text-sm focus:outline-none focus:ring-1 transition-all ${
                  errors.portfolioUrl ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-card-border focus:border-white focus:ring-white/20'
                }`}
                placeholder="https://yourportfolio.com"
                {...register('portfolioUrl')}
              />
            </div>
            {errors.portfolioUrl && (
              <span className="text-red-400 text-[10px] mt-1 block pl-1">{errors.portfolioUrl.message}</span>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-2">GitHub Profile URL</label>
              <div className="relative">
                <Github className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  type="text"
                  className={`w-full pl-9 pr-4 py-2.5 bg-muted border rounded-xl text-white text-sm focus:outline-none focus:ring-1 transition-all ${
                    errors.githubUrl ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-card-border focus:border-white focus:ring-white/20'
                  }`}
                  {...register('githubUrl')}
                />
              </div>
              {errors.githubUrl && (
                <span className="text-red-400 text-[10px] mt-1 block pl-1">{errors.githubUrl.message}</span>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-2">LinkedIn Profile URL</label>
              <div className="relative">
                <Linkedin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  type="text"
                  className={`w-full pl-9 pr-4 py-2.5 bg-muted border rounded-xl text-white text-sm focus:outline-none focus:ring-1 transition-all ${
                    errors.linkedinUrl ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-card-border focus:border-white focus:ring-white/20'
                  }`}
                  {...register('linkedinUrl')}
                />
              </div>
              {errors.linkedinUrl && (
                <span className="text-red-400 text-[10px] mt-1 block pl-1">{errors.linkedinUrl.message}</span>
              )}
            </div>
          </div>

          <div className="pt-4 flex justify-between items-center">
            <span className="text-[10px] text-muted-foreground leading-normal max-w-md">
              💡 These settings are stored locally on your device and injected directly when initiating Playwright browser automation form uploads.
            </span>

            <button
              type="submit"
              disabled={saveMutation.isPending}
              className="py-2.5 px-6 btn-primary rounded-xl font-semibold flex items-center gap-2 text-xs hover:glow-hover transition-all shrink-0 disabled:opacity-50"
            >
              {saveMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : showSavedMsg ? (
                <>
                  <Check className="w-4 h-4" />
                  Saved Preset!
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Save Presets
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
