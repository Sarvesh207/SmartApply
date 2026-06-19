import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch, API_BASE_URL } from '../utils/api';
import { useAuthStore } from '../store/authStore';
import { 
  FileText, 
  UploadCloud, 
  Check, 
  AlertCircle, 
  Loader2, 
  BookOpen, 
  Briefcase, 
  FolderGit2, 
  Cpu 
} from 'lucide-react';

interface ResumeData {
  id: string;
  skills: string[];
  experience: {
    role: string;
    company: string;
    duration: string;
    description: string;
  }[];
  projects: {
    name: string;
    description: string;
    technologies: string[];
  }[];
  education: {
    degree: string;
    institution: string;
    graduationYear: string;
  }[];
  updatedAt: string;
}

export default function ResumeManager() {
  const queryClient = useQueryClient();
  const token = useAuthStore(state => state.token);
  const [file, setFile] = useState<File | null>(null);
  const [uploadError, setUploadError] = useState('');
  const [activeTab, setActiveTab] = useState<'skills' | 'experience' | 'projects' | 'education'>('skills');

  // Query to fetch current resume
  const { data: resume, isLoading, error } = useQuery<ResumeData>({
    queryKey: ['resume'],
    queryFn: () => apiFetch('/resume'),
    retry: false, // If no resume found, don't keep retrying
  });

  // Mutation to upload resume
  const uploadMutation = useMutation({
    mutationFn: async (uploadFile: File) => {
      const formData = new FormData();
      formData.append('resume', uploadFile);

      const response = await fetch(`${API_BASE_URL}/resume/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData,
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to upload resume');
      }
      return data.resume;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['resume'] });
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      setFile(null);
      setUploadError('');
      alert('Resume parsed and saved successfully!');
    },
    onError: (err: any) => {
      setUploadError(err.message || 'File upload failed');
    }
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFile = e.target.files[0];
      if (selectedFile.type !== 'application/pdf') {
        setUploadError('Only PDF files are supported');
        setFile(null);
      } else {
        setFile(selectedFile);
        setUploadError('');
      }
    }
  };

  const handleUploadSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (file) {
      uploadMutation.mutate(file);
    }
  };

  const tabs = [
    { id: 'skills', label: 'Technical Skills', icon: Cpu },
    { id: 'experience', label: 'Work Experience', icon: Briefcase },
    { id: 'projects', label: 'Projects', icon: FolderGit2 },
    { id: 'education', label: 'Education', icon: BookOpen },
  ] as const;

  return (
    <div className="space-y-8 animate-fade-in p-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight gradient-text">Resume Manager</h1>
        <p className="text-muted-foreground text-sm mt-1">Upload and review your PDF resume for profile auto-filling and matches.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Upload Column */}
        <div className="space-y-6">
          <div className="glass-panel p-6 rounded-2xl border border-white/5 shadow-xl space-y-4">
            <h3 className="text-sm font-semibold text-white">Upload New Resume</h3>
            
            {uploadError && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-xs p-3 rounded-lg flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{uploadError}</span>
              </div>
            )}

            <form onSubmit={handleUploadSubmit} className="space-y-4">
              <div className="border-2 border-dashed border-white/10 hover:border-purple-500/40 rounded-xl p-6 text-center cursor-pointer transition-colors relative">
                <input 
                  type="file" 
                  accept=".pdf"
                  className="absolute inset-0 opacity-0 cursor-pointer" 
                  onChange={handleFileChange}
                />
                <UploadCloud className="w-8 h-8 text-gray-500 mx-auto mb-2" />
                <span className="text-xs text-gray-400 block">
                  {file ? file.name : 'Click to select or drag PDF file'}
                </span>
                <span className="text-[10px] text-gray-600 block mt-1">PDF max 5MB</span>
              </div>

              {file && (
                <button
                  type="submit"
                  disabled={uploadMutation.isPending}
                  className="w-full py-2.5 px-4 btn-primary rounded-xl font-bold text-xs flex items-center justify-center gap-2"
                >
                  {uploadMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Check className="w-4 h-4" />
                  )}
                  Upload & Analyze
                </button>
              )}
            </form>
          </div>
        </div>

        {/* Parsed Output Column */}
        <div className="md:col-span-2 space-y-6">
          {isLoading ? (
            <div className="flex justify-center py-20 glass-panel rounded-2xl border border-white/5 shadow-xl">
              <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
            </div>
          ) : error || !resume ? (
            <div className="text-center py-20 glass-panel border border-white/5 rounded-2xl shadow-xl space-y-4">
              <FileText className="w-12 h-12 text-gray-600 mx-auto" />
              <div className="text-sm font-semibold text-gray-400">No active resume parsed yet</div>
              <p className="text-xs text-muted-foreground px-10 leading-normal">
                Upload your engineering resume in PDF format. We will parse it dynamically and map details into your auto-fill profiles.
              </p>
            </div>
          ) : (
            <div className="glass-panel p-6 rounded-2xl border border-white/5 shadow-xl space-y-6">
              <div className="flex justify-between items-center border-b border-white/5 pb-4">
                <span className="text-xs text-muted-foreground">
                  Last Updated: {new Date(resume.updatedAt).toLocaleString()}
                </span>
                <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded text-[10px] font-semibold flex items-center gap-1">
                  <Check className="w-3 h-3" />
                  Active Profile
                </span>
              </div>

              {/* Tabs Navigation */}
              <div className="flex border-b border-white/5 gap-2 overflow-x-auto">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex items-center gap-1.5 px-4 py-2 border-b-2 text-xs font-semibold whitespace-nowrap transition-all ${
                        isActive 
                          ? 'border-purple-500 text-purple-400' 
                          : 'border-transparent text-muted-foreground hover:text-white'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      {tab.label}
                    </button>
                  );
                })}
              </div>

              {/* Tab Contents */}
              <div className="pt-4 min-h-[300px]">
                {activeTab === 'skills' && (
                  <div className="space-y-4">
                    <h4 className="text-sm font-semibold text-white">Extracted Technologies</h4>
                    <div className="flex flex-wrap gap-2">
                      {resume.skills.map((skill, idx) => (
                        <span 
                          key={idx} 
                          className="bg-purple-500/10 text-purple-400 border border-purple-500/20 px-3 py-1 rounded-xl text-xs font-medium"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {activeTab === 'experience' && (
                  <div className="space-y-6">
                    {resume.experience.map((exp, idx) => (
                      <div key={idx} className="border-l-2 border-purple-500/30 pl-4 space-y-1 relative">
                        <div className="w-3 h-3 rounded-full bg-purple-500 absolute -left-[7px] top-1.5"></div>
                        <h4 className="text-sm font-bold text-white">{exp.role}</h4>
                        <div className="text-xs text-purple-400 font-semibold">{exp.company} <span className="text-muted-foreground">({exp.duration})</span></div>
                        <p className="text-xs text-gray-300 leading-relaxed font-sans">{exp.description}</p>
                      </div>
                    ))}
                  </div>
                )}

                {activeTab === 'projects' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {resume.projects.map((proj, idx) => (
                      <div key={idx} className="bg-white/5 border border-white/5 rounded-xl p-4 space-y-3 shadow-inner">
                        <div>
                          <h4 className="text-sm font-bold text-white">{proj.name}</h4>
                          <p className="text-xs text-gray-300 leading-relaxed mt-1 font-sans">{proj.description}</p>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {proj.technologies.map((t, tIdx) => (
                            <span key={tIdx} className="bg-white/5 px-2 py-0.5 rounded text-[10px] text-gray-400 border border-white/5">
                              {t}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {activeTab === 'education' && (
                  <div className="space-y-6">
                    {resume.education.map((edu, idx) => (
                      <div key={idx} className="border-l-2 border-indigo-500/30 pl-4 space-y-1 relative">
                        <div className="w-3 h-3 rounded-full bg-indigo-500 absolute -left-[7px] top-1.5"></div>
                        <h4 className="text-sm font-bold text-white">{edu.degree}</h4>
                        <div className="text-xs text-indigo-400 font-semibold">{edu.institution}</div>
                        <p className="text-xs text-muted-foreground">Graduation Year: {edu.graduationYear}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
