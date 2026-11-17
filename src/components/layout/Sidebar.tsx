import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  BarChart3,
  Bell,
  Building2,
  CheckSquare,
  ChevronDown,
  CreditCard,
  FileText,
  FolderKanban,
  HardHat,
  LayoutDashboard,
  LogOut,
  Package,
  Receipt,
  Settings,
  Truck,
  X,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { UserRole } from '../../types';

interface SidebarProps {
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

interface NavItem {
  label: string;
  to: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({ mobileOpen, onCloseMobile }) => {
  const {
    currentRole,
    currentUser,
    projects,
    activeProject,
    setActiveProjectId,
    switchRole,
    logout,
    expenses,
    purchases,
    deliveries,
    progressUpdates,
    notifications,
  } = useApp();
  const navigate = useNavigate();

  const pendingApprovalsCount =
    expenses.filter(
      (e) =>
        e.projectId === activeProject.id &&
        (e.status === 'Pending' || e.status === 'Disputed'),
    ).length +
    purchases.filter(
      (p) =>
        p.projectId === activeProject.id &&
        (p.approvalStatus === 'Pending' || p.approvalStatus === 'Disputed'),
    ).length +
    deliveries.filter(
      (d) =>
        d.projectId === activeProject.id &&
        (d.approvalStatus === 'Pending' || d.approvalStatus === 'Disputed'),
    ).length +
    progressUpdates.filter(
      (u) =>
        u.projectId === activeProject.id &&
        (u.approvalStatus === 'Pending' || u.approvalStatus === 'Disputed'),
    ).length;

  const unreadNotificationsCount = notifications.filter(
    (n) => !n.read && (n.targetRole === currentRole || n.targetRole === 'both'),
  ).length;

  const homeownerNav: NavItem[] = [
    { label: 'Overview', to: '/homeowner/overview', icon: LayoutDashboard },
    { label: 'Expenses', to: '/homeowner/expenses', icon: Receipt },
    { label: 'Materials & Purchases', to: '/homeowner/materials', icon: Package },
    { label: 'Payments', to: '/homeowner/payments', icon: CreditCard },
    { label: 'Progress', to: '/homeowner/progress', icon: HardHat },
    { label: 'Documents', to: '/homeowner/documents', icon: FileText },
    {
      label: 'Approvals & Disputes',
      to: '/homeowner/approvals',
      icon: CheckSquare,
      badge: pendingApprovalsCount,
    },
    { label: 'Reports', to: '/homeowner/reports', icon: BarChart3 },
    { label: 'Project Settings', to: '/homeowner/settings', icon: Settings },
  ];

  const contractorNav: NavItem[] = [
    { label: 'Dashboard', to: '/contractor/dashboard', icon: LayoutDashboard },
    { label: 'My Projects', to: '/contractor/projects', icon: FolderKanban },
    { label: 'Expenses', to: '/contractor/expenses', icon: Receipt },
    { label: 'Material Purchases', to: '/contractor/purchases', icon: Package },
    { label: 'Deliveries', to: '/contractor/deliveries', icon: Truck },
    { label: 'Payments', to: '/contractor/payments', icon: CreditCard },
    { label: 'Progress Updates', to: '/contractor/progress', icon: HardHat },
    { label: 'Documents', to: '/contractor/documents', icon: FileText },
    {
      label: 'Notifications',
      to: '/contractor/notifications',
      icon: Bell,
      badge: unreadNotificationsCount,
    },
    { label: 'Profile & Settings', to: '/contractor/settings', icon: Settings },
  ];

  const navItems = currentRole === 'homeowner' ? homeownerNav : contractorNav;

  const handleRoleSwitch = (nextRole: UserRole) => {
    if (nextRole === currentRole) return;
    switchRole(nextRole);
    navigate(nextRole === 'homeowner' ? '/homeowner/overview' : '/contractor/dashboard');
    onCloseMobile();
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const sidebarContent = (
    <div className="flex flex-col h-full bg-white border-r border-[#E6E9EF] w-64 select-none">
      {/* Brand */}
      <div className="h-16 px-5 flex items-center justify-between border-b border-[#E6E9EF] shrink-0">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-[#172B4D] text-white flex items-center justify-center shrink-0">
            <Building2 className="w-4 h-4" />
          </div>
          <span className="font-display font-bold text-base tracking-tight text-[#172B4D] whitespace-nowrap">
            BuildLedger
          </span>
        </div>
        <button
          type="button"
          onClick={onCloseMobile}
          className="lg:hidden p-1.5 rounded-lg text-[#707987] hover:bg-[#F0F2F5]"
          aria-label="Close sidebar"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Project Selector */}
      <div className="p-4 border-b border-[#E6E9EF]">
        <label
          htmlFor="sidebar-project-select"
          className="block text-[11px] font-medium text-[#707987] mb-1.5"
        >
          Active Project
        </label>
        <div className="relative">
          <select
            id="sidebar-project-select"
            value={activeProject.id}
            onChange={(e) => setActiveProjectId(e.target.value)}
            className="w-full appearance-none bg-[#F7F8FA] border border-[#E6E9EF] rounded-lg px-3 py-2 pr-8 text-xs font-semibold text-[#172B4D] focus:outline-none focus:border-[#172B4D] cursor-pointer truncate"
          >
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
          <ChevronDown className="w-3.5 h-3.5 text-[#707987] absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>
        <div className="mt-1.5 text-[11px] text-[#707987] truncate">{activeProject.location}</div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-0.5" aria-label="Primary">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={onCloseMobile}
              className={({ isActive }) =>
                `flex items-center justify-between gap-2.5 px-3 py-2.5 rounded-lg text-[13px] font-medium transition-colors whitespace-nowrap ${
                  isActive
                    ? 'bg-[#172B4D] text-white'
                    : 'text-[#20252D] hover:bg-[#F0F2F5] hover:text-[#172B4D]'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <span className="flex items-center gap-2.5 min-w-0">
                    <Icon
                      className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-[#707987]'}`}
                    />
                    <span className="truncate">{item.label}</span>
                  </span>
                  {typeof item.badge === 'number' && item.badge > 0 && (
                    <span
                      className={`font-mono tabular-nums text-[11px] font-semibold px-1.5 py-0.5 rounded ${
                        isActive
                          ? 'bg-white/20 text-white'
                          : 'bg-[#F0F2F5] text-[#172B4D]'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Role Demo Switcher & Profile */}
      <div className="p-3 border-t border-[#E6E9EF] space-y-3 shrink-0 bg-[#F7F8FA]/70">
        <div>
          <div className="text-[11px] font-medium text-[#707987] mb-1.5 px-1">
            Workspace Role
          </div>
          <div className="grid grid-cols-2 gap-1 p-1 bg-[#F0F2F5] rounded-lg">
            <button
              type="button"
              onClick={() => handleRoleSwitch('homeowner')}
              className={`px-2 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                currentRole === 'homeowner'
                  ? 'bg-white text-[#172B4D] shadow-xs'
                  : 'text-[#707987] hover:text-[#20252D]'
              }`}
            >
              Homeowner
            </button>
            <button
              type="button"
              onClick={() => handleRoleSwitch('contractor')}
              className={`px-2 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                currentRole === 'contractor'
                  ? 'bg-white text-[#172B4D] shadow-xs'
                  : 'text-[#707987] hover:text-[#20252D]'
              }`}
            >
              Contractor
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between gap-2 px-1.5 pt-1">
          <div className="min-w-0">
            <div className="text-xs font-semibold text-[#172B4D] truncate">{currentUser.name}</div>
            <div className="text-[11px] text-[#707987] truncate">
              {currentRole === 'homeowner' ? 'Homeowner' : currentUser.companyName || 'Contractor'}
            </div>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            title="Sign out / Switch account"
            aria-label="Sign out"
            className="p-2 rounded-lg text-[#707987] hover:text-[#DC2626] hover:bg-white transition-colors shrink-0 cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sticky Sidebar */}
      <aside className="hidden lg:block shrink-0 h-screen sticky top-0 z-30">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer Sidebar */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-50 lg:hidden flex bg-[#172B4D]/40"
          onClick={onCloseMobile}
        >
          <aside className="h-full" onClick={(e) => e.stopPropagation()}>
            {sidebarContent}
          </aside>
        </div>
      )}
    </>
  );
};
