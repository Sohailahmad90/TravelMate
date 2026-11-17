import React, { useMemo, useState } from 'react';
import {
  ArrowLeft,
  Check,
  MessageSquare,
  Search,
  X,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useMarketplace } from '../context/MarketplaceContext';
import {
  ActivePage,
  calculateDaysBetween,
  formatPkr,
  GuidePackage,
} from '../types/travelmate';
import { ResilientImage } from '../components/ResilientImage';

interface PackagesPageProps {
  initialQuery?: string;
  initialSelectedId?: string;
  onOpenPaymentModal?: () => void;
  onNavigate: (page: ActivePage) => void;
}

export function PackagesPage({
  initialQuery = '',
  initialSelectedId,
  onNavigate,
}: PackagesPageProps) {
  const { firebaseUser, effectiveRole, setDashboardTargetTab, openAuthModal } = useAuth();
  const { packages, createBooking, sendMessage } = useMarketplace();

  const [query, setQuery] = useState(initialQuery);
  const [selectedId, setSelectedId] = useState<string | null>(initialSelectedId || null);
  const [startDate, setStartDate] = useState('');
  const [travelers, setTravelers] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [bookingMessage, setBookingMessage] = useState<string | null>(null);
  const [bookingError, setBookingError] = useState<string | null>(null);
  const [msgText, setMsgText] = useState('');
  const [msgFeedback, setMsgFeedback] = useState<string | null>(null);
  const [msgError, setMsgError] = useState<string | null>(null);
  const [sendingMsg, setSendingMsg] = useState(false);

  const published = useMemo(
    () =>
      packages.filter(
        (p) =>
          p.isPublished &&
          (!query.trim() ||
            p.title.toLowerCase().includes(query.toLowerCase()) ||
            p.destination.toLowerCase().includes(query.toLowerCase()) ||
            p.guideName.toLowerCase().includes(query.toLowerCase()))
      ),
    [packages, query]
  );

  const selected: GuidePackage | null = useMemo(
    () => packages.find((p) => p.id === selectedId) || null,
    [packages, selectedId]
  );

  const handleBookPackage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selected) return;
    if (!firebaseUser) {
      openAuthModal('signin');
      return;
    }

    const numTravelers = Number(travelers);
    if (!startDate) {
      setBookingError('Please select a departure date.');
      return;
    }
    if (!numTravelers || numTravelers < (selected.minTravelers || 1)) {
      setBookingError('Please enter the number of travellers.');
      return;
    }

    setSubmitting(true);
    setBookingMessage(null);
    setBookingError(null);
    try {
      const start = new Date(startDate);
      const end = new Date(start);
      end.setDate(start.getDate() + Math.max(1, selected.days - 1));
      const endDate = end.toISOString().slice(0, 10);

      await createBooking({
        bookingType: 'package',
        providerUid: selected.ownerUid,
        providerName: selected.guideName,
        listingId: selected.id,
        listingTitle: selected.title,
        destination: selected.destination,
        startDate,
        endDate,
        daysCount: calculateDaysBetween(startDate, endDate),
        guestsCount: numTravelers,
        estimatedTotalPkr: selected.pricePerPersonPkr * numTravelers,
        notes: notes.trim(),
      });
      setBookingMessage(
        'Booking request submitted! Track confirmation in your Dashboard.'
      );
      setStartDate('');
      setTravelers('');
      setNotes('');
    } catch (err) {
      setBookingError(err instanceof Error ? err.message : 'Unable to submit booking.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleQuickMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selected || !msgText.trim()) return;
    if (!firebaseUser) {
      openAuthModal('signin');
      return;
    }
    setSendingMsg(true);
    setMsgFeedback(null);
    setMsgError(null);
    try {
      await sendMessage({
        recipientUid: selected.ownerUid,
        recipientName: selected.guideName,
        relatedListingTitle: `Tour Package · ${selected.title}`,
        text: msgText.trim(),
      });
      setMsgText('');
      setMsgFeedback(`Message sent to ${selected.guideName}. Check your Messages inbox.`);
    } catch (err) {
      setMsgError(err instanceof Error ? err.message : 'Unable to send message.');
    } finally {
      setSendingMsg(false);
    }
  };

  const inputClass =
    'w-full rounded-xl bg-slate-50 border border-slate-200 px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#0B5ED7] focus:bg-white';

  if (selected) {
    const numTravelers = Number(travelers) || 0;
    const estimatedTotal = numTravelers > 0 ? selected.pricePerPersonPkr * numTravelers : 0;

    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
        <button
          type="button"
          onClick={() => {
            setSelectedId(null);
            setBookingMessage(null);
            setBookingError(null);
            setMsgFeedback(null);
            setMsgError(null);
          }}
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-[#0B5ED7] cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Tour Packages</span>
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8 space-y-6">
            <div className="rounded-2xl border border-slate-200 shadow-sm overflow-hidden aspect-[16/9]">
              <ResilientImage
                src={selected.imageUrl}
                alt={selected.title}
                className="w-full h-full object-cover"
              />
            </div>

            <div className="rounded-2xl bg-white border border-slate-200 shadow-xs p-6 sm:p-8 space-y-5">
              <div className="space-y-2">
                <p className="text-xs text-[#0B5ED7] font-semibold">
                  {selected.destination} · {selected.days} Days / {selected.nights} Nights · Guide:{' '}
                  {selected.guideName}
                </p>
                <h1 className="text-2xl sm:text-3xl font-extrabold font-display text-slate-900">
                  {selected.title}
                </h1>
                <p className="text-sm text-slate-600 leading-relaxed">{selected.description}</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-slate-100 text-xs">
                <div>
                  <span className="text-slate-400 block mb-1">Accommodation</span>
                  <span className="font-medium text-slate-800">{selected.accommodationSummary}</span>
                </div>
                <div>
                  <span className="text-slate-400 block mb-1">Transport</span>
                  <span className="font-medium text-slate-800">{selected.transportSummary}</span>
                </div>
              </div>

              {(selected.dailyItinerary || []).length > 0 && (
                <div className="pt-4 border-t border-slate-100 space-y-2.5">
                  <h2 className="text-lg font-bold font-display text-slate-900">Daily Itinerary</h2>
                  <ul className="space-y-2 text-sm text-slate-700">
                    {(selected.dailyItinerary || []).map((day, idx) => (
                      <li
                        key={idx}
                        className="rounded-xl bg-slate-50 border border-slate-200 px-4 py-2.5"
                      >
                        {day}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4 border-t border-slate-100 text-xs">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 mb-2">Included Services</h3>
                  <ul className="space-y-1.5 text-slate-600">
                    {(selected.includedServices || []).map((inc) => (
                      <li key={inc} className="flex items-center gap-2">
                        <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>{inc}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 mb-2">Excluded Services</h3>
                  <ul className="space-y-1.5 text-slate-500">
                    {(selected.excludedServices || []).map((exc) => (
                      <li key={exc} className="flex items-center gap-2">
                        <X className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                        <span>{exc}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Compact Booking Card + Quick Message */}
          <div className="lg:col-span-4 space-y-5">
            {firebaseUser && effectiveRole === 'guide' ? (
              <div className="rounded-2xl bg-white border border-slate-200 shadow-sm p-6 space-y-4">
                <div className="border-b border-slate-100 pb-4">
                  <span className="text-xs text-slate-500 block">Price per person</span>
                  <span className="text-2xl font-extrabold font-mono-num text-[#0B5ED7]">
                    {formatPkr(selected.pricePerPersonPkr)}
                  </span>
                </div>
                {selected.ownerUid === firebaseUser.uid ? (
                  <div className="space-y-3">
                    <h3 className="text-base font-bold font-display text-slate-900">
                      You Created This Tour Package
                    </h3>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Update pricing, itinerary, or publishing status directly in your Guide Studio.
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setDashboardTargetTab('packages');
                        onNavigate('dashboard');
                      }}
                      className="w-full py-2.5 rounded-full bg-[#0B5ED7] text-white font-bold text-xs hover:bg-[#0842A0] transition-colors cursor-pointer"
                    >
                      Edit in Tour Guide Studio
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <h3 className="text-base font-bold font-display text-slate-900">
                      Tour Guide Account Notice
                    </h3>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Tour Guide accounts cannot book other guides&apos; packages. You can manage
                      your own packages or book hotels and 4x4 vehicles.
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => onNavigate('hotels')}
                        className="py-2 rounded-full border border-slate-300 bg-white text-xs font-semibold text-slate-800 hover:border-[#0B5ED7] hover:text-[#0B5ED7] cursor-pointer"
                      >
                        Hotels
                      </button>
                      <button
                        type="button"
                        onClick={() => onNavigate('vehicles')}
                        className="py-2 rounded-full border border-slate-300 bg-white text-xs font-semibold text-slate-800 hover:border-[#0B5ED7] hover:text-[#0B5ED7] cursor-pointer"
                      >
                        Vehicles
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <form
                onSubmit={handleBookPackage}
                className="rounded-2xl bg-white border border-slate-200 shadow-sm p-5 space-y-4"
              >
                <div className="flex items-baseline justify-between border-b border-slate-100 pb-3">
                  <div>
                    <span className="text-xs text-slate-500 block">Per Person</span>
                    <span className="text-xl font-extrabold font-mono-num text-[#0B5ED7]">
                      {formatPkr(selected.pricePerPersonPkr)}
                    </span>
                  </div>
                  {selected.groupPricePkr && (
                    <span className="text-xs text-slate-500 font-medium">
                      Group: {formatPkr(selected.groupPricePkr)}
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Departure Date
                    </label>
                    <input
                      type="date"
                      required
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Travellers
                    </label>
                    <input
                      type="number"
                      required
                      min={selected.minTravelers || 1}
                      max={selected.maxTravelers || 20}
                      value={travelers}
                      onChange={(e) => setTravelers(e.target.value)}
                      placeholder="e.g., 2"
                      className={`${inputClass} font-mono-num`}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Note (Optional)
                  </label>
                  <input
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Pickup city or special request..."
                    className={inputClass}
                  />
                </div>

                <div className="flex items-center justify-between rounded-xl bg-slate-50 border border-slate-200 px-3.5 py-2.5 text-sm">
                  <span className="text-slate-600 text-xs font-medium">Estimated Total</span>
                  <span className="font-bold font-mono-num text-[#0B5ED7]">
                    {estimatedTotal > 0 ? formatPkr(estimatedTotal) : '—'}
                  </span>
                </div>

                {bookingError && (
                  <p className="text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-xl p-2.5">
                    {bookingError}
                  </p>
                )}

                {bookingMessage && (
                  <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-3 text-xs text-emerald-800 space-y-1.5">
                    <p>{bookingMessage}</p>
                    <button
                      type="button"
                      onClick={() => {
                        setDashboardTargetTab('bookings');
                        onNavigate('dashboard');
                      }}
                      className="underline font-bold text-[#0B5ED7] cursor-pointer"
                    >
                      Go to My Bookings &rarr;
                    </button>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-2.5 rounded-full bg-[#0B5ED7] text-white font-bold text-sm hover:bg-[#0842A0] transition-colors cursor-pointer"
                >
                  {submitting ? 'Submitting...' : 'Submit Booking Request'}
                </button>
              </form>
            )}

            {selected.ownerUid !== firebaseUser?.uid && (
              <form
                onSubmit={handleQuickMessage}
                className="rounded-2xl bg-white border border-slate-200 shadow-xs p-5 space-y-3"
              >
                <h3 className="text-sm font-bold font-display text-slate-900 flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-[#0B5ED7]" />
                  <span>Message {selected.guideName}</span>
                </h3>
                <input
                  type="text"
                  value={msgText}
                  onChange={(e) => setMsgText(e.target.value)}
                  placeholder="Ask about inclusions or dates..."
                  className={inputClass}
                />
                {msgError && <p className="text-xs font-medium text-rose-600">{msgError}</p>}
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
                  disabled={sendingMsg}
                  className="w-full py-2 rounded-full border border-slate-300 bg-white text-xs font-semibold text-slate-800 hover:border-[#0B5ED7] hover:text-[#0B5ED7] transition-colors cursor-pointer"
                >
                  {sendingMsg ? 'Sending...' : 'Send Direct Message'}
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
            Guided Tour <span className="text-[#0B5ED7]">Packages</span>
          </h1>
          <p className="text-sm text-slate-600 mt-2">
            All-inclusive multi-day expeditions crafted directly by TravelMate tour guides.
          </p>
        </div>
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-[#0B5ED7] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search packages by destination..."
            className="w-full rounded-xl bg-white border border-slate-200 pl-10 pr-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#0B5ED7]"
          />
        </div>
      </div>

      {published.length === 0 ? (
        <div className="rounded-2xl bg-white border border-slate-200 p-10 text-center space-y-2">
          <p className="text-sm font-semibold text-slate-800">
            No tour packages match &ldquo;{query}&rdquo;.
          </p>
          <p className="text-xs text-slate-500">
            Try clearing your search or send a custom itinerary in Trip Planner.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {published.map((pkg) => (
            <div
              key={pkg.id}
              className="rounded-2xl bg-white border border-slate-200 shadow-xs overflow-hidden flex flex-col hover:shadow-md transition-shadow"
            >
              <div className="aspect-[4/3] relative">
                <ResilientImage
                  src={pkg.imageUrl}
                  alt={pkg.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/75 via-transparent to-transparent" />
                <span className="absolute top-3 left-3 px-2.5 py-1 rounded-md bg-white/95 text-[#0B5ED7] text-[11px] font-bold">
                  {pkg.days}D / {pkg.nights}N
                </span>
                <div className="absolute bottom-3 left-4 right-4 text-xs text-white font-medium">
                  {pkg.destination} · {pkg.guideName}
                </div>
              </div>
              <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                <div>
                  <h2 className="text-lg font-bold font-display text-slate-900">{pkg.title}</h2>
                  <p className="text-xs text-slate-600 mt-1.5 line-clamp-2">{pkg.description}</p>
                </div>
                <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                  <div>
                    <span className="text-[11px] text-slate-400 block">Per Person</span>
                    <span className="text-sm font-extrabold font-mono-num text-[#0B5ED7]">
                      {formatPkr(pkg.pricePerPersonPkr)}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedId(pkg.id)}
                    className="px-4 py-2 rounded-full bg-[#0B5ED7] text-white text-xs font-bold hover:bg-[#0842A0] transition-colors cursor-pointer"
                  >
                    View &amp; Book
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
