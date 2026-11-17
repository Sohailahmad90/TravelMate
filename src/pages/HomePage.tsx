import React, { useMemo, useState } from 'react';
import {
  ArrowRight,
  BadgeCheck,
  Building2,
  Calendar,
  Car,
  CheckCircle2,
  Compass,
  Headphones,
  MapPin,
  Plus,
  Quote,
  Search,
  ShieldCheck,
  Star,
  Users,
} from 'lucide-react';
import { HERO_IMAGE } from '../data/seedData';
import { useAuth } from '../context/AuthContext';
import { useMarketplace } from '../context/MarketplaceContext';
import {
  ActivePage,
  DestinationRegion,
  formatPkr,
} from '../types/travelmate';
import { ResilientImage } from '../components/ResilientImage';

interface HomePageProps {
  onNavigate: (page: ActivePage, extra?: { query?: string; id?: string }) => void;
}

const REGION_TABS: ('All' | DestinationRegion)[] = [
  'All',
  'Gilgit-Baltistan',
  'Swat & Kaghan',
  'High Passes',
  'Lakes & Meadows',
];

const HERO_AVATARS = [
  '/src/assets/images/about_traveler_pakistan_1794920589035.jpg',
  '/src/assets/images/dest_hunza_baltit_1794920585672.jpg',
  '/src/assets/images/dest_skardu_shangrila_1794920587347.jpg',
  '/src/assets/images/dest_fairy_meadows_1794920586767.jpg',
];

