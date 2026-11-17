import React, { useEffect, useMemo, useState } from 'react';
import { Building2, Car, CheckCircle2, MessageSquare, Plus, Trash2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useMarketplace } from '../../context/MarketplaceContext';
import { DriverOption, formatPkr, Vehicle } from '../../types/travelmate';
import { MessagingPanel } from './MessagingPanel';

export function HotelDashboard() {
  const { firebaseUser, isAdmin, dashboardTargetTab, setDashboardTargetTab } = useAuth();
  const { hotels, bookings, upsertHotel, deleteHotel, updateBookingStatus, setMessagingTarget } =
    useMarketplace();
  const uid = firebaseUser?.uid || '';

  const [tab, setTab] = useState<'hotels' | 'reservations' | 'messages'>('hotels');
  const [name, setName] = useState('');
  const [destination, setDestination] = useState('Hunza Valley');
  const [address, setAddress] = useState('');
  const [description, setDescription] = useState('');
  const [deluxePrice, setDeluxePrice] = useState(16000);
  const [familyPrice, setFamilyPrice] = useState(25000);
  const [msg, setMsg] = useState<string | null>(null);
  const [actionErr, setActionErr] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    if (
      dashboardTargetTab === 'hotels' ||
      dashboardTargetTab === 'reservations' ||
      dashboardTargetTab === 'messages'
    ) {
      setTab(dashboardTargetTab);
    }
  }, [dashboardTargetTab]);

  const myHotels = useMemo(
    () => (isAdmin ? hotels : hotels.filter((h) => h.ownerUid === uid)),
    [hotels, uid, isAdmin]
  );
  const myReservations = useMemo(
    () =>
      isAdmin
        ? bookings.filter((b) => b.bookingType === 'hotel')
        : bookings.filter((b) => b.providerUid === uid && b.bookingType === 'hotel'),
    [bookings, uid, isAdmin]
  );

  const handleAddHotel = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null);
    setActionErr(null);
    try {
      await upsertHotel({
        name,
        destination,
        address,
        description,
        startingPricePkr: deluxePrice,
        facilities: ['Free Wi-Fi', 'Mountain View', 'Breakfast Included', 'Free Parking'],
        rooms: [
          { roomType: 'Double', pricePerNightPkr: Math.round(deluxePrice * 0.8), totalRooms: 8, maxGuests: 2 },
          { roomType: 'Deluxe', pricePerNightPkr: deluxePrice, totalRooms: 6, maxGuests: 3 },
          { roomType: 'Family', pricePerNightPkr: familyPrice, totalRooms: 4, maxGuests: 5 },
        ],
      });
      setName('');
      setAddress('');
      setDescription('');
      setMsg('Hotel registered successfully!');
    } catch (err) {
      setActionErr(err instanceof Error ? err.message : 'Unable to register hotel.');
    }
  };

  const handleStatusChange = async (
    booking: (typeof myReservations)[number],
    status: 'accepted' | 'rejected' | 'confirmed' | 'completed'
  ) => {
    setBusyId(booking.id);
    setMsg(null);
    setActionErr(null);
    try {
      await updateBookingStatus(booking, status);
      setMsg(`Reservation for "${booking.listingTitle}" marked as ${status}.`);
    } catch (err) {
      setActionErr(err instanceof Error ? err.message : 'Failed to update reservation.');
    } finally {
      setBusyId(null);
    }
  };

  const inputClass =
    'w-full rounded-xl bg-slate-50 border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-[#0B5ED7] focus:bg-white';

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        {(
          [
            { id: 'hotels', label: `My Hotels (${myHotels.length})` },
            { id: 'reservations', label: `Reservations (${myReservations.length})` },
            { id: 'messages', label: 'Messages' },
          ] as const
        ).map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => {
              setTab(t.id);
              setDashboardTargetTab(t.id);
            }}
            className={`px-4 py-2 rounded-full text-xs font-semibold cursor-pointer ${
              tab === t.id
                ? 'bg-[#0B5ED7] text-white shadow-xs'
                : 'bg-white text-slate-600 border border-slate-200 hover:text-slate-900'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {msg && (
        <div className="rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-3 text-xs font-medium text-emerald-800 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
          <span>{msg}</span>
        </div>
      )}
      {actionErr && (
        <div className="rounded-xl bg-rose-50 border border-rose-200 px-4 py-3 text-xs font-medium text-rose-700">
          {actionErr}
        </div>
      )}

      {tab === 'hotels' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <form
            onSubmit={handleAddHotel}
            className="lg:col-span-5 rounded-2xl bg-white border border-slate-200 shadow-xs p-6 space-y-4 h-fit"
          >
            <h3 className="text-lg font-bold font-display text-slate-900 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-[#0B5ED7]" /> Register Hotel Property
            </h3>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Hotel / Lodge Name"
              className={inputClass}
            />
            <input
              type="text"
              required
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              placeholder="Destination (e.g., Skardu & Kachura)"
              className={inputClass}
            />
            <input
              type="text"
              required
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Street / Valley Address"
              className={inputClass}
            />
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Deluxe Room / Night
                </label>
                <input
                  type="number"
                  min={2000}
                  step={500}
                  value={deluxePrice}
                  onChange={(e) => setDeluxePrice(Number(e.target.value))}
                  className={`${inputClass} font-mono-num`}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Family Suite / Night
                </label>
                <input
                  type="number"
                  min={3000}
                  step={500}
                  value={familyPrice}
                  onChange={(e) => setFamilyPrice(Number(e.target.value))}
                  className={`${inputClass} font-mono-num`}
                />
              </div>
            </div>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe room views, dining, parking..."
              className={inputClass}
            />
            <button
              type="submit"
              className="w-full py-2.5 rounded-full bg-[#0B5ED7] text-white text-xs font-bold hover:bg-[#0842A0] cursor-pointer"
            >
              Add Hotel Listing
            </button>
          </form>

          <div className="lg:col-span-7 space-y-3">
            {myHotels.map((h) => (
              <div
                key={h.id}
                className="rounded-2xl bg-white border border-slate-200 shadow-xs p-5 flex items-center justify-between gap-4"
              >
                <div>
                  <p className="text-base font-bold text-slate-900">{h.name}</p>
                  <p className="text-xs text-slate-600 mt-0.5">
                    {h.destination} · Starting {formatPkr(h.startingPricePkr)}/night · Status:{' '}
                    <span className="text-[#0B5ED7] font-bold uppercase">{h.verificationStatus}</span>
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => void deleteHotel(h.id)}
                  className="p-2 text-rose-500 hover:bg-rose-50 rounded-full cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
            {myHotels.length === 0 && (
              <div className="rounded-2xl bg-white border border-slate-200 p-10 text-center text-sm text-slate-500">
                No hotels registered yet.
              </div>
            )}
          </div>
        </div>
      )}

      {tab === 'reservations' && (
        <div className="space-y-3">
          {myReservations.map((b) => (
            <div
              key={b.id}
              className="rounded-2xl bg-white border border-slate-200 shadow-xs p-5 flex flex-wrap items-center justify-between gap-4"
            >
              <div>
                <p className="text-sm font-bold text-slate-900">
                  {b.listingTitle} ({b.roomType || 'Standard'})
                </p>
                <p className="text-xs text-slate-600 mt-0.5">
                  Guest: {b.touristName} · {b.startDate} to {b.endDate} ({b.daysCount} nights) ·{' '}
                  <span className="font-mono-num font-bold text-[#0B5ED7]">
                    {formatPkr(b.estimatedTotalPkr)}
                  </span>{' '}
                  · <span className="uppercase font-semibold">{b.bookingStatus}</span>
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {b.bookingStatus === 'pending' && (
                  <>
                    <button
                      type="button"
                      disabled={busyId === b.id}
                      onClick={() => void handleStatusChange(b, 'accepted')}
                      className="px-4 py-1.5 rounded-full bg-[#0B5ED7] text-white text-xs font-bold hover:bg-[#0842A0] cursor-pointer"
                    >
                      {busyId === b.id ? 'Accepting...' : 'Accept'}
                    </button>
                    <button
                      type="button"
                      disabled={busyId === b.id}
                      onClick={() => void handleStatusChange(b, 'rejected')}
                      className="px-3.5 py-1.5 rounded-full border border-rose-200 bg-rose-50 text-rose-600 text-xs font-semibold cursor-pointer"
                    >
                      Reject
                    </button>
                  </>
                )}
                {b.bookingStatus === 'accepted' && (
                  <button
                    type="button"
                    disabled={busyId === b.id}
                    onClick={() => void handleStatusChange(b, 'confirmed')}
                    className="px-4 py-1.5 rounded-full bg-emerald-600 text-white text-xs font-bold cursor-pointer"
                  >
                    Confirm Stay
                  </button>
                )}
                {b.bookingStatus === 'confirmed' && (
                  <button
                    type="button"
                    disabled={busyId === b.id}
                    onClick={() => void handleStatusChange(b, 'completed')}
                    className="px-4 py-1.5 rounded-full bg-slate-900 text-white text-xs font-bold cursor-pointer"
                  >
                    Complete Checkout
                  </button>
                )}
                {b.touristUid && b.touristUid !== uid && (
                  <button
                    type="button"
                    onClick={() => {
                      setMessagingTarget({
                        recipientUid: b.touristUid,
                        recipientName: b.touristName,
                        relatedListingTitle: b.listingTitle,
                      });
                      setTab('messages');
                      setDashboardTargetTab('messages');
                    }}
                    className="px-3.5 py-1.5 rounded-full border border-slate-300 bg-white text-slate-700 text-xs font-semibold inline-flex items-center gap-1 hover:border-[#0B5ED7] hover:text-[#0B5ED7] cursor-pointer"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>Message Guest</span>
                  </button>
                )}
              </div>
            </div>
          ))}
          {myReservations.length === 0 && (
            <div className="rounded-2xl bg-white border border-slate-200 p-10 text-center text-sm text-slate-500">
              No hotel reservation requests yet.
            </div>
          )}
        </div>
      )}

      {tab === 'messages' && <MessagingPanel />}
    </div>
  );
}

export function VehicleDashboard() {
  const { firebaseUser, isAdmin, dashboardTargetTab, setDashboardTargetTab } = useAuth();
  const { vehicles, bookings, upsertVehicle, deleteVehicle, updateBookingStatus, setMessagingTarget } =
    useMarketplace();
  const uid = firebaseUser?.uid || '';

  const [tab, setTab] = useState<'vehicles' | 'requests' | 'messages'>('vehicles');
  const [name, setName] = useState('');
  const [category, setCategory] = useState<Vehicle['category']>('4x4 Jeep');
  const [seats, setSeats] = useState(7);
  const [pickupLocation, setPickupLocation] = useState('Skardu');
  const [pricePerDay, setPricePerDay] = useState(14000);
  const [driverOption, setDriverOption] = useState<DriverOption>('both');
  const [driverFee, setDriverFee] = useState(2500);
  const [msg, setMsg] = useState<string | null>(null);
  const [actionErr, setActionErr] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    if (
      dashboardTargetTab === 'vehicles' ||
      dashboardTargetTab === 'requests' ||
      dashboardTargetTab === 'messages'
    ) {
      setTab(dashboardTargetTab);
    }
  }, [dashboardTargetTab]);

  const myVehicles = useMemo(
    () => (isAdmin ? vehicles : vehicles.filter((v) => v.ownerUid === uid)),
    [vehicles, uid, isAdmin]
  );
  const myRentalBookings = useMemo(
    () =>
      isAdmin
        ? bookings.filter((b) => b.bookingType === 'vehicle')
        : bookings.filter((b) => b.providerUid === uid && b.bookingType === 'vehicle'),
    [bookings, uid, isAdmin]
  );

  const handleAddVehicle = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null);
    setActionErr(null);
    try {
      await upsertVehicle({
        name,
        category,
        seats,
        pickupLocation,
        pricePerDayPkr: pricePerDay,
        driverOption,
        driverFeePerDayPkr: driverOption === 'without_driver_only' ? 0 : driverFee,
        serviceAreas: [pickupLocation, 'Hunza Valley', 'Skardu & Kachura'],
      });
      setName('');
      setMsg('Vehicle added to your fleet!');
    } catch (err) {
      setActionErr(err instanceof Error ? err.message : 'Unable to register vehicle.');
    }
  };

  const handleStatusChange = async (
    booking: (typeof myRentalBookings)[number],
    status: 'accepted' | 'rejected' | 'active' | 'completed'
  ) => {
    setBusyId(booking.id);
    setMsg(null);
    setActionErr(null);
    try {
      await updateBookingStatus(booking, status);
      setMsg(`Rental "${booking.listingTitle}" marked as ${status}.`);
    } catch (err) {
      setActionErr(err instanceof Error ? err.message : 'Unable to update rental.');
    } finally {
      setBusyId(null);
    }
  };

  const inputClass =
    'w-full rounded-xl bg-slate-50 border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-[#0B5ED7] focus:bg-white';

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        {(
          [
            { id: 'vehicles', label: `My Fleet (${myVehicles.length})` },
            { id: 'requests', label: `Rental Requests (${myRentalBookings.length})` },
            { id: 'messages', label: 'Messages' },
          ] as const
        ).map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => {
              setTab(t.id);
              setDashboardTargetTab(t.id);
            }}
            className={`px-4 py-2 rounded-full text-xs font-semibold cursor-pointer ${
              tab === t.id
                ? 'bg-[#0B5ED7] text-white shadow-xs'
                : 'bg-white text-slate-600 border border-slate-200 hover:text-slate-900'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {msg && (
        <div className="rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-3 text-xs font-medium text-emerald-800 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
          <span>{msg}</span>
        </div>
      )}
      {actionErr && (
        <div className="rounded-xl bg-rose-50 border border-rose-200 px-4 py-3 text-xs font-medium text-rose-700">
          {actionErr}
        </div>
      )}

      {tab === 'vehicles' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <form
            onSubmit={handleAddVehicle}
            className="lg:col-span-5 rounded-2xl bg-white border border-slate-200 shadow-xs p-6 space-y-4 h-fit"
          >
            <h3 className="text-lg font-bold font-display text-slate-900 flex items-center gap-2">
              <Car className="w-5 h-5 text-[#0B5ED7]" /> Add Vehicle to Fleet
            </h3>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Vehicle Name (e.g., Toyota Prado TX 4x4)"
              className={inputClass}
            />
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as Vehicle['category'])}
                  className={inputClass}
                >
                  <option value="4x4 Jeep">4x4 Jeep</option>
                  <option value="SUV">SUV</option>
                  <option value="Car">Car</option>
                  <option value="Hiace Van">Hiace Van</option>
                  <option value="Coaster">Coaster</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Seats</label>
                <input
                  type="number"
                  min={2}
                  max={50}
                  value={seats}
                  onChange={(e) => setSeats(Number(e.target.value))}
                  className={`${inputClass} font-mono-num`}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Pickup City</label>
                <input
                  type="text"
                  required
                  value={pickupLocation}
                  onChange={(e) => setPickupLocation(e.target.value)}
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Daily Rate (PKR)
                </label>
                <input
                  type="number"
                  min={3000}
                  step={500}
                  value={pricePerDay}
                  onChange={(e) => setPricePerDay(Number(e.target.value))}
                  className={`${inputClass} font-mono-num`}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Driver Option</label>
                <select
                  value={driverOption}
                  onChange={(e) => setDriverOption(e.target.value as DriverOption)}
                  className={inputClass}
                >
                  <option value="both">Both (With or Without Driver)</option>
                  <option value="with_driver_only">With Driver Only</option>
                  <option value="without_driver_only">Without Driver Only</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Driver Fee / Day
                </label>
                <input
                  type="number"
                  min={0}
                  step={500}
                  disabled={driverOption === 'without_driver_only'}
                  value={driverFee}
                  onChange={(e) => setDriverFee(Number(e.target.value))}
                  className={`${inputClass} font-mono-num disabled:opacity-40`}
                />
              </div>
            </div>
            <button
              type="submit"
              className="w-full py-2.5 rounded-full bg-[#0B5ED7] text-white text-xs font-bold inline-flex items-center justify-center gap-1.5 hover:bg-[#0842A0] cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Register Vehicle
            </button>
          </form>

          <div className="lg:col-span-7 space-y-3">
            {myVehicles.map((v) => (
              <div
                key={v.id}
                className="rounded-2xl bg-white border border-slate-200 shadow-xs p-5 flex items-center justify-between gap-4"
              >
                <div>
                  <p className="text-base font-bold text-slate-900">{v.name}</p>
                  <p className="text-xs text-slate-600 mt-0.5">
                    {v.category} · {v.seats} seats · {formatPkr(v.pricePerDayPkr)}/day ·{' '}
                    <span className="text-[#0B5ED7] font-bold uppercase">{v.verificationStatus}</span>
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => void deleteVehicle(v.id)}
                  className="p-2 text-rose-500 hover:bg-rose-50 rounded-full cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
            {myVehicles.length === 0 && (
              <div className="rounded-2xl bg-white border border-slate-200 p-10 text-center text-sm text-slate-500">
                No vehicles registered yet.
              </div>
            )}
          </div>
        </div>
      )}

      {tab === 'requests' && (
        <div className="space-y-3">
          {myRentalBookings.map((b) => (
            <div
              key={b.id}
              className="rounded-2xl bg-white border border-slate-200 shadow-xs p-5 flex flex-wrap items-center justify-between gap-4"
            >
              <div>
                <p className="text-sm font-bold text-slate-900">{b.listingTitle}</p>
                <p className="text-xs text-slate-600 mt-0.5">
                  Renter: {b.touristName} · {b.startDate} to {b.endDate} ({b.daysCount} days) ·{' '}
                  {b.driverSelected ? 'With Driver' : 'Without Driver (Self-Drive)'} ·{' '}
                  <span className="font-mono-num font-bold text-[#0B5ED7]">
                    {formatPkr(b.estimatedTotalPkr)}
                  </span>{' '}
                  · <span className="uppercase font-semibold">{b.bookingStatus}</span>
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {b.bookingStatus === 'pending' && (
                  <>
                    <button
                      type="button"
                      disabled={busyId === b.id}
                      onClick={() => void handleStatusChange(b, 'accepted')}
                      className="px-4 py-1.5 rounded-full bg-[#0B5ED7] text-white text-xs font-bold hover:bg-[#0842A0] cursor-pointer"
                    >
                      {busyId === b.id ? 'Accepting...' : 'Accept'}
                    </button>
                    <button
                      type="button"
                      disabled={busyId === b.id}
                      onClick={() => void handleStatusChange(b, 'rejected')}
                      className="px-3.5 py-1.5 rounded-full border border-rose-200 bg-rose-50 text-rose-600 text-xs font-semibold cursor-pointer"
                    >
                      Reject
                    </button>
                  </>
                )}
                {b.bookingStatus === 'accepted' && (
                  <button
                    type="button"
                    disabled={busyId === b.id}
                    onClick={() => void handleStatusChange(b, 'active')}
                    className="px-4 py-1.5 rounded-full bg-emerald-600 text-white text-xs font-bold cursor-pointer"
                  >
                    Start Active Rental
                  </button>
                )}
                {['confirmed', 'active'].includes(b.bookingStatus) && (
                  <button
                    type="button"
                    disabled={busyId === b.id}
                    onClick={() => void handleStatusChange(b, 'completed')}
                    className="px-4 py-1.5 rounded-full bg-slate-900 text-white text-xs font-bold cursor-pointer"
                  >
                    Mark Completed
                  </button>
                )}
                {b.touristUid && b.touristUid !== uid && (
                  <button
                    type="button"
                    onClick={() => {
                      setMessagingTarget({
                        recipientUid: b.touristUid,
                        recipientName: b.touristName,
                        relatedListingTitle: b.listingTitle,
                      });
                      setTab('messages');
                      setDashboardTargetTab('messages');
                    }}
                    className="px-3.5 py-1.5 rounded-full border border-slate-300 bg-white text-slate-700 text-xs font-semibold inline-flex items-center gap-1 hover:border-[#0B5ED7] hover:text-[#0B5ED7] cursor-pointer"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>Message Renter</span>
                  </button>
                )}
              </div>
            </div>
          ))}
          {myRentalBookings.length === 0 && (
            <div className="rounded-2xl bg-white border border-slate-200 p-10 text-center text-sm text-slate-500">
              No vehicle rental requests yet.
            </div>
          )}
        </div>
      )}

      {tab === 'messages' && <MessagingPanel />}
    </div>
  );
}
