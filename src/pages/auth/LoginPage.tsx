import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Building2, HardHat, Home, ShieldCheck } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { UserRole } from '../../types';

export const LoginPage: React.FC = () => {
  const { loginUser, switchRole } = useApp();
  const navigate = useNavigate();

  const [email, setEmail] = useState('ananya.rao@gmail.com');
  const [password, setPassword] = useState('••••••••••••');
  const [role, setRole] = useState<UserRole>('homeowner');
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setError('Enter both email address and password.');
      return;
    }
    loginUser(email.trim(), role);
    navigate(role === 'homeowner' ? '/homeowner/overview' : '/contractor/dashboard');
  };

  const enterDemo = (demoRole: UserRole) => {
    switchRole(demoRole);
    navigate(demoRole === 'homeowner' ? '/homeowner/overview' : '/contractor/dashboard');
  };

  return (
    <div className="min-h-screen bg-[#F7F8FA] flex flex-col justify-center py-10 px-4 sm:px-6">
      <div className="max-w-md w-full mx-auto">
        <div className="flex items-center justify-center gap-2.5 mb-6">
          <div className="w-9 h-9 rounded-lg bg-[#172B4D] text-white flex items-center justify-center">
            <Building2 className="w-5 h-5" />
          </div>
          <span className="font-display text-xl font-bold tracking-tight text-[#172B4D]">
            BuildLedger
          </span>
        </div>

        <div className="bg-white border border-[#E6E9EF] rounded-xl p-6 sm:p-8">
          <h1 className="text-lg font-bold text-[#172B4D]">Sign in to your workspace</h1>
          <p className="mt-1 text-xs text-[#707987]">
            Every expense recorded. Every purchase traceable. Every payment accounted for.
          </p>

          {/* Role Toggle */}
          <div className="mt-5 grid grid-cols-2 gap-1.5 p-1 bg-[#F0F2F5] rounded-lg">
            <button
              type="button"
              onClick={() => {
                setRole('homeowner');
                setEmail('ananya.rao@gmail.com');
              }}
              className={`flex items-center justify-center gap-1.5 py-2 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                role === 'homeowner'
                  ? 'bg-white text-[#172B4D] shadow-xs'
                  : 'text-[#707987] hover:text-[#20252D]'
              }`}
            >
              <Home className="w-3.5 h-3.5" />
              Homeowner
            </button>
            <button
              type="button"
              onClick={() => {
                setRole('contractor');
                setEmail('rajesh@kulkarnicivil.in');
              }}
              className={`flex items-center justify-center gap-1.5 py-2 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                role === 'contractor'
                  ? 'bg-white text-[#172B4D] shadow-xs'
                  : 'text-[#707987] hover:text-[#20252D]'
              }`}
            >
              <HardHat className="w-3.5 h-3.5" />
              Contractor
            </button>
          </div>

          <form onSubmit={handleSubmit} className="mt-5 space-y-4">
            <div>
              <label className="block text-xs font-medium text-[#20252D] mb-1">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-[#E6E9EF] focus:outline-none focus:border-[#172B4D]"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-medium text-[#20252D]">Password</label>
                <Link
                  to="/forgot-password"
                  className="text-xs font-medium text-[#2563EB] hover:underline"
                >
                  Forgot password?
                </Link>
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-[#E6E9EF] focus:outline-none focus:border-[#172B4D]"
              />
            </div>

            <label className="flex items-center gap-2 text-xs text-[#20252D] cursor-pointer">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="rounded border-[#CBD5E1]"
              />
              <span>Remember me on this device</span>
            </label>

            {error && <p className="text-xs text-[#DC2626]">{error}</p>}

            <button
              type="submit"
              className="w-full py-2.5 text-sm font-semibold rounded-lg bg-[#172B4D] text-white hover:bg-[#172B4D]/90 transition-colors cursor-pointer"
            >
              Sign In
            </button>
          </form>

          {/* Instant Demo Access */}
          <div className="mt-6 pt-5 border-t border-[#E6E9EF]">
            <div className="text-[11px] font-medium text-[#707987] mb-2.5">
              Instant Interactive Demo Access
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => enterDemo('homeowner')}
                className="px-3 py-2 text-xs font-semibold rounded-lg border border-[#E6E9EF] bg-[#F7F8FA] text-[#172B4D] hover:bg-[#F0F2F5] cursor-pointer"
              >
                Homeowner Demo
              </button>
              <button
                type="button"
                onClick={() => enterDemo('contractor')}
                className="px-3 py-2 text-xs font-semibold rounded-lg border border-[#E6E9EF] bg-[#F7F8FA] text-[#172B4D] hover:bg-[#F0F2F5] cursor-pointer"
              >
                Contractor Demo
              </button>
            </div>
          </div>

          <p className="mt-5 text-center text-xs text-[#707987]">
            New to BuildLedger?{' '}
            <Link to="/signup" className="font-semibold text-[#172B4D] hover:underline">
              Create an account
            </Link>
          </p>
        </div>

        <div className="mt-4 flex items-center justify-center gap-1.5 text-[11px] text-[#707987]">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Built for residential construction transparency in India</span>
        </div>
      </div>
    </div>
  );
};