export function HomePage({ onNavigate }: HomePageProps) {
  const {
    firebaseUser,
    effectiveRole,
    setDashboardTargetTab,
    openAuthModal,
  } = useAuth();
  const {
    destinations,
    guides,
    packages,
    hotels,
    vehicles,
    reviews,
    guideRequests,
    bookings,
  } = useMarketplace();

  const [searchCategory, setSearchCategory] = useState<
    'destinations' | 'guides' | 'hotels' | 'vehicles' | 'packages'
  >('destinations');
  const [searchQuery, setSearchQuery] = useState('');
  const [fromCity, setFromCity] = useState('');
  const [travelDate, setTravelDate] = useState('');
  const [guestCount, setGuestCount] = useState('');
  const [activeRegion, setActiveRegion] = useState<'All' | DestinationRegion>('All');

  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterDone, setNewsletterDone] = useState(false);

  const uid = firebaseUser?.uid || '';

  const filteredDestinations = useMemo(() => {
    const list =
      activeRegion === 'All'
        ? destinations
        : destinations.filter((d) => d.region === activeRegion);
    return list.slice(0, 4);
  }, [destinations, activeRegion]);

  const publishedPackages = useMemo(
    () => packages.filter((p) => p.isPublished).slice(0, 3),
    [packages]
  );

  const verifiedHotels = useMemo(
    () => hotels.filter((h) => h.verificationStatus === 'verified').slice(0, 3),
    [hotels]
  );

  const verifiedVehicles = useMemo(
    () => vehicles.filter((v) => v.verificationStatus === 'verified').slice(0, 3),
    [vehicles]
  );

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onNavigate(searchCategory, { query: searchQuery.trim() });
  };

  const handleNewsletter = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newsletterEmail.includes('@')) return;
    setNewsletterDone(true);
    setNewsletterEmail('');
  };

  const openGuideSection = (tab: string) => {
    setDashboardTargetTab(tab);
    onNavigate('dashboard');
  };

  // Partner / Tour Guide Role-Specific Home Experience
  if (
    firebaseUser &&
    (effectiveRole === 'guide' ||
      effectiveRole === 'hotel_owner' ||
      effectiveRole === 'vehicle_owner')
  ) {
    const myGuidePackages = packages.filter((p) => p.ownerUid === uid);
    const myGuideRequests = guideRequests.filter((r) => r.guideOwnerUid === uid);
    const myProviderBookings = bookings.filter((b) => b.providerUid === uid);
    const myGuide = guides.find((g) => g.guideId === uid);

    const isGuide = effectiveRole === 'guide';
    const isHotel = effectiveRole === 'hotel_owner';

    return (
      <div className="bg-[#F8FAFC] text-slate-900 pb-16">
        <section className="relative overflow-hidden border-b border-slate-200 bg-white">
          <div className="absolute inset-0">
            <ResilientImage
              src={HERO_IMAGE}
              alt="Northern Pakistan valleys"
              className="w-full h-full object-cover opacity-20"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-white via-white/95 to-blue-50/75" />
          </div>

          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-20">
            <div className="max-w-3xl space-y-5">
              <p className="text-xs font-bold uppercase tracking-wider text-[#0B5ED7]">
                {isGuide
                  ? 'Tour Guide Partner Portal'
                  : isHotel
                  ? 'Hotel Partner Portal'
                  : 'Fleet Owner Portal'}
              </p>
              <h1 className="text-4xl sm:text-5xl font-extrabold font-display tracking-tight text-slate-900 leading-tight">
                {isGuide ? (
                  <>
                    Lead Pakistan,{' '}
                    <span className="text-[#F97316]">Inspire Travelers</span>
                  </>
                ) : isHotel ? (
                  <>
                    Welcome Guests to{' '}
                    <span className="text-[#F97316]">Northern Lodges</span>
                  </>
                ) : (
                  <>
                    Power Mountain Trips with{' '}
                    <span className="text-[#F97316]">Your 4x4 Fleet</span>
                  </>
                )}
              </h1>
              <p className="text-base text-slate-600 leading-relaxed max-w-2xl">
                {isGuide
                  ? 'Post custom regional tour packages, respond to incoming traveller trip requests, accept confirmed departures, and manage your public guide profile.'
                  : isHotel
                  ? 'Publish room inventory, confirm guest stay requests directly, and message arriving travellers.'
                  : 'List Prado 4x4s, Jeeps, and tour vans with or without drivers, and accept rental requests in real time.'}
              </p>

              <div className="flex flex-wrap items-center gap-3 pt-2">
                {isGuide ? (
                  <>
                    <button
                      type="button"
                      onClick={() => openGuideSection('packages')}
                      className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full bg-[#0B5ED7] text-white font-bold text-sm hover:bg-[#0842A0] transition-colors cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Post a Tour Package</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => openGuideSection('requests')}
                      className="inline-flex items-center gap-2 px-6 py-3.5 rounded-full border border-slate-300 bg-white text-slate-800 font-semibold text-sm hover:border-[#0B5ED7] hover:text-[#0B5ED7] transition-colors cursor-pointer"
                    >
                      <span>Review Trip Requests ({myGuideRequests.length})</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onNavigate('hotels')}
                      className="inline-flex items-center gap-2 px-5 py-3.5 rounded-full border border-slate-300 bg-white text-slate-700 font-semibold text-sm hover:border-[#0B5ED7] hover:text-[#0B5ED7] transition-colors cursor-pointer"
                    >
                      <Building2 className="w-4 h-4 text-[#0B5ED7]" />
                      <span>Book Hotels</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => onNavigate('vehicles')}
                      className="inline-flex items-center gap-2 px-5 py-3.5 rounded-full border border-slate-300 bg-white text-slate-700 font-semibold text-sm hover:border-[#0B5ED7] hover:text-[#0B5ED7] transition-colors cursor-pointer"
                    >
                      <Car className="w-4 h-4 text-[#0B5ED7]" />
                      <span>Rent Vehicles</span>
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={() => onNavigate('dashboard')}
                    className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full bg-[#0B5ED7] text-white font-bold text-sm hover:bg-[#0842A0] transition-colors cursor-pointer"
                  >
                    <span>Open {isHotel ? 'Hotel' : 'Fleet'} Workspace</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Quick Workspace Summary Cards */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 relative z-10 space-y-10">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <button
              type="button"
              onClick={() => openGuideSection(isGuide ? 'packages' : isHotel ? 'hotels' : 'vehicles')}
              className="text-left rounded-2xl bg-white border border-slate-200 shadow-sm p-5 hover:border-[#0B5ED7] transition-colors cursor-pointer"
            >
              <span className="text-xs font-medium text-slate-500">
                {isGuide ? 'My Tour Packages' : isHotel ? 'My Properties' : 'My Fleet Vehicles'}
              </span>
              <p className="text-3xl font-extrabold font-mono-num text-[#0B5ED7] mt-1">
                {isGuide
                  ? myGuidePackages.length
                  : isHotel
                  ? hotels.filter((h) => h.ownerUid === uid).length
                  : vehicles.filter((v) => v.ownerUid === uid).length}
              </p>
              <span className="text-xs font-semibold text-[#0B5ED7] inline-flex items-center gap-1 mt-2">
                {isGuide ? 'Post or Manage' : 'Manage Listings'} <ArrowRight className="w-3 h-3" />
              </span>
            </button>

            <button
              type="button"
              onClick={() =>
                openGuideSection(isGuide ? 'requests' : isHotel ? 'reservations' : 'requests')
              }
              className="text-left rounded-2xl bg-white border border-slate-200 shadow-sm p-5 hover:border-[#0B5ED7] transition-colors cursor-pointer"
            >
              <span className="text-xs font-medium text-slate-500">
                {isGuide ? 'Incoming Trip Requests' : 'Pending Bookings'}
              </span>
              <p className="text-3xl font-extrabold font-mono-num text-[#F97316] mt-1">
                {isGuide ? myGuideRequests.length : myProviderBookings.length}
              </p>
              <span className="text-xs font-semibold text-slate-700 inline-flex items-center gap-1 mt-2">
                Accept or Quote <ArrowRight className="w-3 h-3" />
              </span>
            </button>

            <button
              type="button"
              onClick={() => openGuideSection(isGuide ? 'bookings' : isHotel ? 'reservations' : 'requests')}
              className="text-left rounded-2xl bg-white border border-slate-200 shadow-sm p-5 hover:border-[#0B5ED7] transition-colors cursor-pointer"
            >
              <span className="text-xs font-medium text-slate-500">Confirmed Bookings</span>
              <p className="text-3xl font-extrabold font-mono-num text-slate-900 mt-1">
                {myProviderBookings.length}
              </p>
              <span className="text-xs font-semibold text-slate-700 inline-flex items-center gap-1 mt-2">
                View Schedule <ArrowRight className="w-3 h-3" />
              </span>
            </button>

            <button
              type="button"
              onClick={() => openGuideSection(isGuide ? 'verification' : 'messages')}
              className="text-left rounded-2xl bg-white border border-slate-200 shadow-sm p-5 hover:border-[#0B5ED7] transition-colors cursor-pointer"
            >
              <span className="text-xs font-medium text-slate-500">
                {isGuide ? 'CNIC Badge Status' : 'Direct Messages'}
              </span>
              <p className="text-lg font-extrabold text-slate-900 mt-2 uppercase">
                {isGuide ? (myGuide?.verificationStatus || 'Not Submitted').replace('_', ' ') : 'Inbox'}
              </p>
              <span className="text-xs font-semibold text-[#0B5ED7] inline-flex items-center gap-1 mt-2">
                {isGuide ? 'Open Verification' : 'Check Messages'} <ArrowRight className="w-3 h-3" />
              </span>
            </button>
          </div>

          {/* Public Marketplace Preview */}
          <div className="rounded-2xl bg-white border border-slate-200 shadow-xs p-6 sm:p-8 space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold font-display text-slate-900">
                  Live Packages Marketplace
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Packages you post appear right alongside Pakistan’s top northern itineraries.
                </p>
              </div>
              <button
                type="button"
                onClick={() => onNavigate('packages')}
                className="text-xs font-bold text-[#0B5ED7] hover:underline cursor-pointer"
              >
                Browse All Packages &rarr;
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {publishedPackages.map((pkg) => (
                <div
                  key={pkg.id}
                  className="rounded-2xl bg-slate-50 border border-slate-200 overflow-hidden flex flex-col"
                >
                  <div className="aspect-[16/10] relative">
                    <ResilientImage
                      src={pkg.imageUrl}
                      alt={pkg.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="p-4 space-y-2 flex-1 flex flex-col justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">{pkg.title}</h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {pkg.destination} · {pkg.days}D/{pkg.nights}N · By {pkg.guideName}
                      </p>
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t border-slate-200">
                      <span className="text-sm font-extrabold font-mono-num text-[#0B5ED7]">
                        {formatPkr(pkg.pricePerPersonPkr)}
                      </span>
                      <button
                        type="button"
                        onClick={() => onNavigate('packages', { id: pkg.id })}
                        className="text-xs font-bold text-slate-800 hover:text-[#0B5ED7] cursor-pointer"
                      >
                        Inspect &rarr;
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    );
  }

  // Standard Guest / Traveller Home Matching Reference Design
  return (
    <div className="bg-[#F8FAFC] text-slate-900">
      {/* 1. TRAVELORA-INSPIRED BRIGHT HERO SECTION */}
      <section className="relative overflow-hidden bg-gradient-to-b from-blue-50 to-[#F8FAFC]">
        <div className="absolute inset-0">
          <ResilientImage
            src={HERO_IMAGE}
            alt="Northern Pakistan mountain lake backdrop"
            className="w-full h-full object-cover object-center"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-white/95 via-white/80 to-white/20" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#F8FAFC] via-transparent to-white/40" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-14 pb-28 lg:pt-20 lg:pb-32">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-7 space-y-6">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold font-display tracking-tight text-slate-900 leading-[1.08]">
                Explore Pakistan
                <br />
                Create <span className="text-[#F97316]">Memories</span>
              </h1>
              <p className="text-base sm:text-lg text-slate-600 max-w-xl leading-relaxed">
                Discover Hunza, Skardu, Swat, and Naran with CNIC-verified tour guides, curated
                packages, mountain lodges, and 4x4 rentals — all in one place.
              </p>

              <div className="flex flex-wrap items-center gap-3.5 pt-1">
                <button
                  type="button"
                  onClick={() => onNavigate('destinations')}
                  className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full bg-[#0B5ED7] text-white font-bold text-sm hover:bg-[#0842A0] shadow-md shadow-blue-600/20 transition-colors cursor-pointer"
                >
                  <span>Explore Destinations</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => onNavigate('packages')}
                  className="inline-flex items-center gap-2 px-6 py-3.5 rounded-full bg-white border border-slate-200 text-slate-800 font-semibold text-sm hover:border-[#0B5ED7] hover:text-[#0B5ED7] shadow-xs transition-colors cursor-pointer"
                >
                  <span>View Packages</span>
                </button>
              </div>

              {/* Social proof avatar row matching theme */}
              <div className="flex items-center gap-3 pt-2">
                <div className="flex -space-x-2.5">
                  {HERO_AVATARS.map((src, idx) => (
                    <div
                      key={idx}
                      className="w-9 h-9 rounded-full border-2 border-white overflow-hidden shadow-xs"
                    >
                      <ResilientImage
                        src={src}
                        alt="TravelMate explorer"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ))}
                </div>
                <p className="text-xs font-medium text-slate-600">
                  Trusted by <strong className="text-slate-900">25,000+</strong> Pakistan
                  travelers
                </p>
              </div>
            </div>

            {/* Right Floating Highlight Card matching theme layout */}
            <div className="lg:col-span-5 hidden lg:flex justify-end items-end self-end">
              <div className="rounded-2xl bg-white/95 backdrop-blur-md border border-slate-200 shadow-xl p-5 max-w-xs space-y-2">
                <p className="text-xs font-bold text-[#F97316] uppercase tracking-wider">
                  Seasonal Highlight
                </p>
                <p className="text-2xl font-extrabold font-display text-[#0B5ED7]">
                  Hunza &amp; Skardu
                </p>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Verified local guides, boutique mountain hotels &amp; 4x4 Prados with zero hidden
                  online fees.
                </p>
                <button
                  type="button"
                  onClick={() => onNavigate('trip-planner')}
                  className="text-xs font-bold text-[#0B5ED7] hover:underline inline-flex items-center gap-1 pt-1 cursor-pointer"
                >
                  <span>Plan Custom Trip</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. OVERLAPPING WHITE MULTI-TAB SEARCH CARD */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 -mt-14 relative z-20">
        <div className="rounded-2xl bg-white border border-slate-200 p-4 sm:p-6 shadow-xl">
          <div className="flex flex-wrap items-center gap-4 sm:gap-6 border-b border-slate-100 pb-3.5 mb-4">
            {(
              [
                { id: 'destinations', label: 'Destinations', icon: MapPin },
                { id: 'guides', label: 'Tour Guides', icon: Compass },
                { id: 'hotels', label: 'Hotels', icon: Building2 },
                { id: 'vehicles', label: '4x4 Vehicles', icon: Car },
                { id: 'packages', label: 'Packages', icon: BadgeCheck },
              ] as const
            ).map((tab) => {
              const Icon = tab.icon;
              const active = searchCategory === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setSearchCategory(tab.id)}
                  className={`relative pb-1.5 inline-flex items-center gap-2 text-xs sm:text-sm font-semibold whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                    active ? 'text-[#0B5ED7]' : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${active ? 'text-[#0B5ED7]' : 'text-slate-400'}`} />
                  <span>{tab.label}</span>
                  {active && (
                    <span className="absolute left-0 right-0 -bottom-3.5 h-0.5 bg-[#0B5ED7] rounded-full" />
                  )}
                </button>
              );
            })}
          </div>

          <form
            onSubmit={handleSearchSubmit}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 items-end"
          >
            <div className="lg:col-span-2">
              <label className="block text-[11px] font-semibold text-slate-500 mb-1">From</label>
              <input
                type="text"
                value={fromCity}
                onChange={(e) => setFromCity(e.target.value)}
                placeholder="From city"
                className="w-full rounded-xl bg-slate-50 border border-slate-200 px-3 py-2.5 text-sm font-medium text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#0B5ED7]"
              />
            </div>

            <div className="lg:col-span-4">
              <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                Destination / Keyword
              </label>
              <div className="relative">
                <Search className="w-4 h-4 text-[#0B5ED7] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={
                    searchCategory === 'destinations'
                      ? 'Hunza, Skardu, Fairy Meadows...'
                      : searchCategory === 'guides'
                      ? 'Search guides by valley or language...'
                      : searchCategory === 'hotels'
                      ? 'Search mountain lodges...'
                      : searchCategory === 'vehicles'
                      ? 'Prado 4x4, Hiace, Skardu...'
                      : 'Search guided packages...'
                  }
                  className="w-full rounded-xl bg-slate-50 border border-slate-200 pl-9 pr-3 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#0B5ED7]"
                />
              </div>
            </div>

            <div className="lg:col-span-2">
              <label className="block text-[11px] font-semibold text-slate-500 mb-1">Date</label>
              <div className="relative">
                <Calendar className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="date"
                  value={travelDate}
                  onChange={(e) => setTravelDate(e.target.value)}
                  className="w-full rounded-xl bg-slate-50 border border-slate-200 pl-8 pr-2.5 py-2.5 text-xs font-medium text-slate-900 focus:outline-none focus:border-[#0B5ED7]"
                />
              </div>
            </div>

            <div className="lg:col-span-2">
              <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                Travelers
              </label>
              <div className="relative">
                <Users className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="number"
                  min={1}
                  max={30}
                  value={guestCount}
                  onChange={(e) => setGuestCount(e.target.value)}
                  placeholder="Guests"
                  className="w-full rounded-xl bg-slate-50 border border-slate-200 pl-8 pr-3 py-2.5 text-sm font-mono-num text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#0B5ED7]"
                />
              </div>
            </div>

            <div className="lg:col-span-2">
              <button
                type="submit"
                className="w-full py-2.5 px-5 rounded-xl bg-[#0B5ED7] text-white font-bold text-sm hover:bg-[#0842A0] transition-colors shadow-sm cursor-pointer"
              >
                Search Now
              </button>
            </div>
          </form>
        </div>
      </section>

      {/* 3. POPULAR DESTINATIONS ROW */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-14 pb-10 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div className="space-y-2">
            <h2 className="text-2xl sm:text-3xl font-extrabold font-display text-slate-900">
              Popular Destinations
            </h2>
            <div className="flex flex-wrap items-center gap-1.5">
              {REGION_TABS.map((region) => (
                <button
                  key={region}
                  type="button"
                  onClick={() => setActiveRegion(region)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    activeRegion === region
                      ? 'bg-[#0B5ED7] text-white'
                      : 'bg-white text-slate-600 border border-slate-200 hover:border-slate-300'
                  }`}
                >
                  {region}
                </button>
              ))}
            </div>
          </div>

          <button
            type="button"
            onClick={() => onNavigate('destinations')}
            className="text-xs sm:text-sm font-bold text-[#0B5ED7] hover:underline whitespace-nowrap cursor-pointer"
          >
            View All Destinations &rarr;
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {filteredDestinations.map((dest) => (
            <button
              key={dest.id}
              type="button"
              onClick={() => onNavigate('destinations', { id: dest.id })}
              className="group relative aspect-[4/5] rounded-2xl overflow-hidden shadow-sm border border-slate-200 text-left cursor-pointer"
            >
              <ResilientImage
                src={dest.imageUrl}
                alt={dest.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-900/20 to-transparent" />
              <div className="absolute bottom-4 left-4 right-4 space-y-1">
                <p className="text-base font-bold font-display text-white">{dest.name}</p>
                <p className="text-xs text-slate-200 font-mono-num">
                  Starting from {formatPkr(dest.estimatedBudgetPkr)}
                </p>
                <div className="flex items-center gap-1 text-xs font-bold text-[#F59E0B] pt-0.5">
                  <Star className="w-3.5 h-3.5 fill-[#F59E0B]" />
                  <span>4.9</span>
                </div>
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* 4. TOP DEALS THIS WEEK + PACKAGES SHOWCASE (Reference Match) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
          {/* Cobalt Promo Banner Card */}
          <div className="lg:col-span-4 rounded-2xl bg-gradient-to-br from-[#0B5ED7] via-[#0A53C1] to-[#0842A0] text-white p-7 flex flex-col justify-between shadow-md">
            <div className="space-y-3">
              <p className="text-xs font-bold uppercase tracking-wider text-blue-100">
                Seasonal Expeditions
              </p>
              <h2 className="text-3xl font-extrabold font-display leading-tight">
                Top Deals
                <br />
                This Week
              </h2>
              <p className="text-sm text-blue-100 leading-relaxed">
                Handpicked guided packages posted directly by local tour guides across Hunza,
                Skardu, and Swat.
              </p>
            </div>
            <div className="pt-6">
              <button
                type="button"
                onClick={() => onNavigate('packages')}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-white text-[#0B5ED7] font-bold text-xs hover:bg-blue-50 transition-colors cursor-pointer"
              >
                <span>Grab Deals</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* 3 Tour Package Cards */}
          <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-3 gap-5">
            {publishedPackages.map((pkg) => (
              <div
                key={pkg.id}
                className="rounded-2xl bg-white border border-slate-200 shadow-xs overflow-hidden flex flex-col hover:shadow-md transition-shadow"
              >
                <div className="aspect-[16/11] relative">
                  <ResilientImage
                    src={pkg.imageUrl}
                    alt={pkg.title}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                  <div>
                    <h3 className="text-sm font-bold font-display text-slate-900 line-clamp-1">
                      {pkg.title}
                    </h3>
                    <p className="text-xs text-slate-500 mt-1">
                      {pkg.days} Days / {pkg.nights} Nights · {pkg.destination}
                    </p>
                  </div>
                  <div className="space-y-2 pt-2 border-t border-slate-100">
                    <p className="text-base font-extrabold font-mono-num text-[#0B5ED7]">
                      {formatPkr(pkg.pricePerPersonPkr)}
                      <span className="text-[11px] font-normal text-slate-500"> / person</span>
                    </p>
                    <button
                      type="button"
                      onClick={() => onNavigate('packages', { id: pkg.id })}
                      className="text-xs font-bold text-slate-800 hover:text-[#0B5ED7] inline-flex items-center gap-1 cursor-pointer"
                    >
                      <span>View Details</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. FIVE-ITEM TRUST STRIP */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {[
            {
              icon: BadgeCheck,
              title: 'CNIC Verified Guides',
              sub: 'Identity checked',
              color: 'bg-amber-50 text-[#F59E0B]',
            },
            {
              icon: Headphones,
              title: '24/7 Local Support',
              sub: 'We are here',
              color: 'bg-emerald-50 text-emerald-600',
            },
            {
              icon: ShieldCheck,
              title: 'Zero Hidden Fees',
              sub: 'Direct provider quotes',
              color: 'bg-rose-50 text-rose-600',
            },
            {
              icon: Compass,
              title: 'Custom Itineraries',
              sub: 'Flexible planning',
              color: 'bg-blue-50 text-[#0B5ED7]',
            },
            {
              icon: Building2,
              title: 'Handpicked Hotels',
              sub: 'Top rated stays',
              color: 'bg-violet-50 text-violet-600',
            },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.title}
                className="rounded-2xl bg-white border border-slate-200 p-4 flex items-center gap-3 shadow-xs"
              >
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${item.color}`}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-slate-900 truncate">{item.title}</p>
                  <p className="text-[11px] text-slate-500 truncate">{item.sub}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 6. HOTELS & 4x4 VEHICLES COMPACT SHOWCASE */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
        <div>
          <div className="flex items-end justify-between gap-4 mb-6">
            <div>
              <h2 className="text-2xl font-extrabold font-display text-slate-900">
                Handpicked Mountain Hotels
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Book lodges directly with flexible room options — no guide package required.
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('hotels')}
              className="text-xs font-bold text-[#0B5ED7] hover:underline whitespace-nowrap cursor-pointer"
            >
              All Hotels &rarr;
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {verifiedHotels.map((hotel) => (
              <div
                key={hotel.id}
                className="rounded-2xl bg-white border border-slate-200 shadow-xs overflow-hidden flex flex-col"
              >
                <div className="aspect-[16/10]">
                  <ResilientImage
                    src={hotel.imageUrl}
                    alt={hotel.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="text-sm font-bold text-slate-900">{hotel.name}</h3>
                      <span className="text-xs font-mono-num font-bold text-[#F59E0B]">
                        ★ {(hotel.ratingAvg || 4.8).toFixed(1)}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">{hotel.destination}</p>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                    <span className="text-sm font-extrabold font-mono-num text-[#0B5ED7]">
                      {formatPkr(hotel.startingPricePkr)}
                      <span className="text-[11px] font-normal text-slate-500">/night</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => onNavigate('hotels', { id: hotel.id })}
                      className="px-4 py-1.5 rounded-full bg-[#0B5ED7] text-white text-xs font-bold hover:bg-[#0842A0] cursor-pointer"
                    >
                      Book Stay
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <div className="flex items-end justify-between gap-4 mb-6">
            <div>
              <h2 className="text-2xl font-extrabold font-display text-slate-900">
                4x4 &amp; Touring Vehicles
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Prado 4x4s, Land Cruisers, and vans — choose With Driver or Self-Drive.
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('vehicles')}
              className="text-xs font-bold text-[#0B5ED7] hover:underline whitespace-nowrap cursor-pointer"
            >
              Browse Fleet &rarr;
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {verifiedVehicles.map((veh) => (
              <div
                key={veh.id}
                className="rounded-2xl bg-white border border-slate-200 shadow-xs overflow-hidden flex flex-col"
              >
                <div className="aspect-[16/10]">
                  <ResilientImage
                    src={veh.imageUrl}
                    alt={veh.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">{veh.name}</h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {veh.category} · {veh.seats} seats · {veh.pickupLocation}
                    </p>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                    <span className="text-sm font-extrabold font-mono-num text-[#0B5ED7]">
                      {formatPkr(veh.pricePerDayPkr)}
                      <span className="text-[11px] font-normal text-slate-500">/day</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => onNavigate('vehicles', { id: veh.id })}
                      className="px-4 py-1.5 rounded-full bg-[#0B5ED7] text-white text-xs font-bold hover:bg-[#0842A0] cursor-pointer"
                    >
                      Calculate &amp; Rent
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 7. WHAT OUR TRAVELERS SAY + NEWSLETTER CARD */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-16">
        <div className="flex items-center justify-between gap-4 mb-6">
          <h2 className="text-2xl sm:text-3xl font-extrabold font-display text-slate-900">
            What Our Travelers Say
          </h2>
          {!firebaseUser && (
            <button
              type="button"
              onClick={() =>
                openAuthModal('signup', { redirectToDashboard: true, defaultRole: 'guide' })
              }
              className="text-xs font-bold text-[#0B5ED7] hover:underline cursor-pointer"
            >
              Join as Tour Guide or Partner &rarr;
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
          <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-3 gap-4">
            {reviews.slice(0, 3).map((rev) => (
              <div
                key={rev.id}
                className="rounded-2xl bg-white border border-slate-200 shadow-xs p-5 flex flex-col justify-between space-y-4"
              >
                <div className="space-y-2.5">
                  <Quote className="w-5 h-5 text-[#0B5ED7]/40" />
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                    “{rev.comment}”
                  </p>
                </div>
                <div className="pt-3 border-t border-slate-100">
                  <p className="text-xs font-bold text-slate-900">{rev.authorName}</p>
                  <div className="flex items-center gap-0.5 text-[#F59E0B] mt-1">
                    {Array.from({ length: rev.rating }).map((_, idx) => (
                      <Star key={idx} className="w-3.5 h-3.5 fill-[#F59E0B]" />
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Cobalt Newsletter CTA Card */}
          <div className="lg:col-span-4 rounded-2xl bg-gradient-to-br from-[#0B5ED7] to-[#0842A0] text-white p-6 flex flex-col justify-between shadow-md">
            <div className="space-y-2">
              <h3 className="text-xl font-extrabold font-display leading-snug">
                Get Exclusive Offers &amp; Trail Alerts
              </h3>
              <p className="text-xs text-blue-100 leading-relaxed">
                Receive Khunjerab Pass opening updates, Deosai road status, and verified seasonal
                tour deals.
              </p>
            </div>

            <form onSubmit={handleNewsletter} className="space-y-2.5 pt-5">
              <div className="flex gap-2">
                <input
                  type="email"
                  required
                  value={newsletterEmail}
                  onChange={(e) => setNewsletterEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="flex-1 min-w-0 rounded-xl bg-white px-3.5 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none"
                />
                <button
                  type="submit"
                  className="px-4 py-2.5 rounded-xl bg-[#F97316] text-white font-bold text-xs hover:bg-orange-600 transition-colors cursor-pointer shrink-0"
                >
                  Join
                </button>
              </div>
              {newsletterDone && (
                <p className="text-xs text-blue-100 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                  <span>Subscribed to Pakistan travel alerts.</span>
                </p>
              )}
            </form>
          </div>
        </div>
      </section>
    </div>
  );
}
