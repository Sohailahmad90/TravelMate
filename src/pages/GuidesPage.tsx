import React, { useMemo, useState } from 'react';
import {
  ArrowLeft,
  BadgeCheck,
  Bookmark,
  MessageSquare,
  Play,
  Search,
  Send,
  Star,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useMarketplace } from '../context/MarketplaceContext';
import { ActivePage, formatPkr, GuideProfile } from '../types/travelmate';
import { ResilientImage } from '../components/ResilientImage';

interface GuidesPageProps {
  initialQuery?: string;
  initialSelectedId?: string;
  onNavigate: (page: ActivePage, extra?: { id?: string; query?: string }) => void;
}

export function GuidesPage({
  initialQuery = '',
  initialSelectedId,
  onNavigate,
}: GuidesPageProps) {
  const {
    firebaseUser,
    profile,
    effectiveRole,
    setDashboardTargetTab,
    toggleSavedGuide,
    openAuthModal,
  } = useAuth();
  const {
    guides,
    guideVideos,
    packages,
    reviews,
    sendGuideRequest,
    sendMessage,
  } = useMarketplace();

  const [query, setQuery] = useState(initialQuery);
  const [languageFilter, setLanguageFilter] = useState('All');
  const [maxBudget, setMaxBudget] = useState<number>(20000);
  const [minExp, setMinExp] = useState<number>(0);
  const [selectedId, setSelectedId] = useState<string | null>(initialSelectedId || null);
  const [activeVideoUrl, setActiveVideoUrl] = useState<string | null>(null);

  // Custom Trip Request inline modal/form state
  const [tripTitle, setTripTitle] = useState('');
  const [destinationsText, setDestinationsText] = useState('Hunza Valley, Skardu');
  const [departureDate, setDepartureDate] = useState('2026-06-15');
  const [returnDate, setReturnDate] = useState('2026-06-22');
  const [travelersCount, setTravelersCount] = useState(4);
  const [budgetPkr, setBudgetPkr] = useState(180000);
  const [notes, setNotes] = useState('');
  const [reqFeedback, setReqFeedback] = useState<string | null>(null);
  const [sendingReq, setSendingReq] = useState(false);

  // Quick message state
  const [msgText, setMsgText] = useState('');
  const [msgFeedback, setMsgFeedback] = useState<string | null>(null);

  const orderedGuides = useMemo(() => {
    return [...guides].sort((a, b) => {
      const aV = a.verificationStatus === 'verified' ? 1 : 0;
      const bV = b.verificationStatus === 'verified' ? 1 : 0;
      return bV - aV;
    });
  }, [guides]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return orderedGuides.filter((g) => {
      const matchesQ =
        !q ||
        g.displayName.toLowerCase().includes(q) ||
        g.bio.toLowerCase().includes(q) ||
        (g.availableDestinations || []).some((d) => d.toLowerCase().includes(q));
      const matchesLang =
        languageFilter === 'All' || (g.languages || []).includes(languageFilter);
      const matchesBudget = g.startingPricePkr <= maxBudget;
      const matchesExp = g.experienceYears >= minExp;
      return matchesQ && matchesLang && matchesBudget && matchesExp;
    });
  }, [orderedGuides, query, languageFilter, maxBudget, minExp]);

  const selected: GuideProfile | null = useMemo(
    () => guides.find((g) => g.guideId === selectedId) || null,
    [guides, selectedId]
  );

  const handleSendCustomRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selected) return;
    if (!firebaseUser) {
      openAuthModal('signin');
      return;
    }
    setSendingReq(true);
    setReqFeedback(null);
    try {
      await sendGuideRequest({
        guide: selected,
        tripTitle: tripTitle.trim() || `Custom Trip with ${selected.displayName}`,
        startingLocation: 'Islamabad',
        destinations: destinationsText
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
        departureDate,
        returnDate,
        travelersCount,
        budgetPkr,
        preferredTransport: '4x4 Prado / SUV',
        hotelRequirement: 'Boutique 3-Star / Mountain Lodge',
        notes,
      });
      setReqFeedback(
        `Request sent to ${selected.displayName}. Track acceptance & quotations in your Dashboard.`
      );
      setTripTitle('');
      setNotes('');
    } catch (err) {
      setReqFeedback(err instanceof Error ? err.message : 'Unable to submit request.');
    } finally {
      setSendingReq(false);
    }
  };

  const handleQuickMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selected || !msgText.trim()) return;
    if (!firebaseUser) {
      openAuthModal('signin');
      return;
    }
    if (selected.ownerUid === firebaseUser.uid) {
      setMsgFeedback('You cannot send a message to yourself.');
      return;
    }
    try {
      await sendMessage({
        recipientUid: selected.ownerUid,
        recipientName: selected.displayName,
        relatedListingTitle: `Tour Guide · ${selected.displayName}`,
        text: msgText.trim(),
      });
      setMsgText('');
      setMsgFeedback('Message delivered. View thread in Dashboard -> Messages.');
    } catch (err) {
      setMsgFeedback(err instanceof Error ? err.message : 'Failed to send message.');
    }
  };

  const inputClass =
    'w-full rounded-xl bg-slate-50 border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-[#0B5ED7] focus:bg-white';

  if (selected) {
    const isSaved = Boolean(profile?.savedGuideIds?.includes(selected.guideId));
    const videos = guideVideos.filter((v) => v.guideId === selected.guideId);
    const guidePackages = packages.filter(
      (p) => p.guideId === selected.guideId && p.isPublished
    );
    const guideReviews = reviews.filter(
      (r) => r.targetType === 'guide' && r.targetId === selected.guideId
    );

    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
        <div className="flex items-center justify-between gap-4">
          <button
            type="button"
            onClick={() => {
              setSelectedId(null);
              setActiveVideoUrl(null);
            }}
            className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-[#0B5ED7] cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Tour Guides</span>
          </button>

          <button
            type="button"
            onClick={() =>
              firebaseUser ? void toggleSavedGuide(selected.guideId) : openAuthModal('signin')
            }
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold border cursor-pointer ${
              isSaved
                ? 'bg-[#0B5ED7] text-white border-[#0B5ED7]'
                : 'bg-white border-slate-300 text-slate-700 hover:border-[#0B5ED7]'
            }`}
          >
            <Bookmark className="w-3.5 h-3.5" />
            <span>{isSaved ? 'Saved Guide' : 'Save Guide'}</span>
          </button>
        </div>

        {/* Profile Header (Public data ONLY — CNIC strictly hidden) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8 space-y-8">
            <div className="rounded-2xl bg-white border border-slate-200 shadow-xs p-6 sm:p-8 flex flex-col sm:flex-row gap-6">
              <div className="w-32 h-32 rounded-2xl border border-slate-200 overflow-hidden shrink-0">
                <ResilientImage
                  src={selected.avatarUrl}
                  alt={selected.displayName}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="space-y-3 flex-1">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h1 className="text-2xl sm:text-3xl font-extrabold font-display text-slate-900 flex items-center gap-2">
                    <span>{selected.displayName}</span>
                    {selected.verificationStatus === 'verified' && (
                      <BadgeCheck className="w-6 h-6 text-[#0B5ED7]" />
                    )}
                  </h1>
                  <span className="text-sm font-mono-num font-bold text-[#0B5ED7]">
                    {formatPkr(selected.startingPricePkr)}/day
                  </span>
                </div>
                <p className="text-xs text-slate-500">
                  {selected.verificationStatus === 'verified'
                    ? 'Identity & CNIC Verified by TravelMate'
                    : 'Local Tour Guide'}
                  {' · '}
                  {selected.experienceYears} Years Experience
                  {' · '}
                  {selected.completedToursCount || 0} Completed Tours
                  {' · '}
                  ★ {(selected.ratingAvg || 4.9).toFixed(1)} ({selected.reviewCount || 0} reviews)
                </p>
                <p className="text-sm text-slate-700 leading-relaxed">{selected.bio}</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs text-slate-600">
                  <div>
                    <span className="text-slate-400 block">Languages</span>
                    <span className="font-medium text-slate-800">
                      {(selected.languages || []).join(' · ')}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Regions Covered</span>
                    <span className="font-medium text-slate-800">
                      {(selected.availableDestinations || []).join(' · ')}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Previous Tour Videos */}
            <div className="rounded-2xl bg-white border border-slate-200 shadow-xs p-6 space-y-5">
              <h2 className="text-xl font-bold font-display text-slate-900">
                Previous Tour Videos ({videos.length})
              </h2>
              {activeVideoUrl && (
                <div className="rounded-xl overflow-hidden bg-black border border-slate-200">
                  <video
                    src={activeVideoUrl}
                    controls
                    autoPlay
                    className="w-full max-h-[360px]"
                  />
                </div>
              )}
              {videos.length === 0 ? (
                <p className="text-sm text-slate-500">
                  No previous tour videos uploaded yet by this guide.
                </p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {videos.map((v) => (
                    <div
                      key={v.id}
                      className="rounded-xl bg-slate-50 border border-slate-200 overflow-hidden"
                    >
                      <div className="aspect-video relative">
                        <ResilientImage
                          src={v.thumbnailUrl}
                          alt={v.title}
                          className="w-full h-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => setActiveVideoUrl(v.videoUrl)}
                          className="absolute inset-0 bg-slate-900/35 flex items-center justify-center hover:bg-slate-900/20 transition-colors cursor-pointer"
                        >
                          <div className="w-12 h-12 rounded-full bg-[#0B5ED7] text-white flex items-center justify-center shadow-lg">
                            <Play className="w-5 h-5 ml-0.5" />
                          </div>
                        </button>
                      </div>
                      <div className="p-3.5 space-y-1">
                        <p className="text-sm font-semibold text-slate-900">{v.title}</p>
                        <p className="text-xs text-slate-500">
                          {v.destination} · {v.tourDate}
                        </p>
                        {v.description && (
                          <p className="text-xs text-slate-600 line-clamp-2">{v.description}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Guide's Published Packages */}
            <div className="rounded-2xl bg-white border border-slate-200 shadow-xs p-6 space-y-4">
              <h2 className="text-xl font-bold font-display text-slate-900">
                Packages by {selected.displayName} ({guidePackages.length})
              </h2>
              {guidePackages.length === 0 ? (
                <p className="text-sm text-slate-500">
                  No published packages yet. Send a custom travel plan request using the form.
                </p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {guidePackages.map((p) => (
                    <div
                      key={p.id}
                      className="rounded-xl bg-slate-50 border border-slate-200 p-4 flex flex-col justify-between space-y-3"
                    >
                      <div>
                        <p className="text-sm font-bold text-slate-900">{p.title}</p>
                        <p className="text-xs text-slate-500 mt-1">
                          {p.destination} · {p.days}D/{p.nights}N
                        </p>
                      </div>
                      <div className="flex items-center justify-between pt-2 border-t border-slate-200">
                        <span className="text-xs font-mono-num font-bold text-[#0B5ED7]">
                          {formatPkr(p.pricePerPersonPkr)}/person
                        </span>
                        <button
                          type="button"
                          onClick={() => onNavigate('packages', { id: p.id })}
                          className="text-xs font-bold text-slate-800 hover:text-[#0B5ED7] cursor-pointer"
                        >
                          View Package &rarr;
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Guide Reviews */}
            <div className="rounded-2xl bg-white border border-slate-200 shadow-xs p-6 space-y-4">
              <h2 className="text-xl font-bold font-display text-slate-900">
                Customer Reviews ({guideReviews.length})
              </h2>
              {guideReviews.length === 0 ? (
                <p className="text-sm text-slate-500">No verified reviews yet.</p>
              ) : (
                <div className="space-y-4">
                  {guideReviews.map((r) => (
                    <div
                      key={r.id}
                      className="border-b border-slate-100 pb-4 last:border-none last:pb-0 space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold text-slate-900">{r.authorName}</span>
                        <span className="inline-flex items-center gap-1 text-xs font-mono-num font-bold text-[#F59E0B]">
                          <Star className="w-3.5 h-3.5 fill-[#F59E0B]" />
                          {r.rating}.0
                        </span>
                      </div>
                      <p className="text-sm text-slate-600">{r.comment}</p>
                      {r.providerReply && (
                        <p className="text-xs text-slate-500 pl-3 border-l-2 border-[#0B5ED7]/40">
                          Reply from {selected.displayName}: {r.providerReply}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Send Custom Trip Request / Guide Role Notice + Direct Message */}
          <div className="lg:col-span-4 space-y-6">
            {firebaseUser && effectiveRole === 'guide' ? (
              <div className="rounded-2xl bg-white border border-slate-200 shadow-xs p-6 space-y-4">
                {selected.ownerUid === firebaseUser.uid ? (
                  <>
                    <h3 className="text-lg font-bold font-display text-slate-900">
                      Your Public Guide Profile
                    </h3>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      This is how travellers view your profile, tour videos, and packages. Manage
                      your listings and respond to requests in your Guide Studio.
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setDashboardTargetTab('packages');
                        onNavigate('dashboard');
                      }}
                      className="w-full py-2.5 rounded-full bg-[#0B5ED7] text-white text-xs font-bold hover:bg-[#0842A0] transition-colors cursor-pointer"
                    >
                      Manage Packages &amp; Profile
                    </button>
                  </>
                ) : (
                  <>
                    <h3 className="text-lg font-bold font-display text-slate-900">
                      Tour Guide Account
                    </h3>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Tour Guide accounts cannot submit tourist trip requests to other guides. You
                      can post your own packages or book hotels and 4x4 vehicles directly.
                    </p>
                    <div className="space-y-2">
                      <button
                        type="button"
                        onClick={() => {
                          setDashboardTargetTab('packages');
                          onNavigate('dashboard');
                        }}
                        className="w-full py-2.5 rounded-full bg-[#0B5ED7] text-white text-xs font-bold hover:bg-[#0842A0] transition-colors cursor-pointer"
                      >
                        Open Guide Studio
                      </button>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => onNavigate('hotels')}
                          className="py-2 rounded-full border border-slate-300 bg-white text-xs font-semibold text-slate-800 hover:border-[#0B5ED7] hover:text-[#0B5ED7] cursor-pointer"
                        >
                          Book Hotels
                        </button>
                        <button
                          type="button"
                          onClick={() => onNavigate('vehicles')}
                          className="py-2 rounded-full border border-slate-300 bg-white text-xs font-semibold text-slate-800 hover:border-[#0B5ED7] hover:text-[#0B5ED7] cursor-pointer"
                        >
                          Rent Vehicles
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <form
                onSubmit={handleSendCustomRequest}
                className="rounded-2xl bg-white border border-slate-200 shadow-xs p-6 space-y-4"
              >
                <h3 className="text-lg font-bold font-display text-slate-900">
                  Send Custom Trip Request
                </h3>
                <p className="text-xs text-slate-500">
                  Share your route and budget. {selected.displayName} will respond or accept your
                  trip plan directly.
                </p>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Trip Title</label>
                  <input
                    type="text"
                    required
                    value={tripTitle}
                    onChange={(e) => setTripTitle(e.target.value)}
                    placeholder="e.g., Family Trip to Hunza & Skardu"
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Destinations (comma separated)
                  </label>
                  <input
                    type="text"
                    required
                    value={destinationsText}
                    onChange={(e) => setDestinationsText(e.target.value)}
                    className={inputClass}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Departure
                    </label>
                    <input
                      type="date"
                      required
                      value={departureDate}
                      onChange={(e) => setDepartureDate(e.target.value)}
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Return</label>
                    <input
                      type="date"
                      required
                      value={returnDate}
                      onChange={(e) => setReturnDate(e.target.value)}
                      className={inputClass}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Travellers
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={50}
                      value={travelersCount}
                      onChange={(e) => setTravelersCount(Number(e.target.value))}
                      className={`${inputClass} font-mono-num`}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Total Budget (PKR)
                    </label>
                    <input
                      type="number"
                      min={5000}
                      step={5000}
                      value={budgetPkr}
                      onChange={(e) => setBudgetPkr(Number(e.target.value))}
                      className={`${inputClass} font-mono-num`}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Special Instructions
                  </label>
                  <textarea
                    rows={3}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Preferred hotels, child-friendly pace, photography stops..."
                    className={inputClass}
                  />
                </div>

                {reqFeedback && (
                  <p className="text-xs font-medium text-[#0B5ED7] bg-blue-50 border border-blue-200 rounded-xl p-3">
                    {reqFeedback}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={sendingReq}
                  className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-full bg-[#0B5ED7] text-white text-sm font-bold hover:bg-[#0842A0] transition-colors cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                  <span>{sendingReq ? 'Sending...' : 'Send Trip Plan to Guide'}</span>
                </button>
              </form>
            )}

            {/* Quick Message Guide */}
            {selected.ownerUid !== firebaseUser?.uid && (
              <form
                onSubmit={handleQuickMessage}
                className="rounded-2xl bg-white border border-slate-200 shadow-xs p-6 space-y-3"
              >
                <h3 className="text-base font-bold font-display text-slate-900 flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-[#0B5ED7]" />
                  <span>Message {selected.displayName}</span>
                </h3>
                <textarea
                  rows={2}
                  value={msgText}
                  onChange={(e) => setMsgText(e.target.value)}
                  placeholder="Ask about road conditions, availability, or itinerary options..."
                  className={inputClass}
                />
                {msgFeedback && (
                  <div className="text-xs font-medium text-emerald-700 space-y-1">
                    <p>{msgFeedback}</p>
                    <button
                      type="button"
                      onClick={() => {
                        setDashboardTargetTab('messages');
                        onNavigate('dashboard');
                      }}
                      className="underline font-bold text-[#0B5ED7] cursor-pointer"
                    >
                      Open Messages Inbox &rarr;
                    </button>
                  </div>
                )}
                <button
                  type="submit"
                  className="w-full py-2.5 rounded-full border border-slate-300 bg-white text-xs font-semibold text-slate-800 hover:border-[#0B5ED7] hover:text-[#0B5ED7] transition-colors cursor-pointer"
                >
                  Send Direct Message
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-3xl sm:text-4xl font-extrabold font-display text-slate-900">
            Tour <span className="text-[#0B5ED7]">Guides</span>
          </h1>
          <p className="text-sm text-slate-600 mt-2 max-w-2xl">
            Browse local northern experts across Hunza, Skardu, Swat &amp; Naran. Watch past tour
            videos and send custom itineraries directly.
          </p>
        </div>

        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-[#0B5ED7] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name or valley..."
            className="w-full rounded-xl bg-white border border-slate-200 pl-10 pr-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#0B5ED7]"
          />
        </div>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 rounded-2xl bg-white border border-slate-200 shadow-xs p-4">
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">Language</label>
          <select
            value={languageFilter}
            onChange={(e) => setLanguageFilter(e.target.value)}
            className={inputClass}
          >
            <option value="All">All Languages</option>
            <option value="Urdu">Urdu</option>
            <option value="English">English</option>
            <option value="Burushaski">Burushaski</option>
            <option value="Balti">Balti</option>
            <option value="Shina">Shina</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">
            Max Daily Fee ({formatPkr(maxBudget)})
          </label>
          <input
            type="range"
            min={5000}
            max={25000}
            step={500}
            value={maxBudget}
            onChange={(e) => setMaxBudget(Number(e.target.value))}
            className="w-full accent-[#0B5ED7] mt-2"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">
            Minimum Experience
          </label>
          <select
            value={minExp}
            onChange={(e) => setMinExp(Number(e.target.value))}
            className={inputClass}
          >
            <option value={0}>Any Experience</option>
            <option value={5}>5+ Years</option>
            <option value={8}>8+ Years</option>
            <option value={10}>10+ Years</option>
          </select>
        </div>
      </div>

      {/* Guide Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {filtered.map((guide) => {
          const videoCount = guideVideos.filter((v) => v.guideId === guide.guideId).length;
          return (
            <div
              key={guide.guideId}
              className="rounded-2xl bg-white border border-slate-200 shadow-xs overflow-hidden flex flex-col hover:shadow-md transition-shadow"
            >
              <div className="aspect-[16/10] relative">
                <ResilientImage
                  src={guide.avatarUrl}
                  alt={guide.displayName}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <h2 className="text-lg font-bold font-display text-slate-900 flex items-center gap-1.5">
                      <span>{guide.displayName}</span>
                      {guide.verificationStatus === 'verified' && (
                        <BadgeCheck className="w-4 h-4 text-[#0B5ED7] shrink-0" />
                      )}
                    </h2>
                    <span className="text-xs font-mono-num font-bold text-[#F59E0B]">
                      ★ {(guide.ratingAvg || 4.9).toFixed(1)}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">
                    {guide.experienceYears} yrs · {videoCount} tour video(s) ·{' '}
                    {(guide.languages || []).join(' / ')}
                  </p>
                  <p className="text-xs text-slate-600 line-clamp-2">{guide.bio}</p>
                  <p className="text-xs text-slate-500">
                    Valleys: {(guide.availableDestinations || []).join(', ')}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                  <div>
                    <span className="text-[11px] text-slate-400 block">Daily Rate</span>
                    <span className="text-sm font-extrabold font-mono-num text-[#0B5ED7]">
                      {formatPkr(guide.startingPricePkr)}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedId(guide.guideId)}
                    className="px-4 py-2 rounded-full bg-[#0B5ED7] text-white text-xs font-bold hover:bg-[#0842A0] transition-colors cursor-pointer"
                  >
                    Profile &amp; Request
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
