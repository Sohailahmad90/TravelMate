import React, { useEffect, useMemo, useState } from 'react';
import {
  Bell,
  Bookmark,
  Calendar,
  CreditCard,
  MessageSquare,
  Send,
  Settings,
  Star,
  Trash2,
  User,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useMarketplace } from '../../context/MarketplaceContext';
import {
  ActivePage,
  Booking,
  calculateDaysBetween,
  formatPkr,
} from '../../types/travelmate';
import { MessagingPanel } from './MessagingPanel';

interface TouristDashboardProps {
  onNavigate: (page: ActivePage, extra?: { id?: string }) => void;
  onOpenPaymentModal: () => void;
}

export function TouristDashboard({
  onNavigate,
  onOpenPaymentModal,
}: TouristDashboardProps) {
  const {
    firebaseUser,
    profile,
    updateProfileInfo,
    openProfileSettings,
    dashboardTargetTab,
    setDashboardTargetTab,
  } = useAuth();
  const {
    destinations,
    guides,
    travelPlans,
    guideRequests,
    bookings,
    notifications,
    setMessagingTarget,
    deleteTravelPlan,
    respondToGuideRequest,
    createBooking,
    updateBookingStatus,
    markNotificationRead,
    submitReview,
  } = useMarketplace();

  const [tab, setTab] = useState<
    'overview' | 'plans' | 'requests' | 'bookings' | 'saved' | 'messages' | 'notifications' | 'settings'
  >('overview');

  useEffect(() => {
    const valid = [
      'overview',
      'plans',
      'requests',
      'bookings',
      'saved',
      'messages',
      'notifications',
      'settings',
    ];
    if (dashboardTargetTab && valid.includes(dashboardTargetTab)) {
      setTab(dashboardTargetTab as typeof tab);
    }
  }, [dashboardTargetTab]);

  const selectTab = (next: typeof tab) => {
    setTab(next);
    setDashboardTargetTab(next);
  };

  const openChatWith = (recipientUid: string, recipientName: string, relatedListingTitle?: string) => {
    setMessagingTarget({ recipientUid, recipientName, relatedListingTitle });
    selectTab('messages');
  };

  const [bookingTypeFilter, setBookingTypeFilter] = useState<string>('all');
  const [reviewBooking, setReviewBooking] = useState<Booking | null>(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewStatus, setReviewStatus] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionMsg, setActionMsg] = useState<string | null>(null);

  const [fullName, setFullName] = useState(profile?.fullName || '');
  const [phone, setPhone] = useState(profile?.phone || '');
  const [city, setCity] = useState(profile?.city || '');
  const [settingsMsg, setSettingsMsg] = useState<string | null>(null);

  const myBookings = useMemo(
    () => bookings.filter((b) => b.touristUid === firebaseUser?.uid),
    [bookings, firebaseUser?.uid]
  );

  const filteredBookings = useMemo(
    () =>
      bookingTypeFilter === 'all'
        ? myBookings
        : myBookings.filter((b) => b.bookingType === bookingTypeFilter),
    [myBookings, bookingTypeFilter]
  );

  const myRequests = useMemo(
    () => guideRequests.filter((r) => r.touristUid === firebaseUser?.uid),
    [guideRequests, firebaseUser?.uid]
  );

  const savedDests = useMemo(
    () => destinations.filter((d) => profile?.savedDestinationIds?.includes(d.id)),
    [destinations, profile?.savedDestinationIds]
  );

  const savedGuides = useMemo(
    () => guides.filter((g) => profile?.savedGuideIds?.includes(g.guideId)),
    [guides, profile?.savedGuideIds]
  );

  const unreadNotifs = notifications.filter((n) => !n.isRead).length;

  const handleConvertQuoteToBooking = async (reqId: string) => {
    const req = myRequests.find((r) => r.id === reqId);
    if (!req) return;
    setActionError(null);
    setActionMsg(null);
    try {
      await respondToGuideRequest(req, { status: 'booking_requested' });
      await createBooking({
        bookingType: 'guide_custom',
        providerUid: req.guideOwnerUid,
        providerName: req.guideName,
        listingId: req.guideId,
        listingTitle: req.tripTitle,
        destination: req.destinations.join(', '),
        startDate: req.departureDate,
        endDate: req.returnDate,
        daysCount: calculateDaysBetween(req.departureDate, req.returnDate),
        guestsCount: req.travelersCount,
        estimatedTotalPkr: req.quotedPricePkr || req.budgetPkr,
        notes: req.proposedItinerary || req.notes,
      });
      setActionMsg(`Booking request created for "${req.tripTitle}".`);
      setTab('bookings');
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Unable to confirm booking.');
    }
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewBooking) return;
    const targetType =
      reviewBooking.bookingType === 'hotel'
        ? 'hotel'
        : reviewBooking.bookingType === 'vehicle'
        ? 'vehicle'
        : 'guide';
    setReviewStatus(null);
    try {
      await submitReview({
        targetType,
        targetId: reviewBooking.listingId,
        targetName: reviewBooking.listingTitle,
        providerUid: reviewBooking.providerUid,
        bookingId: reviewBooking.id,
        rating: reviewRating,
        comment: reviewComment,
      });
      setReviewStatus('Review published! Thank you for sharing your experience.');
      setReviewComment('');
      setReviewBooking(null);
    } catch (err) {
      setReviewStatus(err instanceof Error ? err.message : 'Unable to post review.');
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateProfileInfo({ fullName, phone, city });
      setSettingsMsg('Account settings saved.');
    } catch (err) {
      setSettingsMsg(err instanceof Error ? err.message : 'Unable to save settings.');
    }
  };

  const inputClass =
    'w-full rounded-xl bg-slate-50 border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-[#0B5ED7] focus:bg-white';

  return (
    <div className="space-y-6">
      {/* Sub-navigation */}
      <div className="flex flex-wrap items-center gap-2">
        {(
          [
            { id: 'overview', label: 'Overview' },
            { id: 'plans', label: `Travel Plans (${travelPlans.length})` },
            { id: 'requests', label: `Guide Quotations (${myRequests.length})` },
            { id: 'bookings', label: `My Bookings (${myBookings.length})` },
            { id: 'saved', label: `Saved (${savedDests.length + savedGuides.length})` },
            { id: 'messages', label: 'Messages' },
            { id: 'notifications', label: `Alerts (${unreadNotifs})` },
            { id: 'settings', label: 'Profile Settings' },
          ] as const
        ).map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => selectTab(item.id)}
            className={`px-4 py-2 rounded-full text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              tab === item.id
                ? 'bg-[#0B5ED7] text-white shadow-xs'
                : 'bg-white text-slate-600 border border-slate-200 hover:text-slate-900'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {actionMsg && (
        <div className="rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-3 text-xs font-medium text-emerald-800">
          {actionMsg}
        </div>
      )}
      {actionError && (
        <div className="rounded-xl bg-rose-50 border border-rose-200 px-4 py-3 text-xs font-medium text-rose-700">
          {actionError}
        </div>
      )}

      {tab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Saved Travel Plans', val: travelPlans.length },
              { label: 'Guide Requests', val: myRequests.length },
              { label: 'Active Bookings', val: myBookings.length },
              { label: 'Unread Alerts', val: unreadNotifs },
            ].map((stat) => (
              <div
                key={stat.label}
                className="rounded-2xl bg-white border border-slate-200 shadow-xs p-5"
              >
                <span className="text-xs text-slate-500 font-medium">{stat.label}</span>
                <p className="text-3xl font-extrabold font-mono-num text-[#0B5ED7] mt-1">
                  {stat.val}
                </p>
              </div>
            ))}
          </div>

          <div className="rounded-2xl bg-white border border-slate-200 shadow-xs p-6 flex flex-wrap items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold font-display text-slate-900">
                Ready for your next Northern Pakistan trip?
              </h3>
              <p className="text-xs text-slate-600 mt-1">
                Plan a custom multi-valley itinerary, book hotels directly, or reserve a 4x4 Jeep.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => onNavigate('trip-planner')}
                className="px-5 py-2.5 rounded-full bg-[#0B5ED7] text-white text-xs font-bold hover:bg-[#0842A0] cursor-pointer"
              >
                Create Travel Plan
              </button>
              <button
                type="button"
                onClick={() => onNavigate('hotels')}
                className="px-5 py-2.5 rounded-full border border-slate-300 bg-white text-xs font-semibold text-slate-700 hover:border-[#0B5ED7] hover:text-[#0B5ED7] cursor-pointer"
              >
                Book Hotel
              </button>
              <button
                type="button"
                onClick={() => onNavigate('vehicles')}
                className="px-5 py-2.5 rounded-full border border-slate-300 bg-white text-xs font-semibold text-slate-700 hover:border-[#0B5ED7] hover:text-[#0B5ED7] cursor-pointer"
              >
                Rent Vehicle
              </button>
            </div>
          </div>
        </div>
      )}

      {tab === 'plans' && (
        <div className="space-y-4">
          {travelPlans.length === 0 ? (
            <div className="rounded-2xl bg-white border border-slate-200 p-10 text-center space-y-3">
              <Calendar className="w-8 h-8 text-[#0B5ED7] mx-auto" />
              <p className="text-sm text-slate-900 font-semibold">No custom travel plans yet.</p>
              <button
                type="button"
                onClick={() => onNavigate('trip-planner')}
                className="px-5 py-2 rounded-full bg-[#0B5ED7] text-white text-xs font-bold cursor-pointer"
              >
                Launch Custom Trip Planner
              </button>
            </div>
          ) : (
            travelPlans.map((plan) => (
              <div
                key={plan.id}
                className="rounded-2xl bg-white border border-slate-200 shadow-xs p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="space-y-1">
                  <p className="text-base font-bold text-slate-900">{plan.title}</p>
                  <p className="text-xs text-slate-600">
                    {plan.startingLocation} &rarr; {plan.destinations.join(', ')} ·{' '}
                    {plan.departureDate} to {plan.returnDate} · {plan.travelersCount} guests
                  </p>
                  <p className="text-xs text-[#0B5ED7] font-mono-num font-semibold">
                    Target Budget: {formatPkr(plan.budgetPkr)} · Est:{' '}
                    {formatPkr(plan.estimatedCostPkr)} · Status: {plan.status}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={() => onNavigate('trip-planner')}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-xs font-semibold text-[#0B5ED7] hover:bg-blue-100 cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Send Plan to Guides</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => void deleteTravelPlan(plan.id)}
                    className="inline-flex items-center gap-1.5 text-xs text-rose-600 hover:underline cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" /> Delete
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {tab === 'requests' && (
        <div className="space-y-4">
          {myRequests.length === 0 ? (
            <div className="rounded-2xl bg-white border border-slate-200 p-10 text-center text-sm text-slate-500">
              No guide requests sent yet. Browse Tour Guides or use the Custom Trip Planner.
            </div>
          ) : (
            myRequests.map((req) => (
              <div
                key={req.id}
                className="rounded-2xl bg-white border border-slate-200 shadow-xs p-6 space-y-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <h3 className="text-base font-bold text-slate-900">{req.tripTitle}</h3>
                    <p className="text-xs text-slate-600 mt-1">
                      Guide: {req.guideName} · {req.destinations.join(', ')} · {req.departureDate} –{' '}
                      {req.returnDate}
                    </p>
                  </div>
                  <span className="text-xs font-mono-num uppercase text-[#0B5ED7] font-bold">
                    {req.status.replace('_', ' ')}
                  </span>
                </div>

                {req.quotedPricePkr && (
                  <div className="rounded-xl bg-blue-50/70 border border-blue-200 p-4 space-y-2 text-xs">
                    <p className="font-bold text-slate-900">
                      Guide Quotation / Accepted Rate:{' '}
                      <span className="text-[#0B5ED7] font-mono-num">
                        {formatPkr(req.quotedPricePkr)}
                      </span>
                    </p>
                    {req.proposedItinerary && (
                      <p className="text-slate-700">{req.proposedItinerary}</p>
                    )}
                    {req.guideMessage && (
                      <p className="text-slate-600 italic">“{req.guideMessage}”</p>
                    )}
                  </div>
                )}

                <div className="flex flex-wrap gap-2.5">
                  <button
                    type="button"
                    onClick={() => openChatWith(req.guideOwnerUid, req.guideName, req.tripTitle)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full border border-slate-300 bg-white text-slate-700 text-xs font-semibold hover:border-[#0B5ED7] hover:text-[#0B5ED7] cursor-pointer"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>Message Guide</span>
                  </button>
                  {['quotation_sent', 'accepted'].includes(req.status) && (
                    <>
                      <button
                        type="button"
                        onClick={() => void handleConvertQuoteToBooking(req.id)}
                        className="px-4 py-2 rounded-full bg-[#0B5ED7] text-white text-xs font-bold hover:bg-[#0842A0] cursor-pointer"
                      >
                        Accept &amp; Confirm Booking
                      </button>
                      <button
                        type="button"
                        onClick={() => void respondToGuideRequest(req, { status: 'rejected' })}
                        className="px-4 py-2 rounded-full border border-rose-200 bg-rose-50 text-rose-600 text-xs font-semibold cursor-pointer"
                      >
                        Decline
                      </button>
                    </>
                  )}
                  {['pending', 'viewed'].includes(req.status) && (
                    <button
                      type="button"
                      onClick={() => void respondToGuideRequest(req, { status: 'cancelled' })}
                      className="px-4 py-2 rounded-full border border-slate-300 text-xs font-semibold text-slate-600 cursor-pointer"
                    >
                      Cancel Request
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {tab === 'bookings' && (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {[
              { id: 'all', label: 'All Bookings' },
              { id: 'package', label: 'Tour Packages' },
              { id: 'guide_custom', label: 'Guide Custom' },
              { id: 'hotel', label: 'Hotels' },
              { id: 'vehicle', label: 'Vehicles' },
            ].map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setBookingTypeFilter(f.id)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold cursor-pointer ${
                  bookingTypeFilter === f.id
                    ? 'bg-slate-900 text-white'
                    : 'bg-white text-slate-600 border border-slate-200'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {reviewStatus && (
            <p className="text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl p-3">
              {reviewStatus}
            </p>
          )}

          {reviewBooking && (
            <form
              onSubmit={handleSubmitReview}
              className="rounded-2xl bg-white border border-[#0B5ED7] shadow-sm p-6 space-y-4"
            >
              <h3 className="text-base font-bold text-slate-900">
                Write Verified Review for {reviewBooking.listingTitle}
              </h3>
              <div className="flex items-center gap-3">
                <label className="text-xs font-semibold text-slate-700">Rating:</label>
                <select
                  value={reviewRating}
                  onChange={(e) => setReviewRating(Number(e.target.value))}
                  className="rounded-lg bg-slate-50 border border-slate-200 px-3 py-1.5 text-sm text-slate-900"
                >
                  {[5, 4, 3, 2, 1].map((n) => (
                    <option key={n} value={n}>
                      {n} Stars
                    </option>
                  ))}
                </select>
              </div>
              <textarea
                rows={3}
                required
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
                placeholder="Share your honest experience..."
                className="w-full rounded-xl bg-slate-50 border border-slate-200 p-3 text-sm text-slate-900"
              />
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="px-5 py-2 rounded-full bg-[#0B5ED7] text-white text-xs font-bold cursor-pointer"
                >
                  Publish Review
                </button>
                <button
                  type="button"
                  onClick={() => setReviewBooking(null)}
                  className="px-4 py-2 rounded-full border border-slate-300 text-xs font-semibold text-slate-600 cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}

          {filteredBookings.length === 0 ? (
            <div className="rounded-2xl bg-white border border-slate-200 p-10 text-center text-sm text-slate-500">
              No bookings found under this filter.
            </div>
          ) : (
            filteredBookings.map((b) => (
              <div
                key={b.id}
                className="rounded-2xl bg-white border border-slate-200 shadow-xs p-5 flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="space-y-1">
                  <p className="text-xs text-[#0B5ED7] uppercase font-bold">
                    {b.bookingType.replace('_', ' ')} · Status: {b.bookingStatus}
                  </p>
                  <h3 className="text-base font-bold text-slate-900">{b.listingTitle}</h3>
                  <p className="text-xs text-slate-600">
                    Provider: {b.providerName} · {b.startDate} to {b.endDate} ({b.daysCount} days)
                    {b.roomType ? ` · Room: ${b.roomType}` : ''}
                    {b.bookingType === 'vehicle'
                      ? b.driverSelected
                        ? ' · With Driver'
                        : ' · Self-Drive'
                      : ''}
                  </p>
                  <p className="text-xs font-mono-num font-semibold text-slate-900">
                    Estimated Total: {formatPkr(b.estimatedTotalPkr)} · Payment: Coming Soon
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => openChatWith(b.providerUid, b.providerName, b.listingTitle)}
                    className="px-3.5 py-2 rounded-full border border-slate-300 bg-white text-slate-700 text-xs font-semibold inline-flex items-center gap-1.5 hover:border-[#0B5ED7] hover:text-[#0B5ED7] cursor-pointer"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>Message Partner</span>
                  </button>
                  <button
                    type="button"
                    onClick={onOpenPaymentModal}
                    className="px-3.5 py-2 rounded-full border border-slate-200 bg-slate-50 text-slate-700 text-xs font-semibold inline-flex items-center gap-1.5 hover:border-[#0B5ED7] hover:text-[#0B5ED7] cursor-pointer"
                  >
                    <CreditCard className="w-3.5 h-3.5" />
                    Pay Now (Coming Soon)
                  </button>
                  {b.bookingStatus === 'completed' && (
                    <button
                      type="button"
                      onClick={() => setReviewBooking(b)}
                      className="px-3.5 py-2 rounded-full bg-[#0B5ED7] text-white text-xs font-bold inline-flex items-center gap-1 cursor-pointer"
                    >
                      <Star className="w-3.5 h-3.5" />
                      Leave Review
                    </button>
                  )}
                  {!['completed', 'cancelled', 'rejected'].includes(b.bookingStatus) && (
                    <button
                      type="button"
                      onClick={() => void updateBookingStatus(b, 'cancelled')}
                      className="px-3.5 py-2 rounded-full border border-rose-200 bg-rose-50 text-rose-600 text-xs font-semibold cursor-pointer"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {tab === 'saved' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="rounded-2xl bg-white border border-slate-200 shadow-xs p-6 space-y-3">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Bookmark className="w-4 h-4 text-[#0B5ED7]" />
              Saved Destinations ({savedDests.length})
            </h3>
            {savedDests.map((d) => (
              <div
                key={d.id}
                className="flex items-center justify-between text-sm border-b border-slate-100 pb-2"
              >
                <span className="text-slate-700 font-medium">{d.name}</span>
                <button
                  type="button"
                  onClick={() => onNavigate('destinations', { id: d.id })}
                  className="text-xs font-semibold text-[#0B5ED7] hover:underline cursor-pointer"
                >
                  Open
                </button>
              </div>
            ))}
            {savedDests.length === 0 && (
              <p className="text-xs text-slate-500">No saved destinations yet.</p>
            )}
          </div>

          <div className="rounded-2xl bg-white border border-slate-200 shadow-xs p-6 space-y-3">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <User className="w-4 h-4 text-[#0B5ED7]" />
              Saved Tour Guides ({savedGuides.length})
            </h3>
            {savedGuides.map((g) => (
              <div
                key={g.guideId}
                className="flex items-center justify-between text-sm border-b border-slate-100 pb-2"
              >
                <span className="text-slate-700 font-medium">{g.displayName}</span>
                <button
                  type="button"
                  onClick={() => onNavigate('guides', { id: g.guideId })}
                  className="text-xs font-semibold text-[#0B5ED7] hover:underline cursor-pointer"
                >
                  View
                </button>
              </div>
            ))}
            {savedGuides.length === 0 && (
              <p className="text-xs text-slate-500">No saved guides yet.</p>
            )}
          </div>
        </div>
      )}

      {tab === 'messages' && <MessagingPanel />}

      {tab === 'notifications' && (
        <div className="space-y-3">
          {notifications.length === 0 ? (
            <div className="rounded-2xl bg-white border border-slate-200 p-10 text-center text-sm text-slate-500">
              <Bell className="w-7 h-7 text-[#0B5ED7] mx-auto mb-2" />
              No notifications yet.
            </div>
          ) : (
            notifications.map((n) => (
              <div
                key={n.id}
                className={`rounded-2xl border p-4 flex items-center justify-between gap-4 ${
                  n.isRead
                    ? 'bg-slate-50 border-slate-200 text-slate-500'
                    : 'bg-white border-blue-200 text-slate-900 shadow-xs'
                }`}
              >
                <div>
                  <p className="text-sm font-bold">{n.title}</p>
                  <p className="text-xs mt-0.5">{n.body}</p>
                </div>
                {!n.isRead && (
                  <button
                    type="button"
                    onClick={() => void markNotificationRead(n.id)}
                    className="text-xs text-[#0B5ED7] font-bold whitespace-nowrap cursor-pointer"
                  >
                    Mark Read
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {tab === 'settings' && (
        <form
          onSubmit={handleSaveSettings}
          className="max-w-xl rounded-2xl bg-white border border-slate-200 shadow-xs p-6 space-y-4"
        >
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-lg font-bold font-display text-slate-900">Account Settings</h3>
            <button
              type="button"
              onClick={openProfileSettings}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#0B5ED7] hover:underline cursor-pointer"
            >
              <Settings className="w-3.5 h-3.5" />
              <span>Edit Photo &amp; Email</span>
            </button>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name</label>
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Phone Number</label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">City</label>
            <input
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className={inputClass}
            />
          </div>
          {settingsMsg && <p className="text-xs font-medium text-emerald-600">{settingsMsg}</p>}
          <button
            type="submit"
            className="px-6 py-2.5 rounded-full bg-[#0B5ED7] text-white text-xs font-bold hover:bg-[#0842A0] cursor-pointer"
          >
            Save Settings
          </button>
        </form>
      )}
    </div>
  );
}
