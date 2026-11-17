import { useEffect, useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { MarketplaceProvider } from './context/MarketplaceContext';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { AuthRoleModal } from './components/AuthRoleModal';
import { RoleOnboardingModal } from './components/RoleOnboardingModal';
import { ProfileSettingsModal } from './components/ProfileSettingsModal';
import { PaymentComingSoonModal } from './components/PaymentComingSoonModal';
import { HomePage } from './pages/HomePage';
import { DestinationsPage } from './pages/DestinationsPage';
import { GuidesPage } from './pages/GuidesPage';
import { PackagesPage } from './pages/PackagesPage';
import { TripPlannerPage } from './pages/TripPlannerPage';
import { HotelsPage } from './pages/HotelsPage';
import { VehiclesPage } from './pages/VehiclesPage';
import { AboutPage } from './pages/AboutPage';
import { DashboardPage } from './pages/DashboardPage';
import { ActivePage } from './types/travelmate';

function TravelMateShell() {
  const {
    authError,
    clearAuthError,
    authNotice,
    clearAuthNotice,
    authModalOpen,
    pendingDashboardRedirect,
    clearDashboardRedirect,
  } = useAuth();
  const [activePage, setActivePage] = useState<ActivePage>('home');
  const [navExtra, setNavExtra] = useState<{ query?: string; id?: string; section?: string }>({});
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);

  useEffect(() => {
    if (pendingDashboardRedirect) {
      setActivePage('dashboard');
      setNavExtra({});
      clearDashboardRedirect();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [pendingDashboardRedirect, clearDashboardRedirect]);

  const handleNavigate = (
    page: ActivePage,
    extra?: { query?: string; id?: string; section?: string } | string
  ) => {
    setActivePage(page);
    if (typeof extra === 'string') {
      setNavExtra({ section: extra });
    } else {
      setNavExtra(extra || {});
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC] text-slate-900">
      <Navbar activePage={activePage} onNavigate={(p) => handleNavigate(p)} />

      {authError && !authModalOpen && (
        <div className="bg-rose-50 border-b border-rose-200 px-4 py-2.5 text-xs text-rose-800 flex items-center justify-between gap-4">
          <span>Sign-in notice: {authError}</span>
          <button
            type="button"
            onClick={clearAuthError}
            className="underline font-semibold shrink-0 cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {authNotice && (
        <div className="bg-blue-50 border-b border-blue-200 px-4 py-2.5 text-xs text-[#0B5ED7] font-medium flex items-center justify-between gap-4">
          <span>{authNotice}</span>
          <button
            type="button"
            onClick={clearAuthNotice}
            className="underline font-semibold shrink-0 cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      <main className="flex-1">
        {activePage === 'home' && <HomePage onNavigate={handleNavigate} />}
        {activePage === 'destinations' && (
          <DestinationsPage
            key={`dest-${navExtra.id || ''}-${navExtra.query || ''}`}
            initialQuery={navExtra.query}
            initialSelectedId={navExtra.id}
            onNavigate={handleNavigate}
          />
        )}
        {activePage === 'guides' && (
          <GuidesPage
            key={`guides-${navExtra.id || ''}-${navExtra.query || ''}`}
            initialQuery={navExtra.query}
            initialSelectedId={navExtra.id}
            onNavigate={handleNavigate}
          />
        )}
        {activePage === 'packages' && (
          <PackagesPage
            key={`pkg-${navExtra.id || ''}-${navExtra.query || ''}`}
            initialQuery={navExtra.query}
            initialSelectedId={navExtra.id}
            onOpenPaymentModal={() => setPaymentModalOpen(true)}
            onNavigate={handleNavigate}
          />
        )}
        {activePage === 'trip-planner' && (
          <TripPlannerPage onNavigate={handleNavigate} />
        )}
        {activePage === 'hotels' && (
          <HotelsPage
            key={`htl-${navExtra.id || ''}-${navExtra.query || ''}`}
            initialQuery={navExtra.query}
            initialSelectedId={navExtra.id}
            onOpenPaymentModal={() => setPaymentModalOpen(true)}
            onNavigate={handleNavigate}
          />
        )}
        {activePage === 'vehicles' && (
          <VehiclesPage
            key={`veh-${navExtra.id || ''}-${navExtra.query || ''}`}
            initialQuery={navExtra.query}
            initialSelectedId={navExtra.id}
            onOpenPaymentModal={() => setPaymentModalOpen(true)}
            onNavigate={handleNavigate}
          />
        )}
        {activePage === 'about' && (
          <AboutPage
            key={`abt-${navExtra.section || 'about'}`}
            initialSection={navExtra.section}
          />
        )}
        {activePage === 'dashboard' && (
          <DashboardPage
            onNavigate={handleNavigate}
            onOpenPaymentModal={() => setPaymentModalOpen(true)}
          />
        )}
      </main>

      <Footer
        onNavigate={(page, section) => handleNavigate(page, section ? { section } : undefined)}
      />

      <AuthRoleModal />
      <RoleOnboardingModal />
      <ProfileSettingsModal />
      <PaymentComingSoonModal
        open={paymentModalOpen}
        onClose={() => setPaymentModalOpen(false)}
      />
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <MarketplaceProvider>
          <TravelMateShell />
        </MarketplaceProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}
