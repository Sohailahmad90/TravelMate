import { LogOut, Settings, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { ActivePage, UserRole } from '../types/travelmate';
import { TouristDashboard } from '../components/dashboards/TouristDashboard';
import { GuideDashboard } from '../components/dashboards/GuideDashboard';
import {
  HotelDashboard,
  VehicleDashboard,
} from '../components/dashboards/PartnerDashboards';
import { AdminDashboard } from '../components/dashboards/AdminDashboard';

interface DashboardPageProps {
  onNavigate: (page: ActivePage, extra?: { id?: string }) => void;
  onOpenPaymentModal: () => void;
}

const ROLE_LABELS: Record<UserRole, string> = {
  tourist: 'Traveller',
  guide: 'Tour Guide',
  hotel_owner: 'Hotel Owner',
  vehicle_owner: 'Vehicle Owner',
  admin: 'Admin',
};

export function DashboardPage({
  onNavigate,
  onOpenPaymentModal,
}: DashboardPageProps) {
  const {
    firebaseUser,
    profile,
    isAdmin,
    effectiveRole,
    switchRole,
    openAuthModal,
    openProfileSettings,
    logout,
  } = useAuth();

  if (!firebaseUser) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center space-y-5">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-blue-50 border border-blue-100 text-[#0B5ED7] flex items-center justify-center">
          <ShieldCheck className="w-7 h-7" />
        </div>
        <h1 className="text-3xl font-extrabold font-display text-slate-900">
          Sign in or Sign up for TravelMate
        </h1>
        <p className="text-sm text-slate-600">
          Choose whether you are continuing as a Traveller, Tour Guide, Hotel Owner, or Vehicle
          Owner to open your dedicated workspace.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => openAuthModal('signin', { redirectToDashboard: true })}
            className="px-7 py-3 rounded-full border border-slate-300 bg-white text-slate-800 font-bold text-sm hover:border-[#0B5ED7] hover:text-[#0B5ED7] transition-colors cursor-pointer"
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => openAuthModal('signup', { redirectToDashboard: true })}
            className="px-7 py-3 rounded-full bg-[#0B5ED7] text-white font-bold text-sm hover:bg-[#0842A0] transition-colors cursor-pointer"
          >
            Sign Up
          </button>
        </div>
      </div>
    );
  }

  if (profile?.isSuspended) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center space-y-4">
        <h1 className="text-2xl font-bold text-rose-600">Account Suspended</h1>
        <p className="text-sm text-slate-600">
          Your TravelMate account has been suspended by an administrator. Contact
          concierge@travelmate.pk for review.
        </p>
        <button
          type="button"
          onClick={() => void logout()}
          className="px-5 py-2 rounded-full border border-slate-300 bg-white text-xs font-semibold text-slate-700 cursor-pointer"
        >
          Sign Out
        </button>
      </div>
    );
  }

  const activeRole: UserRole = effectiveRole || 'tourist';
  const displayName = profile?.fullName || firebaseUser.displayName || 'Traveler';
  const avatarSrc = profile?.avatarUrl || firebaseUser.photoURL || '';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div className="rounded-2xl bg-white border border-slate-200 shadow-xs p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full overflow-hidden bg-[#0B5ED7] text-white flex items-center justify-center font-bold text-lg shrink-0 border-2 border-slate-100 shadow-xs">
            {avatarSrc ? (
              <img
                src={avatarSrc}
                alt={displayName}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
            ) : (
              displayName.slice(0, 2).toUpperCase()
            )}
          </div>
          <div>
            <p className="text-xs text-[#0B5ED7] font-bold uppercase tracking-wide">
              {ROLE_LABELS[activeRole]} Workspace
            </p>
            <h1 className="text-2xl sm:text-3xl font-extrabold font-display text-slate-900 mt-0.5">
              Welcome back, {displayName}
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              {profile?.email || firebaseUser.email} · {profile?.city || 'Pakistan'}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <select
            aria-label="Switch workspace role"
            value={activeRole}
            onChange={(e) => void switchRole(e.target.value as UserRole)}
            className="rounded-full bg-slate-50 border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:border-[#0B5ED7]"
          >
            {isAdmin && <option value="admin">Admin Console</option>}
            <option value="tourist">Traveller Workspace</option>
            <option value="guide">Tour Guide Workspace</option>
            <option value="hotel_owner">Hotel Owner Workspace</option>
            <option value="vehicle_owner">Vehicle Owner Workspace</option>
          </select>

          <button
            type="button"
            onClick={openProfileSettings}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full border border-slate-300 bg-white text-xs font-semibold text-slate-700 hover:border-[#0B5ED7] hover:text-[#0B5ED7] transition-colors cursor-pointer"
          >
            <Settings className="w-3.5 h-3.5" />
            <span>Profile Settings</span>
          </button>

          <button
            type="button"
            onClick={() => void logout()}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full border border-rose-200 bg-rose-50/70 text-xs font-semibold text-rose-600 hover:bg-rose-100 transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      {activeRole === 'admin' && <AdminDashboard />}
      {activeRole === 'tourist' && (
        <TouristDashboard
          onNavigate={onNavigate}
          onOpenPaymentModal={onOpenPaymentModal}
        />
      )}
      {activeRole === 'guide' && <GuideDashboard onNavigate={onNavigate} />}
      {activeRole === 'hotel_owner' && <HotelDashboard />}
      {activeRole === 'vehicle_owner' && <VehicleDashboard />}
    </div>
  );
}
