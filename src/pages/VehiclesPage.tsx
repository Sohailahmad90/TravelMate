import React, { useMemo, useState } from 'react';
import {
  AlertCircle,
  ArrowLeft,
  Car,
  MapPin,
  MessageSquare,
  Search,
  Users,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useMarketplace } from '../context/MarketplaceContext';
import {
  ActivePage,
  calculateDaysBetween,
  formatPkr,
  Vehicle,
} from '../types/travelmate';
import { ResilientImage } from '../components/ResilientImage';

interface VehiclesPageProps {
  initialQuery?: string;
  initialSelectedId?: string;
  onOpenPaymentModal?: () => void;
  onNavigate: (page: ActivePage) => void;
}

export function VehiclesPage({
  initialQuery = '',
  initialSelectedId,
  onNavigate,
}: VehiclesPageProps) {
  const { firebaseUser, effectiveRole, setDashboardTargetTab, openAuthModal } = useAuth();
  const { vehicles, reviews, createBooking, sendMessage } = useMarketplace();

  const [query, setQuery] = useState(initialQuery);
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [driverFilter, setDriverFilter] = useState<'all' | 'with_driver' | 'without_driver'>('all');
  const [minSeats, setMinSeats] = useState(1);
  const [selectedId, setSelectedId] = useState<string | null>(initialSelectedId || null);

  // Compact Rental Form State (no pre-filled values)
  const [pickupDate, setPickupDate] = useState('');
  const [returnDate, setReturnDate] = useState('');
  const [pickupLocation, setPickupLocation] = useState('');
  const [withDriver, setWithDriver] = useState(true);
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [bookingMsg, setBookingMsg] = useState<string | null>(null);
  const [bookingErr, setBookingErr] = useState<string | null>(null);
  const [msgText, setMsgText] = useState('');
  const [msgFeedback, setMsgFeedback] = useState<string | null>(null);
  const [msgError, setMsgError] = useState<string | null>(null);
  const [sendingMsg, setSendingMsg] = useState(false);

  const verifiedVehicles = useMemo(
    () =>
      vehicles.filter(
        (v) => v.verificationStatus === 'verified' && v.availableForBooking
      ),
    [vehicles]
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return verifiedVehicles.filter((v) => {
      const matchesQ =
        !q ||
        v.name.toLowerCase().includes(q) ||
        v.pickupLocation.toLowerCase().includes(q) ||
        (v.serviceAreas || []).some((a) => a.toLowerCase().includes(q));
      const matchesCat = categoryFilter === 'All' || v.category === categoryFilter;
      const matchesSeats = v.seats >= minSeats;
      const matchesDriver =
        driverFilter === 'all' ||
        (driverFilter === 'with_driver' &&
          (v.driverOption === 'with_driver_only' || v.driverOption === 'both')) ||
        (driverFilter === 'without_driver' &&
          (v.driverOption === 'without_driver_only' || v.driverOption === 'both'));
      return matchesQ && matchesCat && matchesSeats && matchesDriver;
    });
  }, [verifiedVehicles, query, categoryFilter, minSeats, driverFilter]);

  const selected: Vehicle | null = useMemo(
    () => vehicles.find((v) => v.id === selectedId) || null,
    [vehicles, selectedId]
  );

  const openVehicle = (v: Vehicle) => {
    setSelectedId(v.id);
    setPickupLocation('');
    setWithDriver(v.driverOption !== 'without_driver_only');
    setBookingMsg(null);
    setBookingErr(null);
    setMsgFeedback(null);
    setMsgError(null);
  };

  const handleBookVehicle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selected) return;
    if (!firebaseUser) {
      openAuthModal('signin');
      return;
    }

    if (!pickupDate || !returnDate) {
      setBookingErr('Please choose pickup and return dates.');
      return;
    }
    if (!pickupLocation.trim()) {
      setBookingErr('Please enter your pickup city or location.');
      return;
    }

    const effectiveDriver =
      selected.driverOption === 'with_driver_only'
        ? true
        : selected.driverOption === 'without_driver_only'
        ? false
        : withDriver;

    const days = calculateDaysBetween(pickupDate, returnDate);
    const driverDaily = effectiveDriver ? selected.driverFeePerDayPkr || 0 : 0;
    const totalEstimate = (selected.pricePerDayPkr + driverDaily) * days;

    setSubmitting(true);
    setBookingMsg(null);
    setBookingErr(null);
    try {
      await createBooking({
        bookingType: 'vehicle',
        providerUid: selected.ownerUid,
        providerName: selected.ownerName,
        listingId: selected.id,
        listingTitle: selected.name,
        destination: (selected.serviceAreas || [selected.pickupLocation])[0],
        startDate: pickupDate,
        endDate: returnDate,
        daysCount: days,
        guestsCount: selected.seats,
        driverSelected: effectiveDriver,
        pickupLocation: pickupLocation.trim(),
        estimatedTotalPkr: totalEstimate,
        notes: notes.trim(),
      });
      setBookingMsg(
        `Rental request for ${days} day(s) submitted to ${selected.ownerName}!`
      );
      setPickupDate('');
      setReturnDate('');
      setPickupLocation('');
      setNotes('');
    } catch (err) {
      setBookingErr(err instanceof Error ? err.message : 'Unable to submit rental request.');
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
        relatedListingTitle: `Vehicle · ${selected.name}`,
        text: msgText.trim(),
      });
      setMsgText('');
      setMsgFeedback(`Message sent to ${selected.ownerName}. Check your Messages inbox.`);
    } catch (err) {
      setMsgError(err instanceof Error ? err.message : 'Unable to send message.');
    } finally {
      setSendingMsg(false);
    }
  };

  const inputClass =
    'w-full rounded-xl bg-slate-50 border border-slate-200 px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#0B5ED7] focus:bg-white';

  if (selected) {
    const hasDates = Boolean(pickupDate && returnDate);
    const days = hasDates ? calculateDaysBetween(pickupDate, returnDate) : 0;
    const effectiveDriver =
      selected.driverOption === 'with_driver_only'
        ? true
        : selected.driverOption === 'without_driver_only'
        ? false
        : withDriver;
    const driverFeeDaily = effectiveDriver ? selected.driverFeePerDayPkr || 0 : 0;
    const estimatedTotal = days > 0 ? (selected.pricePerDayPkr + driverFeeDaily) * days : 0;
    const vehReviews = reviews.filter(
      (r) => r.targetType === 'vehicle' && r.targetId === selected.id
    );

    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
        <button
          type="button"
          onClick={() => setSelectedId(null)}
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-[#0B5ED7] cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Vehicle Fleet</span>
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
              <div className="space-y-1.5">
                <p className="text-xs text-[#0B5ED7] font-semibold">
                  {selected.category} · {selected.modelYear || 2022} · Owner: {selected.ownerName}
                </p>
                <h1 className="text-2xl sm:text-3xl font-extrabold font-display text-slate-900">
                  {selected.name}
                </h1>
                <p className="text-xs text-slate-600">
                  {selected.seats} Seats · {selected.transmission || '4WD'} ·{' '}
                  {selected.fuelType || 'Diesel'} · {selected.acAvailable ? 'AC Equipped' : 'Standard'}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-slate-100 text-xs">
                <div>
                  <span className="text-slate-400 block">Primary Pickup Location</span>
                  <span className="text-slate-900 font-semibold mt-1 inline-flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-[#0B5ED7]" />
                    {selected.pickupLocation}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block">Approved Service Areas</span>
                  <span className="text-slate-700 font-medium mt-1 block">
                    {(selected.serviceAreas || []).join(' · ')}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block">Vehicle Condition</span>
                  <span className="text-slate-700 font-medium mt-1 block">{selected.condition}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Driver Policy</span>
                  <span className="text-[#0B5ED7] font-semibold mt-1 block">
                    {selected.driverOption === 'both'
                      ? 'Supports Both (With Driver or Self-Drive)'
                      : selected.driverOption === 'with_driver_only'
                      ? 'With Driver Only'
                      : 'Without Driver (Self-Drive Only)'}
                  </span>
                </div>
              </div>

              <div className="rounded-xl bg-slate-50 border border-slate-200 p-4 space-y-2 text-xs text-slate-600">
                <p className="font-bold text-slate-900">Eligibility &amp; Rental Terms</p>
                <p>{selected.selfDriveEligibility}</p>
                <p className="text-slate-500">{selected.rentalTerms}</p>
              </div>
            </div>

            <div className="rounded-2xl bg-white border border-slate-200 shadow-xs p-6 space-y-4">
              <h2 className="text-lg font-bold font-display text-slate-900">
                Renter Reviews ({vehReviews.length})
              </h2>
              {vehReviews.length === 0 ? (
                <p className="text-xs text-slate-500">No vehicle reviews yet.</p>
              ) : (
                <div className="space-y-3">
                  {vehReviews.map((r) => (
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

          {/* Compact Vehicle Booking Card + Quick Message */}
          <div className="lg:col-span-4 space-y-5">
            <form
              onSubmit={handleBookVehicle}
              className="rounded-2xl bg-white border border-slate-200 shadow-sm p-5 space-y-4"
            >
              <div className="border-b border-slate-100 pb-3">
                <span className="text-xs text-slate-500 block">Daily Vehicle Rate</span>
                <span className="text-xl font-extrabold font-mono-num text-[#0B5ED7]">
                  {formatPkr(selected.pricePerDayPkr)}
                  <span className="text-xs text-slate-500 font-normal"> / day</span>
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Pickup Date
                  </label>
                  <input
                    type="date"
                    required
                    value={pickupDate}
                    onChange={(e) => setPickupDate(e.target.value)}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Return Date
                  </label>
                  <input
                    type="date"
                    required
                    value={returnDate}
                    onChange={(e) => setReturnDate(e.target.value)}
                    className={inputClass}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Pickup City / Location
                </label>
                <input
                  type="text"
                  required
                  value={pickupLocation}
                  onChange={(e) => setPickupLocation(e.target.value)}
                  placeholder={`e.g., ${selected.pickupLocation}`}
                  className={inputClass}
                />
              </div>

              {/* Driver Option Selection */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700">
                  Driver Option
                </label>
                {selected.driverOption === 'both' ? (
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setWithDriver(true)}
                      className={`p-2.5 rounded-xl border text-left text-xs transition-colors cursor-pointer ${
                        withDriver
                          ? 'bg-blue-50 border-[#0B5ED7] text-slate-900'
                          : 'bg-slate-50 border-slate-200 text-slate-600'
                      }`}
                    >
                      <span className="font-bold block">With Driver</span>
                      <span className="text-[11px] text-[#0B5ED7] font-mono-num">
                        +{formatPkr(selected.driverFeePerDayPkr || 0)}/day
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setWithDriver(false)}
                      className={`p-2.5 rounded-xl border text-left text-xs transition-colors cursor-pointer ${
                        !withDriver
                          ? 'bg-blue-50 border-[#0B5ED7] text-slate-900'
                          : 'bg-slate-50 border-slate-200 text-slate-600'
                      }`}
                    >
                      <span className="font-bold block">Self-Drive</span>
                      <span className="text-[11px] text-slate-500">No driver</span>
                    </button>
                  </div>
                ) : (
                  <div className="rounded-xl bg-blue-50 border border-blue-200 px-3 py-2 text-xs text-slate-800 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-[#0B5ED7] shrink-0" />
                    <span>
                      {selected.driverOption === 'with_driver_only'
                        ? 'With Driver Only'
                        : 'Self-Drive Only'}
                    </span>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Note (Optional)
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Route e.g., Skardu to Deosai..."
                  className={inputClass}
                />
              </div>

              <div className="flex items-center justify-between rounded-xl bg-slate-50 border border-slate-200 px-3.5 py-2.5 text-sm">
                <span className="text-slate-600 text-xs font-medium">
                  {days > 0 ? `Total (${days} day${days > 1 ? 's' : ''})` : 'Estimated Total'}
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
                    Track in My Rentals &rarr;
                  </button>
                </div>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-2.5 rounded-full bg-[#0B5ED7] text-white font-bold text-sm hover:bg-[#0842A0] transition-colors cursor-pointer"
              >
                {submitting ? 'Submitting...' : 'Submit Rental Request'}
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
                  placeholder="Ask about pickup or fuel terms..."
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
            Car &amp; 4x4 <span className="text-[#0B5ED7]">Vehicle Rental</span>
          </h1>
          <p className="text-sm text-slate-600 mt-2 max-w-2xl">
            Rent Prado 4x4s, Land Cruisers, Hiace vans, and highway cars across Skardu, Gilgit,
            Hunza, Swat, and Islamabad — with or without a driver.
          </p>
        </div>
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-[#0B5ED7] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by city, model, or valley..."
            className="w-full rounded-xl bg-white border border-slate-200 pl-10 pr-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#0B5ED7]"
          />
        </div>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 rounded-2xl bg-white border border-slate-200 shadow-xs p-4">
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">Vehicle Category</label>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className={inputClass}
          >
            <option value="All">All Categories</option>
            <option value="4x4 Jeep">4x4 Jeep</option>
            <option value="SUV">SUV</option>
            <option value="Car">Car</option>
            <option value="Hiace Van">Hiace Van</option>
            <option value="Coaster">Coaster</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">Driver Option</label>
          <select
            value={driverFilter}
            onChange={(e) =>
              setDriverFilter(e.target.value as 'all' | 'with_driver' | 'without_driver')
            }
            className={inputClass}
          >
            <option value="all">Both Options</option>
            <option value="with_driver">With Driver Available</option>
            <option value="without_driver">Without Driver (Self-Drive Eligible)</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">Minimum Seats</label>
          <select
            value={minSeats}
            onChange={(e) => setMinSeats(Number(e.target.value))}
            className={inputClass}
          >
            <option value={1}>Any Seat Count</option>
            <option value={5}>5+ Seats</option>
            <option value={7}>7+ Seats</option>
            <option value={12}>12+ Seats (Vans)</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {filtered.map((veh) => (
          <div
            key={veh.id}
            className="rounded-2xl bg-white border border-slate-200 shadow-xs overflow-hidden flex flex-col hover:shadow-md transition-shadow"
          >
            <div className="aspect-[4/3] relative">
              <ResilientImage
                src={veh.imageUrl}
                alt={veh.name}
                className="w-full h-full object-cover"
              />
              <span className="absolute top-3 left-3 px-2.5 py-1 rounded-md bg-white/95 text-[#0B5ED7] text-[11px] font-bold">
                {veh.category}
              </span>
            </div>
            <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
              <div className="space-y-1.5">
                <h2 className="text-lg font-bold font-display text-slate-900">{veh.name}</h2>
                <p className="text-xs text-slate-500 flex items-center gap-3">
                  <span className="inline-flex items-center gap-1">
                    <Car className="w-3.5 h-3.5 text-[#0B5ED7]" />
                    {veh.category}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Users className="w-3.5 h-3.5 text-[#0B5ED7]" />
                    {veh.seats} seats
                  </span>
                </p>
                <p className="text-xs text-slate-600">Pickup: {veh.pickupLocation}</p>
                <p className="text-xs font-semibold text-[#F97316]">
                  {veh.driverOption === 'both'
                    ? 'With Driver or Self-Drive'
                    : veh.driverOption === 'with_driver_only'
                    ? 'With Driver Only'
                    : 'Without Driver (Self-Drive Only)'}
                </p>
              </div>
              <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                <div>
                  <span className="text-[11px] text-slate-400 block">Daily Rate</span>
                  <span className="text-sm font-extrabold font-mono-num text-[#0B5ED7]">
                    {formatPkr(veh.pricePerDayPkr)}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => openVehicle(veh)}
                  className="px-4 py-2 rounded-full bg-[#0B5ED7] text-white text-xs font-bold hover:bg-[#0842A0] transition-colors cursor-pointer"
                >
                  Rent Vehicle
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
