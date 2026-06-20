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
  Building,
  SearchCode
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
  });

  const { register, handleSubmit } = useForm<FilterInputs>({
    resolver: zodResolver(filterSchema),
    defaultValues: {
      search: '',
      location: '',
      source: '',
    }
  });
  
  // Query to fetch jobs
  const { data, isLoading, error } = useQuery<FetchJobsResponse>({
    queryKey: ['jobs', page, appliedFilters.search, appliedFilters.source, appliedFilters.location],
    queryFn: () => 
      apiFetch(`/jobs?page=${page}&limit=10&search=${appliedFilters.search}&source=${appliedFilters.source}&location=${appliedFilters.location}`),
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

  // Mutation to save job
  const saveMutation = useMutation({
    mutationFn: (jobId: string) =>
      apiFetch('/applications', {
        method: 'POST',
        body: JSON.stringify({ jobId, status: 'Saved' }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['applications'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      toast.success('Job successfully saved to Applications board!');
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to save job');
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
      <form onSubmit={handleSubmit(handleSearchSubmit)} className="glass-panel p-6 rounded-2xl border border-white/5 shadow-xl grid grid-cols-1 md:grid-cols-4 gap-4">
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
                    <button
                      onClick={() => saveMutation.mutate(job.id)}
                      className="p-2 bg-white/5 hover:bg-white/15 border border-white/5 text-gray-300 rounded-xl transition-all"
                      title="Save Job"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                    <a
                      href={job.jobUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 bg-white/5 hover:bg-white/15 border border-white/5 text-gray-300 rounded-xl transition-all"
                      title="Open Job Link"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
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
