import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Building2, HardHat, Home } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { UserRole } from '../../types';

export const SignupPage: React.FC = () => {
  const { signupUser } = useApp();
  const navigate = useNavigate();

  const [role, setRole] = useState<UserRole>('homeowner');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || password.length < 6) {
      setError('Enter your name, valid email, and a password of at least 6 characters.');
      return;
    }
    signupUser(name.trim(), email.trim(), role, companyName.trim() || undefined);
    navigate(role === 'homeowner' ? '/homeowner/overview' : '/contractor/dashboard');
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
          <h1 className="text-lg font-bold text-[#172B4D]">Create your BuildLedger account</h1>
          <p className="mt-1 text-xs text-[#707987]">
            Select whether you are financing a home build or managing site construction.
          </p>

          <div className="mt-5 grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setRole('homeowner')}
              className={`p-3 rounded-xl border text-left transition-colors cursor-pointer ${
                role === 'homeowner'
                  ? 'border-[#172B4D] bg-[#F7F8FA]'
                  : 'border-[#E6E9EF] hover:border-[#CBD5E1]'
              }`}
            >
              <Home className="w-4 h-4 text-[#172B4D] mb-1.5" />
              <div className="text-xs font-semibold text-[#172B4D]">Homeowner</div>
              <div className="text-[11px] text-[#707987]">Monitor budget & bills</div>
            </button>
            <button
              type="button"
              onClick={() => setRole('contractor')}
              className={`p-3 rounded-xl border text-left transition-colors cursor-pointer ${
                role === 'contractor'
                  ? 'border-[#172B4D] bg-[#F7F8FA]'
                  : 'border-[#E6E9EF] hover:border-[#CBD5E1]'
              }`}
            >
              <HardHat className="w-4 h-4 text-[#172B4D] mb-1.5" />
              <div className="text-xs font-semibold text-[#172B4D]">Contractor</div>
              <div className="text-[11px] text-[#707987]">Log purchases & progress</div>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="mt-5 space-y-4">
            <div>
              <label className="block text-xs font-medium text-[#20252D] mb-1">Full Name *</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={role === 'homeowner' ? 'e.g., Rohan Sharma' : 'e.g., Suresh Nair'}
                className="w-full px-3 py-2 text-sm rounded-lg border border-[#E6E9EF] focus:outline-none focus:border-[#172B4D]"
              />
            </div>

            {role === 'contractor' && (
              <div>
                <label className="block text-xs font-medium text-[#20252D] mb-1">
                  Firm / Company Name
                </label>
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="e.g., Kulkarni Civil Works LLP"
                  className="w-full px-3 py-2 text-sm rounded-lg border border-[#E6E9EF] focus:outline-none focus:border-[#172B4D]"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-[#20252D] mb-1">
                Email Address *
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full px-3 py-2 text-sm rounded-lg border border-[#E6E9EF] focus:outline-none focus:border-[#172B4D]"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#20252D] mb-1">Password *</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimum 6 characters"
                className="w-full px-3 py-2 text-sm rounded-lg border border-[#E6E9EF] focus:outline-none focus:border-[#172B4D]"
              />
            </div>

            {error && <p className="text-xs text-[#DC2626]">{error}</p>}

            <button
              type="submit"
              className="w-full py-2.5 text-sm font-semibold rounded-lg bg-[#172B4D] text-white hover:bg-[#172B4D]/90 transition-colors cursor-pointer"
            >
              Create Account
            </button>
          </form>

          <p className="mt-5 text-center text-xs text-[#707987]">
            Already registered?{' '}
            <Link to="/login" className="font-semibold text-[#172B4D] hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};
