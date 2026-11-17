import React, { useMemo, useState } from 'react';
import {
  ArrowLeft,
  Check,
  MapPin,
  MessageSquare,
  Search,
  Star,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useMarketplace } from '../context/MarketplaceContext';
import {
  ActivePage,
  calculateDaysBetween,
  formatPkr,
  Hotel,
} from '../types/travelmate';
import { ResilientImage } from '../components/ResilientImage';

interface HotelsPageProps {
  initialQuery?: string;
  initialSelectedId?: string;
  onOpenPaymentModal?: () => void;
  onNavigate: (page: ActivePage) => void;
}

export function HotelsPage({
  initialQuery = '',
  initialSelectedId,
  onNavigate,
}: HotelsPageProps) {
  const { firebaseUser, effectiveRole, setDashboardTargetTab, openAuthModal } = useAuth();
  const { hotels, reviews, createBooking, sendMessage } = useMarketplace();

  const [query, setQuery] = useState(initialQuery);
  const [roomFilter, setRoomFilter] = useState('All');
  const [maxPrice, setMaxPrice] = useState(20000);
  const [selectedId, setSelectedId] = useState<string | null>(initialSelectedId || null);

  // Compact booking form state (no pre-filled values)
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [guests, setGuests] = useState('');
  const [selectedRoomType, setSelectedRoomType] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [bookingMsg, setBookingMsg] = useState<string | null>(null);
  const [bookingErr, setBookingErr] = useState<string | null>(null);
  const [msgText, setMsgText] = useState('');
  const [msgFeedback, setMsgFeedback] = useState<string | null>(null);
  const [msgError, setMsgError] = useState<string | null>(null);
  const [sendingMsg, setSendingMsg] = useState(false);

  const verifiedHotels = useMemo(
    () => hotels.filter((h) => h.verificationStatus === 'verified'),
    [hotels]
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return verifiedHotels.filter((h) => {
      const matchesQ =
        !q ||
        h.name.toLowerCase().includes(q) ||
        h.destination.toLowerCase().includes(q) ||
        h.address.toLowerCase().includes(q);
      const matchesPrice = h.startingPricePkr <= maxPrice;
      const matchesRoom =
        roomFilter === 'All' ||
        (h.rooms || []).some((r) => r.roomType === roomFilter);
      return matchesQ && matchesPrice && matchesRoom;
    });
  }, [verifiedHotels, query, maxPrice, roomFilter]);

  const selected: Hotel | null = useMemo(
    () => hotels.find((h) => h.id === selectedId) || null,
    [hotels, selectedId]
  );

  const handleBookHotel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selected) return;
    if (!firebaseUser) {
      openAuthModal('signin');
      return;
    }

    const numGuests = Number(guests);
    if (!checkIn || !checkOut) {
      setBookingErr('Please select check-in and check-out dates.');
      return;
    }
    if (!numGuests || numGuests < 1) {
      setBookingErr('Please enter the number of guests.');
      return;
    }

    const roomObj =
      (selected.rooms || []).find((r) => r.roomType === selectedRoomType) ||
      selected.rooms?.[0];
    const nightlyRate = roomObj?.pricePerNightPkr || selected.startingPricePkr;
    const nights = calculateDaysBetween(checkIn, checkOut);

    setSubmitting(true);
    setBookingMsg(null);
    setBookingErr(null);
    try {
      await createBooking({
        bookingType: 'hotel',
        providerUid: selected.ownerUid,
        providerName: selected.ownerName,
        listingId: selected.id,
        listingTitle: selected.name,
        destination: selected.destination,
        startDate: checkIn,
        endDate: checkOut,
        daysCount: nights,
        guestsCount: numGuests,
        roomType: roomObj?.roomType || selectedRoomType || 'Standard',
        estimatedTotalPkr: nightlyRate * nights,
        notes: notes.trim(),
      });
      setBookingMsg(
        `Reservation request for ${nights} night(s) submitted!`
      );
      setCheckIn('');
      setCheckOut('');
      setGuests('');
      setNotes('');
    } catch (err) {
      setBookingErr(err instanceof Error ? err.message : 'Unable to submit hotel reservation.');
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
        recipientName: selected.ownerName,
        relatedListingTitle: `Hotel · ${selected.name}`,
        text: msgText.trim(),
      });
      setMsgText('');
      setMsgFeedback(`Message sent to ${selected.ownerName}. View replies in Messages inbox.`);
    } catch (err) {
      setMsgError(err instanceof Error ? err.message : 'Unable to send message.');
    } finally {
      setSendingMsg(false);
    }
  };

  const inputClass =
    'w-full rounded-xl bg-slate-50 border border-slate-200 px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#0B5ED7] focus:bg-white';

  if (selected) {
    const hasDates = Boolean(checkIn && checkOut);
    const nights = hasDates ? calculateDaysBetween(checkIn, checkOut) : 0;
    const rooms = selected.rooms || [
      {
        roomType: 'Deluxe' as const,
        pricePerNightPkr: selected.startingPricePkr,
        totalRooms: 5,
        maxGuests: 2,
      },
    ];
    const activeRoom =
      rooms.find((r) => r.roomType === selectedRoomType) || rooms[0];
    const estimatedTotal = nights > 0 ? activeRoom.pricePerNightPkr * nights : 0;
    const hotelReviews = reviews.filter(
      (r) => r.targetType === 'hotel' && r.targetId === selected.id
    );

    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
        <button
          type="button"
          onClick={() => {
            setSelectedId(null);
            setBookingMsg(null);
            setBookingErr(null);
            setMsgFeedback(null);
            setMsgError(null);
          }}
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-[#0B5ED7] cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to All Hotels</span>
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8 space-y-6">
            <div className="rounded-2xl border border-slate-200 shadow-sm overflow-hidden aspect-[16/9]">
              <ResilientImage
                src={selected.imageUrl}
                alt={selected.name}
                className="w-full h-full object-cover"
              />
            </div>

            <div className="rounded-2xl bg-white border border-slate-200 shadow-xs p-6 sm:p-8 space-y-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-xs text-[#0B5ED7] font-semibold flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5" />
                    <span>
                      {selected.destination} · {selected.address}
                    </span>
                  </p>
                  <h1 className="text-2xl sm:text-3xl font-extrabold font-display text-slate-900 mt-1">
                    {selected.name}
                  </h1>
                </div>
                <span className="inline-flex items-center gap-1 text-sm font-mono-num font-bold text-[#F59E0B]">
                  <Star className="w-4 h-4 fill-[#F59E0B]" />
                  {(selected.ratingAvg || 4.8).toFixed(1)}
                </span>
              </div>

              <p className="text-sm text-slate-600 leading-relaxed">{selected.description}</p>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-4 border-t border-slate-100 text-xs">
                <div>
                  <span className="text-slate-400 block">Check-In</span>
                  <span className="text-slate-900 font-semibold">{selected.checkInTime || '02:00 PM'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Check-Out</span>
                  <span className="text-slate-900 font-semibold">{selected.checkOutTime || '12:00 PM'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Independent Booking</span>
                  <span className="text-emerald-600 font-semibold">No Guide Required</span>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100">
                <h2 className="text-base font-bold font-display text-slate-900 mb-3">
                  Property Facilities
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs text-slate-700">
                  {(selected.facilities || []).map((fac) => (
                    <div key={fac} className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-[#0B5ED7] shrink-0" />
                      <span>{fac}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 space-y-3">
                <h2 className="text-base font-bold font-display text-slate-900">
                  Available Room Types
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {rooms.map((rm) => {
                    const isPicked = activeRoom.roomType === rm.roomType;
                    return (
                      <button
                        key={rm.roomType}
                        type="button"
                        onClick={() => setSelectedRoomType(rm.roomType)}
                        className={`p-4 rounded-xl border text-left transition-colors cursor-pointer ${
                          isPicked
                            ? 'bg-blue-50 border-[#0B5ED7] shadow-xs'
                            : 'bg-slate-50 border-slate-200 hover:border-[#0B5ED7]/40'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-bold text-slate-900">{rm.roomType} Room</span>
                          <span className="text-sm font-mono-num font-bold text-[#0B5ED7]">
                            {formatPkr(rm.pricePerNightPkr)}/night
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-1">
                          Max {rm.maxGuests} guests · {rm.totalRooms} rooms available
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Reviews */}
            <div className="rounded-2xl bg-white border border-slate-200 shadow-xs p-6 space-y-4">
              <h2 className="text-lg font-bold font-display text-slate-900">
                Guest Reviews ({hotelReviews.length})
              </h2>
              {hotelReviews.length === 0 ? (
                <p className="text-xs text-slate-500">No guest reviews yet.</p>
              ) : (
                <div className="space-y-3">
                  {hotelReviews.map((r) => (
                    <div key={r.id} className="border-b border-slate-100 pb-3 last:border-none">
                      <div className="flex justify-between text-xs">
                        <span className="font-semibold text-slate-900">{r.authorName}</span>
                        <span className="text-[#F59E0B] font-mono-num font-bold">★ {r.rating}.0</span>
                      </div>
                      <p className="text-sm text-slate-600 mt-1">{r.comment}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Compact Hotel Reservation Card + Quick Message */}
          <div className="lg:col-span-4 space-y-5">
            <form
              onSubmit={handleBookHotel}
              className="rounded-2xl bg-white border border-slate-200 shadow-sm p-5 space-y-4"
            >
              <div className="flex items-baseline justify-between border-b border-slate-100 pb-3">
                <div>
                  <span className="text-xs text-slate-500 block">{activeRoom.roomType} Room</span>
                  <span className="text-xl font-extrabold font-mono-num text-[#0B5ED7]">
                    {formatPkr(activeRoom.pricePerNightPkr)}
                    <span className="text-xs text-slate-500 font-normal"> / night</span>
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Check-In</label>
                  <input
                    type="date"
                    required
                    value={checkIn}
                    onChange={(e) => setCheckIn(e.target.value)}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Check-Out</label>
                  <input
                    type="date"
                    required
                    value={checkOut}
                    onChange={(e) => setCheckOut(e.target.value)}
                    className={inputClass}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Room Type</label>
                  <select
                    value={activeRoom.roomType}
                    onChange={(e) => setSelectedRoomType(e.target.value)}
                    className={inputClass}
                  >
                    {rooms.map((r) => (
                      <option key={r.roomType} value={r.roomType}>
                        {r.roomType}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Guests</label>
                  <input
                    type="number"
                    required
                    min={1}
                    max={12}
                    value={guests}
                    onChange={(e) => setGuests(e.target.value)}
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
                  placeholder="Early check-in or extra bed..."
                  className={inputClass}
                />
              </div>

              <div className="flex items-center justify-between rounded-xl bg-slate-50 border border-slate-200 px-3.5 py-2.5 text-sm">
                <span className="text-slate-600 text-xs font-medium">
                  {nights > 0 ? `Total (${nights} night${nights > 1 ? 's' : ''})` : 'Estimated Total'}
                </span>
                <span className="font-bold font-mono-num text-[#0B5ED7]">
                  {estimatedTotal > 0 ? formatPkr(estimatedTotal) : '—'}
                </span>
              </div>

              {bookingErr && (
                <p className="text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-xl p-2.5">
                  {bookingErr}
                </p>
              )}
              {bookingMsg && (
                <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-3 text-xs text-emerald-800 space-y-1.5">
                  <p>{bookingMsg}</p>
                  <button
                    type="button"
                    onClick={() => {
                      setDashboardTargetTab(
                        effectiveRole === 'guide' ? 'my-rentals' : 'bookings'
                      );
                      onNavigate('dashboard');
                    }}
                    className="underline font-bold text-[#0B5ED7] cursor-pointer"
                  >
                    Manage in My Reservations &rarr;
                  </button>
                </div>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-2.5 rounded-full bg-[#0B5ED7] text-white font-bold text-sm hover:bg-[#0842A0] transition-colors cursor-pointer"
              >
                {submitting ? 'Submitting...' : 'Request Reservation'}
              </button>
            </form>

            {selected.ownerUid !== firebaseUser?.uid && (
              <form
                onSubmit={handleQuickMessage}
                className="rounded-2xl bg-white border border-slate-200 shadow-xs p-5 space-y-3"
              >
                <h3 className="text-sm font-bold font-display text-slate-900 flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-[#0B5ED7]" />
                  <span>Message {selected.ownerName}</span>
                </h3>
                <input
                  type="text"
                  value={msgText}
                  onChange={(e) => setMsgText(e.target.value)}
                  placeholder="Ask about availability or parking..."
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
            Independent <span className="text-[#0B5ED7]">Hotel Bookings</span>
          </h1>
          <p className="text-sm text-slate-600 mt-2 max-w-2xl">
            Reserve verified mountain lodges, resorts, and family suites directly — no tour guide
            package required.
          </p>
        </div>

        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-[#0B5ED7] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search hotel or destination..."
            className="w-full rounded-xl bg-white border border-slate-200 pl-10 pr-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#0B5ED7]"
          />
        </div>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 rounded-2xl bg-white border border-slate-200 shadow-xs p-4">
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">Room Category</label>
          <select
            value={roomFilter}
            onChange={(e) => setRoomFilter(e.target.value)}
            className={inputClass}
          >
            <option value="All">All Room Types</option>
            <option value="Single">Single</option>
            <option value="Double">Double</option>
            <option value="Deluxe">Deluxe</option>
            <option value="Family">Family</option>
            <option value="Suite">Suite</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">
            Max Nightly Starting Rate ({formatPkr(maxPrice)})
          </label>
          <input
            type="range"
            min={2500}
            max={20000}
            step={500}
            value={maxPrice}
            onChange={(e) => setMaxPrice(Number(e.target.value))}
            className="w-full accent-[#0B5ED7] mt-2"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {filtered.map((hotel) => (
          <div
            key={hotel.id}
            className="rounded-2xl bg-white border border-slate-200 shadow-xs overflow-hidden flex flex-col hover:shadow-md transition-shadow"
          >
            <div className="aspect-[4/3] relative">
              <ResilientImage
                src={hotel.imageUrl}
                alt={hotel.name}
                className="w-full h-full object-cover"
              />
              <span className="absolute top-3 left-3 px-2.5 py-1 rounded-md bg-white/95 text-[#0B5ED7] text-[11px] font-bold">
                {hotel.destination}
              </span>
            </div>
            <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <h2 className="text-lg font-bold font-display text-slate-900">{hotel.name}</h2>
                  <span className="text-xs font-mono-num font-bold text-[#F59E0B] shrink-0">
                    ★ {(hotel.ratingAvg || 4.8).toFixed(1)}
                  </span>
                </div>
                <p className="text-xs text-slate-500">{hotel.address}</p>
                <p className="text-xs text-slate-600 line-clamp-2">{hotel.description}</p>
              </div>
              <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                <div>
                  <span className="text-[11px] text-slate-400 block">From / Night</span>
                  <span className="text-sm font-extrabold font-mono-num text-[#0B5ED7]">
                    {formatPkr(hotel.startingPricePkr)}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedId(hotel.id)}
                  className="px-4 py-2 rounded-full bg-[#0B5ED7] text-white text-xs font-bold hover:bg-[#0842A0] transition-colors cursor-pointer"
                >
                  Select Room
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
