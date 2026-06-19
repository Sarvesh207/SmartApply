import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { Save, User, Phone, Globe, Github, Linkedin, Cog, Check } from 'lucide-react';
import { AutoFillProfile } from '@smartapply/shared';

export default function Settings() {
  const user = useAuthStore(state => state.user);
  
  // Default values or load from localStorage
  const [profile, setProfile] = useState<AutoFillProfile>({
    fullName: 'John Doe',
    email: user?.email || 'you@example.com',
    phone: '+91 98765 43210',
    location: 'India',
    githubUrl: 'https://github.com/developer',
    linkedinUrl: 'https://linkedin.com/in/developer',
    portfolioUrl: 'https://portfolio.dev',
    yearsOfExperience: 3,
  });

  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const savedProfile = localStorage.getItem('sa_autofill_profile');
    if (savedProfile) {
      try {
        setProfile(JSON.parse(savedProfile));
      } catch {}
    }
  }, []);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('sa_autofill_profile', JSON.stringify(profile));
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="space-y-8 animate-fade-in p-6 max-w-2xl mx-auto">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight gradient-text">Settings</h1>
        <p className="text-muted-foreground text-sm mt-1">Configure your preset auto-fill profile details.</p>
      </div>

      <div className="glass-panel p-8 rounded-2xl border border-white/5 shadow-xl">
        <div className="flex items-center gap-2 mb-6 border-b border-white/5 pb-4">
          <Cog className="w-5 h-5 text-purple-400" />
          <h2 className="text-lg font-semibold text-white">Autofill Profile Presets</h2>
        </div>

        <form onSubmit={handleSave} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-2">Full Name</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  type="text"
                  required
                  className="w-full pl-9 pr-4 py-2.5 bg-muted border border-card-border rounded-xl text-white text-sm focus:outline-none focus:border-purple-500"
                  value={profile.fullName}
                  onChange={e => setProfile({ ...profile, fullName: e.target.value })}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-2">Phone Number</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  type="text"
                  required
                  className="w-full pl-9 pr-4 py-2.5 bg-muted border border-card-border rounded-xl text-white text-sm focus:outline-none focus:border-purple-500"
                  value={profile.phone}
                  onChange={e => setProfile({ ...profile, phone: e.target.value })}
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-2">Location</label>
              <input
                type="text"
                required
                className="w-full px-4 py-2.5 bg-muted border border-card-border rounded-xl text-white text-sm focus:outline-none focus:border-purple-500"
                value={profile.location}
                onChange={e => setProfile({ ...profile, location: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-2">Years of Experience</label>
              <input
                type="number"
                required
                min="0"
                className="w-full px-4 py-2.5 bg-muted border border-card-border rounded-xl text-white text-sm focus:outline-none focus:border-purple-500"
                value={profile.yearsOfExperience}
                onChange={e => setProfile({ ...profile, yearsOfExperience: parseInt(e.target.value) || 0 })}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-400 mb-2">Portfolio / Website Link</label>
            <div className="relative">
              <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="url"
                className="w-full pl-9 pr-4 py-2.5 bg-muted border border-card-border rounded-xl text-white text-sm focus:outline-none focus:border-purple-500"
                placeholder="https://yourportfolio.com"
                value={profile.portfolioUrl || ''}
                onChange={e => setProfile({ ...profile, portfolioUrl: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-2">GitHub Profile URL</label>
              <div className="relative">
                <Github className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  type="url"
                  required
                  className="w-full pl-9 pr-4 py-2.5 bg-muted border border-card-border rounded-xl text-white text-sm focus:outline-none focus:border-purple-500"
                  value={profile.githubUrl}
                  onChange={e => setProfile({ ...profile, githubUrl: e.target.value })}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-2">LinkedIn Profile URL</label>
              <div className="relative">
                <Linkedin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  type="url"
                  required
                  className="w-full pl-9 pr-4 py-2.5 bg-muted border border-card-border rounded-xl text-white text-sm focus:outline-none focus:border-purple-500"
                  value={profile.linkedinUrl}
                  onChange={e => setProfile({ ...profile, linkedinUrl: e.target.value })}
                />
              </div>
            </div>
          </div>

          <div className="pt-4 flex justify-between items-center">
            <span className="text-[10px] text-muted-foreground leading-normal max-w-md">
              💡 These settings are stored locally on your device and injected directly when initiating Playwright browser automation form uploads.
            </span>

            <button
              type="submit"
              className="py-2.5 px-6 btn-primary rounded-xl font-semibold flex items-center gap-2 text-xs hover:glow-hover transition-all shrink-0"
            >
              {saved ? (
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
