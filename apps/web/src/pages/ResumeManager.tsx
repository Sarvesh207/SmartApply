import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch, apiClient } from '../utils/api';
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
  Cpu,
  Edit2,
  Save,
  X,
  Plus,
  Trash2,
  SearchCode
} from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

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

const uploadSchema = z.object({
  resume: z.any()
    .refine((fileList) => fileList instanceof FileList && fileList.length > 0, 'Please select a PDF file')
    .refine((fileList) => fileList?.[0]?.type === 'application/pdf', 'Only PDF files are supported')
    .refine((fileList) => fileList?.[0]?.size <= 5 * 1024 * 1024, 'PDF file must be less than 5MB')
});

type UploadInputs = z.infer<typeof uploadSchema>;

export default function ResumeManager() {
  const queryClient = useQueryClient();
  const token = useAuthStore(state => state.token);
  const [activeTab, setActiveTab] = useState<'skills' | 'experience' | 'projects' | 'education'>('skills');

  // Editing state
  const [isEditing, setIsEditing] = useState(false);
  const [editedSkills, setEditedSkills] = useState('');
  const [editedExperience, setEditedExperience] = useState<ResumeData['experience']>([]);
  const [editedProjects, setEditedProjects] = useState<ResumeData['projects']>([]);
  const [editedEducation, setEditedEducation] = useState<ResumeData['education']>([]);

  // React Hook Form for Resume Upload
  const { register, handleSubmit, watch, reset, formState: { errors } } = useForm<UploadInputs>({
    resolver: zodResolver(uploadSchema)
  });

  const resumeFile = watch('resume');
  const fileName = resumeFile && resumeFile.length > 0 ? resumeFile[0].name : null;

  // Query to fetch current resume
  const { data: resume, isLoading, error } = useQuery<ResumeData>({
    queryKey: ['resume'],
    queryFn: () => apiFetch('/resume'),
    retry: false,
  });

  // Initialize edit fields when edit mode is triggered
  const startEditing = () => {
    if (resume) {
      setEditedSkills(resume.skills.join(', '));
      setEditedExperience(resume.experience.map(e => ({ ...e })));
      setEditedProjects(resume.projects.map(p => ({ ...p, technologies: [...p.technologies] })));
      setEditedEducation(resume.education.map(ed => ({ ...ed })));
      setIsEditing(true);
    }
  };

  // Mutation to upload resume
  const uploadMutation = useMutation({
    mutationFn: async (uploadFile: File) => {
      const formData = new FormData();
      formData.append('resume', uploadFile);

      const response = await apiClient.post('/resume/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data.resume;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['resume'] });
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      reset();
      alert('Resume parsed and saved successfully!');
    }
  });

  // Mutation to save edited changes
  const saveMutation = useMutation({
    mutationFn: (updatedData: Partial<ResumeData>) => 
      apiFetch('/resume', {
        method: 'PUT',
        body: JSON.stringify(updatedData)
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['resume'] });
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      setIsEditing(false);
      alert('Profile details updated successfully!');
    },
    onError: (err: any) => {
      alert(err.message || 'Failed to save changes');
    }
  });

  // Mutation to trigger local job scraper
  const triggerScrapeMutation = useMutation({
    mutationFn: () => apiFetch('/jobs/trigger-scrape', { method: 'POST' }),
    onSuccess: (res) => {
      alert(res.message);
    },
    onError: (err: any) => {
      alert(err.message || 'Failed to run background scraper');
    }
  });

  const handleUploadSubmit = (data: UploadInputs) => {
    if (data.resume && data.resume.length > 0) {
      uploadMutation.mutate(data.resume[0]);
    }
  };

  const handleSaveProfile = () => {
    const formattedSkills = editedSkills
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);

    saveMutation.mutate({
      skills: formattedSkills,
      experience: editedExperience,
      projects: editedProjects,
      education: editedEducation
    });
  };

  // Helper functions to manage array edits in state
  const updateExperience = (index: number, field: string, value: string) => {
    const updated = [...editedExperience];
    updated[index] = { ...updated[index], [field]: value };
    setEditedExperience(updated);
  };

  const addExperience = () => {
    setEditedExperience([
      ...editedExperience,
      { role: '', company: '', duration: '', description: '' }
    ]);
  };

  const removeExperience = (index: number) => {
    setEditedExperience(editedExperience.filter((_, i) => i !== index));
  };

  const updateProject = (index: number, field: string, value: string) => {
    const updated = [...editedProjects];
    if (field === 'technologies') {
      updated[index] = { 
        ...updated[index], 
        technologies: value.split(',').map(s => s.trim()).filter(Boolean) 
      };
    } else {
      updated[index] = { ...updated[index], [field]: value };
    }
    setEditedProjects(updated);
  };

  const addProject = () => {
    setEditedProjects([
      ...editedProjects,
      { name: '', description: '', technologies: [] }
    ]);
  };

  const removeProject = (index: number) => {
    setEditedProjects(editedProjects.filter((_, i) => i !== index));
  };

  const updateEducation = (index: number, field: string, value: string) => {
    const updated = [...editedEducation];
    updated[index] = { ...updated[index], [field]: value };
    setEditedEducation(updated);
  };

  const addEducation = () => {
    setEditedEducation([
      ...editedEducation,
      { degree: '', institution: '', graduationYear: '' }
    ]);
  };

  const removeEducation = (index: number) => {
    setEditedEducation(editedEducation.filter((_, i) => i !== index));
  };

  const tabs = [
    { id: 'skills', label: 'Technical Skills', icon: Cpu },
    { id: 'experience', label: 'Work Experience', icon: Briefcase },
    { id: 'projects', label: 'Projects', icon: FolderGit2 },
    { id: 'education', label: 'Education', icon: BookOpen },
  ] as const;

  return (
    <div className="space-y-8 animate-fade-in p-6 max-w-4xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight gradient-text">Resume Manager</h1>
          <p className="text-muted-foreground text-sm mt-1">Upload and edit your resume details to personalize job matches.</p>
        </div>
        
        {/* Scraper Trigger Button */}
        {resume && (
          <button
            disabled={triggerScrapeMutation.isPending}
            onClick={() => triggerScrapeMutation.mutate()}
            className="py-2.5 px-4 bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded-xl font-bold text-xs flex items-center gap-2 hover:glow-hover transition-all disabled:opacity-50 shrink-0"
          >
            {triggerScrapeMutation.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <SearchCode className="w-4 h-4" />
            )}
            Fetch Jobs for My Profile
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Upload Column */}
        <div className="space-y-6">
          <div className="glass-panel p-6 rounded-2xl border border-white/5 shadow-xl space-y-4">
            <h3 className="text-sm font-semibold text-white">Upload New Resume</h3>
            
            {(errors.resume || uploadMutation.isError) && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-xs p-3 rounded-lg flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{typeof errors.resume?.message === 'string' ? errors.resume.message : (uploadMutation.error?.message || 'File upload failed')}</span>
              </div>
            )}

            <form onSubmit={handleSubmit(handleUploadSubmit)} className="space-y-4">
              <div className="border-2 border-dashed border-white/10 hover:border-white/30 rounded-xl p-6 text-center cursor-pointer transition-colors relative">
                <input 
                  type="file" 
                  accept=".pdf"
                  className="absolute inset-0 opacity-0 cursor-pointer" 
                  {...register('resume')}
                />
                <UploadCloud className="w-8 h-8 text-gray-500 mx-auto mb-2" />
                <span className="text-xs text-gray-400 block">
                  {fileName ? fileName : 'Click to select or drag PDF file'}
                </span>
                <span className="text-[10px] text-gray-600 block mt-1">PDF max 5MB</span>
              </div>

              {fileName && (
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

        {/* Parsed Output / Editor Column */}
        <div className="md:col-span-2 space-y-6">
          {isLoading ? (
            <div className="flex justify-center py-20 glass-panel rounded-2xl border border-white/5 shadow-xl">
              <Loader2 className="w-8 h-8 text-white animate-spin" />
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
              {/* Header Action Row */}
              <div className="flex justify-between items-center border-b border-white/5 pb-4">
                <span className="text-xs text-muted-foreground">
                  Last Updated: {new Date(resume.updatedAt).toLocaleString()}
                </span>
                
                {isEditing ? (
                  <div className="flex gap-2">
                    <button
                      onClick={() => setIsEditing(false)}
                      className="py-1 px-3 bg-white/5 border border-white/5 text-gray-400 hover:text-white rounded-lg text-xs font-semibold flex items-center gap-1 transition-all"
                    >
                      <X className="w-3.5 h-3.5" />
                      Cancel
                    </button>
                    <button
                      disabled={saveMutation.isPending}
                      onClick={handleSaveProfile}
                      className="py-1 px-3 bg-white text-black hover:bg-neutral-200 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all"
                    >
                      {saveMutation.isPending ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-black" />
                      ) : (
                        <Save className="w-3.5 h-3.5" />
                      )}
                      Save Presets
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={startEditing}
                    className="py-1 px-3 bg-white/5 hover:bg-white/10 border border-white/5 text-white rounded-lg text-xs font-semibold flex items-center gap-1 transition-all"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    Edit Profile
                  </button>
                )}
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
                          ? 'border-white text-white' 
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
                    {isEditing ? (
                      <div className="space-y-2">
                        <label className="text-[10px] text-muted-foreground">List your technical skills separated by commas</label>
                        <textarea
                          className="w-full p-3 bg-muted border border-card-border rounded-xl text-xs text-white placeholder-gray-500 focus:outline-none focus:border-white font-sans"
                          rows={6}
                          value={editedSkills}
                          onChange={e => setEditedSkills(e.target.value)}
                        />
                      </div>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {resume.skills.map((skill, idx) => (
                          <span 
                            key={idx} 
                            className="bg-white/10 text-white border border-white/20 px-3 py-1 rounded-xl text-xs font-medium"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'experience' && (
                  <div className="space-y-6">
                    <h4 className="text-sm font-semibold text-white flex justify-between items-center">
                      Work Experience
                      {isEditing && (
                        <button
                          onClick={addExperience}
                          className="py-1 px-2.5 bg-white/5 border border-white/10 text-white rounded-lg text-[10px] font-bold flex items-center gap-1 hover:bg-white/10 transition-all"
                        >
                          <Plus className="w-3 h-3" /> Add Role
                        </button>
                      )}
                    </h4>
                    
                    {isEditing ? (
                      <div className="space-y-6">
                        {editedExperience.map((exp, idx) => (
                          <div key={idx} className="bg-white/5 border border-white/5 p-4 rounded-xl space-y-3 relative shadow-inner">
                            <button
                              onClick={() => removeExperience(idx)}
                              className="absolute top-2 right-2 p-1.5 hover:bg-red-500/10 text-gray-500 hover:text-red-400 rounded-lg"
                              title="Delete item"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              <div>
                                <label className="text-[10px] text-gray-400 block mb-1">Role Title</label>
                                <input
                                  type="text"
                                  className="w-full px-3 py-1.5 bg-muted border border-card-border rounded-lg text-xs text-white focus:outline-none focus:border-white"
                                  value={exp.role}
                                  onChange={e => updateExperience(idx, 'role', e.target.value)}
                                />
                              </div>
                              <div>
                                <label className="text-[10px] text-gray-400 block mb-1">Company</label>
                                <input
                                  type="text"
                                  className="w-full px-3 py-1.5 bg-muted border border-card-border rounded-lg text-xs text-white focus:outline-none focus:border-white"
                                  value={exp.company}
                                  onChange={e => updateExperience(idx, 'company', e.target.value)}
                                />
                              </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              <div>
                                <label className="text-[10px] text-gray-400 block mb-1">Duration (e.g. 2021 - 2023)</label>
                                <input
                                  type="text"
                                  className="w-full px-3 py-1.5 bg-muted border border-card-border rounded-lg text-xs text-white focus:outline-none focus:border-white"
                                  value={exp.duration}
                                  onChange={e => updateExperience(idx, 'duration', e.target.value)}
                                />
                              </div>
                            </div>

                            <div>
                              <label className="text-[10px] text-gray-400 block mb-1">Description</label>
                              <textarea
                                className="w-full p-3 bg-muted border border-card-border rounded-lg text-xs text-white focus:outline-none focus:border-white font-sans"
                                rows={3}
                                value={exp.description}
                                onChange={e => updateExperience(idx, 'description', e.target.value)}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      resume.experience.map((exp, idx) => (
                        <div key={idx} className="border-l-2 border-white/10 pl-4 space-y-1 relative">
                          <div className="w-3 h-3 rounded-full bg-white absolute -left-[7px] top-1.5"></div>
                          <h4 className="text-sm font-bold text-white">{exp.role}</h4>
                          <div className="text-xs text-neutral-300 font-semibold">{exp.company} <span className="text-muted-foreground">({exp.duration})</span></div>
                          <p className="text-xs text-gray-300 leading-relaxed font-sans">{exp.description}</p>
                        </div>
                      ))
                    )}
                  </div>
                )}

                {activeTab === 'projects' && (
                  <div className="space-y-6">
                    <h4 className="text-sm font-semibold text-white flex justify-between items-center">
                      Projects
                      {isEditing && (
                        <button
                          onClick={addProject}
                          className="py-1 px-2.5 bg-white/5 border border-white/10 text-white rounded-lg text-[10px] font-bold flex items-center gap-1 hover:bg-white/10 transition-all"
                        >
                          <Plus className="w-3 h-3" /> Add Project
                        </button>
                      )}
                    </h4>

                    {isEditing ? (
                      <div className="space-y-6">
                        {editedProjects.map((proj, idx) => (
                          <div key={idx} className="bg-white/5 border border-white/5 p-4 rounded-xl space-y-3 relative shadow-inner">
                            <button
                              onClick={() => removeProject(idx)}
                              className="absolute top-2 right-2 p-1.5 hover:bg-red-500/10 text-gray-500 hover:text-red-400 rounded-lg"
                              title="Delete project"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>

                            <div>
                              <label className="text-[10px] text-gray-400 block mb-1">Project Name</label>
                              <input
                                type="text"
                                className="w-full px-3 py-1.5 bg-muted border border-card-border rounded-lg text-xs text-white focus:outline-none focus:border-white"
                                value={proj.name}
                                onChange={e => updateProject(idx, 'name', e.target.value)}
                              />
                            </div>

                            <div>
                              <label className="text-[10px] text-gray-400 block mb-1">Description</label>
                              <textarea
                                className="w-full p-3 bg-muted border border-card-border rounded-lg text-xs text-white focus:outline-none focus:border-white font-sans"
                                rows={3}
                                value={proj.description}
                                onChange={e => updateProject(idx, 'description', e.target.value)}
                              />
                            </div>

                            <div>
                              <label className="text-[10px] text-gray-400 block mb-1">Technologies (comma separated)</label>
                              <input
                                type="text"
                                className="w-full px-3 py-1.5 bg-muted border border-card-border rounded-lg text-xs text-white focus:outline-none focus:border-white"
                                value={proj.technologies.join(', ')}
                                onChange={e => updateProject(idx, 'technologies', e.target.value)}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
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
                  </div>
                )}

                {activeTab === 'education' && (
                  <div className="space-y-6">
                    <h4 className="text-sm font-semibold text-white flex justify-between items-center">
                      Education
                      {isEditing && (
                        <button
                          onClick={addEducation}
                          className="py-1 px-2.5 bg-white/5 border border-white/10 text-white rounded-lg text-[10px] font-bold flex items-center gap-1 hover:bg-white/10 transition-all"
                        >
                          <Plus className="w-3 h-3" /> Add Edu
                        </button>
                      )}
                    </h4>

                    {isEditing ? (
                      <div className="space-y-6">
                        {editedEducation.map((edu, idx) => (
                          <div key={idx} className="bg-white/5 border border-white/5 p-4 rounded-xl space-y-3 relative shadow-inner">
                            <button
                              onClick={() => removeEducation(idx)}
                              className="absolute top-2 right-2 p-1.5 hover:bg-red-500/10 text-gray-500 hover:text-red-400 rounded-lg"
                              title="Delete education"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              <div>
                                <label className="text-[10px] text-gray-400 block mb-1">Degree Title</label>
                                <input
                                  type="text"
                                  className="w-full px-3 py-1.5 bg-muted border border-card-border rounded-lg text-xs text-white focus:outline-none focus:border-white"
                                  value={edu.degree}
                                  onChange={e => updateEducation(idx, 'degree', e.target.value)}
                                />
                              </div>
                              <div>
                                <label className="text-[10px] text-gray-400 block mb-1">Institution</label>
                                <input
                                  type="text"
                                  className="w-full px-3 py-1.5 bg-muted border border-card-border rounded-lg text-xs text-white focus:outline-none focus:border-white"
                                  value={edu.institution}
                                  onChange={e => updateEducation(idx, 'institution', e.target.value)}
                                />
                              </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              <div>
                                <label className="text-[10px] text-gray-400 block mb-1">Graduation Year</label>
                                <input
                                  type="text"
                                  className="w-full px-3 py-1.5 bg-muted border border-card-border rounded-lg text-xs text-white focus:outline-none focus:border-white"
                                  value={edu.graduationYear}
                                  onChange={e => updateEducation(idx, 'graduationYear', e.target.value)}
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      resume.education.map((edu, idx) => (
                        <div key={idx} className="border-l-2 border-white/10 pl-4 space-y-1 relative">
                          <div className="w-3 h-3 rounded-full bg-white absolute -left-[7px] top-1.5"></div>
                          <h4 className="text-sm font-bold text-white">{edu.degree}</h4>
                          <div className="text-xs text-neutral-300 font-semibold">{edu.institution}</div>
                          <p className="text-xs text-muted-foreground">Graduation Year: {edu.graduationYear}</p>
                        </div>
                      ))
                    )}
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
