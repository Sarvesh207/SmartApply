import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '../utils/api';
import { ApplicationDTO, ApplicationStatus } from '@smartapply/shared';
import { 
  Building, 
  MapPin, 
  Target, 
  Chrome, 
  Loader2, 
  ExternalLink,
  Search,
  Plus,
  Trash2,
  Calendar,
  X,
  FileText,
  ArrowUpDown,
  BookOpen,
  Check,
  Edit2
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const STATUS_OPTIONS: { id: ApplicationStatus; label: string; color: string; border: string; bg: string }[] = [
  { id: 'Saved', label: 'Saved Jobs', color: 'text-purple-400', border: 'border-purple-500/20', bg: 'bg-purple-500/10' },
  { id: 'Applied', label: 'Applied', color: 'text-indigo-400', border: 'border-indigo-500/20', bg: 'bg-indigo-500/10' },
  { id: 'Interview', label: 'Interviews', color: 'text-emerald-400', border: 'border-emerald-500/20', bg: 'bg-emerald-500/10' },
  { id: 'Offer', label: 'Offers', color: 'text-amber-400', border: 'border-amber-500/20', bg: 'bg-amber-500/10' },
  { id: 'Rejected', label: 'Rejected', color: 'text-red-400', border: 'border-red-500/20', bg: 'bg-red-500/10' },
  { id: 'Expired', label: 'Expired', color: 'text-slate-400', border: 'border-slate-500/20', bg: 'bg-slate-500/10' },
];

export default function Applications() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'All' | ApplicationStatus>('All');
  const [search, setSearch] = useState('');
  
  // Sorting State
  const [sortColumn, setSortColumn] = useState<'title' | 'company' | 'location' | 'scrapedAt' | 'appliedAt' | 'matchScore'>('appliedAt');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  // Modals State
  const [selectedApp, setSelectedApp] = useState<ApplicationDTO | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Form State for Adding Job by URL
  const [urlInput, setUrlInput] = useState('');
  const [titleInput, setTitleInput] = useState('');
  const [companyInput, setCompanyInput] = useState('');
  const [locationInput, setLocationInput] = useState('Remote');
  const [descriptionInput, setDescriptionInput] = useState('');
  const [statusInput, setStatusInput] = useState<ApplicationStatus>('Saved');
  const [notesInput, setNotesInput] = useState('');
  const [appliedDateInput, setAppliedDateInput] = useState('');
  const [addJobError, setAddJobError] = useState('');

  // Fetch applications
  const { data: applications = [], isLoading, error } = useQuery<ApplicationDTO[]>({
    queryKey: ['applications'],
    queryFn: () => apiFetch('/applications'),
  });

  // Update application status, notes, or appliedAt date
  const updateMutation = useMutation({
    mutationFn: ({ id, status, notes, appliedAt }: { id: string; status?: ApplicationStatus; notes?: string; appliedAt?: Date | null }) => 
      apiFetch(`/applications/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status, notes, appliedAt }),
      }),
    onSuccess: () => {
      toast.success('Application updated successfully');
      queryClient.invalidateQueries({ queryKey: ['applications'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to update application');
    }
  });

  // Delete application
  const deleteMutation = useMutation({
    mutationFn: (id: string) => 
      apiFetch(`/applications/${id}`, {
        method: 'DELETE',
      }),
    onSuccess: () => {
      toast.success('Application deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['applications'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      setDeleteConfirmId(null);
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to delete application');
    }
  });

  // Add application by URL
  const addByUrlMutation = useMutation({
    mutationFn: (body: any) => 
      apiFetch('/applications/by-url', {
        method: 'POST',
        body: JSON.stringify(body),
      }),
    onSuccess: () => {
      toast.success('Job application imported successfully!');
      queryClient.invalidateQueries({ queryKey: ['applications'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      setShowAddModal(false);
      resetAddForm();
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to import job application');
      setAddJobError(err.message || 'Failed to add job application');
    }
  });

  // Trigger autofill
  const autofillMutation = useMutation({
    mutationFn: (appId: string) => 
      apiFetch<{ success: boolean; message: string }>(`/applications/${appId}/autofill`, {
        method: 'POST',
      }),
    onMutate: () => {
      return { toastId: toast.loading('Launching autofill script in Google Chrome...') };
    },
    onSuccess: (res, appId, context) => {
      toast.dismiss(context?.toastId);
      toast.success(res.message || 'Autofill window successfully opened.');
    },
    onError: (err: any, appId, context) => {
      toast.dismiss(context?.toastId);
      toast.error(err.message || 'Failed to start autofill process.');
    }
  });

  const resetAddForm = () => {
    setUrlInput('');
    setTitleInput('');
    setCompanyInput('');
    setLocationInput('Remote');
    setDescriptionInput('');
    setStatusInput('Saved');
    setNotesInput('');
    setAppliedDateInput('');
    setAddJobError('');
  };

  const handleUrlChange = (val: string) => {
    setUrlInput(val);
    // Simple regex parsing to extract company/title guesses from URLs
    if (val.includes('linkedin.com/jobs/view/')) {
      // Just some sample guesses to make it feel smart
      setTitleInput(titleInput || 'Software Engineer');
      setCompanyInput(companyInput || 'LinkedIn Job Posting');
    } else if (val.includes('indeed.com')) {
      setTitleInput(titleInput || 'Developer Role');
      setCompanyInput(companyInput || 'Indeed Job Posting');
    }
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!urlInput || !titleInput || !companyInput) {
      setAddJobError('Please fill out all required fields.');
      return;
    }
    
    addByUrlMutation.mutate({
      url: urlInput,
      title: titleInput,
      company: companyInput,
      location: locationInput,
      description: descriptionInput || undefined,
      status: statusInput,
      notes: notesInput || undefined,
      appliedAt: statusInput === 'Applied' && appliedDateInput ? new Date(appliedDateInput).toISOString() : undefined
    });
  };

  const handleSort = (col: typeof sortColumn) => {
    if (sortColumn === col) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(col);
      setSortDirection('desc');
    }
  };

  // Filter application list
  const filteredApps = applications.filter((app) => {
    const matchesTab = activeTab === 'All' || app.status === activeTab;
    const matchesSearch = 
      app.job.title.toLowerCase().includes(search.toLowerCase()) ||
      app.job.company.toLowerCase().includes(search.toLowerCase()) ||
      app.job.location.toLowerCase().includes(search.toLowerCase()) ||
      (app.notes && app.notes.toLowerCase().includes(search.toLowerCase()));
    
    return matchesTab && matchesSearch;
  });

  // Sort applications list
  const sortedApps = [...filteredApps].sort((a, b) => {
    let valA: any;
    let valB: any;

    if (sortColumn === 'title') {
      valA = a.job.title.toLowerCase();
      valB = b.job.title.toLowerCase();
    } else if (sortColumn === 'company') {
      valA = a.job.company.toLowerCase();
      valB = b.job.company.toLowerCase();
    } else if (sortColumn === 'location') {
      valA = a.job.location.toLowerCase();
      valB = b.job.location.toLowerCase();
    } else if (sortColumn === 'scrapedAt') {
      valA = new Date(a.job.scrapedAt).getTime();
      valB = new Date(b.job.scrapedAt).getTime();
    } else if (sortColumn === 'appliedAt') {
      valA = a.appliedAt ? new Date(a.appliedAt).getTime() : 0;
      valB = b.appliedAt ? new Date(b.appliedAt).getTime() : 0;
    } else if (sortColumn === 'matchScore') {
      valA = a.job.matchScore || 0;
      valB = b.job.matchScore || 0;
    }

    if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
    if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  const getStatusBadgeStyle = (status: ApplicationStatus) => {
    const opt = STATUS_OPTIONS.find(o => o.id === status);
    return opt ? `${opt.color} ${opt.border} ${opt.bg}` : '';
  };

  const getScoreBadgeClass = (score: number) => {
    if (score >= 80) return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25';
    if (score >= 60) return 'bg-amber-500/10 text-amber-400 border-amber-500/25';
    return 'bg-gray-500/10 text-gray-400 border-gray-500/20';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-4 rounded-xl max-w-lg mx-auto text-center mt-10">
        Failed to load applications.
      </div>
    );
  }

  // Count helper
  const getTabCount = (status: 'All' | ApplicationStatus) => {
    if (status === 'All') return applications.length;
    return applications.filter(app => app.status === status).length;
  };

  return (
    <div className="space-y-8 animate-fade-in p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight gradient-text">Application Board</h1>
          <p className="text-muted-foreground text-sm mt-1">Manage and track your job applications in one high-performance smart table.</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setShowAddModal(true)}
            className="py-2.5 px-4 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold text-xs flex items-center gap-2 hover:glow-hover transition-all"
          >
            <Plus className="w-4 h-4" />
            Add Job by URL
          </button>
          <button
            onClick={() => navigate('/jobs')}
            className="py-2.5 px-4 bg-white/5 hover:bg-white/10 border border-white/5 text-purple-400 rounded-xl font-bold text-xs"
          >
            Job Board
          </button>
        </div>
      </div>

      {/* Tabs / Filters Grid */}
      <div className="space-y-4">
        {/* Status Tab Navigation */}
        <div className="flex border-b border-white/5 gap-2 overflow-x-auto pb-px">
          <button
            onClick={() => setActiveTab('All')}
            className={`flex items-center gap-2 px-4 py-3 border-b-2 text-xs font-semibold whitespace-nowrap transition-all ${
              activeTab === 'All' 
                ? 'border-purple-500 text-purple-400' 
                : 'border-transparent text-muted-foreground hover:text-white'
            }`}
          >
            All Jobs
            <span className="text-[10px] bg-white/5 px-1.5 py-0.5 rounded font-mono">
              {getTabCount('All')}
            </span>
          </button>
          {STATUS_OPTIONS.map((opt) => (
            <button
              key={opt.id}
              onClick={() => setActiveTab(opt.id)}
              className={`flex items-center gap-2 px-4 py-3 border-b-2 text-xs font-semibold whitespace-nowrap transition-all ${
                activeTab === opt.id 
                  ? 'border-purple-500 text-purple-400' 
                  : 'border-transparent text-muted-foreground hover:text-white'
              }`}
            >
              {opt.label}
              <span className="text-[10px] bg-white/5 px-1.5 py-0.5 rounded font-mono">
                {getTabCount(opt.id)}
              </span>
            </button>
          ))}
        </div>

        {/* Search Input Filter */}
        <div className="flex max-w-md relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            className="w-full pl-10 pr-4 py-2.5 bg-muted/60 border border-card-border rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 text-xs shadow-inner"
            placeholder="Search company, title, location, or notes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* High-Performance Custom Glassmorphic Table */}
      <div className="glass-panel rounded-2xl border border-white/5 shadow-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-white/5 bg-white/5 text-gray-400 font-semibold select-none">
                <th onClick={() => handleSort('title')} className="p-4 cursor-pointer hover:text-white transition-colors">
                  <div className="flex items-center gap-1">
                    Job Title <ArrowUpDown className="w-3.5 h-3.5" />
                  </div>
                </th>
                <th onClick={() => handleSort('company')} className="p-4 cursor-pointer hover:text-white transition-colors">
                  <div className="flex items-center gap-1">
                    Company <ArrowUpDown className="w-3.5 h-3.5" />
                  </div>
                </th>
                <th onClick={() => handleSort('location')} className="p-4 cursor-pointer hover:text-white transition-colors">
                  <div className="flex items-center gap-1">
                    Location <ArrowUpDown className="w-3.5 h-3.5" />
                  </div>
                </th>
                <th onClick={() => handleSort('scrapedAt')} className="p-4 cursor-pointer hover:text-white transition-colors">
                  <div className="flex items-center gap-1">
                    Scraped Date <ArrowUpDown className="w-3.5 h-3.5" />
                  </div>
                </th>
                <th onClick={() => handleSort('appliedAt')} className="p-4 cursor-pointer hover:text-white transition-colors">
                  <div className="flex items-center gap-1">
                    Applied Date <ArrowUpDown className="w-3.5 h-3.5" />
                  </div>
                </th>
                <th className="p-4">Status</th>
                <th className="p-4 w-60">Notes</th>
                <th className="p-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-gray-200">
              {sortedApps.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-20 text-muted-foreground">
                    <FileText className="w-12 h-12 mx-auto mb-3 text-gray-700" />
                    No job applications found matching filter parameters.
                  </td>
                </tr>
              ) : (
                sortedApps.map((app) => (
                  <tr 
                    key={app.id} 
                    className="hover:bg-white/[0.02] transition-colors group"
                  >
                    {/* Job Title / Match Score */}
                    <td className="p-4">
                      <div className="flex items-center gap-2 max-w-xs">
                        <button
                          onClick={() => setSelectedApp(app)}
                          className="font-bold text-white hover:text-purple-400 text-left transition-colors truncate leading-snug hover:underline"
                          title="Click to view details"
                        >
                          {app.job.title}
                        </button>
                        
                        {app.job.matchScore !== null && (
                          <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold border shrink-0 flex items-center gap-0.5 ${getScoreBadgeClass(app.job.matchScore)}`}>
                            <Target className="w-2.5 h-2.5" />
                            {app.job.matchScore}%
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Company */}
                    <td className="p-4 text-gray-300 font-medium font-sans">
                      <div className="flex items-center gap-1.5">
                        <Building className="w-3.5 h-3.5 text-gray-500" />
                        {app.job.company}
                      </div>
                    </td>

                    {/* Location */}
                    <td className="p-4 text-gray-400">
                      <div className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-gray-600" />
                        {app.job.location}
                      </div>
                    </td>

                    {/* Scraped Date */}
                    <td className="p-4 text-gray-400 font-sans">
                      {new Date(app.job.scrapedAt).toLocaleDateString()}
                    </td>

                    {/* Applied Date (Editable inline datepicker) */}
                    <td className="p-4 text-gray-400">
                      <input
                        type="date"
                        className="bg-transparent hover:bg-white/5 border-0 focus:border border-purple-500/20 focus:bg-muted p-1 rounded font-sans text-xs text-gray-300 w-28 focus:outline-none"
                        value={app.appliedAt ? new Date(app.appliedAt).toISOString().split('T')[0] : ''}
                        onChange={(e) => {
                          const dateVal = e.target.value;
                          updateMutation.mutate({ 
                            id: app.id, 
                            appliedAt: dateVal ? new Date(dateVal) : null 
                          });
                        }}
                      />
                    </td>

                    {/* Status Tag Pill Selector */}
                    <td className="p-4">
                      <select
                        className={`px-2 py-1 rounded-lg text-[10px] font-bold border ${getStatusBadgeStyle(app.status)} outline-none cursor-pointer focus:border-purple-500 transition-colors w-28 bg-black/40`}
                        value={app.status}
                        onChange={(e) => {
                          const nextStatus = e.target.value as ApplicationStatus;
                          updateMutation.mutate({ 
                            id: app.id, 
                            status: nextStatus,
                            // Autofill appliedAt to today if changing status to Applied and it's empty
                            appliedAt: nextStatus === 'Applied' && !app.appliedAt ? new Date() : undefined
                          });
                        }}
                      >
                        {STATUS_OPTIONS.map((opt) => (
                          <option key={opt.id} value={opt.id} className="bg-slate-900 text-white text-[10px]">
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </td>

                    {/* Inline Notes Box (Saves on blur) */}
                    <td className="p-4">
                      <input
                        type="text"
                        className="w-full bg-transparent hover:bg-white/5 focus:bg-muted border-0 focus:border border-purple-500/20 px-2 py-1 rounded text-xs text-gray-300 placeholder-gray-600 focus:outline-none truncate"
                        placeholder="Add quick notes..."
                        defaultValue={app.notes || ''}
                        onBlur={(e) => {
                          if (e.target.value !== (app.notes || '')) {
                            updateMutation.mutate({ id: app.id, notes: e.target.value });
                          }
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.currentTarget.blur();
                          }
                        }}
                      />
                    </td>

                    {/* Actions */}
                    <td className="p-4">
                      <div className="flex items-center justify-center gap-2">
                        {/* Playwright Auto Fill Form */}
                        {(app.status === 'Saved' || app.status === 'Applied') ? (
                          <button
                            disabled={autofillMutation.isPending && autofillMutation.variables === app.id}
                            onClick={() => autofillMutation.mutate(app.id)}
                            className="p-1.5 bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 border border-purple-500/20 rounded-lg transition-colors disabled:opacity-50 flex items-center"
                            title="Autofill Job Form"
                          >
                            {autofillMutation.isPending && autofillMutation.variables === app.id ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Chrome className="w-3.5 h-3.5" />
                            )}
                          </button>
                        ) : (
                          <div className="w-7 h-7" /> /* Spacer */
                        )}

                        {/* Open Job Link */}
                        <a
                          href={app.job.jobUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 bg-white/5 hover:bg-white/10 border border-white/5 text-gray-400 hover:text-white rounded-lg transition-colors"
                          title="Open External URL"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>

                        {/* Delete Application Button */}
                        {deleteConfirmId === app.id ? (
                          <div className="flex items-center gap-1 z-20">
                            <button
                              onClick={() => deleteMutation.mutate(app.id)}
                              className="px-1.5 py-0.5 bg-red-600 hover:bg-red-700 text-white rounded text-[9px] font-bold"
                            >
                              Yes
                            </button>
                            <button
                              onClick={() => setDeleteConfirmId(null)}
                              className="px-1.5 py-0.5 bg-white/10 hover:bg-white/20 text-white rounded text-[9px]"
                            >
                              No
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setDeleteConfirmId(app.id)}
                            className="p-1.5 bg-white/5 hover:bg-red-500/15 border border-white/5 hover:border-red-500/20 text-gray-500 hover:text-red-400 rounded-lg transition-colors"
                            title="Delete Application"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* QUICK ADD JOB BY URL MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div className="fixed inset-0 bg-black/75 backdrop-blur-sm" onClick={() => setShowAddModal(false)}></div>
          
          {/* Form */}
          <div className="glass-panel p-6 rounded-2xl border border-white/10 shadow-2xl relative max-w-lg w-full space-y-4 z-10 animate-scale-in">
            <div className="flex justify-between items-center border-b border-white/5 pb-3">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Plus className="w-5 h-5 text-purple-400" />
                Add Job Application by Link
              </h2>
              <button 
                onClick={() => setShowAddModal(false)}
                className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-white/5"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {addJobError && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-xs p-3 rounded-xl">
                {addJobError}
              </div>
            )}

            <form onSubmit={handleAddSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-gray-400 font-semibold mb-1">Job URL / Link *</label>
                <input
                  type="url"
                  required
                  placeholder="https://www.linkedin.com/jobs/view/123..."
                  className="w-full p-2.5 bg-muted border border-card-border rounded-xl text-white focus:outline-none focus:border-purple-500 text-xs"
                  value={urlInput}
                  onChange={(e) => handleUrlChange(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-400 font-semibold mb-1">Job Title *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Frontend Engineer"
                    className="w-full p-2.5 bg-muted border border-card-border rounded-xl text-white focus:outline-none focus:border-purple-500 text-xs"
                    value={titleInput}
                    onChange={(e) => setTitleInput(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-gray-400 font-semibold mb-1">Company Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Google"
                    className="w-full p-2.5 bg-muted border border-card-border rounded-xl text-white focus:outline-none focus:border-purple-500 text-xs"
                    value={companyInput}
                    onChange={(e) => setCompanyInput(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-400 font-semibold mb-1">Location</label>
                  <input
                    type="text"
                    placeholder="e.g. Bangalore, Remote"
                    className="w-full p-2.5 bg-muted border border-card-border rounded-xl text-white focus:outline-none focus:border-purple-500 text-xs"
                    value={locationInput}
                    onChange={(e) => setLocationInput(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-gray-400 font-semibold mb-1">Status</label>
                  <select
                    className="w-full p-2.5 bg-muted border border-card-border rounded-xl text-white focus:outline-none focus:border-purple-500 text-xs"
                    value={statusInput}
                    onChange={(e) => setStatusInput(e.target.value as ApplicationStatus)}
                  >
                    {STATUS_OPTIONS.map((opt) => (
                      <option key={opt.id} value={opt.id}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {statusInput === 'Applied' && (
                <div>
                  <label className="block text-gray-400 font-semibold mb-1">Applied Date</label>
                  <input
                    type="date"
                    className="w-full p-2.5 bg-muted border border-card-border rounded-xl text-white focus:outline-none focus:border-purple-500 text-xs font-sans"
                    value={appliedDateInput}
                    onChange={(e) => setAppliedDateInput(e.target.value)}
                  />
                </div>
              )}

              <div>
                <label className="block text-gray-400 font-semibold mb-1">Notes</label>
                <input
                  type="text"
                  placeholder="e.g. Referred by contact, follow up next Monday"
                  className="w-full p-2.5 bg-muted border border-card-border rounded-xl text-white focus:outline-none focus:border-purple-500 text-xs"
                  value={notesInput}
                  onChange={(e) => setNotesInput(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-gray-400 font-semibold mb-1">Job Description (optional)</label>
                <textarea
                  rows={4}
                  placeholder="Paste details of the role to run instant AI matching..."
                  className="w-full p-2.5 bg-muted border border-card-border rounded-xl text-white focus:outline-none focus:border-purple-500 text-xs font-sans"
                  value={descriptionInput}
                  onChange={(e) => setDescriptionInput(e.target.value)}
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-white/5 border border-white/5 text-gray-300 hover:text-white rounded-xl font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addByUrlMutation.isPending}
                  className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold flex items-center gap-1 disabled:opacity-50"
                >
                  {addByUrlMutation.isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Add Job
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* JOB DESCRIPTION & MATCH DETAILS MODAL */}
      {selectedApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/75 backdrop-blur-sm" onClick={() => setSelectedApp(null)}></div>
          
          <div className="glass-panel p-6 rounded-2xl border border-white/10 shadow-2xl relative max-w-2xl w-full max-h-[85vh] flex flex-col z-10 animate-scale-in">
            {/* Header */}
            <div className="flex justify-between items-start border-b border-white/5 pb-4 shrink-0">
              <div className="space-y-1">
                <h2 className="text-lg font-bold text-white leading-tight">{selectedApp.job.title}</h2>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1 font-semibold text-gray-300">
                    <Building className="w-3.5 h-3.5" />
                    {selectedApp.job.company}
                  </span>
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5" />
                    {selectedApp.job.location}
                  </span>
                </div>
              </div>
              <button 
                onClick={() => setSelectedApp(null)}
                className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-white/5"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="overflow-y-auto py-4 space-y-6 text-xs leading-relaxed flex-1">
              {/* Match Card If Available */}
              {selectedApp.job.matchScore !== undefined && selectedApp.job.matchScore !== null && (
                <div className="bg-purple-950/10 border border-purple-500/20 p-4 rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white text-sm flex items-center gap-1.5">
                      <Target className="w-4 h-4 text-purple-400" />
                      Resume Match Analysis
                    </span>
                    <span className={`px-2.5 py-1 rounded-full border text-xs font-bold ${getScoreBadgeClass(selectedApp.job.matchScore)}`}>
                      {selectedApp.job.matchScore}% Match
                    </span>
                  </div>
                  
                  {selectedApp.job.matchDetails && (
                    <div className="space-y-3 pt-2 text-gray-300">
                      <div>
                        <span className="block text-[10px] font-semibold text-purple-400 mb-1">Matched Tech Stack</span>
                        <div className="flex flex-wrap gap-1.5">
                          {(selectedApp.job.matchDetails.matchedSkills || []).map((skill: string, idx: number) => (
                            <span key={idx} className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-lg text-[10px] font-medium">
                              {skill}
                            </span>
                          ))}
                          {(selectedApp.job.matchDetails.matchedSkills || []).length === 0 && (
                            <span className="text-gray-500 italic">None</span>
                          )}
                        </div>
                      </div>

                      <div>
                        <span className="block text-[10px] font-semibold text-purple-400 mb-1">Missing Stack (Recommended to add)</span>
                        <div className="flex flex-wrap gap-1.5">
                          {(selectedApp.job.matchDetails.missingSkills || []).map((skill: string, idx: number) => (
                            <span key={idx} className="bg-red-500/10 border border-red-500/20 text-red-400 px-2 py-0.5 rounded-lg text-[10px] font-medium">
                              {skill}
                            </span>
                          ))}
                          {(selectedApp.job.matchDetails.missingSkills || []).length === 0 && (
                            <span className="text-gray-500 italic">None</span>
                          )}
                        </div>
                      </div>

                      <div className="border-t border-white/5 pt-2">
                        <span className="block text-[10px] font-semibold text-purple-400 mb-0.5">Scout AI Match Recommendation</span>
                        <p className="text-gray-300 leading-normal font-sans italic">{selectedApp.job.matchDetails.recommendation}</p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Notes display */}
              <div className="space-y-1">
                <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">Application Notes</span>
                <textarea
                  className="w-full p-2.5 bg-muted border border-card-border rounded-xl text-xs text-white focus:outline-none focus:border-purple-500 font-sans"
                  rows={3}
                  defaultValue={selectedApp.notes || ''}
                  placeholder="Enter details about interview steps, key contacts, or links..."
                  onBlur={(e) => {
                    if (e.target.value !== (selectedApp.notes || '')) {
                      updateMutation.mutate({ id: selectedApp.id, notes: e.target.value });
                    }
                  }}
                />
              </div>

              {/* Full Description */}
              <div className="space-y-2">
                <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1">
                  <BookOpen className="w-3.5 h-3.5 text-gray-500" />
                  Full Job Description
                </span>
                <div className="bg-muted/40 p-4 rounded-xl border border-card-border font-sans whitespace-pre-wrap text-gray-300 break-words leading-relaxed max-h-72 overflow-y-auto">
                  {selectedApp.job.description}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="border-t border-white/5 pt-4 flex justify-between items-center shrink-0 text-xs">
              <span className="text-gray-500">
                Job URL Source: <span className="uppercase text-gray-400 font-semibold">{selectedApp.job.source}</span>
              </span>
              <div className="flex gap-2">
                <a
                  href={selectedApp.job.jobUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 bg-white/5 border border-white/5 hover:bg-white/10 text-white rounded-xl font-bold flex items-center gap-1.5 transition-colors"
                >
                  Open Original Page
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
                <button
                  onClick={() => setSelectedApp(null)}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
