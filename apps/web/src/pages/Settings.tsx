import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { apiFetch } from '../utils/api';
import { Save, User, Phone, Globe, Github, Linkedin, Cog, Check, Loader2, Trash2 } from 'lucide-react';
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
  currentCtc: z.string().optional().nullable().or(z.string().length(0)),
  expectedCtc: z.string().optional().nullable().or(z.string().length(0)),
  noticePeriod: z.string().optional().nullable().or(z.string().length(0)),
  onNoticePeriod: z.boolean().optional().nullable(),
  lastWorkingDay: z.string().optional().nullable().or(z.string().length(0)),
  openToRelocate: z.boolean().optional().nullable(),
  customQuestions: z.array(z.object({ keyword: z.string(), answer: z.string() })).optional().nullable(),
});

type SettingsInputs = z.infer<typeof settingsSchema>;

export default function Settings() {
  const user = useAuthStore(state => state.user);
  const [showSavedMsg, setShowSavedMsg] = useState(false);
  const [customQuestions, setCustomQuestions] = useState<{ keyword: string; answer: string }[]>([]);

  const { register, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm<SettingsInputs>({
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
      currentCtc: '',
      expectedCtc: '',
      noticePeriod: '',
      onNoticePeriod: false,
      lastWorkingDay: '',
      openToRelocate: false,
      customQuestions: []
    }
  });

  const watchOnNotice = watch('onNoticePeriod');

  useEffect(() => {
    const fetchRemoteAndLocalProfile = async () => {
      let profileData: any = null;
      
      // 1. Try to fetch from remote DB
      try {
        const resumeData = await apiFetch('/resume');
        if (resumeData && resumeData.contactInfo) {
          profileData = resumeData.contactInfo;
        }
      } catch (err) {
        console.warn('Could not fetch settings from database backend:', err);
      }

      // 2. Fall back to local storage
      if (!profileData) {
        const savedProfile = localStorage.getItem('sa_autofill_profile');
        if (savedProfile) {
          try {
            profileData = JSON.parse(savedProfile);
          } catch {}
        }
      }

      // 3. Fall back to defaults
      if (!profileData && user?.email) {
        profileData = {
          fullName: 'John Doe',
          email: user.email,
          phone: '+91 98765 43210',
          location: 'India',
          yearsOfExperience: 3,
          portfolioUrl: 'https://portfolio.dev',
          githubUrl: 'https://github.com/developer',
          linkedinUrl: 'https://linkedin.com/in/developer',
          currentCtc: '12',
          expectedCtc: '18',
          noticePeriod: '30',
          onNoticePeriod: false,
          lastWorkingDay: '',
          openToRelocate: true,
          customQuestions: [
            { keyword: 'gender', answer: 'Male' },
            { keyword: 'date of birth', answer: '15/08/1995' },
            { keyword: 'veteran', answer: 'No' }
          ]
        };
      }

      if (profileData) {
        reset({
          ...profileData,
          currentCtc: profileData.currentCtc || '',
          expectedCtc: profileData.expectedCtc || '',
          noticePeriod: profileData.noticePeriod || '',
          onNoticePeriod: profileData.onNoticePeriod || false,
          lastWorkingDay: profileData.lastWorkingDay || '',
          openToRelocate: profileData.openToRelocate || false,
        });
        setCustomQuestions(profileData.customQuestions || []);
      }
    };

    fetchRemoteAndLocalProfile();
  }, [user, reset]);

  const addCustomQuestion = () => {
    const updated = [...customQuestions, { keyword: '', answer: '' }];
    setCustomQuestions(updated);
    setValue('customQuestions', updated);
  };

  const removeCustomQuestion = (index: number) => {
    const updated = customQuestions.filter((_, i) => i !== index);
    setCustomQuestions(updated);
    setValue('customQuestions', updated);
  };

  const updateCustomQuestion = (index: number, field: 'keyword' | 'answer', value: string) => {
    const updated = [...customQuestions];
    updated[index] = { ...updated[index], [field]: value };
    setCustomQuestions(updated);
    setValue('customQuestions', updated);
  };

  const saveMutation = useMutation({
    mutationFn: async (data: SettingsInputs) => {
      const payload = {
        ...data,
        customQuestions
      };
      
      // Save locally
      localStorage.setItem('sa_autofill_profile', JSON.stringify(payload));
      
      // Sync to remote database
      try {
        const resumeData = await apiFetch('/resume');
        if (resumeData) {
          await apiFetch('/resume', {
            method: 'PUT',
            body: JSON.stringify({
              ...resumeData,
              contactInfo: payload
            })
          });
        }
      } catch (err) {
        console.warn('Could not sync presets to database server:', err);
      }
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

          {/* CTC & Job Status Section */}
          <div className="border-t border-white/5 pt-4">
            <h3 className="text-xs font-semibold text-neutral-300 mb-4">CTC & Job Status</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-2">Current CTC (LPA)</label>
                <input
                  type="text"
                  placeholder="e.g. 12"
                  className="w-full px-4 py-2.5 bg-muted border border-card-border rounded-xl text-white text-sm focus:outline-none focus:ring-1 focus:border-white focus:ring-white/20 transition-all"
                  {...register('currentCtc')}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-2">Expected CTC (LPA)</label>
                <input
                  type="text"
                  placeholder="e.g. 18"
                  className="w-full px-4 py-2.5 bg-muted border border-card-border rounded-xl text-white text-sm focus:outline-none focus:ring-1 focus:border-white focus:ring-white/20 transition-all"
                  {...register('expectedCtc')}
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-2">Notice Period (days)</label>
              <input
                type="text"
                placeholder="e.g. 30"
                className="w-full px-4 py-2.5 bg-muted border border-card-border rounded-xl text-white text-sm focus:outline-none focus:ring-1 focus:border-white focus:ring-white/20 transition-all"
                {...register('noticePeriod')}
              />
            </div>

            <div className="flex items-center h-11 pl-1">
              <input
                type="checkbox"
                id="onNoticePeriod"
                className="w-4 h-4 rounded bg-muted border-card-border text-primary focus:ring-primary cursor-pointer"
                {...register('onNoticePeriod')}
              />
              <label htmlFor="onNoticePeriod" className="text-xs font-semibold text-gray-300 ml-2 cursor-pointer select-none">Currently on Notice Period</label>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-2">Last Working Day</label>
              <input
                type="date"
                disabled={!watchOnNotice}
                className="w-full px-4 py-2.5 bg-muted border border-card-border rounded-xl text-white text-sm focus:outline-none focus:ring-1 focus:border-white focus:ring-white/20 transition-all disabled:opacity-50 [color-scheme:dark]"
                {...register('lastWorkingDay')}
              />
            </div>
          </div>

          <div className="flex items-center pl-1 py-1">
            <input
              type="checkbox"
              id="openToRelocate"
              className="w-4 h-4 rounded bg-muted border-card-border text-primary focus:ring-primary cursor-pointer"
              {...register('openToRelocate')}
            />
            <label htmlFor="openToRelocate" className="text-xs font-semibold text-gray-300 ml-2 cursor-pointer select-none">Open to Relocation</label>
          </div>

          {/* Custom Q&A section */}
          <div className="border-t border-white/5 pt-4">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="text-xs font-semibold text-neutral-300">Custom Autofill Questions & Answers</h3>
                <p className="text-[10px] text-muted-foreground mt-0.5">Specify generic Q&A pairs (e.g., date of birth, gender, veteran status) to be matched on forms.</p>
              </div>
              <button
                type="button"
                onClick={addCustomQuestion}
                className="py-1.5 px-3 bg-white/5 border border-white/10 hover:bg-white/10 text-white rounded-lg text-[10px] font-bold transition-all"
              >
                + Add Custom Field
              </button>
            </div>

            {customQuestions.length === 0 ? (
              <p className="text-xs text-gray-500 italic text-center py-2">No custom Q&A fields added yet.</p>
            ) : (
              <div className="space-y-3">
                {customQuestions.map((q, idx) => (
                  <div key={idx} className="flex gap-3 items-center bg-white/[0.02] border border-white/5 p-3 rounded-xl">
                    <div className="flex-1">
                      <input
                        type="text"
                        placeholder="Question Keyword (e.g. gender)"
                        className="w-full px-3 py-2 bg-muted border border-card-border rounded-lg text-xs text-white focus:outline-none focus:border-white"
                        value={q.keyword}
                        onChange={e => updateCustomQuestion(idx, 'keyword', e.target.value)}
                      />
                    </div>
                    <div className="flex-1">
                      <input
                        type="text"
                        placeholder="Answer Value (e.g. Male)"
                        className="w-full px-3 py-2 bg-muted border border-card-border rounded-lg text-xs text-white focus:outline-none focus:border-white"
                        value={q.answer}
                        onChange={e => updateCustomQuestion(idx, 'answer', e.target.value)}
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => removeCustomQuestion(idx)}
                      className="p-2 hover:bg-red-500/10 text-gray-500 hover:text-red-400 rounded-lg transition-colors"
                      title="Delete field"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
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
