import React, { useMemo, useState } from 'react';
import {
  BadgeCheck,
  Calendar,
  Check,
  CheckCircle2,
  Compass,
  Home,
  Info,
  MapPin,
  MessageSquare,
  Plus,
  Send,
  ShieldAlert,
  Trash2,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useMarketplace } from '../context/MarketplaceContext';
import {
  ActivePage,
  calculateDaysBetween,
  formatPkr,
  GuideProfile,
} from '../types/travelmate';

interface TripPlannerPageProps {
  onNavigate: (page: ActivePage) => void;
}

const ACTIVITY_OPTIONS = [
  'Cultural Forts & Heritage',
  'Glacier & Alpine Trekking',
  'Boating & Lake Sightseeing',
  '4x4 Deosai / Mountain Safari',
  'Bonfire & Stargazing',
  'Photography Expedition',
];

export function TripPlannerPage({ onNavigate }: TripPlannerPageProps) {
  const { firebaseUser, effectiveRole, setDashboardTargetTab, openAuthModal } = useAuth();
  const {
    destinations,
    guides,
    packages,
    createTravelPlan,
    sendGuideRequest,
    setMessagingTarget,
  } = useMarketplace();

  const [title, setTitle] = useState('');
  const [startingLocation, setStartingLocation] = useState('');
  const [selectedDestinations, setSelectedDestinations] = useState<string[]>([]);
  const [departureDate, setDepartureDate] = useState('');
  const [returnDate, setReturnDate] = useState('');
  const [travelersCount, setTravelersCount] = useState('');
  const [budgetPkr, setBudgetPkr] = useState('');
  const [preferredTransport, setPreferredTransport] = useState('');
  const [hotelRequirement, setHotelRequirement] = useState('');
  const [activities, setActivities] = useState<string[]>([]);
  const [customActivity, setCustomActivity] = useState('');
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [selectedGuideIds, setSelectedGuideIds] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Success confirmation modal shown when tourist sends trip plan to guide(s)
  const [sentSuccessModal, setSentSuccessModal] = useState<{
    tripTitle: string;
    destinations: string[];
    guides: GuideProfile[];
    selectedMessageGuideId: string;
  } | null>(null);

  const availableGuides = useMemo(
    () =>
      [...guides].sort((a, b) => {
        const av = a.verificationStatus === 'verified' ? 1 : 0;
        const bv = b.verificationStatus === 'verified' ? 1 : 0;
        return bv - av;
      }),
    [guides]
  );

  const parsedTravelers = Math.max(1, Number(travelersCount) || 1);
  const tripDays = useMemo(
    () => (departureDate && returnDate ? calculateDaysBetween(departureDate, returnDate) : 0),
    [departureDate, returnDate]
  );

  // Estimate trip expenses dynamically using affordable marketplace rates
  const estimatedCostPkr = useMemo(() => {
    if (selectedDestinations.length === 0 || tripDays === 0) return 0;
    const avgPkgPerDay =
      packages.length > 0
        ? packages.reduce((acc, p) => acc + p.pricePerPersonPkr / Math.max(1, p.days), 0) /
          packages.length
        : 3500;
    const hotelMultiplier = hotelRequirement.includes('Luxury')
      ? 1.25
      : hotelRequirement.includes('Deluxe')
      ? 1.1
      : 0.95;
    const transportDaily = preferredTransport.includes('4x4')
      ? 6500
      : preferredTransport.includes('Hiace')
      ? 5800
      : preferredTransport
      ? 3500
      : 4000;
    const destSurcharge = selectedDestinations.length * 1500 * parsedTravelers;
    return Math.round(
      avgPkgPerDay * tripDays * parsedTravelers * hotelMultiplier +
        transportDaily * tripDays +
        destSurcharge * 0.25
    );
  }, [
    packages,
    tripDays,
    parsedTravelers,
    hotelRequirement,
    preferredTransport,
    selectedDestinations,
  ]);

  const toggleDest = (name: string) => {
    setSelectedDestinations((prev) =>
      prev.includes(name) ? prev.filter((d) => d !== name) : [...prev, name]
    );
  };

  const toggleActivity = (act: string) => {
    setActivities((prev) =>
      prev.includes(act) ? prev.filter((a) => a !== act) : [...prev, act]
    );
  };

  const addCustomActivity = () => {
    const clean = customActivity.trim();
    if (!clean || activities.includes(clean)) return;
    setActivities((prev) => [...prev, clean]);
    setCustomActivity('');
  };

  const toggleGuide = (guideId: string) => {
    setSelectedGuideIds((prev) =>
      prev.includes(guideId) ? prev.filter((id) => id !== guideId) : [...prev, guideId]
    );
  };

  const handleSaveAndSend = async (sendToGuides: boolean) => {
    if (!firebaseUser) {
      openAuthModal('signin');
      return;
    }
    setFeedback(null);
    setErrorMsg(null);

    const cleanTitle = title.trim();
    const cleanStart = startingLocation.trim();
    const numTravelers = Number(travelersCount);
    const numBudget = Number(budgetPkr);

    if (cleanTitle.length < 3) {
      setErrorMsg('Please enter a trip title (at least 3 characters).');
      return;
    }
    if (!cleanStart) {
      setErrorMsg('Please select a starting location.');
      return;
    }
    if (selectedDestinations.length === 0) {
      setErrorMsg('Please select at least one destination.');
      return;
    }
    if (!departureDate || !returnDate) {
      setErrorMsg('Please select both departure and return dates.');
      return;
    }
    if (!numTravelers || numTravelers < 1) {
      setErrorMsg('Please enter the number of travellers.');
      return;
    }
    if (!budgetPkr || Number.isNaN(numBudget) || numBudget < 1000) {
      setErrorMsg('Please enter your target budget in PKR.');
      return;
    }
    if (sendToGuides && selectedGuideIds.length === 0) {
      setErrorMsg('Select at least one tour guide below to send your plan.');
      return;
    }

    setSubmitting(true);
    try {
      const plan = await createTravelPlan({
        title: cleanTitle,
        startingLocation: cleanStart,
        destinations: selectedDestinations,
        departureDate,
        returnDate,
        travelersCount: numTravelers,
        budgetPkr: numBudget,
        preferredTransport: preferredTransport || 'Flexible',
        hotelRequirement: hotelRequirement || 'Standard',
        activities,
        specialInstructions,
        estimatedCostPkr,
        status: sendToGuides ? 'sent' : 'draft',
      });

      if (sendToGuides) {
        const sentGuides: GuideProfile[] = [];
        for (const gId of selectedGuideIds) {
          const guide = availableGuides.find((g) => g.guideId === gId);
          if (guide) {
            await sendGuideRequest({
              planId: plan.id,
              guide,
              tripTitle: plan.title,
              startingLocation: cleanStart,
              destinations: selectedDestinations,
              departureDate,
              returnDate,
              travelersCount: numTravelers,
              budgetPkr: numBudget,
              preferredTransport: preferredTransport || 'Flexible',
              hotelRequirement: hotelRequirement || 'Standard',
              notes: `${activities.join(', ')}${specialInstructions ? `. ${specialInstructions}` : ''}`.trim(),
            });
            sentGuides.push(guide);
          }
        }
        if (sentGuides.length > 0) {
          setSentSuccessModal({
            tripTitle: plan.title,
            destinations: selectedDestinations,
            guides: sentGuides,
            selectedMessageGuideId: sentGuides[0].guideId,
          });
        }
      } else {
        setFeedback('Travel plan saved to your Traveller Dashboard!');
      }
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Unable to save travel plan.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleMessageGuideFromModal = () => {
    if (!sentSuccessModal) return;
    const guide =
      sentSuccessModal.guides.find((g) => g.guideId === sentSuccessModal.selectedMessageGuideId) ||
      sentSuccessModal.guides[0];
    if (guide) {
      setMessagingTarget({
        recipientUid: guide.ownerUid,
        recipientName: guide.displayName,
        relatedListingTitle: sentSuccessModal.tripTitle,
      });
    }
    setSentSuccessModal(null);
    setDashboardTargetTab('messages');
    onNavigate('dashboard');
  };

  const handleViewPlanFromModal = () => {
    setSentSuccessModal(null);
    setDashboardTargetTab('plans');
    onNavigate('dashboard');
  };

  const handleBackHomeFromModal = () => {
    setSentSuccessModal(null);
    onNavigate('home');
  };

  const inputClass =
    'w-full rounded-xl bg-slate-50 border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#0B5ED7] focus:bg-white';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10">
      <div className="max-w-3xl space-y-2">
        <h1 className="text-3xl sm:text-4xl font-extrabold font-display text-slate-900">
          Custom <span className="text-[#0B5ED7]">Trip Planner</span>
        </h1>
        <p className="text-sm text-slate-600 leading-relaxed">
          Design your multi-destination itinerary across northern Pakistan, calculate a dynamic
          cost estimate, save your plan, and send it to local guides for confirmation and custom
          quotations.
        </p>
      </div>

      {firebaseUser &&
      effectiveRole &&
      ['guide', 'hotel_owner', 'vehicle_owner'].includes(effectiveRole) ? (
        <div className="rounded-2xl bg-white border border-slate-200 shadow-xs p-8 max-w-2xl space-y-5">
          <div className="flex items-start gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-amber-50 text-[#F97316] flex items-center justify-center shrink-0">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div className="space-y-1.5">
              <h2 className="text-xl font-bold font-display text-slate-900">
                Tourist Feature Only
              </h2>
              <p className="text-sm text-slate-600 leading-relaxed">
                {effectiveRole === 'guide'
                  ? 'You are signed in as a Tour Guide. Tour Guides cannot generate or submit tourist travel plans, though you can post your own tour packages, respond to incoming requests, book hotels, and rent 4x4 vehicles.'
                  : 'Custom travel plan submissions are exclusive to Traveller / Tourist accounts. Manage your listings and guest reservations from your partner workspace.'}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3 pt-2">
            <button
              type="button"
              onClick={() => {
                setDashboardTargetTab(effectiveRole === 'guide' ? 'packages' : 'messages');
                onNavigate('dashboard');
              }}
              className="px-5 py-2.5 rounded-full bg-[#0B5ED7] text-white text-xs font-bold hover:bg-[#0842A0] transition-colors cursor-pointer"
            >
              Open Workspace
            </button>
            {effectiveRole === 'guide' && (
              <>
                <button
                  type="button"
                  onClick={() => onNavigate('hotels')}
                  className="px-5 py-2.5 rounded-full border border-slate-300 bg-white text-slate-800 text-xs font-semibold hover:border-[#0B5ED7] hover:text-[#0B5ED7] transition-colors cursor-pointer"
                >
                  Book Hotels
                </button>
                <button
                  type="button"
                  onClick={() => onNavigate('vehicles')}
                  className="px-5 py-2.5 rounded-full border border-slate-300 bg-white text-slate-800 text-xs font-semibold hover:border-[#0B5ED7] hover:text-[#0B5ED7] transition-colors cursor-pointer"
                >
                  Rent 4x4 Vehicles
                </button>
              </>
            )}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Main Planner Form */}
          <div className="lg:col-span-8 space-y-6">
            <div className="rounded-2xl bg-white border border-slate-200 shadow-xs p-6 sm:p-8 space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Trip Title
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g., Northern Pakistan Family Trip"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Starting Location
                  </label>
                  <select
                    value={startingLocation}
                    onChange={(e) => setStartingLocation(e.target.value)}
                    className={inputClass}
                  >
                    <option value="">Select starting city...</option>
                    <option value="Islamabad">Islamabad</option>
                    <option value="Lahore">Lahore</option>
                    <option value="Karachi">Karachi</option>
                    <option value="Peshawar">Peshawar</option>
                    <option value="Gilgit">Gilgit</option>
                    <option value="Skardu">Skardu</option>
                  </select>
                </div>
              </div>

              {/* Multiple Destinations */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-2">
                  Select Destinations ({selectedDestinations.length} selected)
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {destinations.map((dest) => {
                    const active = selectedDestinations.includes(dest.name);
                    return (
                      <button
                        key={dest.id}
                        type="button"
                        onClick={() => toggleDest(dest.name)}
                        className={`px-3 py-2.5 rounded-xl border text-left text-xs font-semibold flex items-center justify-between gap-2 transition-colors cursor-pointer ${
                          active
                            ? 'bg-[#0B5ED7] text-white border-[#0B5ED7]'
                            : 'bg-slate-50 text-slate-700 border-slate-200 hover:border-[#0B5ED7]/50'
                        }`}
                      >
                        <span className="truncate">{dest.name}</span>
                        {active ? (
                          <Check className="w-3.5 h-3.5 shrink-0" />
                        ) : (
                          <MapPin className="w-3.5 h-3.5 shrink-0 opacity-60" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Dates & Travellers & Budget */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Departure Date
                  </label>
                  <input
                    type="date"
                    value={departureDate}
                    onChange={(e) => setDepartureDate(e.target.value)}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Return Date
                  </label>
                  <input
                    type="date"
                    value={returnDate}
                    onChange={(e) => setReturnDate(e.target.value)}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Travellers
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={50}
                    value={travelersCount}
                    onChange={(e) => setTravelersCount(e.target.value)}
                    placeholder="e.g., 4"
                    className={`${inputClass} font-mono-num`}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Budget (PKR)
                  </label>
                  <input
                    type="number"
                    min={1000}
                    step={1000}
                    value={budgetPkr}
                    onChange={(e) => setBudgetPkr(e.target.value)}
                    placeholder="e.g., 60000"
                    className={`${inputClass} font-mono-num`}
                  />
                </div>
              </div>

              {/* Transport & Hotel Requirements */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Preferred Transport
                  </label>
                  <select
                    value={preferredTransport}
                    onChange={(e) => setPreferredTransport(e.target.value)}
                    className={inputClass}
                  >
                    <option value="">Select transport option...</option>
                    <option value="4x4 Prado / Land Cruiser">4x4 Prado / Land Cruiser</option>
                    <option value="Toyota Hiace Grand Cabin">Toyota Hiace Grand Cabin</option>
                    <option value="Sedan Car (Highway Routes)">Sedan Car (Highway Routes)</option>
                    <option value="Flight + Local 4x4 Jeep">Flight + Local 4x4 Jeep</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Hotel Requirement
                  </label>
                  <select
                    value={hotelRequirement}
                    onChange={(e) => setHotelRequirement(e.target.value)}
                    className={inputClass}
                  >
                    <option value="">Select stay preference...</option>
                    <option value="Standard Family Rooms">Standard Family Rooms</option>
                    <option value="Deluxe Mountain Lodge">Deluxe Mountain Lodge</option>
                    <option value="Luxury Resort & Suites">Luxury Resort &amp; Suites</option>
                    <option value="Alpine Cabins & Glamping">Alpine Cabins &amp; Glamping</option>
                  </select>
                </div>
              </div>

              {/* Daily Activities */}
              <div className="space-y-3">
                <label className="block text-xs font-semibold text-slate-700">
                  Planned Activities (Optional)
                </label>
                <div className="flex flex-wrap gap-2">
                  {ACTIVITY_OPTIONS.map((act) => {
                    const active = activities.includes(act);
                    return (
                      <button
                        key={act}
                        type="button"
                        onClick={() => toggleActivity(act)}
                        className={`px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-colors cursor-pointer ${
                          active
                            ? 'bg-blue-50 border-[#0B5ED7] text-[#0B5ED7]'
                            : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-300'
                        }`}
                      >
                        {act}
                      </button>
                    );
                  })}
                  {activities
                    .filter((a) => !ACTIVITY_OPTIONS.includes(a))
                    .map((custom) => (
                      <button
                        key={custom}
                        type="button"
                        onClick={() => toggleActivity(custom)}
                        className="px-3.5 py-1.5 rounded-full text-xs font-semibold border bg-blue-50 border-[#0B5ED7] text-[#0B5ED7] inline-flex items-center gap-1.5 cursor-pointer"
                      >
                        <span>{custom}</span>
                        <Trash2 className="w-3 h-3" />
                      </button>
                    ))}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={customActivity}
                    onChange={(e) => setCustomActivity(e.target.value)}
                    placeholder="Add custom activity (e.g., Cherry Blossom Walk)..."
                    className="flex-1 rounded-xl bg-slate-50 border border-slate-200 px-3.5 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#0B5ED7] focus:bg-white"
                  />
                  <button
                    type="button"
                    onClick={addCustomActivity}
                    className="px-4 py-2 rounded-xl border border-slate-300 bg-white text-xs font-semibold text-slate-800 hover:border-[#0B5ED7] hover:text-[#0B5ED7] inline-flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Special Instructions (Optional)
                </label>
                <textarea
                  rows={2}
                  value={specialInstructions}
                  onChange={(e) => setSpecialInstructions(e.target.value)}
                  placeholder="Mention elders/kids traveling, meal requests, or flexible dates..."
                  className={inputClass}
                />
              </div>
            </div>

            {/* Select Guides to Send Plan */}
            <div className="rounded-2xl bg-white border border-slate-200 shadow-xs p-6 sm:p-8 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold font-display text-slate-900 flex items-center gap-2">
                  <Compass className="w-5 h-5 text-[#0B5ED7]" />
                  <span>Send Plan to Selected Tour Guides</span>
                </h2>
                <span className="text-xs font-semibold text-[#0B5ED7]">
                  {selectedGuideIds.length} selected
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {availableGuides.map((g) => {
                  const picked = selectedGuideIds.includes(g.guideId);
                  return (
                    <button
                      key={g.guideId}
                      type="button"
                      onClick={() => toggleGuide(g.guideId)}
                      className={`p-4 rounded-xl border text-left transition-colors cursor-pointer ${
                        picked
                          ? 'bg-blue-50 border-[#0B5ED7] shadow-xs'
                          : 'bg-slate-50 border-slate-200 hover:border-[#0B5ED7]/50'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                          {g.displayName}
                          {g.verificationStatus === 'verified' && (
                            <BadgeCheck className="w-4 h-4 text-[#0B5ED7]" />
                          )}
                        </span>
                        <span className="text-xs font-mono-num font-bold text-[#0B5ED7]">
                          {formatPkr(g.startingPricePkr)}/day
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-1">
                        {(g.availableDestinations || []).slice(0, 3).join(' · ')}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Sticky Estimate & Submit Sidebar */}
          <div className="lg:col-span-4">
            <div className="rounded-2xl bg-white border border-slate-200 shadow-sm p-6 space-y-5 sticky top-24">
              <h2 className="text-lg font-bold font-display text-slate-900">
                Trip Estimate Summary
              </h2>

              <div className="space-y-2.5 text-sm border-y border-slate-100 py-4">
                <div className="flex justify-between">
                  <span className="text-slate-500">Duration</span>
                  <span className="font-mono-num font-semibold text-slate-900 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-[#0B5ED7]" />
                    {tripDays > 0 ? `${tripDays} Days` : '—'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Travellers</span>
                  <span className="font-mono-num font-semibold text-slate-900">
                    {travelersCount ? travelersCount : '—'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Destinations</span>
                  <span className="font-mono-num font-semibold text-slate-900">
                    {selectedDestinations.length}
                  </span>
                </div>
                <div className="flex justify-between pt-2 border-t border-slate-100">
                  <span className="text-slate-700 font-semibold">Estimated Expense</span>
                  <span className="text-xl font-extrabold font-mono-num text-[#0B5ED7]">
                    {estimatedCostPkr > 0 ? formatPkr(estimatedCostPkr) : '—'}
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-2.5 rounded-xl bg-blue-50 border border-blue-100 p-3.5 text-xs text-slate-700">
                <Info className="w-4 h-4 text-[#0B5ED7] shrink-0 mt-0.5" />
                <span>
                  Estimated cost adjusts automatically based on your route, duration, and traveller
                  count. Guides reply with exact quotes.
                </span>
              </div>

              {errorMsg && (
                <p className="text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-xl p-3">
                  {errorMsg}
                </p>
              )}

              {feedback && (
                <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-3.5 text-xs text-emerald-800 space-y-2">
                  <p>{feedback}</p>
                  <button
                    type="button"
                    onClick={() => {
                      setDashboardTargetTab('plans');
                      onNavigate('dashboard');
                    }}
                    className="underline font-bold text-[#0B5ED7] cursor-pointer"
                  >
                    View Saved Plans &rarr;
                  </button>
                </div>
              )}

              <div className="space-y-2.5">
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => void handleSaveAndSend(true)}
                  className="w-full inline-flex items-center justify-center gap-2 py-3 rounded-full bg-[#0B5ED7] text-white font-bold text-sm hover:bg-[#0842A0] transition-colors cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                  <span>{submitting ? 'Sending...' : 'Save & Send to Selected Guides'}</span>
                </button>
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => void handleSaveAndSend(false)}
                  className="w-full py-2.5 rounded-full border border-slate-300 bg-white text-xs font-semibold text-slate-800 hover:border-[#0B5ED7] hover:text-[#0B5ED7] transition-colors cursor-pointer"
                >
                  Save Plan as Draft Only
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Trip Plan Sent Successfully Modal (3 Options: Message Guide, View Your Plan, Back to Home) */}
      {sentSuccessModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="trip-sent-modal-title"
        >
          <div className="w-full max-w-md rounded-2xl bg-white border border-slate-200 p-6 sm:p-8 shadow-2xl text-slate-900 space-y-5">
            <div className="flex flex-col items-center text-center space-y-3">
              <div className="w-14 h-14 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8 text-emerald-600" />
              </div>
              <h2
                id="trip-sent-modal-title"
                className="text-2xl font-extrabold font-display text-slate-900"
              >
                Trip Plan Sent!
              </h2>
              <p className="text-sm text-slate-600 leading-relaxed">
                Your trip plan <strong className="text-slate-900">&ldquo;{sentSuccessModal.tripTitle}&rdquo;</strong>{' '}
                ({sentSuccessModal.destinations.join(', ')}) has been sent to{' '}
                <strong className="text-[#0B5ED7]">
                  {sentSuccessModal.guides.map((g) => g.displayName).join(', ')}
                </strong>
                .
              </p>
            </div>

            {sentSuccessModal.guides.length > 1 && (
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-600">
                  Choose guide to message
                </label>
                <select
                  value={sentSuccessModal.selectedMessageGuideId}
                  onChange={(e) =>
                    setSentSuccessModal((prev) =>
                      prev ? { ...prev, selectedMessageGuideId: e.target.value } : null
                    )
                  }
                  className={inputClass}
                >
                  {sentSuccessModal.guides.map((g) => (
                    <option key={g.guideId} value={g.guideId}>
                      {g.displayName}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="space-y-2.5 pt-2">
              <button
                type="button"
                onClick={handleMessageGuideFromModal}
                className="w-full inline-flex items-center justify-center gap-2 py-3 rounded-full bg-[#0B5ED7] text-white font-bold text-sm hover:bg-[#0842A0] transition-colors cursor-pointer"
              >
                <MessageSquare className="w-4 h-4" />
                <span>Message Guide</span>
              </button>

              <button
                type="button"
                onClick={handleViewPlanFromModal}
                className="w-full inline-flex items-center justify-center gap-2 py-2.5 rounded-full border border-[#0B5ED7] bg-blue-50 text-[#0B5ED7] font-bold text-sm hover:bg-blue-100 transition-colors cursor-pointer"
              >
                <Calendar className="w-4 h-4" />
                <span>View Your Plan</span>
              </button>

              <button
                type="button"
                onClick={handleBackHomeFromModal}
                className="w-full inline-flex items-center justify-center gap-2 py-2.5 rounded-full border border-slate-300 bg-white text-slate-700 font-semibold text-sm hover:border-slate-400 hover:bg-slate-50 transition-colors cursor-pointer"
              >
                <Home className="w-4 h-4" />
                <span>Back to Home</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
