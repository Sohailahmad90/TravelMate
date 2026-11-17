import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowRight,
  BadgeCheck,
  Building2,
  Car,
  CheckCircle2,
  Lock,
  MessageSquare,
  Pencil,
  Plus,
  ShieldAlert,
  Trash2,
  Video,
  X,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useMarketplace } from '../../context/MarketplaceContext';
import {
  ActivePage,
  formatPkr,
  GuidePackage,
  GuideRequest,
} from '../../types/travelmate';
import { MessagingPanel } from './MessagingPanel';

interface GuideDashboardProps {
  onNavigate?: (page: ActivePage, extra?: { id?: string }) => void;
}

const PACKAGE_IMAGE_OPTIONS = [
  {
    label: 'Hunza Valley & Baltit Fort',
    url: '/src/assets/images/dest_hunza_baltit_1794920585672.jpg',
  },
  {
    label: 'Skardu & Upper Kachura Lake',
    url: '/src/assets/images/dest_skardu_shangrila_1794920587347.jpg',
  },
  {
    label: 'Fairy Meadows & Nanga Parbat',
    url: '/src/assets/images/dest_fairy_meadows_1794920586767.jpg',
  },
  {
    label: 'Swat & Naran Alpine Lakes',
    url: '/src/assets/images/dest_swat_naran_1794920588579.jpg',
  },
  {
    label: 'Attabad Lake & Karakoram Highway',
    url: '/src/assets/images/hero_pakistan_hunza_1794920586950.jpg',
  },
];

type GuideTab =
  | 'overview'
  | 'packages'
  | 'requests'
  | 'bookings'
  | 'my-rentals'
  | 'verification'
  | 'videos'
  | 'messages'
  | 'reviews';

const VALID_TABS: GuideTab[] = [
  'overview',
  'packages',
  'requests',
  'bookings',
  'my-rentals',
  'verification',
  'videos',
  'messages',
  'reviews',
];

