import React, { useState } from 'react';
import { Building2, Car, Compass, ShieldCheck, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types/travelmate';

const ROLE_OPTIONS: {
  role: Exclude<UserRole, 'admin'>;
  title: string;
  subtitle: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  {
    role: 'tourist',
    title: 'Tourist / Traveller',
    subtitle: 'Plan trips, hire verified guides, reserve hotels & rent vehicles',
    icon: User,
  },
  {
    role: 'guide',
    title: 'Tour Guide',
    subtitle: 'Post packages, accept trip requests & verify your CNIC badge',
    icon: Compass,
  },
  {
    role: 'hotel_owner',
    title: 'Hotel Owner',
    subtitle: 'Register properties, manage room inventory & accept reservations',
    icon: Building2,
  },
  {
    role: 'vehicle_owner',
    title: 'Vehicle / Fleet Owner',
    subtitle: 'List 4x4 jeeps, SUVs, vans & cars with or without driver options',
    icon: Car,
  },
];

export function RoleOnboardingModal() {
  const { firebaseUser, needsOnboarding, completeOnboarding, logout } = useAuth();
  const [role, setRole] = useState<Exclude<UserRole, 'admin'>>('tourist');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!needsOnboarding || !firebaseUser) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (fullName.trim().length < 2) {
      setError('Please enter your full name.');
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      await completeOnboarding({
        fullName: fullName.trim(),
        phone: phone.trim(),
        city: city.trim(),
        role,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save profile.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="onboarding-title"
    >
      <div className="w-full max-w-2xl rounded-2xl bg-white border border-slate-200 p-6 sm:p-8 shadow-2xl text-slate-900 my-8">
        <div className="flex items-center justify-between gap-4 mb-6">
          <div>
            <h2 id="onboarding-title" className="text-2xl font-bold font-display text-slate-900">
              Complete Your TravelMate Account
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              Signed in as {firebaseUser.email}. Choose how you want to use TravelMate.
            </p>
          </div>
          <ShieldCheck className="w-8 h-8 text-[#0B5ED7] shrink-0" />
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {ROLE_OPTIONS.map((opt) => {
              const Icon = opt.icon;
              const selected = role === opt.role;
              return (
                <button
                  key={opt.role}
                  type="button"
                  onClick={() => setRole(opt.role)}
                  className={`text-left p-4 rounded-xl border transition-colors cursor-pointer ${
                    selected
                      ? 'bg-blue-50/80 border-[#0B5ED7] text-slate-900 ring-1 ring-[#0B5ED7]'
                      : 'bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-2.5 mb-1.5">
                    <Icon className={`w-5 h-5 ${selected ? 'text-[#0B5ED7]' : 'text-slate-400'}`} />
                    <span className="font-bold text-sm">{opt.title}</span>
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed">{opt.subtitle}</p>
                </button>
              );
            })}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Full Legal Name
              </label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g., Ali Hassan"
                className="w-full rounded-xl bg-white border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-[#0B5ED7]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Phone Number
              </label>
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+92 300 1234567"
                className="w-full rounded-xl bg-white border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-[#0B5ED7]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Base City
              </label>
              <input
                type="text"
                required
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Islamabad / Gilgit"
                className="w-full rounded-xl bg-white border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-[#0B5ED7]"
              />
            </div>
          </div>

          {error && (
            <p className="text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-xl px-3 py-2">
              {error}
            </p>
          )}

          <div className="flex items-center justify-between gap-4 pt-2 border-t border-slate-200">
            <button
              type="button"
              onClick={() => void logout()}
              className="text-xs text-slate-500 hover:text-slate-900 underline cursor-pointer"
            >
              Switch Google Account
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2.5 rounded-full bg-[#0B5ED7] text-white font-bold text-sm hover:bg-[#0842A0] disabled:opacity-60 transition-colors cursor-pointer"
            >
              {submitting ? 'Creating Account...' : 'Continue to TravelMate'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
