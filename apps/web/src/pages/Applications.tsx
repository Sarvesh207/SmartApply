import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '../utils/api';
import { ApplicationDTO, ApplicationStatus } from '@smartapply/shared';
import { 
  Building, 
  MapPin, 
  Target, 
  Chrome, 
  FileEdit, 
  ArrowRight,
  Loader2, 
  MoreVertical,
  XCircle,
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const COLUMNS: { id: ApplicationStatus; label: string; color: string; border: string }[] = [
  { id: 'Saved', label: 'Saved Jobs', color: 'bg-purple-500/10 text-purple-400', border: 'border-purple-500/20' },
  { id: 'Applied', label: 'Applied', color: 'bg-indigo-500/10 text-indigo-400', border: 'border-indigo-500/20' },
  { id: 'Interview', label: 'Interviews', color: 'bg-emerald-500/10 text-emerald-400', border: 'border-emerald-500/20' },
  { id: 'Offer', label: 'Offers', color: 'bg-amber-500/10 text-amber-400', border: 'border-amber-500/20' },
  { id: 'Rejected', label: 'Rejected', color: 'bg-red-500/10 text-red-400', border: 'border-red-500/20' },
];

export default function Applications() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [editingNotesId, setEditingNotesId] = useState<string | null>(null);
  const [notesText, setNotesText] = useState('');
  const [activeCardMenu, setActiveCardMenu] = useState<string | null>(null);

  // Fetch user applications
  const { data: applications, isLoading, error } = useQuery<ApplicationDTO[]>({
    queryKey: ['applications'],
    queryFn: () => apiFetch('/applications'),
  });

  // Mutation to update application status/notes
  const updateMutation = useMutation({
    mutationFn: ({ id, status, notes }: { id: string; status?: ApplicationStatus; notes?: string }) => 
      apiFetch(`/applications/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status, notes }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['applications'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      setEditingNotesId(null);
      setActiveCardMenu(null);
    }
  });

  // Mutation to trigger autofill
  const autofillMutation = useMutation({
    mutationFn: (appId: string) => 
      apiFetch<{ success: boolean; message: string }>(`/applications/${appId}/autofill`, {
        method: 'POST',
      }),
    onSuccess: (res) => {
      alert(res.message);
    },
    onError: (err: any) => {
      alert(err.message || 'Failed to start autofill');
    }
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
      </div>
    );
  }

  if (error || !applications) {
    return (
      <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-4 rounded-xl max-w-lg mx-auto text-center mt-10">
        Failed to load applications.
      </div>
    );
  }

  // Filter application list by status column
  const getAppsForColumn = (status: ApplicationStatus) => {
    return applications.filter(app => app.status === status);
  };

  const handleStartEditingNotes = (id: string, currentNotes: string | null) => {
    setEditingNotesId(id);
    setNotesText(currentNotes || '');
  };

  const handleSaveNotes = (id: string) => {
    updateMutation.mutate({ id, notes: notesText });
  };

  return (
    <div className="space-y-8 animate-fade-in p-6">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight gradient-text">Application Board</h1>
        <p className="text-muted-foreground text-sm mt-1">Manage and track your interview pipeline state.</p>
      </div>

      {/* Kanban Board Container */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-start overflow-x-auto pb-6">
        {COLUMNS.map((col) => {
          const colApps = getAppsForColumn(col.id);
          return (
            <div key={col.id} className="glass-panel p-4 rounded-2xl border border-white/5 shadow-xl space-y-4 min-w-[250px]">
              {/* Header */}
              <div className="flex justify-between items-center pb-2 border-b border-white/5">
                <span className={`px-2.5 py-1 rounded-lg text-xs font-bold border ${col.color} ${col.border}`}>
                  {col.label}
                </span>
                <span className="text-xs text-muted-foreground font-semibold bg-white/5 px-2 py-0.5 rounded">
                  {colApps.length}
                </span>
              </div>

              {/* Card List */}
              <div className="space-y-3 min-h-[500px]">
                {colApps.length === 0 ? (
                  <div className="text-center py-10 text-[10px] text-muted-foreground border border-dashed border-white/5 rounded-xl">
                    No jobs here
                  </div>
                ) : (
                  colApps.map((app) => (
                    <div 
                      key={app.id} 
                      className="bg-card/40 border border-card-border p-4 rounded-xl relative space-y-3 hover:border-purple-500/30 transition-all shadow-md"
                    >
                      {/* Job Header */}
                      <div>
                        <div className="flex justify-between items-start gap-1">
                          <h4 
                            onClick={() => navigate(`/jobs/${app.jobId}`)}
                            className="text-xs font-bold text-white hover:text-purple-400 cursor-pointer transition-colors leading-tight line-clamp-2"
                          >
                            {app.job.title}
                          </h4>
                          
                          {/* Menu Trigger */}
                          <div className="relative">
                            <button 
                              onClick={() => setActiveCardMenu(activeCardMenu === app.id ? null : app.id)}
                              className="p-1 hover:bg-white/5 rounded text-gray-500 hover:text-white"
                            >
                              <MoreVertical className="w-3.5 h-3.5" />
                            </button>
                            
                            {activeCardMenu === app.id && (
                              <div className="absolute right-0 mt-1 w-36 bg-muted/95 backdrop-blur-md border border-card-border rounded-xl shadow-lg z-20 p-1 text-[10px]">
                                {COLUMNS.filter(c => c.id !== app.status).map(c => (
                                  <button
                                    key={c.id}
                                    onClick={() => updateMutation.mutate({ id: app.id, status: c.id })}
                                    className="w-full text-left px-2 py-1.5 hover:bg-purple-500/10 hover:text-purple-400 rounded-lg text-gray-300 transition-colors"
                                  >
                                    Move to {c.label.split(' ')[0]}
                                  </button>
                                ))}
                                <button
                                  onClick={() => handleStartEditingNotes(app.id, app.notes)}
                                  className="w-full text-left px-2 py-1.5 hover:bg-purple-500/10 hover:text-purple-400 rounded-lg text-gray-300 transition-colors border-t border-white/5 mt-1"
                                >
                                  Edit Notes
                                </button>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="text-[10px] text-gray-400 flex items-center gap-1 mt-1">
                          <Building className="w-3 h-3 text-muted-foreground" />
                          <span className="truncate max-w-[120px]">{app.job.company}</span>
                        </div>
                      </div>

                      {/* Score display */}
                      {app.job.matchScore !== undefined && app.job.matchScore !== null && (
                        <div className="text-[10px] bg-purple-500/5 border border-purple-500/20 text-purple-400 px-2 py-0.5 rounded w-max font-semibold flex items-center gap-1">
                          <Target className="w-3 h-3" />
                          {app.job.matchScore}% Match
                        </div>
                      )}

                      {/* Notes Box */}
                      {editingNotesId === app.id ? (
                        <div className="space-y-1.5 pt-1.5 border-t border-white/5">
                          <textarea
                            className="w-full p-2 bg-muted border border-card-border rounded-lg text-[10px] text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
                            rows={3}
                            placeholder="Add interview link, contact details..."
                            value={notesText}
                            onChange={e => setNotesText(e.target.value)}
                          />
                          <div className="flex justify-end gap-1">
                            <button 
                              onClick={() => setEditingNotesId(null)}
                              className="px-2 py-0.5 border border-white/5 text-[9px] text-gray-400 rounded hover:text-white"
                            >
                              Cancel
                            </button>
                            <button 
                              onClick={() => handleSaveNotes(app.id)}
                              className="px-2 py-0.5 bg-purple-600 text-[9px] text-white rounded font-bold"
                            >
                              Save
                            </button>
                          </div>
                        </div>
                      ) : (
                        app.notes && (
                          <div 
                            onClick={() => handleStartEditingNotes(app.id, app.notes)}
                            className="text-[9px] text-muted-foreground leading-normal bg-white/5 p-2 rounded-lg cursor-pointer hover:bg-white/10 hover:text-gray-300 transition-colors whitespace-pre-wrap font-sans max-h-16 overflow-y-auto"
                            title="Click to edit notes"
                          >
                            {app.notes}
                          </div>
                        )
                      )}

                      {/* Footer Actions */}
                      <div className="flex justify-between items-center pt-2 border-t border-white/5 text-[9px]">
                        <span className="text-gray-600">
                          Updated: {new Date(app.updatedAt).toLocaleDateString()}
                        </span>
                        
                        {/* Autofill form only displayed for Saved or Applied columns */}
                        {(app.status === 'Saved' || app.status === 'Applied') && (
                          <button
                            disabled={autofillMutation.isPending && autofillMutation.variables === app.id}
                            onClick={() => autofillMutation.mutate(app.id)}
                            className="px-2 py-1 bg-purple-500/10 border border-purple-500/20 text-purple-400 hover:bg-purple-500/20 rounded-md font-bold flex items-center gap-1 transition-all disabled:opacity-50"
                            title="Autofill job form"
                          >
                            {autofillMutation.isPending && autofillMutation.variables === app.id ? (
                              <Loader2 className="w-2.5 h-2.5 animate-spin" />
                            ) : (
                              <Chrome className="w-2.5 h-2.5" />
                            )}
                            Fill Form
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
