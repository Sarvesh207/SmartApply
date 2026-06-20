import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '../utils/api';
import { JobDTO, ApplicationDTO } from '@smartapply/shared';
import { 
  ArrowLeft, 
  MapPin, 
  Calendar, 
  Target, 
  Sparkles, 
  Check, 
  AlertCircle, 
  Chrome,
  Loader2,
  Building,
  Bookmark
} from 'lucide-react';

export default function JobDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [autofillMessage, setAutofillMessage] = useState('');

  // 1. Fetch Job details (with match details if calculated)
  const { data: job, isLoading, error } = useQuery<JobDTO>({
    queryKey: ['job', id],
    queryFn: () => apiFetch(`/jobs/${id}`),
  });

  // 2. Fetch User's applications to see if this job is already saved
  const { data: applications } = useQuery<ApplicationDTO[]>({
    queryKey: ['applications'],
    queryFn: () => apiFetch('/applications'),
  });

  const matchedApplication = applications?.find(app => app.jobId === id);

  // 3. Match mutation
  const matchMutation = useMutation({
    mutationFn: () => apiFetch(`/jobs/${id}/match`, { method: 'POST' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['job', id] });
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
    }
  });

  // 4. Autofill mutation
  const autofillMutation = useMutation({
    mutationFn: async () => {
      let appId = matchedApplication?.id;
      
      // If the job is not yet saved, save it first!
      if (!appId) {
        const newApp = await apiFetch<ApplicationDTO>('/applications', {
          method: 'POST',
          body: JSON.stringify({ jobId: id, status: 'Saved' }),
        });
        appId = newApp.id;
        queryClient.invalidateQueries({ queryKey: ['applications'] });
        queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      }

      // Trigger autofill on the application ID
      return apiFetch<{ success: boolean; message: string }>(`/applications/${appId}/autofill`, {
        method: 'POST',
      });
    },
    onSuccess: (res) => {
      setAutofillMessage(res.message);
    },
    onError: (err: any) => {
      alert(err.message || 'Failed to launch autofill');
    }
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 text-white animate-spin" />
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-4 rounded-xl max-w-lg mx-auto text-center mt-10">
        Failed to load job details.
      </div>
    );
  }

  const getScoreBadgeClass = (score: number) => {
    if (score >= 80) return 'text-emerald-400 border-emerald-500/30 bg-emerald-500/5';
    if (score >= 60) return 'text-amber-400 border-amber-500/30 bg-amber-500/5';
    return 'text-gray-400 border-gray-500/20 bg-gray-500/5';
  };

  return (
    <div className="space-y-8 animate-fade-in p-6 max-w-5xl mx-auto">
      <button 
        onClick={() => navigate('/jobs')}
        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-white transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Jobs
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Job Body */}
        <div className="lg:col-span-2 space-y-6">
          <div className="glass-panel p-8 rounded-2xl border border-white/5 shadow-xl relative overflow-hidden">
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 rounded-2xl gradient-bg flex items-center justify-center text-white font-bold text-2xl shadow-lg">
                {job.company.substring(0, 2).toUpperCase()}
              </div>
              <div className="space-y-1.5">
                <h1 className="text-2xl font-extrabold text-white">{job.title}</h1>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1 font-semibold text-gray-200">
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

            <div className="mt-8 border-t border-white/5 pt-6 space-y-4">
              <h2 className="text-lg font-bold text-white">Job Description</h2>
              <div className="text-gray-300 text-sm leading-relaxed whitespace-pre-wrap font-sans">
                {job.description}
              </div>
            </div>
          </div>
        </div>

        {/* AI Match & Autofill Actions Sidebar */}
        <div className="space-y-6">
          {/* Match Score Card */}
          <div className="glass-panel p-6 rounded-2xl border border-white/5 shadow-xl space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">AI Evaluation</h3>
              <Sparkles className="w-4 h-4 text-neutral-400" />
            </div>

            {job.matchDetails ? (
              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <div className={`w-16 h-16 rounded-full border-2 flex items-center justify-center text-xl font-extrabold shadow-inner ${getScoreBadgeClass(job.matchDetails.matchScore)}`}>
                    {job.matchDetails.matchScore}%
                  </div>
                  <div>
                    <h4 className="font-bold text-white">Match Quality</h4>
                    <p className="text-xs text-muted-foreground">Computed by AI matching algorithm</p>
                  </div>
                </div>

                {/* Match Recommendation */}
                <div className="bg-white/5 border border-white/5 p-4 rounded-xl text-xs leading-relaxed text-gray-300">
                  {job.matchDetails.recommendation}
                </div>

                {/* Skills Breakdown */}
                <div className="space-y-4">
                  <div>
                    <h5 className="text-xs font-semibold text-gray-400 mb-2">Matched Skills ({job.matchDetails.matchedSkills.length})</h5>
                    <div className="flex flex-wrap gap-1.5">
                      {job.matchDetails.matchedSkills.length > 0 ? (
                        job.matchDetails.matchedSkills.map((s: string, idx: number) => (
                          <span key={idx} className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 px-2 py-0.5 rounded text-[10px] flex items-center gap-1 font-medium">
                            <Check className="w-2.5 h-2.5" />
                            {s}
                          </span>
                        ))
                      ) : (
                        <span className="text-xs text-muted-foreground italic">None detected</span>
                      )}
                    </div>
                  </div>

                  <div>
                    <h5 className="text-xs font-semibold text-gray-400 mb-2">Missing Skills ({job.matchDetails.missingSkills.length})</h5>
                    <div className="flex flex-wrap gap-1.5">
                      {job.matchDetails.missingSkills.length > 0 ? (
                        job.matchDetails.missingSkills.map((s: string, idx: number) => (
                          <span key={idx} className="bg-red-500/10 text-red-400 border border-red-500/25 px-2 py-0.5 rounded text-[10px] flex items-center gap-1 font-medium">
                            <AlertCircle className="w-2.5 h-2.5" />
                            {s}
                          </span>
                        ))
                      ) : (
                        <span className="text-xs text-emerald-400 italic">None! Perfect fit!</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-6 space-y-4">
                <Target className="w-12 h-12 text-gray-600 mx-auto" />
                <p className="text-xs text-muted-foreground leading-relaxed px-4">
                  Match score not calculated yet. Analyze this job description against your resume to check fit rate.
                </p>
                <button
                  disabled={matchMutation.isPending}
                  onClick={() => matchMutation.mutate()}
                  className="w-full py-2.5 px-4 bg-white/10 hover:bg-white/15 border border-white/15 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all"
                >
                  {matchMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Sparkles className="w-4 h-4" />
                  )}
                  Calculate Match Score
                </button>
              </div>
            )}
          </div>

          {/* Playwright Browser Autofill Card */}
          <div className="glass-panel p-6 rounded-2xl border border-white/5 shadow-xl space-y-6">
            <div>
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-1">Form Autofill</h3>
              <p className="text-xs text-muted-foreground">Automate application form inputs safely.</p>
            </div>

            {autofillMessage ? (
              <div className="bg-emerald-500/10 border border-emerald-500/30 p-4 rounded-xl text-xs text-emerald-400 leading-relaxed space-y-2">
                <p className="font-bold flex items-center gap-1">
                  <Check className="w-4 h-4 shrink-0" />
                  Form autofill initialized!
                </p>
                <p>{autofillMessage}</p>
                <p className="text-[10px] text-muted-foreground mt-2 border-t border-emerald-500/20 pt-2 font-mono">
                  Review browser window now.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Automatically pre-fill name, email, phone number, social links, and upload your resume on the target application form page.
                </p>
                <button
                  disabled={autofillMutation.isPending}
                  onClick={() => autofillMutation.mutate()}
                  className="w-full py-3 px-4 btn-primary rounded-xl font-semibold text-xs flex items-center justify-center gap-2 hover:glow-hover transition-all"
                >
                  {autofillMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Chrome className="w-4 h-4" />
                  )}
                  {matchedApplication ? 'Auto Fill Form' : 'Save Job & Autofill'}
                </button>

                <div className="text-[10px] text-muted-foreground leading-normal flex gap-1.5">
                  <span className="text-amber-500">⚠️</span>
                  <span>
                    The script does <strong className="text-gray-300">NOT</strong> auto-submit. It opens a real browser for you to inspect and manually complete submission.
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
