import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Building2, CheckCircle2 } from 'lucide-react';

export const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setSent(true);
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
          {sent ? (
            <div className="text-center py-3 space-y-3">
              <div className="w-10 h-10 rounded-full bg-[#F0FDF4] text-[#15803D] flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <h1 className="text-base font-bold text-[#172B4D]">Reset instructions sent</h1>
              <p className="text-xs text-[#707987] leading-relaxed">
                If an account exists for <strong className="text-[#172B4D]">{email}</strong>, you
                will receive a password reset link shortly.
              </p>
              <Link
                to="/login"
                className="inline-flex items-center gap-1.5 mt-2 text-xs font-semibold text-[#172B4D] hover:underline"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Return to Sign In
              </Link>
            </div>
          ) : (
            <>
              <h1 className="text-lg font-bold text-[#172B4D]">Reset your password</h1>
              <p className="mt-1 text-xs text-[#707987]">
                Enter the email address associated with your BuildLedger account.
              </p>
              <form onSubmit={handleSubmit} className="mt-5 space-y-4">
                <div>
                  <label className="block text-xs font-medium text-[#20252D] mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="ananya.rao@gmail.com"
                    className="w-full px-3 py-2 text-sm rounded-lg border border-[#E6E9EF] focus:outline-none focus:border-[#172B4D]"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-2.5 text-sm font-semibold rounded-lg bg-[#172B4D] text-white hover:bg-[#172B4D]/90 cursor-pointer"
                >
                  Send Reset Link
                </button>
              </form>
              <div className="mt-5 text-center">
                <Link
                  to="/login"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#707987] hover:text-[#172B4D]"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  Back to Sign In
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
