import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronDown, LogOut, Menu, RefreshCw, UserCheck } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { NotificationDropdown } from './NotificationDropdown';
import { StatusBadge } from '../common/StatusBadge';

interface TopHeaderProps {
  onOpenMobileMenu: () => void;
}

export const TopHeader: React.FC<TopHeaderProps> = ({ onOpenMobileMenu }) => {
  const { activeProject, currentUser, currentRole, switchRole, logout, resetDemoData } = useApp();
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!profileOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    };
    window.addEventListener('mousedown', handleClick);
    return () => window.removeEventListener('mousedown', handleClick);
  }, [profileOpen]);

  return (
    <header className="sticky top-0 z-20 h-16 bg-white border-b border-[#E6E9EF] px-4 sm:px-6 flex items-center justify-between gap-4">
      <div className="flex items-center gap-3 min-w-0">
        <button
          type="button"
          onClick={onOpenMobileMenu}
          aria-label="Open menu"
          className="lg:hidden p-2 rounded-lg border border-[#E6E9EF] text-[#20252D] hover:bg-[#F0F2F5] shrink-0"
        >
          <Menu className="w-4 h-4" />
        </button>
        <div className="min-w-0">
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="text-sm font-semibold text-[#172B4D] truncate">
              {activeProject.name}
            </span>
            <span className="hidden sm:inline text-xs text-[#707987]">·</span>
            <span className="hidden sm:inline text-xs text-[#707987] truncate">
              {activeProject.location}
            </span>
            <StatusBadge label={activeProject.status} />
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2.5 shrink-0">
        <NotificationDropdown />

        <div ref={profileRef} className="relative">
          <button
            type="button"
            onClick={() => setProfileOpen((v) => !v)}
            className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg border border-[#E6E9EF] bg-white hover:bg-[#F0F2F5] transition-colors cursor-pointer"
          >
            <div className="w-7 h-7 rounded-md bg-[#172B4D] text-white text-xs font-semibold flex items-center justify-center shrink-0">
              {currentUser.name
                .split(' ')
                .map((n) => n[0])
                .join('')
                .slice(0, 2)}
            </div>
            <div className="hidden md:block text-left">
              <div className="text-xs font-semibold text-[#172B4D] leading-none">
                {currentUser.name}
              </div>
              <div className="text-[11px] text-[#707987] mt-0.5 leading-none capitalize">
                {currentRole}
              </div>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-[#707987]" />
          </button>

          {profileOpen && (
            <div className="absolute right-0 mt-2 w-60 bg-white border border-[#E6E9EF] rounded-xl shadow-lg py-1.5 z-40">
              <div className="px-3.5 py-2 border-b border-[#E6E9EF]">
                <div className="text-xs font-semibold text-[#172B4D]">{currentUser.name}</div>
                <div className="text-[11px] text-[#707987] truncate">{currentUser.email}</div>
              </div>
              <button
                type="button"
                onClick={() => {
                  const target = currentRole === 'homeowner' ? 'contractor' : 'homeowner';
                  switchRole(target);
                  navigate(
                    target === 'homeowner' ? '/homeowner/overview' : '/contractor/dashboard',
                  );
                  setProfileOpen(false);
                }}
                className="w-full px-3.5 py-2 text-left text-xs text-[#20252D] hover:bg-[#F0F2F5] flex items-center gap-2 cursor-pointer"
              >
                <UserCheck className="w-3.5 h-3.5 text-[#707987]" />
                Switch to {currentRole === 'homeowner' ? 'Contractor' : 'Homeowner'} Demo
              </button>
              <button
                type="button"
                onClick={() => {
                  resetDemoData();
                  setProfileOpen(false);
                }}
                className="w-full px-3.5 py-2 text-left text-xs text-[#20252D] hover:bg-[#F0F2F5] flex items-center gap-2 cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5 text-[#707987]" />
                Reset Demo Data
              </button>
              <div className="my-1 border-t border-[#E6E9EF]" />
              <button
                type="button"
                onClick={() => {
                  setProfileOpen(false);
                  logout();
                  navigate('/login');
                }}
                className="w-full px-3.5 py-2 text-left text-xs text-[#DC2626] hover:bg-[#FEF2F2] flex items-center gap-2 cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                Sign Out / Auth Screens
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
