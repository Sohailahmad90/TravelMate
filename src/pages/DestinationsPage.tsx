import { useMemo, useState } from 'react';
import {
  ArrowLeft,
  BadgeCheck,
  Bookmark,
  Calendar,
  Compass,
  MapPin,
  Mountain,
  Search,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useMarketplace } from '../context/MarketplaceContext';
import {
  ActivePage,
  Destination,
  DestinationRegion,
  formatPkr,
} from '../types/travelmate';
import { ResilientImage } from '../components/ResilientImage';

interface DestinationsPageProps {
  initialQuery?: string;
  initialSelectedId?: string;
  onNavigate: (page: ActivePage, extra?: { id?: string; query?: string }) => void;
}

const REGIONS: ('All' | DestinationRegion)[] = [
  'All',
  'Gilgit-Baltistan',
  'Swat & Kaghan',
  'High Passes',
  'Lakes & Meadows',
];

export function DestinationsPage({
  initialQuery = '',
  initialSelectedId,
  onNavigate,
}: DestinationsPageProps) {
  const {
    firebaseUser,
    profile,
    effectiveRole,
    setDashboardTargetTab,
    toggleSavedDestination,
    openAuthModal,
  } = useAuth();
  const { destinations, guides, hotels, packages } = useMarketplace();

  const [query, setQuery] = useState(initialQuery);
  const [region, setRegion] = useState<'All' | DestinationRegion>('All');
  const [selectedId, setSelectedId] = useState<string | null>(initialSelectedId || null);

  const selected: Destination | null = useMemo(
    () => destinations.find((d) => d.id === selectedId) || null,
    [destinations, selectedId]
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return destinations.filter((d) => {
      const matchesRegion = region === 'All' || d.region === region;
      const matchesQuery =
        !q ||
        d.name.toLowerCase().includes(q) ||
        d.description.toLowerCase().includes(q) ||
        (d.province || '').toLowerCase().includes(q);
      return matchesRegion && matchesQuery;
    });
  }, [destinations, region, query]);

  if (selected) {
    const isSaved = Boolean(profile?.savedDestinationIds?.includes(selected.id));
    const nearbyHotels = hotels.filter(
      (h) =>
        h.verificationStatus === 'verified' &&
        (h.destination.toLowerCase().includes(selected.name.split(' ')[0].toLowerCase()) ||
          selected.name.toLowerCase().includes(h.destination.split(' ')[0].toLowerCase()))
    );
    const availableGuides = guides.filter(
      (g) =>
        g.verificationStatus === 'verified' &&
        (g.availableDestinations || []).some((dest) =>
          dest.toLowerCase().includes(selected.name.split(' ')[0].toLowerCase())
        )
    );
    const relatedPackages = packages.filter(
      (p) =>
        p.isPublished &&
        p.destination.toLowerCase().includes(selected.name.split(' ')[0].toLowerCase())
    );

    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
        <div className="flex items-center justify-between gap-4">
          <button
            type="button"
            onClick={() => setSelectedId(null)}
            className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-[#0B5ED7] cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to All Destinations</span>
          </button>

          <button
            type="button"
            onClick={() =>
              firebaseUser ? void toggleSavedDestination(selected.id) : openAuthModal('signin')
            }
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold border transition-colors cursor-pointer ${
              isSaved
                ? 'bg-[#0B5ED7] text-white border-[#0B5ED7]'
                : 'bg-white border-slate-300 text-slate-700 hover:border-[#0B5ED7]'
            }`}
          >
            <Bookmark className="w-3.5 h-3.5" />
            <span>{isSaved ? 'Saved Destination' : 'Save Destination'}</span>
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          <div className="lg:col-span-7 rounded-2xl border border-slate-200 shadow-sm overflow-hidden aspect-[16/10] lg:aspect-auto lg:h-full">
            <ResilientImage
              src={selected.imageUrl}
              alt={selected.name}
              className="w-full h-full object-cover"
            />
          </div>

          <div className="lg:col-span-5 rounded-2xl bg-white border border-slate-200 shadow-xs p-6 sm:p-8 flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <p className="text-xs text-[#0B5ED7] font-bold uppercase tracking-wide">
                {selected.region} · {selected.province || 'Pakistan'}
              </p>
              <h1 className="text-3xl font-extrabold font-display text-slate-900">{selected.name}</h1>
              <p className="text-sm text-slate-600 leading-relaxed">{selected.description}</p>

              <div className="grid grid-cols-2 gap-4 pt-3 border-t border-slate-100 text-xs">
                <div>
                  <span className="text-slate-400 block">Best Time to Visit</span>
                  <span className="text-slate-900 font-semibold inline-flex items-center gap-1.5 mt-1">
                    <Calendar className="w-3.5 h-3.5 text-[#0B5ED7]" />
                    {selected.bestTimeToVisit}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block">Estimated Trip Budget</span>
                  <span className="text-[#0B5ED7] font-bold font-mono-num mt-1 block">
                    {formatPkr(selected.estimatedBudgetPkr)}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block">Elevation</span>
                  <span className="text-slate-900 font-mono-num font-semibold mt-1 block">
                    {selected.elevationMeters ? `${selected.elevationMeters} m` : 'Alpine Valley'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block">Coordinates</span>
                  <span className="text-slate-900 font-mono-num font-semibold mt-1 block">
                    {selected.latitude?.toFixed(2)}°N, {selected.longitude?.toFixed(2)}°E
                  </span>
                </div>
              </div>

              {(selected.highlights || []).length > 0 && (
                <div className="pt-3 border-t border-slate-100">
                  <span className="text-xs text-slate-400 block mb-1.5">Key Highlights</span>
                  <p className="text-xs font-medium text-slate-700">
                    {(selected.highlights || []).join(' · ')}
                  </p>
                </div>
              )}
            </div>

            <div className="flex flex-wrap gap-3 pt-2">
              {firebaseUser && effectiveRole === 'guide' ? (
                <button
                  type="button"
                  onClick={() => {
                    setDashboardTargetTab('packages');
                    onNavigate('dashboard');
                  }}
                  className="flex-1 px-5 py-2.5 rounded-full bg-[#0B5ED7] text-white text-xs font-bold hover:bg-[#0842A0] transition-colors cursor-pointer"
                >
                  Post Package for {selected.name}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => onNavigate('trip-planner')}
                  className="flex-1 px-5 py-2.5 rounded-full bg-[#0B5ED7] text-white text-xs font-bold hover:bg-[#0842A0] transition-colors cursor-pointer"
                >
                  Plan Trip Here
                </button>
              )}
              <button
                type="button"
                onClick={() => onNavigate('vehicles', { query: selected.name.split(' ')[0] })}
                className="flex-1 px-5 py-2.5 rounded-full border border-slate-300 bg-white text-slate-800 text-xs font-semibold hover:border-[#0B5ED7] hover:text-[#0B5ED7] transition-colors cursor-pointer"
              >
                Rent a 4x4 Vehicle
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="rounded-2xl bg-white border border-slate-200 shadow-xs p-6 space-y-4">
            <h2 className="text-lg font-bold font-display text-slate-900 flex items-center gap-2">
              <Compass className="w-5 h-5 text-[#0B5ED7]" />
              <span>Available Verified Guides ({availableGuides.length})</span>
            </h2>
            {availableGuides.length === 0 ? (
              <p className="text-xs text-slate-500">
                Any verified northern guide can quote this route via the Custom Trip Planner.
              </p>
            ) : (
              <div className="space-y-3">
                {availableGuides.map((g) => (
                  <div
                    key={g.guideId}
                    className="flex items-center justify-between gap-3 border-b border-slate-100 pb-3 last:border-none last:pb-0"
                  >
                    <div>
                      <p className="text-sm font-semibold text-slate-900 flex items-center gap-1">
                        {g.displayName}
                        <BadgeCheck className="w-3.5 h-3.5 text-[#0B5ED7]" />
                      </p>
                      <p className="text-xs text-slate-500">
                        {formatPkr(g.startingPricePkr)}/day · {g.experienceYears} yrs
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => onNavigate('guides', { id: g.guideId })}
                      className="text-xs font-bold text-[#0B5ED7] hover:underline cursor-pointer"
                    >
                      View
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-2xl bg-white border border-slate-200 shadow-xs p-6 space-y-4">
            <h2 className="text-lg font-bold font-display text-slate-900 flex items-center gap-2">
              <Mountain className="w-5 h-5 text-[#0B5ED7]" />
              <span>Nearby Hotels ({nearbyHotels.length})</span>
            </h2>
            {nearbyHotels.length === 0 ? (
              <p className="text-xs text-slate-500">
                Browse all verified hotels for regional accommodations nearby.
              </p>
            ) : (
              <div className="space-y-3">
                {nearbyHotels.map((h) => (
                  <div
                    key={h.id}
                    className="flex items-center justify-between gap-3 border-b border-slate-100 pb-3 last:border-none last:pb-0"
                  >
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{h.name}</p>
                      <p className="text-xs text-slate-500">
                        From {formatPkr(h.startingPricePkr)}/night
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => onNavigate('hotels', { id: h.id })}
                      className="text-xs font-bold text-[#0B5ED7] hover:underline cursor-pointer"
                    >
                      Book
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-2xl bg-white border border-slate-200 shadow-xs p-6 space-y-4">
            <h2 className="text-lg font-bold font-display text-slate-900">
              Related Tour Packages ({relatedPackages.length})
            </h2>
            {relatedPackages.length === 0 ? (
              <p className="text-xs text-slate-500">
                Create a custom plan to receive tailor-made quotations for {selected.name}.
              </p>
            ) : (
              <div className="space-y-3">
                {relatedPackages.map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between gap-3 border-b border-slate-100 pb-3 last:border-none last:pb-0"
                  >
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{p.title}</p>
                      <p className="text-xs text-slate-500">
                        {p.days}D/{p.nights}N · {formatPkr(p.pricePerPersonPkr)}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => onNavigate('packages', { id: p.id })}
                      className="text-xs font-bold text-[#0B5ED7] hover:underline cursor-pointer"
                    >
                      Inspect
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-3xl sm:text-4xl font-extrabold font-display text-slate-900">
            Explore <span className="text-[#0B5ED7]">Pakistan Destinations</span>
          </h1>
          <p className="text-sm text-slate-600 mt-2 max-w-2xl">
            Discover valleys, high mountain passes, and emerald lakes across Gilgit-Baltistan and
            Khyber Pakhtunkhwa with real estimated budgets and nearby verified providers.
          </p>
        </div>

        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-[#0B5ED7] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Filter valleys or provinces..."
            className="w-full rounded-xl bg-white border border-slate-200 pl-10 pr-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#0B5ED7]"
          />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {REGIONS.map((r) => (
          <button
            key={r}
            type="button"
            onClick={() => setRegion(r)}
            className={`px-4 py-2 rounded-full text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              region === r
                ? 'bg-[#0B5ED7] text-white shadow-xs'
                : 'bg-white text-slate-600 border border-slate-200 hover:text-slate-900'
            }`}
          >
            {r}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-2xl bg-white border border-slate-200 p-12 text-center space-y-3">
          <p className="text-base font-semibold text-slate-900">No destinations match your filter.</p>
          <button
            type="button"
            onClick={() => {
              setQuery('');
              setRegion('All');
            }}
            className="px-5 py-2 rounded-full bg-[#0B5ED7] text-white text-xs font-bold cursor-pointer"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {filtered.map((dest) => (
            <div
              key={dest.id}
              onClick={() => setSelectedId(dest.id)}
              className="group rounded-2xl bg-white border border-slate-200 shadow-xs overflow-hidden cursor-pointer hover:border-[#0B5ED7] hover:shadow-md transition-all flex flex-col"
            >
              <div className="aspect-[4/3] relative overflow-hidden">
                <ResilientImage
                  src={dest.imageUrl}
                  alt={dest.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent" />
                <div className="absolute bottom-3 left-3.5 right-3.5 flex items-center gap-1.5 text-white">
                  <MapPin className="w-3.5 h-3.5 text-[#F97316] shrink-0" />
                  <span className="text-sm font-bold font-display truncate">{dest.name}</span>
                </div>
              </div>
              <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                <p className="text-xs text-slate-600 line-clamp-2">{dest.tagline || dest.description}</p>
                <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-100">
                  <span className="text-slate-500">{dest.bestTimeToVisit}</span>
                  <span className="font-mono-num font-bold text-[#0B5ED7]">
                    ~{formatPkr(dest.estimatedBudgetPkr)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
