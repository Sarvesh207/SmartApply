import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '../utils/api';
import { JobDTO } from '@smartapply/shared';
import { 
  Search, 
  Filter, 
  MapPin, 
  Calendar, 
  Target, 
  Plus, 
  Briefcase, 
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Loader2,
  CheckCircle,
  Check,
  Building,
  SearchCode,
  Trash2
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

interface FetchJobsResponse {
  jobs: JobDTO[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

const filterSchema = z.object({
  search: z.string().optional().default(''),
  location: z.string().optional().default(''),
  source: z.string().optional().default(''),
  dateRange: z.string().optional().default(''),
  statusFilter: z.string().optional().default(''),
});

type FilterInputs = z.infer<typeof filterSchema>;

export default function Jobs() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [appliedFilters, setAppliedFilters] = useState<FilterInputs>({
    search: '',
    location: '',
    source: '',
    dateRange: '',
    statusFilter: '',
  });
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const { register, handleSubmit } = useForm<FilterInputs>({
    resolver: zodResolver(filterSchema),
    defaultValues: {
      search: '',
      location: '',
      source: '',
      dateRange: '',
      statusFilter: '',
    }
  });
  
  // Query to fetch jobs
  const { data, isLoading, error } = useQuery<FetchJobsResponse>({
    queryKey: ['jobs', page, appliedFilters.search, appliedFilters.source, appliedFilters.location, appliedFilters.dateRange, appliedFilters.statusFilter],
    queryFn: () => 
      apiFetch(`/jobs?page=${page}&limit=10&search=${appliedFilters.search}&source=${appliedFilters.source}&location=${appliedFilters.location}&dateRange=${appliedFilters.dateRange}&statusFilter=${appliedFilters.statusFilter}`),
  });

  // Mutation to run job matching
  const matchMutation = useMutation({
    mutationFn: (jobId: string) => 
      apiFetch(`/jobs/${jobId}/match`, { method: 'POST' }),
    onMutate: () => {
      return { toastId: toast.loading('Analyzing job requirements against your resume...') };
    },
    onSuccess: (data, jobId, context) => {
      toast.dismiss(context?.toastId);
      toast.success(`Analysis complete! Found ${data.matchScore}% resume compatibility.`);
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
    },
    onError: (err: any, jobId, context) => {
      toast.dismiss(context?.toastId);
      toast.error(err.message || 'Failed to match job. Make sure you have uploaded your resume.');
    }
  });

  // Mutation to save or apply job
  const saveMutation = useMutation({
    mutationFn: ({ jobId, status }: { jobId: string; status: 'Saved' | 'Applied' }) =>
      apiFetch('/applications', {
        method: 'POST',
        body: JSON.stringify({ jobId, status }),
      }),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      queryClient.invalidateQueries({ queryKey: ['applications'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      if (variables.status === 'Applied') {
        toast.success('Job successfully marked as Applied!');
      } else {
        toast.success('Job successfully saved to Applications board!');
      }
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to update job application status');
    }
  });

  // Mutation to delete job
  const deleteJobMutation = useMutation({
    mutationFn: (jobId: string) =>
      apiFetch(`/jobs/${jobId}`, {
        method: 'DELETE',
      }),
    onSuccess: () => {
      toast.success('Job deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      setDeleteConfirmId(null);
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to delete job');
    }
  });

  // Mutation to trigger local job scraper
  const triggerScrapeMutation = useMutation({
    mutationFn: () => apiFetch('/jobs/trigger-scrape', { method: 'POST' }),
    onSuccess: (res) => {
      toast.success(res.message || 'Scraper task triggered successfully!');
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to trigger background scraping.');
    }
  });

  const handleSearchSubmit = (data: FilterInputs) => {
    setPage(1);
    setAppliedFilters(data);
  };

  const getScoreBadgeClass = (score: number) => {
    if (score >= 80) return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
    if (score >= 60) return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
    return 'bg-gray-500/10 text-gray-400 border-gray-500/20';
  };

  return (
    <div className="space-y-8 animate-fade-in p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight gradient-text">Job Board</h1>
          <p className="text-muted-foreground text-sm mt-1">Explore and filter scraped roles from LinkedIn & Indeed.</p>
        </div>
        <button
          disabled={triggerScrapeMutation.isPending}
          onClick={() => triggerScrapeMutation.mutate()}
          className="py-2.5 px-4 bg-white/10 hover:bg-white/15 border border-white/15 text-white rounded-xl font-bold text-xs flex items-center gap-2 hover:glow-hover transition-all disabled:opacity-50 shrink-0"
        >
          {triggerScrapeMutation.isPending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <SearchCode className="w-4 h-4" />
          )}
          Fetch New Jobs
        </button>
      </div>

      {/* Filters form */}
      <form onSubmit={handleSubmit(handleSearchSubmit)} className="glass-panel p-6 rounded-2xl border border-white/5 shadow-xl grid grid-cols-1 md:grid-cols-6 gap-4 animate-fade-in">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            className="w-full pl-9 pr-4 py-2 bg-muted border border-card-border rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-white text-sm"
            placeholder="Search title, company, skills..."
            {...register('search')}
          />
        </div>

        <div className="relative">
          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            className="w-full pl-9 pr-4 py-2 bg-muted border border-card-border rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-white text-sm"
            placeholder="Location (e.g. Remote, Bangalore)"
            {...register('location')}
          />
        </div>

        <div>
          <select
            className="w-full px-4 py-2 bg-muted border border-card-border rounded-xl text-white focus:outline-none focus:border-white text-sm"
            {...register('source')}
          >
            <option value="">All Sources</option>
            <option value="linkedin">LinkedIn</option>
            <option value="indeed">Indeed</option>
          </select>
        </div>

        <div>
          <select
            className="w-full px-4 py-2 bg-muted border border-card-border rounded-xl text-white focus:outline-none focus:border-white text-sm"
            {...register('dateRange')}
          >
            <option value="">Any time</option>
            <option value="24h">Past 24 hours</option>
            <option value="3d">Past 3 days</option>
            <option value="7d">Past week</option>
            <option value="30d">Past month</option>
          </select>
        </div>

        <div>
          <select
            className="w-full px-4 py-2 bg-muted border border-card-border rounded-xl text-white focus:outline-none focus:border-white text-sm"
            {...register('statusFilter')}
          >
            <option value="">All Jobs</option>
            <option value="not_added">Not Added</option>
            <option value="added">Added to Board</option>
          </select>
        </div>

        <button
          type="submit"
          className="py-2 px-4 btn-primary rounded-xl font-semibold flex items-center justify-center gap-2 text-sm hover:glow-hover"
        >
          <Filter className="w-4 h-4" />
          Apply Filters
        </button>
      </form>

      {/* Job list */}
      {isLoading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 text-white animate-spin" />
        </div>
      ) : error || !data || data.jobs.length === 0 ? (
        <div className="text-center py-20 glass-panel border border-white/5 rounded-2xl">
          <Briefcase className="w-12 h-12 text-gray-600 mx-auto mb-4" />
          <p className="text-muted-foreground">No jobs found. Try adjusting your filters or start scraping jobs.</p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            {data.jobs.map((job) => (
              <div 
                key={job.id} 
                className="glass-panel-interactive p-6 rounded-2xl border border-white/5 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 shadow-lg"
              >
                <div className="flex items-start gap-4 flex-1">
                  {/* Company Logo placeholder */}
                  <div className="w-12 h-12 rounded-xl gradient-bg flex items-center justify-center text-white font-bold text-lg shadow-md shrink-0">
                    {job.company.substring(0, 2).toUpperCase()}
                  </div>

                  <div className="space-y-1">
                    <h2 
                      onClick={() => navigate(`/jobs/${job.id}`)}
                      className="text-lg font-bold text-white hover:text-neutral-300 cursor-pointer transition-colors"
                    >
                      {job.title}
                    </h2>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1 font-medium text-gray-300">
                        <Building className="w-3.5 h-3.5" />
                        {job.company}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5" />
                        {job.location}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        {job.datePosted ? new Date(job.datePosted).toLocaleDateString() : 'Recently'}
                      </span>
                      <span className="bg-white/5 px-2 py-0.5 rounded text-[10px] uppercase font-bold text-gray-400 border border-white/5">
                        {job.source}
                      </span>
                      <span className="text-[10px] text-neutral-500 font-sans">
                        Scraped: {new Date(job.scrapedAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4 shrink-0 w-full md:w-auto justify-between md:justify-end">
                  {/* Match Score */}
                  {job.matchScore !== null ? (
                    <div 
                      onClick={() => navigate(`/jobs/${job.id}`)}
                      className={`px-3 py-1.5 rounded-full border text-xs font-semibold flex items-center gap-1.5 cursor-pointer hover:opacity-85 transition-opacity ${getScoreBadgeClass(job.matchScore)}`}
                    >
                      <Target className="w-3.5 h-3.5" />
                      {job.matchScore}% Match
                    </div>
                  ) : (
                    <button
                      disabled={matchMutation.isPending && matchMutation.variables === job.id}
                      onClick={() => matchMutation.mutate(job.id)}
                      className="py-1.5 px-3 bg-white/10 border border-white/15 text-white rounded-full text-xs font-semibold flex items-center gap-1.5 hover:bg-white/20 transition-all disabled:opacity-50"
                    >
                      {matchMutation.isPending && matchMutation.variables === job.id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Target className="w-3.5 h-3.5" />
                      )}
                      Analyze Match
                    </button>
                  )}

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    {job.isApplied ? (
                      job.applicationStatus === 'Saved' ? (
                        <>
                          <span 
                            className="px-3 py-2 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-xl text-[10px] uppercase font-bold flex items-center gap-1.5 shadow-sm shrink-0"
                            title="Status: Saved"
                          >
                            Saved
                          </span>
                          <button
                            disabled={saveMutation.isPending && saveMutation.variables?.jobId === job.id}
                            onClick={() => saveMutation.mutate({ jobId: job.id, status: 'Applied' })}
                            className="p-2 bg-white/5 hover:bg-white/15 border border-white/5 text-gray-300 hover:text-white rounded-xl transition-all disabled:opacity-50"
                            title="Mark as Applied"
                          >
                            {saveMutation.isPending && saveMutation.variables?.jobId === job.id && saveMutation.variables?.status === 'Applied' ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Check className="w-4 h-4" />
                            )}
                          </button>
                        </>
                      ) : (
                        <span 
                          className="px-3 py-2 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-xl text-[10px] uppercase font-bold flex items-center gap-1.5 shadow-sm shrink-0"
                          title={`Status: ${job.applicationStatus}`}
                        >
                          <CheckCircle className="w-3.5 h-3.5" />
                          {job.applicationStatus}
                        </span>
                      )
                    ) : (
                      <>
                        <button
                          disabled={saveMutation.isPending && saveMutation.variables?.jobId === job.id}
                          onClick={() => saveMutation.mutate({ jobId: job.id, status: 'Saved' })}
                          className="p-2 bg-white/5 hover:bg-white/15 border border-white/5 text-gray-300 hover:text-white rounded-xl transition-all disabled:opacity-50"
                          title="Save Job"
                        >
                          {saveMutation.isPending && saveMutation.variables?.jobId === job.id && saveMutation.variables?.status === 'Saved' ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Plus className="w-4 h-4" />
                          )}
                        </button>
                        <button
                          disabled={saveMutation.isPending && saveMutation.variables?.jobId === job.id}
                          onClick={() => saveMutation.mutate({ jobId: job.id, status: 'Applied' })}
                          className="p-2 bg-white/5 hover:bg-white/15 border border-white/5 text-gray-300 hover:text-white rounded-xl transition-all disabled:opacity-50"
                          title="Mark as Applied"
                        >
                          {saveMutation.isPending && saveMutation.variables?.jobId === job.id && saveMutation.variables?.status === 'Applied' ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Check className="w-4 h-4" />
                          )}
                        </button>
                      </>
                    )}
                    <a
                      href={job.jobUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 bg-white/5 hover:bg-white/15 border border-white/5 text-gray-300 hover:text-white rounded-xl transition-all"
                      title="Open Job Link"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>

                    {/* Delete Job Button */}
                    {deleteConfirmId === job.id ? (
                      <div className="flex items-center gap-1 z-20">
                        <button
                          onClick={() => deleteJobMutation.mutate(job.id)}
                          className="px-2 py-1 bg-red-600 hover:bg-red-700 text-white rounded-lg text-[9px] font-bold"
                        >
                          Yes
                        </button>
                        <button
                          onClick={() => setDeleteConfirmId(null)}
                          className="px-2 py-1 bg-white/10 hover:bg-white/20 text-white rounded-lg text-[9px]"
                        >
                          No
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setDeleteConfirmId(job.id)}
                        className="p-2 bg-white/5 hover:bg-red-500/15 border border-white/5 hover:border-red-500/20 text-gray-500 hover:text-red-400 rounded-xl transition-all"
                        title="Delete Job"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination Controls */}
          {data.pagination.totalPages > 1 && (
            <div className="flex justify-between items-center pt-6 text-sm">
              <span className="text-muted-foreground">
                Showing Page {page} of {data.pagination.totalPages} ({data.pagination.total} jobs)
              </span>
              <div className="flex items-center gap-2">
                <button
                  disabled={page === 1}
                  onClick={() => setPage(page - 1)}
                  className="p-2 bg-muted hover:bg-card border border-card-border rounded-lg disabled:opacity-30 disabled:cursor-not-allowed transition-all text-white"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  disabled={page === data.pagination.totalPages}
                  onClick={() => setPage(page + 1)}
                  className="p-2 bg-muted hover:bg-card border border-card-border rounded-lg disabled:opacity-30 disabled:cursor-not-allowed transition-all text-white"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
