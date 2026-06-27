import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuthStore } from './store/authStore';
import { apiClient } from './utils/api';
import { Loader2 } from 'lucide-react';

// Pages
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Jobs from './pages/Jobs';
import JobDetails from './pages/JobDetails';
import ResumeManager from './pages/ResumeManager';
import Applications from './pages/Applications';
import Settings from './pages/Settings';
import LandingPage from './pages/LandingPage';
import PrivacyPolicy from './pages/PrivacyPolicy';

// Components
import Navbar from './components/Navbar';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

// Guard component to enforce authentication
export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const token = useAuthStore(state => state.token);
  return token ? <>{children}</> : <Navigate to="/login" replace />;
}

// Guard component to block auth pages if logged in
export function PublicRoute({ children }: { children: React.ReactNode }) {
  const token = useAuthStore(state => state.token);
  return token ? <Navigate to="/dashboard" replace /> : <>{children}</>;
}

// Structure layout for private dashboard pages
function AppLayout() {
  return (
    <div className="flex min-h-screen bg-black">
      <Navbar />
      <main className="flex-1 overflow-y-auto max-h-screen">
        <Routes>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/jobs" element={<Jobs />} />
          <Route path="/jobs/:id" element={<JobDetails />} />
          <Route path="/resume" element={<ResumeManager />} />
          <Route path="/applications" element={<Applications />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </main>
    </div>
  );
}

import { Toaster } from 'react-hot-toast';

export default function App() {
  const { setAuth, logout, token } = useAuthStore();
  const [loadingSession, setLoadingSession] = useState(true);

  useEffect(() => {
    let cancelled = false;

    apiClient.get('/auth/me')
      .then((res) => {
        if (!cancelled) {
          const storedToken = useAuthStore.getState().token;
          setAuth(storedToken || 'cookie-auth', res.data.user);
        }
      })
      .catch(() => {
        if (!cancelled) {
          logout();
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoadingSession(false);
        }
      });

    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loadingSession) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-white">
        <Loader2 className="w-8 h-8 animate-spin text-neutral-400" />
      </div>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          {/* Public Landing page */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/privacy" element={<PrivacyPolicy />} />

          {/* Public Authentication routes */}
          <Route 
            path="/login" 
            element={
              <PublicRoute>
                <Login />
              </PublicRoute>
            } 
          />
          <Route 
            path="/register" 
            element={
              <PublicRoute>
                <Register />
              </PublicRoute>
            } 
          />

          {/* Protected Main dashboard routes */}
          <Route 
            path="/*" 
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            } 
          />
        </Routes>
      </BrowserRouter>
      <Toaster 
        position="top-center" 
        toastOptions={{
          className: 'glass-panel border border-white/10 text-white',
          style: {
            background: 'rgba(10, 10, 10, 0.95)',
            backdropFilter: 'blur(8px)',
            color: '#fff',
            fontSize: '13px',
            borderRadius: '12px',
            padding: '12px 18px',
          },
          success: {
            iconTheme: {
              primary: '#10b981',
              secondary: '#fff',
            },
          },
          error: {
            iconTheme: {
              primary: '#ef4444',
              secondary: '#fff',
            },
          },
        }}
      />
    </QueryClientProvider>
  );
}
