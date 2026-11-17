import { useEffect, useRef, useState } from 'react';
import {
  Compass,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageSquare,
  Mountain,
  Settings,
  ShieldCheck,
  X,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { ActivePage, UserRole } from '../types/travelmate';

interface NavbarProps {
  activePage: ActivePage;
  onNavigate: (page: ActivePage) => void;
}

interface NavItem {
  key: string;
  page: ActivePage;
  label: string;
}

const ROLE_LABELS: Record<UserRole, string> = {
  tourist: 'Traveller',
  guide: 'Tour Guide',
  hotel_owner: 'Hotel Owner',
  vehicle_owner: 'Fleet Owner',
  admin: 'Admin',
};

const PRIMARY_NAV_ITEMS: NavItem[] = [
  { key: 'home', page: 'home', label: 'Home' },
  { key: 'destinations', page: 'destinations', label: 'Destinations' },
  { key: 'guides', page: 'guides', label: 'Guides' },
  { key: 'hotels', page: 'hotels', label: 'Hotels' },
  { key: 'vehicles', page: 'vehicles', label: 'Vehicles' },
  { key: 'trip-planner', page: 'trip-planner', label: 'Trip Plan' },
];

export function Navbar({ activePage, onNavigate }: NavbarProps) {
  const {
    firebaseUser,
    profile,
    isAdmin,
    effectiveRole,
    setDashboardTargetTab,
    switchRole,
    openAuthModal,
    openProfileSettings,
    logout,
  } = useAuth();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setProfileMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

  const handleItemClick = (page: ActivePage) => {
    onNavigate(page);
    setMobileOpen(false);
    setProfileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const displayName = profile?.fullName || firebaseUser?.displayName || 'Traveler';
  const avatarSrc = profile?.avatarUrl || firebaseUser?.photoURL || '';
  const initials = displayName.slice(0, 2).toUpperCase();

  return (
    <>
      {/* Top Cobalt Trust Utility Strip (non-sticky for mobile viewport cap) */}
      <div className="bg-[#0B5ED7] text-white text-[11px] py-2 px-4 hidden sm:block">
        <div className="max-w-7xl mx-auto flex items-center justify-center gap-6 lg:gap-10 font-medium">
          <span>Free cancellation on bookings</span>
          <span aria-hidden="true" className="text-white/40">
            ·
          </span>
          <span>CNIC-verified tour guides</span>
          <span aria-hidden="true" className="text-white/40">
            ·
          </span>
          <span>Direct guide &amp; hotel messaging</span>
          <span aria-hidden="true" className="text-white/40">
            ·
          </span>
          <span>24/7 Northern Pakistan support</span>
        </div>
      </div>

      {/* Main Sticky Crisp White Header */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4 lg:gap-8">
          {/* Zone 1: Brand Wordmark */}
          <button
            type="button"
            onClick={() => handleItemClick('home')}
            className="flex items-center gap-2 text-slate-900 whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0B5ED7] rounded-lg px-1"
          >
            <div className="w-8 h-8 rounded-lg bg-[#0B5ED7] text-white flex items-center justify-center shrink-0">
              <Mountain className="w-4 h-4" />
            </div>
            <span className="text-lg font-extrabold font-display tracking-tight text-slate-900">
              TravelMate
            </span>
          </button>

          {/* Zone 2: Clean Single-Line Navigation Links */}
          <nav
            aria-label="Primary Navigation"
            className="hidden md:flex items-center gap-6 lg:gap-8 text-sm font-medium text-slate-600"
          >
            {PRIMARY_NAV_ITEMS.map((item) => {
              const isActive = activePage === item.page;
              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => handleItemClick(item.page)}
                  className={`relative py-1 whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                    isActive
                      ? 'text-[#0B5ED7] font-semibold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {item.label}
                  {isActive && (
                    <span className="absolute left-0 right-0 -bottom-0.5 h-0.5 bg-[#0B5ED7] rounded-full" />
                  )}
                </button>
              );
            })}
          </nav>

          {/* Zone 3: Sign In / Sign Up OR User Profile Avatar Only */}
          <div className="flex items-center gap-2.5 shrink-0" ref={menuRef}>
            {firebaseUser ? (
              <div className="relative">
                <button
                  type="button"
                  aria-label="Open account menu"
                  onClick={() => setProfileMenuOpen((prev) => !prev)}
                  className="w-10 h-10 rounded-full overflow-hidden bg-[#0B5ED7] text-white border-2 border-slate-200 hover:border-[#0B5ED7] transition-all flex items-center justify-center text-xs font-bold shadow-xs cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0B5ED7]"
                >
                  {avatarSrc ? (
                    <img
                      src={avatarSrc}
                      alt={displayName}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    initials
                  )}
                </button>

                {profileMenuOpen && (
                  <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-white border border-slate-200 shadow-xl py-2 z-50 text-left">
                    <div className="px-4 py-3 border-b border-slate-100">
                      <p className="text-sm font-bold text-slate-900 truncate">{displayName}</p>
                      <p className="text-xs text-slate-500 truncate">
                        {profile?.email || firebaseUser.email}
                      </p>
                      <p className="text-[11px] font-semibold text-[#0B5ED7] mt-1">
                        Role: {effectiveRole ? ROLE_LABELS[effectiveRole] : 'Traveller'}
                      </p>
                    </div>

                    <div className="py-1">
                      <button
                        type="button"
                        onClick={() => {
                          setProfileMenuOpen(false);
                          setDashboardTargetTab('overview');
                          onNavigate('dashboard');
                        }}
                        className="w-full px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-[#0B5ED7] flex items-center gap-2.5 cursor-pointer"
                      >
                        <LayoutDashboard className="w-4 h-4" />
                        <span>
                          {effectiveRole === 'guide'
                            ? 'Tour Guide Workspace'
                            : effectiveRole === 'hotel_owner'
                            ? 'Hotel Owner Workspace'
                            : effectiveRole === 'vehicle_owner'
                            ? 'Fleet Owner Workspace'
                            : effectiveRole === 'admin'
                            ? 'Admin Console'
                            : 'My Dashboard'}
                        </span>
                      </button>

                      {effectiveRole === 'guide' && (
                        <button
                          type="button"
                          onClick={() => {
                            setProfileMenuOpen(false);
                            setDashboardTargetTab('packages');
                            onNavigate('dashboard');
                          }}
                          className="w-full px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-[#0B5ED7] flex items-center gap-2.5 cursor-pointer"
                        >
                          <Compass className="w-4 h-4" />
                          <span>Post &amp; Edit Tour Packages</span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => {
                          setProfileMenuOpen(false);
                          setDashboardTargetTab('messages');
                          onNavigate('dashboard');
                        }}
                        className="w-full px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-[#0B5ED7] flex items-center gap-2.5 cursor-pointer"
                      >
                        <MessageSquare className="w-4 h-4" />
                        <span>Messages Inbox</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setProfileMenuOpen(false);
                          openProfileSettings();
                        }}
                        className="w-full px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-[#0B5ED7] flex items-center gap-2.5 cursor-pointer"
                      >
                        <Settings className="w-4 h-4" />
                        <span>Profile Settings</span>
                      </button>

                      {isAdmin && effectiveRole !== 'admin' && (
                        <button
                          type="button"
                          onClick={() => {
                            setProfileMenuOpen(false);
                            void switchRole('admin');
                            onNavigate('dashboard');
                          }}
                          className="w-full px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-[#0B5ED7] flex items-center gap-2.5 cursor-pointer"
                        >
                          <ShieldCheck className="w-4 h-4" />
                          <span>Switch to Admin Console</span>
                        </button>
                      )}
                    </div>

                    <div className="pt-1 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={() => {
                          setProfileMenuOpen(false);
                          void logout();
                        }}
                        className="w-full px-4 py-2.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 flex items-center gap-2.5 cursor-pointer"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => openAuthModal('signin', { redirectToDashboard: true })}
                  className="px-4 py-2 rounded-full border border-slate-300 text-slate-700 text-xs font-semibold hover:border-[#0B5ED7] hover:text-[#0B5ED7] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => openAuthModal('signup', { redirectToDashboard: true })}
                  className="px-4 py-2 rounded-full bg-[#0B5ED7] text-white text-xs font-bold hover:bg-[#0842A0] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  Sign Up
                </button>
              </div>
            )}

            <button
              type="button"
              onClick={() => setMobileOpen((prev) => !prev)}
              aria-label="Toggle navigation menu"
              className="md:hidden p-2 rounded-lg text-slate-700 hover:bg-slate-100 cursor-pointer"
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu Drawer */}
        {mobileOpen && (
          <div className="md:hidden border-t border-slate-200 bg-white px-4 py-4 space-y-1">
            {PRIMARY_NAV_ITEMS.map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={() => handleItemClick(item.page)}
                className={`block w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                  activePage === item.page
                    ? 'bg-blue-50 text-[#0B5ED7] font-semibold'
                    : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                {item.label}
              </button>
            ))}

            {firebaseUser ? (
              <div className="pt-3 mt-2 border-t border-slate-200 space-y-2">
                <button
                  type="button"
                  onClick={() => {
                    setMobileOpen(false);
                    setDashboardTargetTab('overview');
                    onNavigate('dashboard');
                  }}
                  className="w-full py-2.5 rounded-full bg-[#0B5ED7] text-white text-xs font-bold cursor-pointer"
                >
                  Open My Workspace
                </button>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setMobileOpen(false);
                      openProfileSettings();
                    }}
                    className="flex-1 py-2.5 rounded-full border border-slate-300 text-slate-700 text-xs font-semibold cursor-pointer"
                  >
                    Profile Settings
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setMobileOpen(false);
                      void logout();
                    }}
                    className="flex-1 py-2.5 rounded-full bg-rose-50 text-rose-600 text-xs font-bold cursor-pointer"
                  >
                    Sign Out
                  </button>
                </div>
              </div>
            ) : (
              <div className="pt-3 mt-2 border-t border-slate-200 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setMobileOpen(false);
                    openAuthModal('signin', { redirectToDashboard: true });
                  }}
                  className="flex-1 py-2.5 rounded-full border border-slate-300 text-slate-700 text-xs font-semibold cursor-pointer"
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMobileOpen(false);
                    openAuthModal('signup', { redirectToDashboard: true });
                  }}
                  className="flex-1 py-2.5 rounded-full bg-[#0B5ED7] text-white text-xs font-bold cursor-pointer"
                >
                  Sign Up
                </button>
              </div>
            )}
          </div>
        )}
      </header>
    </>
  );
}
