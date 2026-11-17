import React, { useEffect, useState } from 'react';
import { Building2, Car, Compass, ShieldCheck, User, X } from 'lucide-react';
import { AuthModalMode, useAuth } from '../context/AuthContext';
import { UserRole } from '../types/travelmate';

const ROLE_OPTIONS: {
  role: Exclude<UserRole, 'admin'>;
  title: string;
  subtitle: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  {
    role: 'tourist',
    title: 'Traveller / Tourist',
    subtitle: 'Plan custom trips, hire verified guides, reserve hotels & rent 4x4 vehicles',
    icon: User,
  },
  {
    role: 'guide',
    title: 'Tour Guide',
    subtitle: 'Post tour packages, accept custom trip requests & verify your CNIC badge',
    icon: Compass,
  },
  {
    role: 'hotel_owner',
    title: 'Hotel Owner',
    subtitle: 'Register properties, manage room inventory & confirm reservations',
    icon: Building2,
  },
  {
    role: 'vehicle_owner',
    title: 'Vehicle / Fleet Owner',
    subtitle: 'List 4x4 jeeps, SUVs, vans & cars with or without driver options',
    icon: Car,
  },
];

export function AuthRoleModal() {
  const {
    authModalOpen,
    authModalMode,
    authModalDefaultRole,
    closeAuthModal,
    signInWithGoogle,
    authError,
    clearAuthError,
  } = useAuth();

  const [mode, setMode] = useState<AuthModalMode>(authModalMode);
  const [selectedRole, setSelectedRole] =
    useState<Exclude<UserRole, 'admin'>>(authModalDefaultRole);
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('+92 300 ');
  const [city, setCity] = useState('Islamabad');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (authModalOpen) {
      setMode(authModalMode);
      setSelectedRole(authModalDefaultRole);
      clearAuthError();
    }
  }, [authModalOpen, authModalMode, authModalDefaultRole]);

  if (!authModalOpen) return null;

  const selectedLabel =
    ROLE_OPTIONS.find((opt) => opt.role === selectedRole)?.title || 'Traveller';

  const handleContinue = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await signInWithGoogle({
        mode,
        role: selectedRole,
        fullName: fullName.trim() || undefined,
        phone: phone.trim() === '+92 300' ? '' : phone.trim(),
        city: city.trim() || 'Islamabad',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-role-modal-title"
      onClick={closeAuthModal}
    >
      <div
        className="w-full max-w-2xl rounded-2xl bg-white border border-slate-200 p-6 sm:p-8 shadow-2xl text-slate-900 my-8 relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={closeAuthModal}
          aria-label="Close sign in dialog"
          className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Mode Switch Tabs */}
        <div className="inline-flex rounded-full bg-slate-100 border border-slate-200 p-1 mb-5">
          <button
            type="button"
            onClick={() => {
              setMode('signin');
              clearAuthError();
            }}
            className={`px-5 py-1.5 rounded-full text-xs font-bold transition-colors cursor-pointer ${
              mode === 'signin'
                ? 'bg-[#0B5ED7] text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('signup');
              clearAuthError();
            }}
            className={`px-5 py-1.5 rounded-full text-xs font-bold transition-colors cursor-pointer ${
              mode === 'signup'
                ? 'bg-[#0B5ED7] text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Sign Up
          </button>
        </div>

        <div className="flex items-start justify-between gap-4 mb-5">
          <div>
            <h2 id="auth-role-modal-title" className="text-2xl font-bold font-display text-slate-900">
              {mode === 'signin'
                ? 'Sign In to TravelMate'
                : 'Create Your TravelMate Account'}
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              {mode === 'signin'
                ? 'Choose whether you are signing in as a Traveller, Tour Guide, or Partner.'
                : 'Select your role first — are you joining as a Traveller or a Tour Guide?'}
            </p>
          </div>
          <ShieldCheck className="w-8 h-8 text-[#0B5ED7] shrink-0 hidden sm:block" />
        </div>

        <form onSubmit={handleContinue} className="space-y-5">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-[#0B5ED7] mb-2.5">
              Select Account Role
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {ROLE_OPTIONS.map((opt) => {
                const Icon = opt.icon;
                const selected = selectedRole === opt.role;
                return (
                  <button
                    key={opt.role}
                    type="button"
                    onClick={() => setSelectedRole(opt.role)}
                    className={`text-left p-4 rounded-xl border transition-colors cursor-pointer ${
                      selected
                        ? 'bg-blue-50/80 border-[#0B5ED7] text-slate-900 ring-1 ring-[#0B5ED7]'
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 mb-1.5">
                      <Icon
                        className={`w-5 h-5 ${selected ? 'text-[#0B5ED7]' : 'text-slate-400'}`}
                      />
                      <span className="font-bold text-sm">{opt.title}</span>
                    </div>
                    <p className="text-xs text-slate-500 leading-relaxed">{opt.subtitle}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {mode === 'signup' && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Full Name (Optional)
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Uses Google name"
                  className="w-full rounded-xl bg-white border border-slate-200 px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#0B5ED7]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+92 300 1234567"
                  className="w-full rounded-xl bg-white border border-slate-200 px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#0B5ED7]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Base City
                </label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="Islamabad / Gilgit"
                  className="w-full rounded-xl bg-white border border-slate-200 px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#0B5ED7]"
                />
              </div>
            </div>
          )}

          {authError && (
            <div className="text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-xl px-4 py-3">
              {authError}
            </div>
          )}

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-200">
            <p className="text-xs text-slate-500">Secured with Google Authentication.</p>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={closeAuthModal}
                className="px-4 py-2.5 rounded-full border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-2.5 rounded-full bg-[#0B5ED7] text-white font-bold text-sm hover:bg-[#0842A0] disabled:opacity-60 transition-colors whitespace-nowrap cursor-pointer"
              >
                {submitting
                  ? 'Connecting to Google...'
                  : `${mode === 'signin' ? 'Sign In' : 'Sign Up'} with Google · ${selectedLabel}`}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
