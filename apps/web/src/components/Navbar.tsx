import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { 
  LayoutDashboard, 
  Briefcase, 
  FileText, 
  KanbanSquare, 
  Settings as SettingsIcon, 
  LogOut,
  Target
} from 'lucide-react';

export default function Navbar() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { to: '/', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/jobs', label: 'Job Board', icon: Briefcase },
    { to: '/resume', label: 'Resume Manager', icon: FileText },
    { to: '/applications', label: 'Applications Board', icon: KanbanSquare },
    { to: '/settings', label: 'Settings', icon: SettingsIcon },
  ];

  return (
    <aside className="w-64 bg-card/65 border-r border-card-border backdrop-blur-xl shrink-0 flex flex-col justify-between h-screen sticky top-0">
      <div className="p-6 space-y-8">
        {/* Brand Header */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 gradient-bg rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/25">
            <Target className="w-5.5 h-5.5 text-white" />
          </div>
          <div>
            <span className="font-extrabold text-lg text-white leading-none block">SmartApply</span>
            <span className="text-[10px] text-purple-400 font-semibold tracking-wider uppercase">Platform</span>
          </div>
        </div>

        {/* Nav Links */}
        <nav className="space-y-1.5 flex flex-col">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                    isActive 
                      ? 'bg-purple-500/10 text-purple-400 border border-purple-500/15' 
                      : 'text-muted-foreground hover:text-white hover:bg-white/5 border border-transparent'
                  }`
                }
              >
                <Icon className="w-4.5 h-4.5" />
                {item.label}
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* User Session profile Footer */}
      <div className="p-4 border-t border-white/5 space-y-4">
        <div className="px-3 py-2 bg-white/5 rounded-xl border border-white/5 overflow-hidden">
          <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Signed In As</span>
          <span className="text-xs font-semibold text-gray-200 block truncate mt-0.5" title={user?.email}>
            {user?.email}
          </span>
        </div>

        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors border border-transparent"
        >
          <LogOut className="w-4.5 h-4.5" />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