export function GuideDashboard({ onNavigate }: GuideDashboardProps) {
  const { firebaseUser, profile, dashboardTargetTab, setDashboardTargetTab } = useAuth();
  const {
    guides,
    guideVideos,
    packages,
    guideRequests,
    bookings,
    reviews,
    myVerification,
    setMessagingTarget,
    upsertGuideProfile,
    submitGuideVerification,
    addGuideVideo,
    deleteGuideVideo,
    upsertPackage,
    deletePackage,
    respondToGuideRequest,
    updateBookingStatus,
    replyToReview,
  } = useMarketplace();

  const uid = firebaseUser?.uid || '';
  const myGuide = guides.find((g) => g.guideId === uid);
  const verificationStatus = myVerification?.status || myGuide?.verificationStatus || 'not_submitted';
  const isVerified = verificationStatus === 'verified';

  const [tab, setTab] = useState<GuideTab>('overview');
  const pkgFormRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (dashboardTargetTab && VALID_TABS.includes(dashboardTargetTab as GuideTab)) {
      setTab(dashboardTargetTab as GuideTab);
    }
  }, [dashboardTargetTab]);

  const selectTab = (next: GuideTab) => {
    setTab(next);
    setDashboardTargetTab(next);
  };

  const openChatWith = (recipientUid: string, recipientName: string, relatedListingTitle?: string) => {
    setMessagingTarget({ recipientUid, recipientName, relatedListingTitle });
    selectTab('messages');
  };

  // Profile form state (empty by default unless saved profile exists)
  const [displayName, setDisplayName] = useState(
    myGuide?.displayName || profile?.fullName || ''
  );
  const [bio, setBio] = useState(myGuide?.bio || '');
  const [expYears, setExpYears] = useState(
    myGuide?.experienceYears ? String(myGuide.experienceYears) : ''
  );
  const [startingPrice, setStartingPrice] = useState(
    myGuide?.startingPricePkr ? String(myGuide.startingPricePkr) : ''
  );
  const [languagesText, setLanguagesText] = useState(
    myGuide?.languages?.length ? myGuide.languages.join(', ') : ''
  );
  const [destsText, setDestsText] = useState(
    myGuide?.availableDestinations?.length ? myGuide.availableDestinations.join(', ') : ''
  );
  const [profileMsg, setProfileMsg] = useState<string | null>(null);

  // CNIC Verification form state
  const [legalFullName, setLegalFullName] = useState(
    myVerification?.legalFullName || ''
  );
  const [cnicNumber, setCnicNumber] = useState(myVerification?.cnicNumber || '');
  const [contactNumber, setContactNumber] = useState(
    myVerification?.contactNumber || ''
  );
  const [address, setAddress] = useState(myVerification?.address || '');
  const [cnicFrontRef, setCnicFrontRef] = useState(
    myVerification?.cnicFrontReference || ''
  );
  const [cnicBackRef, setCnicBackRef] = useState(
    myVerification?.cnicBackReference || ''
  );
  const [certificateTitle, setCertificateTitle] = useState(
    myVerification?.certificateTitle || ''
  );
  const [verMsg, setVerMsg] = useState<string | null>(null);

  // Create / Edit Package form state (empty by default)
  const [editingPkgId, setEditingPkgId] = useState<string | null>(null);
  const [pkgTitle, setPkgTitle] = useState('');
  const [pkgDest, setPkgDest] = useState('');
  const [pkgImage, setPkgImage] = useState(PACKAGE_IMAGE_OPTIONS[0].url);
  const [pkgDays, setPkgDays] = useState('');
  const [pkgNights, setPkgNights] = useState('');
  const [pkgPrice, setPkgPrice] = useState('');
  const [pkgIncluded, setPkgIncluded] = useState('');
  const [pkgAccommodation, setPkgAccommodation] = useState('');
  const [pkgTransport, setPkgTransport] = useState('');
  const [pkgDesc, setPkgDesc] = useState('');
  const [pkgPublish, setPkgPublish] = useState(true);
  const [pkgSubmitting, setPkgSubmitting] = useState(false);
  const [pkgMsg, setPkgMsg] = useState<string | null>(null);
  const [pkgErr, setPkgErr] = useState<string | null>(null);

  // Add Video form state (empty by default)
  const [vidTitle, setVidTitle] = useState('');
  const [vidDest, setVidDest] = useState('');
  const [vidDate, setVidDate] = useState('');
  const [vidUrl, setVidUrl] = useState('');
  const [vidDesc, setVidDesc] = useState('');

  // Quotation & Request Action State
  const [quotingReq, setQuotingReq] = useState<GuideRequest | null>(null);
  const [quotePrice, setQuotePrice] = useState('');
  const [quoteItinerary, setQuoteItinerary] = useState('');
  const [quoteMessage, setQuoteMessage] = useState('');
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const [replyTargetId, setReplyTargetId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');

  // Strict ownership filtering so guides only manage their OWN items
  const myPackages = useMemo(
    () => packages.filter((p) => p.ownerUid === uid),
    [packages, uid]
  );
  const myVideos = useMemo(
    () => guideVideos.filter((v) => v.ownerUid === uid),
    [guideVideos, uid]
  );
  const incomingRequests = useMemo(
    () => guideRequests.filter((r) => r.guideOwnerUid === uid),
    [guideRequests, uid]
  );
  const myBookings = useMemo(
    () => bookings.filter((b) => b.providerUid === uid),
    [bookings, uid]
  );
  const myStayAndVehicleBookings = useMemo(
    () =>
      bookings.filter(
        (b) =>
          b.touristUid === uid &&
          (b.bookingType === 'hotel' || b.bookingType === 'vehicle')
      ),
    [bookings, uid]
  );
  const myReviews = useMemo(
    () => reviews.filter((r) => r.providerUid === uid),
    [reviews, uid]
  );

  const resetPackageForm = () => {
    setEditingPkgId(null);
    setPkgTitle('');
    setPkgDest('');
    setPkgImage(PACKAGE_IMAGE_OPTIONS[0].url);
    setPkgDays('');
    setPkgNights('');
    setPkgPrice('');
    setPkgIncluded('');
    setPkgAccommodation('');
    setPkgTransport('');
    setPkgDesc('');
    setPkgPublish(true);
  };

  const startEditPackage = (pkg: GuidePackage) => {
    if (pkg.ownerUid !== uid) return;
    setEditingPkgId(pkg.id);
    setPkgTitle(pkg.title);
    setPkgDest(pkg.destination);
    setPkgImage(pkg.imageUrl || PACKAGE_IMAGE_OPTIONS[0].url);
    setPkgDays(String(pkg.days));
    setPkgNights(String(pkg.nights));
    setPkgPrice(String(pkg.pricePerPersonPkr));
    setPkgIncluded((pkg.includedServices || []).join(', '));
    setPkgAccommodation(pkg.accommodationSummary || '');
    setPkgTransport(pkg.transportSummary || '');
    setPkgDesc(pkg.description || '');
    setPkgPublish(pkg.isPublished);
    setPkgMsg(null);
    setPkgErr(null);
    pkgFormRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileMsg(null);
    try {
      await upsertGuideProfile({
        displayName: displayName.trim(),
        bio: bio.trim(),
        experienceYears: Number(expYears) || 1,
        startingPricePkr: Number(startingPrice) || 2500,
        languages: languagesText.split(',').map((s) => s.trim()).filter(Boolean),
        availableDestinations: destsText.split(',').map((s) => s.trim()).filter(Boolean),
      });
      setProfileMsg('Public guide profile saved.');
    } catch (err) {
      setProfileMsg(err instanceof Error ? err.message : 'Unable to save profile.');
    }
  };

  const handleSubmitVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    setVerMsg(null);
    try {
      await upsertGuideProfile({
        displayName: displayName || legalFullName,
        bio: bio.trim() || 'Local Pakistan Tour Guide',
      });
      await submitGuideVerification({
        legalFullName: legalFullName.trim(),
        cnicNumber: cnicNumber.trim(),
        contactNumber: contactNumber.trim(),
        address: address.trim(),
        cnicFrontReference: cnicFrontRef.trim(),
        cnicBackReference: cnicBackRef.trim(),
        certificateTitle: certificateTitle.trim(),
      });
      setVerMsg(
        'CNIC verification submitted privately! An admin will review and unlock your Verified Badge.'
      );
    } catch (err) {
      setVerMsg(err instanceof Error ? err.message : 'Verification submission failed.');
    }
  };

  const handleSavePackage = async (e: React.FormEvent) => {
    e.preventDefault();
    setPkgSubmitting(true);
    setPkgMsg(null);
    setPkgErr(null);
    const daysVal = Number(pkgDays);
    const nightsVal = Number(pkgNights) || Math.max(0, daysVal - 1);
    const priceVal = Number(pkgPrice);
    if (!daysVal || daysVal < 1) {
      setPkgErr('Please enter valid number of days.');
      setPkgSubmitting(false);
      return;
    }
    if (!priceVal || priceVal < 1000) {
      setPkgErr('Please enter package price per person in PKR.');
      setPkgSubmitting(false);
      return;
    }
    try {
      const existingPkg = editingPkgId
        ? myPackages.find((p) => p.id === editingPkgId)
        : undefined;
      await upsertPackage({
        ...(existingPkg || {}),
        ...(editingPkgId ? { id: editingPkgId } : {}),
        title: pkgTitle.trim(),
        destination: pkgDest.trim(),
        imageUrl: pkgImage,
        days: daysVal,
        nights: nightsVal,
        pricePerPersonPkr: priceVal,
        groupPricePkr: priceVal * 4,
        includedServices: pkgIncluded
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
        accommodationSummary: pkgAccommodation.trim(),
        transportSummary: pkgTransport.trim(),
        description: pkgDesc.trim(),
        isPublished: pkgPublish,
      });
      const wasEditing = Boolean(editingPkgId);
      resetPackageForm();
      setPkgMsg(
        wasEditing
          ? 'Your tour package was updated successfully!'
          : pkgPublish
          ? 'Tour package published live! Travellers can now view and book it.'
          : 'Tour package saved as draft.'
      );
    } catch (err) {
      setPkgErr(err instanceof Error ? err.message : 'Unable to save tour package.');
    } finally {
      setPkgSubmitting(false);
    }
  };

  const handleAddVideo = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addGuideVideo({
        title: vidTitle,
        description: vidDesc,
        destination: vidDest,
        tourDate: vidDate,
        videoUrl: vidUrl,
      });
      setVidTitle('');
      setVidDesc('');
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Unable to add video.');
    }
  };

  const handleAcceptRequest = async (req: GuideRequest) => {
    setBusyId(req.id);
    setActionFeedback(null);
    setActionError(null);
    try {
      await respondToGuideRequest(req, {
        status: 'accepted',
        quotedPricePkr: req.quotedPricePkr || req.budgetPkr,
        guideMessage: 'Trip request accepted! Ready to coordinate your itinerary.',
      });
      setActionFeedback(`Accepted trip request "${req.tripTitle}" from ${req.touristName}.`);
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : 'Failed to accept request. Please try again.'
      );
    } finally {
      setBusyId(null);
    }
  };

  const handleDeclineRequest = async (req: GuideRequest) => {
    setBusyId(req.id);
    setActionFeedback(null);
    setActionError(null);
    try {
      await respondToGuideRequest(req, { status: 'rejected' });
      setActionFeedback(`Declined request "${req.tripTitle}".`);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Unable to decline request.');
    } finally {
      setBusyId(null);
    }
  };

  const handleSendQuote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quotingReq) return;
    const priceNum = Number(quotePrice);
    if (!priceNum || priceNum < 1000) {
      setActionError('Please enter a valid quotation price in PKR.');
      return;
    }
    setBusyId(quotingReq.id);
    setActionFeedback(null);
    setActionError(null);
    try {
      await respondToGuideRequest(quotingReq, {
        status: 'quotation_sent',
        quotedPricePkr: priceNum,
        proposedItinerary: quoteItinerary,
        guideMessage: quoteMessage,
      });
      setActionFeedback(`Custom quotation sent to ${quotingReq.touristName}.`);
      setQuotingReq(null);
      setQuotePrice('');
      setQuoteItinerary('');
      setQuoteMessage('');
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Unable to send quotation.');
    } finally {
      setBusyId(null);
    }
  };

  const handleBookingUpdate = async (
    booking: (typeof myBookings)[number],
    status: 'accepted' | 'rejected' | 'confirmed' | 'completed' | 'cancelled'
  ) => {
    setBusyId(booking.id);
    setActionFeedback(null);
    setActionError(null);
    try {
      await updateBookingStatus(booking, status);
      setActionFeedback(`Booking "${booking.listingTitle}" marked as ${status}.`);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Unable to update booking status.');
    } finally {
      setBusyId(null);
    }
  };

  const inputClass =
    'w-full rounded-xl bg-slate-50 border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#0B5ED7] focus:bg-white';

  return (
    <div className="space-y-6">
      {/* Quick Action Bar for Guides */}
      <div className="rounded-2xl bg-gradient-to-r from-[#0B5ED7] to-[#0842A0] text-white p-5 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-md">
        <div className="space-y-1">
          <p className="text-xs font-bold uppercase tracking-wider text-blue-100">
            Tour Guide Studio
          </p>
          <h2 className="text-xl font-extrabold font-display">
            Manage Your Packages, Trip Requests &amp; Bookings
          </h2>
          <p className="text-xs text-blue-100">
            Post and update only your own tour packages, accept/reject incoming requests, chat with
            tourists, or book hotels &amp; 4x4 vehicles.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => {
              resetPackageForm();
              selectTab('packages');
            }}
            className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full bg-white text-[#0B5ED7] text-xs font-bold hover:bg-blue-50 transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Post Tour Package</span>
          </button>
          <button
            type="button"
            onClick={() => selectTab('requests')}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-full bg-white/15 border border-white/30 text-white text-xs font-semibold hover:bg-white/25 transition-colors cursor-pointer"
          >
            <span>Trip Requests ({incomingRequests.length})</span>
          </button>
        </div>
      </div>

      {/* Verification Status Banner */}
      <div
        className={`rounded-2xl border p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white shadow-xs ${
          isVerified ? 'border-emerald-200' : 'border-amber-200'
        }`}
      >
        <div className="flex items-start gap-3">
          {isVerified ? (
            <BadgeCheck className="w-6 h-6 text-emerald-600 shrink-0 mt-0.5" />
          ) : (
            <ShieldAlert className="w-6 h-6 text-[#F97316] shrink-0 mt-0.5" />
          )}
          <div>
            <p className="text-sm font-bold text-slate-900">
              Identity Badge Status:{' '}
              <span className={isVerified ? 'text-emerald-600 uppercase' : 'text-[#F97316] uppercase'}>
                {verificationStatus.replace('_', ' ')}
              </span>
            </p>
            <p className="text-xs text-slate-600 mt-0.5">
              {isVerified
                ? 'Your account carries the Verified Tour Guide Badge across TravelMate.'
                : 'You can post and edit your own packages immediately! Submit CNIC privately to unlock the Verified Guide Badge.'}
            </p>
          </div>
        </div>
        {!isVerified && (
          <button
            type="button"
            onClick={() => selectTab('verification')}
            className="px-4 py-2 rounded-full bg-[#0B5ED7] text-white text-xs font-bold whitespace-nowrap hover:bg-[#0842A0] cursor-pointer"
          >
            Submit CNIC Verification
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap items-center gap-2">
        {(
          [
            { id: 'overview', label: 'Overview & Profile' },
            { id: 'packages', label: `My Packages (${myPackages.length})` },
            { id: 'requests', label: `Trip Requests (${incomingRequests.length})` },
            { id: 'bookings', label: `Client Bookings (${myBookings.length})` },
            {
              id: 'my-rentals',
              label: `My Hotels & Vehicles (${myStayAndVehicleBookings.length})`,
            },
            { id: 'messages', label: 'Messages' },
            { id: 'videos', label: `Tour Videos (${myVideos.length})` },
            { id: 'verification', label: 'CNIC Verification' },
            { id: 'reviews', label: `Reviews (${myReviews.length})` },
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

      {actionFeedback && (
        <div className="rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-3 text-xs font-medium text-emerald-800 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
          <span>{actionFeedback}</span>
        </div>
      )}
      {actionError && (
        <div className="rounded-xl bg-rose-50 border border-rose-200 px-4 py-3 text-xs font-medium text-rose-700">
          {actionError}
        </div>
      )}

      {tab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-2xl bg-white border border-slate-200 shadow-xs p-5">
                <span className="text-xs text-slate-500 font-medium">My Packages</span>
                <p className="text-3xl font-extrabold font-mono-num text-[#0B5ED7] mt-1">
                  {myPackages.length}
                </p>
              </div>
              <div className="rounded-2xl bg-white border border-slate-200 shadow-xs p-5">
                <span className="text-xs text-slate-500 font-medium">Trip Requests</span>
                <p className="text-3xl font-extrabold font-mono-num text-slate-900 mt-1">
                  {incomingRequests.length}
                </p>
              </div>
            </div>
            <div className="rounded-2xl bg-white border border-slate-200 shadow-xs p-5 space-y-3 text-xs text-slate-600">
              <p className="font-bold text-slate-900">Estimated Booking Value</p>
              <p>
                Accepted &amp; completed tour bookings:{' '}
                <span className="font-mono-num font-bold text-[#0B5ED7]">
                  {formatPkr(
                    myBookings
                      .filter((b) =>
                        ['accepted', 'confirmed', 'active', 'completed'].includes(b.bookingStatus)
                      )
                      .reduce((s, b) => s + b.estimatedTotalPkr, 0)
                  )}
                </span>
              </p>
              {onNavigate && (
                <div className="pt-2 border-t border-slate-100 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => onNavigate('hotels')}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-slate-200 text-slate-700 font-semibold hover:border-[#0B5ED7] hover:text-[#0B5ED7] cursor-pointer"
                  >
                    <Building2 className="w-3.5 h-3.5" /> Book Hotel
                  </button>
                  <button
                    type="button"
                    onClick={() => onNavigate('vehicles')}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-slate-200 text-slate-700 font-semibold hover:border-[#0B5ED7] hover:text-[#0B5ED7] cursor-pointer"
                  >
                    <Car className="w-3.5 h-3.5" /> Rent 4x4 Vehicle
                  </button>
                </div>
              )}
            </div>
          </div>

          <form
            onSubmit={handleSaveProfile}
            className="lg:col-span-7 rounded-2xl bg-white border border-slate-200 shadow-xs p-6 space-y-4"
          >
            <h3 className="text-lg font-bold font-display text-slate-900">Public Guide Profile</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Display Name</label>
                <input
                  type="text"
                  required
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Your guide name"
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Experience (Years)</label>
                <input
                  type="number"
                  required
                  min={0}
                  max={60}
                  value={expYears}
                  onChange={(e) => setExpYears(e.target.value)}
                  placeholder="e.g., 5"
                  className={`${inputClass} font-mono-num`}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Daily Fee (PKR)</label>
                <input
                  type="number"
                  required
                  min={1000}
                  step={500}
                  value={startingPrice}
                  onChange={(e) => setStartingPrice(e.target.value)}
                  placeholder="e.g., 3000"
                  className={`${inputClass} font-mono-num`}
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Bio</label>
              <textarea
                rows={3}
                required
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Describe your guiding background and specialties..."
                className={inputClass}
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Languages (comma separated)
                </label>
                <input
                  type="text"
                  value={languagesText}
                  onChange={(e) => setLanguagesText(e.target.value)}
                  placeholder="e.g., Urdu, English"
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Destinations Covered (comma separated)
                </label>
                <input
                  type="text"
                  value={destsText}
                  onChange={(e) => setDestsText(e.target.value)}
                  placeholder="e.g., Hunza Valley, Skardu"
                  className={inputClass}
                />
              </div>
            </div>
            {profileMsg && <p className="text-xs font-medium text-emerald-600">{profileMsg}</p>}
            <button
              type="submit"
              className="px-6 py-2.5 rounded-full bg-[#0B5ED7] text-white text-xs font-bold hover:bg-[#0842A0] cursor-pointer"
            >
              Save Public Profile
            </button>
          </form>
        </div>
      )}

      {tab === 'packages' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <form
            ref={pkgFormRef}
            onSubmit={handleSavePackage}
            className="lg:col-span-5 rounded-2xl bg-white border border-slate-200 shadow-xs p-6 space-y-4 h-fit"
          >
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-lg font-bold font-display text-slate-900 flex items-center gap-2">
                {editingPkgId ? (
                  <>
                    <Pencil className="w-4 h-4 text-[#0B5ED7]" />
                    <span>Edit Your Tour Package</span>
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4 text-[#0B5ED7]" />
                    <span>Post a New Tour Package</span>
                  </>
                )}
              </h3>
              {editingPkgId && (
                <button
                  type="button"
                  onClick={resetPackageForm}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-rose-600 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                  Cancel
                </button>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Package Title</label>
              <input
                type="text"
                required
                value={pkgTitle}
                onChange={(e) => setPkgTitle(e.target.value)}
                placeholder="e.g., 5-Day Hunza & Attabad Lake Escape"
                className={inputClass}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Primary Destination
                </label>
                <input
                  type="text"
                  required
                  value={pkgDest}
                  onChange={(e) => setPkgDest(e.target.value)}
                  placeholder="Hunza Valley"
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Cover Photo</label>
                <select
                  value={pkgImage}
                  onChange={(e) => setPkgImage(e.target.value)}
                  className={inputClass}
                >
                  {PACKAGE_IMAGE_OPTIONS.map((opt) => (
                    <option key={opt.url} value={opt.url}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Days</label>
                <input
                  type="number"
                  required
                  min={1}
                  value={pkgDays}
                  onChange={(e) => setPkgDays(e.target.value)}
                  placeholder="e.g., 4"
                  className={`${inputClass} font-mono-num`}
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Nights</label>
                <input
                  type="number"
                  min={0}
                  value={pkgNights}
                  onChange={(e) => setPkgNights(e.target.value)}
                  placeholder="e.g., 3"
                  className={`${inputClass} font-mono-num`}
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Price/Person (PKR)
                </label>
                <input
                  type="number"
                  required
                  min={1000}
                  step={500}
                  value={pkgPrice}
                  onChange={(e) => setPkgPrice(e.target.value)}
                  placeholder="e.g., 16000"
                  className={`${inputClass} font-mono-num`}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Accommodation Summary
                </label>
                <input
                  type="text"
                  value={pkgAccommodation}
                  onChange={(e) => setPkgAccommodation(e.target.value)}
                  placeholder="e.g., Mountain Lodges"
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Transport Summary
                </label>
                <input
                  type="text"
                  value={pkgTransport}
                  onChange={(e) => setPkgTransport(e.target.value)}
                  placeholder="e.g., 4x4 Prado / Van"
                  className={inputClass}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Included Services (comma separated)
              </label>
              <input
                type="text"
                value={pkgIncluded}
                onChange={(e) => setPkgIncluded(e.target.value)}
                placeholder="e.g., Transport, Lodge Stay, Breakfast, Guide"
                className={inputClass}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Itinerary &amp; Highlights
              </label>
              <textarea
                rows={3}
                required
                value={pkgDesc}
                onChange={(e) => setPkgDesc(e.target.value)}
                placeholder="Describe itinerary highlights, hotels & transport..."
                className={inputClass}
              />
            </div>

            <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={pkgPublish}
                onChange={(e) => setPkgPublish(e.target.checked)}
                className="accent-[#0B5ED7] w-4 h-4"
              />
              <span>Publish publicly on TravelMate Packages</span>
            </label>

            {pkgErr && (
              <p className="text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-xl p-3">
                {pkgErr}
              </p>
            )}
            {pkgMsg && (
              <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-3 text-xs text-emerald-800 space-y-1.5">
                <p className="font-medium">{pkgMsg}</p>
                {onNavigate && (
                  <button
                    type="button"
                    onClick={() => onNavigate('packages')}
                    className="inline-flex items-center gap-1 font-bold text-[#0B5ED7] hover:underline cursor-pointer"
                  >
                    <span>View Live on Packages Page</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            )}

            <button
              type="submit"
              disabled={pkgSubmitting}
              className="w-full py-3 rounded-full bg-[#0B5ED7] text-white text-xs font-bold hover:bg-[#0842A0] disabled:opacity-60 cursor-pointer"
            >
              {pkgSubmitting
                ? 'Saving...'
                : editingPkgId
                ? 'Save Package Changes'
                : 'Post & Save Tour Package'}
            </button>
          </form>

          <div className="lg:col-span-7 space-y-3">
            {myPackages.length === 0 ? (
              <div className="rounded-2xl bg-white border border-slate-200 p-10 text-center text-sm text-slate-500">
                You haven&rsquo;t posted any tour packages yet. Use the form on the left to create
                your first package.
              </div>
            ) : (
              myPackages.map((p) => (
                <div
                  key={p.id}
                  className={`rounded-2xl bg-white border shadow-xs p-5 flex flex-wrap items-center justify-between gap-4 ${
                    editingPkgId === p.id ? 'border-[#0B5ED7] ring-1 ring-[#0B5ED7]/20' : 'border-slate-200'
                  }`}
                >
                  <div>
                    <p className="text-sm font-bold text-slate-900">{p.title}</p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {p.destination} · {p.days}D/{p.nights}N ·{' '}
                      <span className="font-mono-num font-semibold text-[#0B5ED7]">
                        {formatPkr(p.pricePerPersonPkr)}
                      </span>{' '}
                      ·{' '}
                      <span className={p.isPublished ? 'text-emerald-600 font-semibold' : 'text-amber-600 font-semibold'}>
                        {p.isPublished ? 'Published Live' : 'Draft'}
                      </span>
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => startEditPackage(p)}
                      className="inline-flex items-center gap-1 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-xs font-semibold text-[#0B5ED7] hover:bg-blue-100 cursor-pointer"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                      <span>Edit</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => void upsertPackage({ ...p, isPublished: !p.isPublished })}
                      className="px-3.5 py-1.5 rounded-full border border-slate-300 text-xs font-semibold text-slate-700 hover:border-[#0B5ED7] hover:text-[#0B5ED7] cursor-pointer"
                    >
                      {p.isPublished ? 'Unpublish' : 'Publish Live'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (editingPkgId === p.id) resetPackageForm();
                        void deletePackage(p.id);
                      }}
                      className="p-2 text-rose-500 hover:bg-rose-50 rounded-full cursor-pointer"
                      aria-label={`Delete ${p.title}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {tab === 'requests' && (
        <div className="space-y-4">
          {quotingReq && (
            <form
              onSubmit={handleSendQuote}
              className="rounded-2xl bg-white border border-[#0B5ED7] shadow-sm p-6 space-y-4"
            >
              <h3 className="text-base font-bold text-slate-900">
                Send Custom Quotation for &ldquo;{quotingReq.tripTitle}&rdquo;
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Quoted Price (PKR)
                  </label>
                  <input
                    type="number"
                    required
                    min={1000}
                    value={quotePrice}
                    onChange={(e) => setQuotePrice(e.target.value)}
                    placeholder="Enter quote in PKR"
                    className={`${inputClass} font-mono-num`}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Message to Tourist
                  </label>
                  <input
                    type="text"
                    required
                    value={quoteMessage}
                    onChange={(e) => setQuoteMessage(e.target.value)}
                    placeholder="Includes 4x4 Prado & breakfast..."
                    className={inputClass}
                  />
                </div>
              </div>
              <textarea
                rows={3}
                required
                value={quoteItinerary}
                onChange={(e) => setQuoteItinerary(e.target.value)}
                placeholder="Outline your suggested day-by-day route..."
                className={inputClass}
              />
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={busyId === quotingReq.id}
                  className="px-5 py-2 rounded-full bg-[#0B5ED7] text-white text-xs font-bold hover:bg-[#0842A0] cursor-pointer"
                >
                  {busyId === quotingReq.id ? 'Sending...' : 'Send Quotation'}
                </button>
                <button
                  type="button"
                  onClick={() => setQuotingReq(null)}
                  className="px-4 py-2 rounded-full border border-slate-300 text-xs font-semibold text-slate-600 cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}

          {incomingRequests.length === 0 ? (
            <div className="rounded-2xl bg-white border border-slate-200 p-10 text-center text-sm text-slate-500">
              No custom travel plan requests received yet.
            </div>
          ) : (
            incomingRequests.map((req) => (
              <div
                key={req.id}
                className="rounded-2xl bg-white border border-slate-200 shadow-xs p-5 space-y-3"
              >
                <div className="flex flex-wrap justify-between gap-2">
                  <div>
                    <p className="text-base font-bold text-slate-900">{req.tripTitle}</p>
                    <p className="text-xs text-slate-600 mt-0.5">
                      From: {req.touristName} · {req.destinations.join(', ')} · {req.departureDate}{' '}
                      to {req.returnDate} · {req.travelersCount} guests · Budget:{' '}
                      <span className="font-mono-num font-semibold text-slate-900">
                        {formatPkr(req.budgetPkr)}
                      </span>
                    </p>
                  </div>
                  <span className="text-xs font-mono-num font-bold uppercase text-[#0B5ED7]">
                    {req.status.replace('_', ' ')}
                  </span>
                </div>
                {req.notes && <p className="text-xs text-slate-500">Notes: {req.notes}</p>}
                <div className="flex flex-wrap gap-2 pt-1">
                  {['pending', 'viewed'].includes(req.status) && (
                    <button
                      type="button"
                      disabled={busyId === req.id}
                      onClick={() => void handleAcceptRequest(req)}
                      className="px-4 py-1.5 rounded-full bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 disabled:opacity-60 cursor-pointer"
                    >
                      {busyId === req.id ? 'Accepting...' : 'Accept Request'}
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      setQuotingReq(req);
                      setQuotePrice(req.quotedPricePkr ? String(req.quotedPricePkr) : '');
                    }}
                    className="px-4 py-1.5 rounded-full bg-[#0B5ED7] text-white text-xs font-bold hover:bg-[#0842A0] cursor-pointer"
                  >
                    Send / Update Quotation
                  </button>
                  <button
                    type="button"
                    onClick={() => openChatWith(req.touristUid, req.touristName, req.tripTitle)}
                    className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full border border-slate-300 bg-white text-slate-700 text-xs font-semibold hover:border-[#0B5ED7] hover:text-[#0B5ED7] cursor-pointer"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>Message {req.touristName}</span>
                  </button>
                  {['pending', 'viewed'].includes(req.status) && (
                    <button
                      type="button"
                      disabled={busyId === req.id}
                      onClick={() => void handleDeclineRequest(req)}
                      className="px-4 py-1.5 rounded-full border border-rose-200 bg-rose-50 text-rose-600 text-xs font-semibold hover:bg-rose-100 cursor-pointer"
                    >
                      Reject
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {tab === 'bookings' && (
        <div className="space-y-3">
          {myBookings.length === 0 ? (
            <div className="rounded-2xl bg-white border border-slate-200 p-10 text-center text-sm text-slate-500">
              No package or custom guide bookings received yet.
            </div>
          ) : (
            myBookings.map((b) => (
              <div
                key={b.id}
                className="rounded-2xl bg-white border border-slate-200 shadow-xs p-5 flex flex-wrap items-center justify-between gap-4"
              >
                <div>
                  <p className="text-sm font-bold text-slate-900">{b.listingTitle}</p>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Tourist: {b.touristName} · {b.startDate} to {b.endDate} ·{' '}
                    <span className="font-mono-num font-bold text-[#0B5ED7]">
                      {formatPkr(b.estimatedTotalPkr)}
                    </span>{' '}
                    · Status: <span className="uppercase font-semibold">{b.bookingStatus}</span>
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => openChatWith(b.touristUid, b.touristName, b.listingTitle)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-slate-300 bg-white text-slate-700 text-xs font-semibold hover:border-[#0B5ED7] hover:text-[#0B5ED7] cursor-pointer"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>Message</span>
                  </button>
                  {b.bookingStatus === 'pending' && (
                    <>
                      <button
                        type="button"
                        disabled={busyId === b.id}
                        onClick={() => void handleBookingUpdate(b, 'accepted')}
                        className="px-4 py-1.5 rounded-full bg-[#0B5ED7] text-white text-xs font-bold hover:bg-[#0842A0] disabled:opacity-60 cursor-pointer"
                      >
                        {busyId === b.id ? 'Updating...' : 'Accept'}
                      </button>
                      <button
                        type="button"
                        disabled={busyId === b.id}
                        onClick={() => void handleBookingUpdate(b, 'rejected')}
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
                      onClick={() => void handleBookingUpdate(b, 'confirmed')}
                      className="px-4 py-1.5 rounded-full bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 cursor-pointer"
                    >
                      Mark Confirmed
                    </button>
                  )}
                  {b.bookingStatus === 'confirmed' && (
                    <button
                      type="button"
                      disabled={busyId === b.id}
                      onClick={() => void handleBookingUpdate(b, 'completed')}
                      className="px-4 py-1.5 rounded-full bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 cursor-pointer"
                    >
                      Mark Tour Completed
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {tab === 'my-rentals' && (
        <div className="space-y-4">
          <div className="rounded-2xl bg-white border border-slate-200 p-5 flex flex-wrap items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                My Hotel &amp; Vehicle Reservations
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Track hotel stays and 4x4 vehicles you booked for your expeditions.
              </p>
            </div>
            {onNavigate && (
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => onNavigate('hotels')}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#0B5ED7] text-white text-xs font-bold hover:bg-[#0842A0] cursor-pointer"
                >
                  <Building2 className="w-3.5 h-3.5" />
                  <span>Book Hotel</span>
                </button>
                <button
                  type="button"
                  onClick={() => onNavigate('vehicles')}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full border border-slate-300 bg-white text-slate-700 text-xs font-semibold hover:border-[#0B5ED7] hover:text-[#0B5ED7] cursor-pointer"
                >
                  <Car className="w-3.5 h-3.5" />
                  <span>Rent 4x4 Vehicle</span>
                </button>
              </div>
            )}
          </div>

          {myStayAndVehicleBookings.length === 0 ? (
            <div className="rounded-2xl bg-white border border-slate-200 p-10 text-center text-sm text-slate-500">
              You have not booked any hotels or rental vehicles yet.
            </div>
          ) : (
            myStayAndVehicleBookings.map((b) => (
              <div
                key={b.id}
                className="rounded-2xl bg-white border border-slate-200 shadow-xs p-5 flex flex-wrap items-center justify-between gap-4"
              >
                <div>
                  <p className="text-[11px] font-bold uppercase text-[#0B5ED7]">
                    {b.bookingType} · Status: {b.bookingStatus}
                  </p>
                  <p className="text-sm font-bold text-slate-900 mt-0.5">{b.listingTitle}</p>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Provider: {b.providerName} · {b.startDate} to {b.endDate} ({b.daysCount} days) ·{' '}
                    <span className="font-mono-num font-bold text-[#0B5ED7]">
                      {formatPkr(b.estimatedTotalPkr)}
                    </span>
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => openChatWith(b.providerUid, b.providerName, b.listingTitle)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-slate-300 bg-white text-slate-700 text-xs font-semibold hover:border-[#0B5ED7] hover:text-[#0B5ED7] cursor-pointer"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>Message Partner</span>
                  </button>
                  {!['completed', 'cancelled', 'rejected'].includes(b.bookingStatus) && (
                    <button
                      type="button"
                      disabled={busyId === b.id}
                      onClick={() => void handleBookingUpdate(b, 'cancelled')}
                      className="px-3.5 py-1.5 rounded-full border border-rose-200 bg-rose-50 text-rose-600 text-xs font-semibold cursor-pointer"
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

      {tab === 'verification' && (
        <form
          onSubmit={handleSubmitVerification}
          className="max-w-2xl rounded-2xl bg-white border border-slate-200 shadow-xs p-6 sm:p-8 space-y-5"
        >
          <div className="flex items-start gap-3 rounded-xl bg-blue-50 border border-blue-100 p-4 text-xs text-slate-700">
            <Lock className="w-4 h-4 text-[#0B5ED7] shrink-0 mt-0.5" />
            <span>
              CNIC numbers and document references are stored in an isolated private collection
              accessible ONLY to you and authorized TravelMate administrators. Never shown
              publicly.
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Legal Full Name (per CNIC)
              </label>
              <input
                type="text"
                required
                value={legalFullName}
                onChange={(e) => setLegalFullName(e.target.value)}
                placeholder="Enter full name per CNIC"
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">CNIC Number</label>
              <input
                type="text"
                required
                value={cnicNumber}
                onChange={(e) => setCnicNumber(e.target.value)}
                placeholder="XXXXX-XXXXXXX-X"
                className={`${inputClass} font-mono-num`}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Contact Number</label>
              <input
                type="text"
                required
                value={contactNumber}
                onChange={(e) => setContactNumber(e.target.value)}
                placeholder="+92 300 0000000"
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Tourism Certificate (Optional)
              </label>
              <input
                type="text"
                value={certificateTitle}
                onChange={(e) => setCertificateTitle(e.target.value)}
                placeholder="e.g., PTDC / Alpine Club License"
                className={inputClass}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Residential Address</label>
            <input
              type="text"
              required
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Village / Mohallah, Tehsil, District"
              className={inputClass}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                CNIC Front Reference (Optional)
              </label>
              <input
                type="text"
                value={cnicFrontRef}
                onChange={(e) => setCnicFrontRef(e.target.value)}
                placeholder="File name or drive link"
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                CNIC Back Reference (Optional)
              </label>
              <input
                type="text"
                value={cnicBackRef}
                onChange={(e) => setCnicBackRef(e.target.value)}
                placeholder="File name or drive link"
                className={inputClass}
              />
            </div>
          </div>

          {myVerification?.adminRemarks && (
            <p className="text-xs font-medium text-[#F97316]">
              Admin Remarks: {myVerification.adminRemarks}
            </p>
          )}
          {verMsg && <p className="text-xs font-medium text-emerald-600">{verMsg}</p>}

          <button
            type="submit"
            className="px-6 py-2.5 rounded-full bg-[#0B5ED7] text-white text-xs font-bold hover:bg-[#0842A0] cursor-pointer"
          >
            Submit Private Verification
          </button>
        </form>
      )}

      {tab === 'videos' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <form
            onSubmit={handleAddVideo}
            className="lg:col-span-5 rounded-2xl bg-white border border-slate-200 shadow-xs p-6 space-y-4 h-fit"
          >
            <h3 className="text-lg font-bold font-display text-slate-900 flex items-center gap-2">
              <Video className="w-4 h-4 text-[#0B5ED7]" /> Add Previous Tour Video
            </h3>
            <input
              type="text"
              required
              value={vidTitle}
              onChange={(e) => setVidTitle(e.target.value)}
              placeholder="Video Title"
              className={inputClass}
            />
            <input
              type="text"
              required
              value={vidDest}
              onChange={(e) => setVidDest(e.target.value)}
              placeholder="Destination"
              className={inputClass}
            />
            <input
              type="text"
              required
              value={vidDate}
              onChange={(e) => setVidDate(e.target.value)}
              placeholder="Tour Date (e.g., August 2026)"
              className={inputClass}
            />
            <input
              type="url"
              required
              value={vidUrl}
              onChange={(e) => setVidUrl(e.target.value)}
              placeholder="MP4 Video URL"
              className={inputClass}
            />
            <textarea
              rows={2}
              value={vidDesc}
              onChange={(e) => setVidDesc(e.target.value)}
              placeholder="Brief highlight description..."
              className={inputClass}
            />
            <button
              type="submit"
              className="w-full py-2.5 rounded-full bg-[#0B5ED7] text-white text-xs font-bold hover:bg-[#0842A0] cursor-pointer"
            >
              Publish Video to Profile
            </button>
          </form>

          <div className="lg:col-span-7 space-y-3">
            {myVideos.map((v) => (
              <div
                key={v.id}
                className="rounded-2xl bg-white border border-slate-200 shadow-xs p-4 flex items-center justify-between gap-4"
              >
                <div>
                  <p className="text-sm font-bold text-slate-900">{v.title}</p>
                  <p className="text-xs text-slate-500">
                    {v.destination} · {v.tourDate}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => void deleteGuideVideo(v.id)}
                  className="p-2 text-rose-500 hover:bg-rose-50 rounded-full cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
            {myVideos.length === 0 && (
              <div className="rounded-2xl bg-white border border-slate-200 p-10 text-center text-sm text-slate-500">
                No tour videos uploaded yet.
              </div>
            )}
          </div>
        </div>
      )}

      {tab === 'messages' && <MessagingPanel />}

      {tab === 'reviews' && (
        <div className="space-y-3">
          {myReviews.map((r) => (
            <div key={r.id} className="rounded-2xl bg-white border border-slate-200 shadow-xs p-5 space-y-2">
              <div className="flex justify-between text-xs">
                <span className="font-bold text-slate-900">{r.authorName}</span>
                <span className="font-mono-num font-bold text-[#F59E0B]">★ {r.rating}.0</span>
              </div>
              <p className="text-sm text-slate-600">{r.comment}</p>
              {r.providerReply ? (
                <p className="text-xs text-slate-500">Your reply: {r.providerReply}</p>
              ) : replyTargetId === r.id ? (
                <div className="flex gap-2 pt-2">
                  <input
                    type="text"
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Write public reply..."
                    className="flex-1 rounded-xl bg-slate-50 border border-slate-200 px-3 py-1.5 text-xs text-slate-900"
                  />
                  <button
                    type="button"
                    onClick={async () => {
                      await replyToReview(r.id, replyText);
                      setReplyTargetId(null);
                      setReplyText('');
                    }}
                    className="px-4 py-1.5 rounded-full bg-[#0B5ED7] text-white text-xs font-bold cursor-pointer"
                  >
                    Post
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setReplyTargetId(r.id)}
                  className="text-xs font-semibold text-[#0B5ED7] hover:underline cursor-pointer"
                >
                  Reply to Review
                </button>
              )}
            </div>
          ))}
          {myReviews.length === 0 && (
            <div className="rounded-2xl bg-white border border-slate-200 p-10 text-center text-sm text-slate-500">
              No reviews yet.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
