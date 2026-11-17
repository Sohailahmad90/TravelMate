import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import {
  SEED_DESTINATIONS,
  SEED_GUIDE_VIDEOS,
  SEED_GUIDES,
  SEED_HOTELS,
  SEED_PACKAGES,
  SEED_REVIEWS,
  SEED_VEHICLES,
} from '../data/seedData';
import {
  Booking,
  BookingStatus,
  BookingType,
  createSafeId,
  Destination,
  GuidePackage,
  GuideProfile,
  GuideRequest,
  GuideRequestStatus,
  GuideVerification,
  GuideVideo,
  Hotel,
  Message,
  NotificationItem,
  PartnerApprovalStatus,
  Review,
  sanitizeString,
  sanitizeStringList,
  TravelPlan,
  UserProfile,
  Vehicle,
  VerificationStatus,
} from '../types/travelmate';
import { useAuth } from './AuthContext';

function mergeWithSeed<T>(liveItems: T[], seedItems: T[], keyFn: (item: T) => string): T[] {
  const map = new Map<string, T>();
  for (const s of seedItems) map.set(keyFn(s), s);
  for (const l of liveItems) map.set(keyFn(l), l);
  return Array.from(map.values());
}

function datesOverlap(aStart: string, aEnd: string, bStart: string, bEnd: string): boolean {
  if (!aStart || !aEnd || !bStart || !bEnd) return false;
  return aStart <= bEnd && bStart <= aEnd;
}

export interface MessagingTarget {
  recipientUid: string;
  recipientName: string;
  relatedListingTitle?: string;
}

interface MarketplaceContextValue {
  destinations: Destination[];
  guides: GuideProfile[];
  guideVideos: GuideVideo[];
  packages: GuidePackage[];
  hotels: Hotel[];
  vehicles: Vehicle[];
  reviews: Review[];
  travelPlans: TravelPlan[];
  guideRequests: GuideRequest[];
  bookings: Booking[];
  messages: Message[];
  notifications: NotificationItem[];
  myVerification: GuideVerification | null;
  allUsers: UserProfile[];
  allVerifications: GuideVerification[];
  catalogLoading: boolean;
  messagingTarget: MessagingTarget | null;
  setMessagingTarget: (target: MessagingTarget | null) => void;
  createBooking: (input: {
    bookingType: BookingType;
    providerUid: string;
    providerName: string;
    listingId: string;
    listingTitle: string;
    destination: string;
    startDate: string;
    endDate: string;
    daysCount: number;
    guestsCount: number;
    roomType?: string;
    driverSelected?: boolean;
    pickupLocation?: string;
    estimatedTotalPkr: number;
    notes?: string;
  }) => Promise<Booking>;
  updateBookingStatus: (booking: Booking, status: BookingStatus) => Promise<void>;
  createTravelPlan: (input: Omit<TravelPlan, 'id' | 'touristUid' | 'touristName' | 'createdAt' | 'updatedAt'>) => Promise<TravelPlan>;
  updateTravelPlan: (planId: string, patch: Partial<TravelPlan>) => Promise<void>;
  deleteTravelPlan: (planId: string) => Promise<void>;
  sendGuideRequest: (input: {
    planId?: string;
    guide: GuideProfile;
    tripTitle: string;
    startingLocation: string;
    destinations: string[];
    departureDate: string;
    returnDate: string;
    travelersCount: number;
    budgetPkr: number;
    preferredTransport: string;
    hotelRequirement: string;
    notes: string;
  }) => Promise<GuideRequest>;
  respondToGuideRequest: (
    req: GuideRequest,
    update: {
      status: GuideRequestStatus;
      quotedPricePkr?: number;
      proposedItinerary?: string;
      guideMessage?: string;
    }
  ) => Promise<void>;
  upsertGuideProfile: (patch: Partial<GuideProfile> & { displayName: string; bio: string }) => Promise<void>;
  submitGuideVerification: (input: {
    legalFullName: string;
    cnicNumber: string;
    contactNumber: string;
    address: string;
    cnicFrontReference: string;
    cnicBackReference: string;
    certificateTitle: string;
  }) => Promise<void>;
  addGuideVideo: (input: {
    title: string;
    description: string;
    destination: string;
    tourDate: string;
    videoUrl: string;
    thumbnailUrl?: string;
  }) => Promise<void>;
  deleteGuideVideo: (videoId: string) => Promise<void>;
  upsertPackage: (pkg: Partial<GuidePackage> & { title: string; destination: string; days: number; nights: number; pricePerPersonPkr: number }) => Promise<void>;
  deletePackage: (packageId: string) => Promise<void>;
  upsertHotel: (hotel: Partial<Hotel> & { name: string; destination: string; address: string; startingPricePkr: number }) => Promise<void>;
  deleteHotel: (hotelId: string) => Promise<void>;
  upsertVehicle: (vehicle: Partial<Vehicle> & { name: string; category: Vehicle['category']; seats: number; pickupLocation: string; pricePerDayPkr: number; driverOption: Vehicle['driverOption'] }) => Promise<void>;
  deleteVehicle: (vehicleId: string) => Promise<void>;
  sendMessage: (input: {
    recipientUid: string;
    recipientName: string;
    relatedListingTitle?: string;
    text: string;
  }) => Promise<void>;
  markNotificationRead: (id: string) => Promise<void>;
  submitReview: (input: {
    targetType: Review['targetType'];
    targetId: string;
    targetName: string;
    providerUid: string;
    bookingId: string;
    rating: number;
    comment: string;
  }) => Promise<void>;
  replyToReview: (reviewId: string, reply: string) => Promise<void>;
  adminVerifyGuide: (guideId: string, status: VerificationStatus, remarks?: string) => Promise<void>;
  adminVerifyPartner: (collectionName: 'hotels' | 'vehicles', docId: string, status: PartnerApprovalStatus) => Promise<void>;
  adminToggleUserSuspend: (uid: string, isSuspended: boolean) => Promise<void>;
  adminUpsertDestination: (dest: Destination) => Promise<void>;
  adminSeedCatalogToFirestore: () => Promise<number>;
}

const MarketplaceContext = createContext<MarketplaceContextValue | null>(null);

export function MarketplaceProvider({ children }: { children: React.ReactNode }) {
  const { firebaseUser, profile, isAdmin, effectiveRole, authReady } = useAuth();

  const [liveDestinations, setLiveDestinations] = useState<Destination[]>([]);
  const [liveGuides, setLiveGuides] = useState<GuideProfile[]>([]);
  const [liveGuideVideos, setLiveGuideVideos] = useState<GuideVideo[]>([]);
  const [livePackages, setLivePackages] = useState<GuidePackage[]>([]);
  const [liveHotels, setLiveHotels] = useState<Hotel[]>([]);
  const [liveVehicles, setLiveVehicles] = useState<Vehicle[]>([]);
  const [liveReviews, setLiveReviews] = useState<Review[]>([]);

  const [travelPlans, setTravelPlans] = useState<TravelPlan[]>([]);
  const [guideRequests, setGuideRequests] = useState<GuideRequest[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [myVerification, setMyVerification] = useState<GuideVerification | null>(null);
  const [allUsers, setAllUsers] = useState<UserProfile[]>([]);
  const [allVerifications, setAllVerifications] = useState<GuideVerification[]>([]);
  const [catalogLoading, setCatalogLoading] = useState(true);
  const [messagingTarget, setMessagingTarget] = useState<MessagingTarget | null>(null);
  const autoSeededRef = useRef(false);

  // Public catalog listeners
  useEffect(() => {
    const unsubs: (() => void)[] = [];

    unsubs.push(
      onSnapshot(
        collection(db, 'destinations'),
        (snap) => {
          setLiveDestinations(snap.docs.map((d) => d.data() as Destination));
          setCatalogLoading(false);
        },
        (err) => handleFirestoreError(err, OperationType.LIST, 'destinations')
      )
    );

    unsubs.push(
      onSnapshot(
        collection(db, 'guides'),
        (snap) => setLiveGuides(snap.docs.map((d) => d.data() as GuideProfile)),
        (err) => handleFirestoreError(err, OperationType.LIST, 'guides')
      )
    );

    unsubs.push(
      onSnapshot(
        collection(db, 'guideVideos'),
        (snap) => setLiveGuideVideos(snap.docs.map((d) => d.data() as GuideVideo)),
        (err) => handleFirestoreError(err, OperationType.LIST, 'guideVideos')
      )
    );

    unsubs.push(
      onSnapshot(
        collection(db, 'packages'),
        (snap) => setLivePackages(snap.docs.map((d) => d.data() as GuidePackage)),
        (err) => handleFirestoreError(err, OperationType.LIST, 'packages')
      )
    );

    unsubs.push(
      onSnapshot(
        collection(db, 'hotels'),
        (snap) => setLiveHotels(snap.docs.map((d) => d.data() as Hotel)),
        (err) => handleFirestoreError(err, OperationType.LIST, 'hotels')
      )
    );

    unsubs.push(
      onSnapshot(
        collection(db, 'vehicles'),
        (snap) => setLiveVehicles(snap.docs.map((d) => d.data() as Vehicle)),
        (err) => handleFirestoreError(err, OperationType.LIST, 'vehicles')
      )
    );

    unsubs.push(
      onSnapshot(
        collection(db, 'reviews'),
        (snap) => setLiveReviews(snap.docs.map((d) => d.data() as Review)),
        (err) => handleFirestoreError(err, OperationType.LIST, 'reviews')
      )
    );

    return () => {
      unsubs.forEach((u) => u());
    };
  }, []);

  // Authenticated user & role-scoped listeners
  useEffect(() => {
    if (!authReady || !firebaseUser) {
      setTravelPlans([]);
      setGuideRequests([]);
      setBookings([]);
      setMessages([]);
      setNotifications([]);
      setMyVerification(null);
      setAllUsers([]);
      setAllVerifications([]);
      return;
    }

    const uid = firebaseUser.uid;
    const unsubs: (() => void)[] = [];

    // Travel Plans
    const plansQuery = isAdmin
      ? collection(db, 'travelPlans')
      : query(collection(db, 'travelPlans'), where('touristUid', '==', uid));
    unsubs.push(
      onSnapshot(
        plansQuery,
        (snap) => setTravelPlans(snap.docs.map((d) => d.data() as TravelPlan)),
        (err) => handleFirestoreError(err, OperationType.LIST, 'travelPlans')
      )
    );

    // Guide Requests (merge tourist & guideOwner queries for non-admins)
    if (isAdmin) {
      unsubs.push(
        onSnapshot(
          collection(db, 'guideRequests'),
          (snap) => setGuideRequests(snap.docs.map((d) => d.data() as GuideRequest)),
          (err) => handleFirestoreError(err, OperationType.LIST, 'guideRequests')
        )
      );
    } else {
      let touristReqs: GuideRequest[] = [];
      let guideReqs: GuideRequest[] = [];
      const syncReqs = () => setGuideRequests(mergeWithSeed(guideReqs, touristReqs, (r) => r.id));

      unsubs.push(
        onSnapshot(
          query(collection(db, 'guideRequests'), where('touristUid', '==', uid)),
          (snap) => {
            touristReqs = snap.docs.map((d) => d.data() as GuideRequest);
            syncReqs();
          },
          (err) => handleFirestoreError(err, OperationType.LIST, 'guideRequests/tourist')
        )
      );

      unsubs.push(
        onSnapshot(
          query(collection(db, 'guideRequests'), where('guideOwnerUid', '==', uid)),
          (snap) => {
            guideReqs = snap.docs.map((d) => d.data() as GuideRequest);
            syncReqs();
          },
          (err) => handleFirestoreError(err, OperationType.LIST, 'guideRequests/guide')
        )
      );
    }

    // Bookings (merge tourist & provider queries for non-admins)
    if (isAdmin) {
      unsubs.push(
        onSnapshot(
          collection(db, 'bookings'),
          (snap) => setBookings(snap.docs.map((d) => d.data() as Booking)),
          (err) => handleFirestoreError(err, OperationType.LIST, 'bookings')
        )
      );
    } else {
      let touristBookings: Booking[] = [];
      let providerBookings: Booking[] = [];
      const syncBookings = () =>
        setBookings(mergeWithSeed(providerBookings, touristBookings, (b) => b.id));

      unsubs.push(
        onSnapshot(
          query(collection(db, 'bookings'), where('touristUid', '==', uid)),
          (snap) => {
            touristBookings = snap.docs.map((d) => d.data() as Booking);
            syncBookings();
          },
          (err) => handleFirestoreError(err, OperationType.LIST, 'bookings/tourist')
        )
      );

      unsubs.push(
        onSnapshot(
          query(collection(db, 'bookings'), where('providerUid', '==', uid)),
          (snap) => {
            providerBookings = snap.docs.map((d) => d.data() as Booking);
            syncBookings();
          },
          (err) => handleFirestoreError(err, OperationType.LIST, 'bookings/provider')
        )
      );
    }

    // Messages
    const msgQuery = isAdmin
      ? collection(db, 'messages')
      : query(collection(db, 'messages'), where('participants', 'array-contains', uid));
    unsubs.push(
      onSnapshot(
        msgQuery,
        (snap) => setMessages(snap.docs.map((d) => d.data() as Message)),
        (err) => handleFirestoreError(err, OperationType.LIST, 'messages')
      )
    );

    // Notifications
    const notifQuery = query(
      collection(db, 'notifications'),
      where('recipientUid', '==', uid)
    );
    unsubs.push(
      onSnapshot(
        notifQuery,
        (snap) => setNotifications(snap.docs.map((d) => d.data() as NotificationItem)),
        (err) => handleFirestoreError(err, OperationType.LIST, 'notifications')
      )
    );

    // Guide's own verification doc
    unsubs.push(
      onSnapshot(
        doc(db, 'guideVerifications', uid),
        (snap) => {
          setMyVerification(snap.exists() ? (snap.data() as GuideVerification) : null);
        },
        (err) => handleFirestoreError(err, OperationType.GET, `guideVerifications/${uid}`)
      )
    );

    // Admin collections
    if (isAdmin) {
      unsubs.push(
        onSnapshot(
          collection(db, 'users'),
          (snap) => setAllUsers(snap.docs.map((d) => d.data() as UserProfile)),
          (err) => handleFirestoreError(err, OperationType.LIST, 'users')
        )
      );
      unsubs.push(
        onSnapshot(
          collection(db, 'guideVerifications'),
          (snap) => setAllVerifications(snap.docs.map((d) => d.data() as GuideVerification)),
          (err) => handleFirestoreError(err, OperationType.LIST, 'guideVerifications')
        )
      );
    }

    return () => {
      unsubs.forEach((u) => u());
    };
  }, [authReady, firebaseUser, isAdmin]);

  const destinations = useMemo(
    () => mergeWithSeed(liveDestinations, SEED_DESTINATIONS, (d) => d.id),
    [liveDestinations]
  );
  const guides = useMemo(
    () => mergeWithSeed(liveGuides, SEED_GUIDES, (g) => g.guideId),
    [liveGuides]
  );
  const guideVideos = useMemo(
    () => mergeWithSeed(liveGuideVideos, SEED_GUIDE_VIDEOS, (v) => v.id),
    [liveGuideVideos]
  );
  const packages = useMemo(
    () => mergeWithSeed(livePackages, SEED_PACKAGES, (p) => p.id),
    [livePackages]
  );
  const hotels = useMemo(
    () => mergeWithSeed(liveHotels, SEED_HOTELS, (h) => h.id),
    [liveHotels]
  );
  const vehicles = useMemo(
    () => mergeWithSeed(liveVehicles, SEED_VEHICLES, (v) => v.id),
    [liveVehicles]
  );
  const reviews = useMemo(
    () => mergeWithSeed(liveReviews, SEED_REVIEWS, (r) => r.id),
    [liveReviews]
  );

  const pushNotification = async (
    recipientUid: string,
    title: string,
    body: string,
    type: NotificationItem['type']
  ) => {
    if (!firebaseUser || !recipientUid || recipientUid.startsWith('seed_')) return;
    const id = createSafeId('ntf');
    try {
      await setDoc(doc(db, 'notifications', id), {
        id,
        recipientUid: sanitizeString(recipientUid, 128),
        title: sanitizeString(title, 140),
        body: sanitizeString(body, 500),
        type,
        isRead: false,
        createdAt: serverTimestamp(),
      });
    } catch {
      // Non-fatal notification delivery fallback
    }
  };

  const createBooking: MarketplaceContextValue['createBooking'] = async (input) => {
    if (!firebaseUser) throw new Error('Please sign in with Google to submit a booking request.');
    if (
      effectiveRole === 'guide' &&
      (input.bookingType === 'package' || input.bookingType === 'guide_custom')
    ) {
      throw new Error(
        'Tour Guide accounts cannot book tour packages or custom guide trips. You can still book Hotels and 4x4 Vehicles.'
      );
    }

    // Availability overlap check for hotel & vehicle rentals
    if (input.bookingType === 'hotel' || input.bookingType === 'vehicle') {
      const existingSameListing = bookings.filter(
        (b) =>
          b.listingId === input.listingId &&
          ['pending', 'accepted', 'confirmed', 'active'].includes(b.bookingStatus) &&
          datesOverlap(b.startDate, b.endDate, input.startDate, input.endDate)
      );
      if (input.bookingType === 'vehicle' && existingSameListing.length > 0) {
        throw new Error(
          'This vehicle already has an active or pending booking overlapping those dates. Please adjust your pickup or return dates.'
        );
      }
      if (input.bookingType === 'hotel' && existingSameListing.length >= 3) {
        throw new Error(
          'Selected room inventory is heavily booked for those dates. Please select different dates or another room type.'
        );
      }
    }

    const id = createSafeId('bkg');
    const booking: Booking = {
      id,
      bookingType: input.bookingType,
      touristUid: firebaseUser.uid,
      touristName: sanitizeString(profile?.fullName || firebaseUser.displayName || 'Traveler', 100),
      providerUid: sanitizeString(input.providerUid, 128),
      providerName: sanitizeString(input.providerName, 100),
      listingId: sanitizeString(input.listingId, 128),
      listingTitle: sanitizeString(input.listingTitle, 160),
      destination: sanitizeString(input.destination, 120),
      startDate: sanitizeString(input.startDate, 40),
      endDate: sanitizeString(input.endDate, 40),
      daysCount: Math.max(1, Math.min(90, Math.round(input.daysCount))),
      guestsCount: Math.max(1, Math.round(input.guestsCount)),
      roomType: sanitizeString(input.roomType || '', 60),
      driverSelected: Boolean(input.driverSelected),
      pickupLocation: sanitizeString(input.pickupLocation || '', 120),
      estimatedTotalPkr: Math.max(0, Math.round(input.estimatedTotalPkr)),
      notes: sanitizeString(input.notes || '', 800),
      bookingStatus: 'pending',
      paymentStatus: 'not_required_yet',
    };

    try {
      await setDoc(doc(db, 'bookings', id), {
        ...booking,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      await pushNotification(
        booking.providerUid,
        `New Booking Request: ${booking.listingTitle}`,
        `${booking.touristName} requested ${booking.daysCount} day(s) starting ${booking.startDate}.`,
        'booking'
      );
      return booking;
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `bookings/${id}`);
    }
  };

  const updateBookingStatus = async (booking: Booking, status: BookingStatus) => {
    try {
      await updateDoc(doc(db, 'bookings', booking.id), {
        bookingStatus: status,
        updatedAt: serverTimestamp(),
      });
      const targetUid =
        firebaseUser?.uid === booking.providerUid ? booking.touristUid : booking.providerUid;
      await pushNotification(
        targetUid,
        `Booking ${status.toUpperCase()}`,
        `${booking.listingTitle} is now marked as ${status}.`,
        'booking'
      );
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `bookings/${booking.id}`);
    }
  };

  const createTravelPlan: MarketplaceContextValue['createTravelPlan'] = async (input) => {
    if (!firebaseUser) throw new Error('Please sign in first.');
    if (effectiveRole && ['guide', 'hotel_owner', 'vehicle_owner'].includes(effectiveRole)) {
      throw new Error(
        'Partner and Tour Guide accounts cannot generate tourist travel plans. Switch to a Traveller account to plan trips.'
      );
    }
    const id = createSafeId('pln');
    const plan: TravelPlan = {
      id,
      touristUid: firebaseUser.uid,
      touristName: sanitizeString(profile?.fullName || firebaseUser.displayName || 'Traveler', 100),
      title: sanitizeString(input.title, 140),
      startingLocation: sanitizeString(input.startingLocation, 100),
      destinations: sanitizeStringList(input.destinations, 15, 100),
      departureDate: sanitizeString(input.departureDate, 40),
      returnDate: sanitizeString(input.returnDate, 40),
      travelersCount: Math.max(1, Math.min(50, Math.round(input.travelersCount))),
      budgetPkr: Math.max(0, Math.round(input.budgetPkr)),
      preferredTransport: sanitizeString(input.preferredTransport || '', 120),
      hotelRequirement: sanitizeString(input.hotelRequirement || '', 120),
      activities: sanitizeStringList(input.activities, 20, 100),
      specialInstructions: sanitizeString(input.specialInstructions || '', 1000),
      estimatedCostPkr: Math.max(0, Math.round(input.estimatedCostPkr || 0)),
      status: input.status || 'draft',
    };

    try {
      await setDoc(doc(db, 'travelPlans', id), {
        ...plan,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      return plan;
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `travelPlans/${id}`);
    }
  };

  const updateTravelPlan = async (planId: string, patch: Partial<TravelPlan>) => {
    try {
      await updateDoc(doc(db, 'travelPlans', planId), {
        ...patch,
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `travelPlans/${planId}`);
    }
  };

  const deleteTravelPlan = async (planId: string) => {
    try {
      await deleteDoc(doc(db, 'travelPlans', planId));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `travelPlans/${planId}`);
    }
  };

  const sendGuideRequest: MarketplaceContextValue['sendGuideRequest'] = async (input) => {
    if (!firebaseUser) throw new Error('Please sign in first.');
    if (effectiveRole && ['guide', 'hotel_owner', 'vehicle_owner'].includes(effectiveRole)) {
      throw new Error(
        'Tour Guide and Partner accounts cannot send tourist trip requests to other guides.'
      );
    }
    const id = createSafeId('req');
    const reqDoc: GuideRequest = {
      id,
      planId: sanitizeString(input.planId || '', 128),
      touristUid: firebaseUser.uid,
      touristName: sanitizeString(profile?.fullName || firebaseUser.displayName || 'Traveler', 100),
      guideId: input.guide.guideId,
      guideOwnerUid: input.guide.ownerUid,
      guideName: sanitizeString(input.guide.displayName, 100),
      tripTitle: sanitizeString(input.tripTitle, 140),
      startingLocation: sanitizeString(input.startingLocation, 100),
      destinations: sanitizeStringList(input.destinations, 15, 100),
      departureDate: sanitizeString(input.departureDate, 40),
      returnDate: sanitizeString(input.returnDate, 40),
      travelersCount: Math.max(1, Math.round(input.travelersCount)),
      budgetPkr: Math.max(0, Math.round(input.budgetPkr)),
      preferredTransport: sanitizeString(input.preferredTransport, 120),
      hotelRequirement: sanitizeString(input.hotelRequirement, 120),
      notes: sanitizeString(input.notes, 1000),
      status: 'pending',
    };

    try {
      await setDoc(doc(db, 'guideRequests', id), {
        ...reqDoc,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      await pushNotification(
        reqDoc.guideOwnerUid,
        `New Custom Trip Request: ${reqDoc.tripTitle}`,
        `${reqDoc.touristName} wants to travel to ${reqDoc.destinations.join(', ')}.`,
        'quotation'
      );
      return reqDoc;
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `guideRequests/${id}`);
    }
  };

  const respondToGuideRequest: MarketplaceContextValue['respondToGuideRequest'] = async (
    req,
    update
  ) => {
    try {
      const payload: Record<string, unknown> = {
        status: update.status,
        updatedAt: serverTimestamp(),
      };
      if (typeof update.quotedPricePkr === 'number') {
        payload.quotedPricePkr = Math.max(0, Math.round(update.quotedPricePkr));
      }
      if (update.proposedItinerary !== undefined) {
        payload.proposedItinerary = sanitizeString(update.proposedItinerary, 2000);
      }
      if (update.guideMessage !== undefined) {
        payload.guideMessage = sanitizeString(update.guideMessage, 1000);
      }
      await updateDoc(doc(db, 'guideRequests', req.id), payload);

      const targetUid =
        firebaseUser?.uid === req.guideOwnerUid ? req.touristUid : req.guideOwnerUid;
      await pushNotification(
        targetUid,
        `Trip Request Update: ${req.tripTitle}`,
        `Status changed to ${update.status.replace('_', ' ')}.`,
        'quotation'
      );
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `guideRequests/${req.id}`);
    }
  };

  const upsertGuideProfile: MarketplaceContextValue['upsertGuideProfile'] = async (patch) => {
    if (!firebaseUser) return;
    const guideId = firebaseUser.uid;
    const existing = guides.find((g) => g.guideId === guideId);
    try {
      if (existing && liveGuides.some((g) => g.guideId === guideId)) {
        await updateDoc(doc(db, 'guides', guideId), {
          displayName: sanitizeString(patch.displayName, 100),
          bio: sanitizeString(patch.bio, 1500),
          experienceYears: Math.max(0, Math.min(70, Number(patch.experienceYears ?? existing.experienceYears))),
          languages: sanitizeStringList(patch.languages ?? existing.languages, 12, 40),
          specializations: sanitizeStringList(patch.specializations ?? existing.specializations, 12, 60),
          availableDestinations: sanitizeStringList(patch.availableDestinations ?? existing.availableDestinations, 20, 80),
          startingPricePkr: Math.max(0, Math.round(Number(patch.startingPricePkr ?? existing.startingPricePkr))),
          availabilityStatus: sanitizeString(patch.availabilityStatus ?? existing.availabilityStatus ?? 'Available', 60),
          updatedAt: serverTimestamp(),
        });
      } else {
        await setDoc(doc(db, 'guides', guideId), {
          guideId,
          ownerUid: firebaseUser.uid,
          displayName: sanitizeString(patch.displayName, 100),
          avatarUrl: sanitizeString(patch.avatarUrl || profile?.avatarUrl || '', 500),
          bio: sanitizeString(patch.bio, 1500),
          experienceYears: Math.max(0, Math.min(70, Number(patch.experienceYears ?? 2))),
          languages: sanitizeStringList(patch.languages ?? ['Urdu', 'English'], 12, 40),
          specializations: sanitizeStringList(patch.specializations ?? ['Mountain Tours'], 12, 60),
          availableDestinations: sanitizeStringList(patch.availableDestinations ?? ['Hunza Valley'], 20, 80),
          startingPricePkr: Math.max(0, Math.round(Number(patch.startingPricePkr ?? 7500))),
          verificationStatus: 'not_submitted',
          ratingAvg: 5,
          reviewCount: 0,
          completedToursCount: 0,
          availabilityStatus: sanitizeString(patch.availabilityStatus ?? 'Available', 60),
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `guides/${guideId}`);
    }
  };

  const submitGuideVerification: MarketplaceContextValue['submitGuideVerification'] = async (input) => {
    if (!firebaseUser) return;
    const guideId = firebaseUser.uid;
    const verificationPayload = {
      guideId,
      ownerUid: firebaseUser.uid,
      legalFullName: sanitizeString(input.legalFullName, 120),
      cnicNumber: sanitizeString(input.cnicNumber, 25),
      contactNumber: sanitizeString(input.contactNumber, 30),
      address: sanitizeString(input.address, 300),
      cnicFrontReference: sanitizeString(input.cnicFrontReference, 300),
      cnicBackReference: sanitizeString(input.cnicBackReference, 300),
      certificateTitle: sanitizeString(input.certificateTitle, 160),
      status: 'pending' as VerificationStatus,
      updatedAt: serverTimestamp(),
    };

    try {
      const existsInLive = Boolean(myVerification);
      if (existsInLive) {
        await updateDoc(doc(db, 'guideVerifications', guideId), verificationPayload);
      } else {
        await setDoc(doc(db, 'guideVerifications', guideId), {
          ...verificationPayload,
          createdAt: serverTimestamp(),
        });
      }
      // Also update public guide verificationStatus to 'pending'
      const guideLive = liveGuides.some((g) => g.guideId === guideId);
      if (guideLive) {
        await updateDoc(doc(db, 'guides', guideId), {
          verificationStatus: 'pending',
          updatedAt: serverTimestamp(),
        });
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `guideVerifications/${guideId}`);
    }
  };

  const addGuideVideo: MarketplaceContextValue['addGuideVideo'] = async (input) => {
    if (!firebaseUser) return;
    const id = createSafeId('vid');
    try {
      await setDoc(doc(db, 'guideVideos', id), {
        id,
        guideId: firebaseUser.uid,
        ownerUid: firebaseUser.uid,
        title: sanitizeString(input.title, 140),
        description: sanitizeString(input.description, 800),
        destination: sanitizeString(input.destination, 100),
        tourDate: sanitizeString(input.tourDate, 40),
        videoUrl: sanitizeString(input.videoUrl, 500),
        thumbnailUrl: sanitizeString(
          input.thumbnailUrl || '/src/assets/images/dest_hunza_baltit_1794920585672.jpg',
          500
        ),
        createdAt: serverTimestamp(),
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `guideVideos/${id}`);
    }
  };

  const deleteGuideVideo = async (videoId: string) => {
    try {
      await deleteDoc(doc(db, 'guideVideos', videoId));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `guideVideos/${videoId}`);
    }
  };

  const upsertPackage: MarketplaceContextValue['upsertPackage'] = async (pkg) => {
    if (!firebaseUser) return;
    const id = pkg.id || createSafeId('pkg');
    const existingLive = pkg.id ? livePackages.find((p) => p.id === pkg.id) : undefined;
    const isEdit = Boolean(existingLive);
    if (existingLive && existingLive.ownerUid !== firebaseUser.uid && !isAdmin) {
      throw new Error('You can only edit tour packages that you created.');
    }
    const myGuide = guides.find((g) => g.guideId === firebaseUser.uid);
    const wantPublished = pkg.isPublished !== false;

    try {
      if (!liveGuides.some((g) => g.guideId === firebaseUser.uid)) {
        const displayName = sanitizeString(
          myGuide?.displayName || profile?.fullName || firebaseUser.displayName || 'Local Guide',
          100,
          'Local Guide'
        );
        await setDoc(doc(db, 'guides', firebaseUser.uid), {
          guideId: firebaseUser.uid,
          ownerUid: firebaseUser.uid,
          displayName: displayName.length >= 2 ? displayName : 'Local Guide',
          avatarUrl: sanitizeString(profile?.avatarUrl || firebaseUser.photoURL || '', 120000),
          bio: `Local tour guide based in ${profile?.city || 'Pakistan'} ready to host northern Pakistan adventures.`,
          experienceYears: 2,
          languages: ['Urdu', 'English'],
          specializations: ['Custom Tours'],
          availableDestinations: [sanitizeString(pkg.destination, 80, 'Hunza Valley')],
          startingPricePkr: 7000,
          verificationStatus: 'not_submitted',
          ratingAvg: 5,
          reviewCount: 0,
          completedToursCount: 0,
          availabilityStatus: 'Accepting Requests',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }

      if (isEdit) {
        await updateDoc(doc(db, 'packages', id), {
          title: sanitizeString(pkg.title, 140),
          destination: sanitizeString(pkg.destination, 120),
          imageUrl: sanitizeString(pkg.imageUrl || '/src/assets/images/dest_hunza_baltit_1794920585672.jpg', 500),
          description: sanitizeString(pkg.description || '', 2000),
          days: Math.max(1, Math.min(60, Math.round(pkg.days))),
          nights: Math.max(0, Math.min(60, Math.round(pkg.nights))),
          pricePerPersonPkr: Math.max(0, Math.round(pkg.pricePerPersonPkr)),
          groupPricePkr: Math.max(0, Math.round(pkg.groupPricePkr || pkg.pricePerPersonPkr * 4)),
          minTravelers: Math.max(1, Math.round(pkg.minTravelers || 1)),
          maxTravelers: Math.max(1, Math.round(pkg.maxTravelers || 12)),
          includedServices: sanitizeStringList(pkg.includedServices || [], 20, 120),
          excludedServices: sanitizeStringList(pkg.excludedServices || [], 20, 120),
          accommodationSummary: sanitizeString(pkg.accommodationSummary || '', 400),
          transportSummary: sanitizeString(pkg.transportSummary || '', 400),
          dailyItinerary: sanitizeStringList(pkg.dailyItinerary || [], 30, 300),
          availableDates: sanitizeString(pkg.availableDates || 'Year-round on request', 200),
          cancellationPolicy: sanitizeString(pkg.cancellationPolicy || 'Free cancellation 7 days prior.', 500),
          isPublished: wantPublished,
          updatedAt: serverTimestamp(),
        });
      } else {
        await setDoc(doc(db, 'packages', id), {
          id,
          guideId: firebaseUser.uid,
          ownerUid: firebaseUser.uid,
          guideName: sanitizeString(myGuide?.displayName || profile?.fullName || 'Tour Guide', 100),
          title: sanitizeString(pkg.title, 140),
          destination: sanitizeString(pkg.destination, 120),
          imageUrl: sanitizeString(pkg.imageUrl || '/src/assets/images/dest_hunza_baltit_1794920585672.jpg', 500),
          description: sanitizeString(pkg.description || '', 2000),
          days: Math.max(1, Math.min(60, Math.round(pkg.days))),
          nights: Math.max(0, Math.min(60, Math.round(pkg.nights))),
          pricePerPersonPkr: Math.max(0, Math.round(pkg.pricePerPersonPkr)),
          groupPricePkr: Math.max(0, Math.round(pkg.groupPricePkr || pkg.pricePerPersonPkr * 4)),
          minTravelers: Math.max(1, Math.round(pkg.minTravelers || 1)),
          maxTravelers: Math.max(1, Math.round(pkg.maxTravelers || 12)),
          includedServices: sanitizeStringList(pkg.includedServices || [], 20, 120),
          excludedServices: sanitizeStringList(pkg.excludedServices || [], 20, 120),
          accommodationSummary: sanitizeString(pkg.accommodationSummary || '', 400),
          transportSummary: sanitizeString(pkg.transportSummary || '', 400),
          dailyItinerary: sanitizeStringList(pkg.dailyItinerary || [], 30, 300),
          availableDates: sanitizeString(pkg.availableDates || 'Year-round on request', 200),
          cancellationPolicy: sanitizeString(pkg.cancellationPolicy || 'Free cancellation 7 days prior.', 500),
          isPublished: wantPublished,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `packages/${id}`);
    }
  };

  const deletePackage = async (packageId: string) => {
    try {
      await deleteDoc(doc(db, 'packages', packageId));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `packages/${packageId}`);
    }
  };

  const upsertHotel: MarketplaceContextValue['upsertHotel'] = async (hotel) => {
    if (!firebaseUser) return;
    const id = hotel.id || createSafeId('htl');
    const isEdit = Boolean(hotel.id && liveHotels.some((h) => h.id === hotel.id));

    try {
      if (isEdit) {
        await updateDoc(doc(db, 'hotels', id), {
          name: sanitizeString(hotel.name, 140),
          destination: sanitizeString(hotel.destination, 120),
          address: sanitizeString(hotel.address, 250),
          description: sanitizeString(hotel.description || '', 1500),
          imageUrl: sanitizeString(hotel.imageUrl || '/src/assets/images/hotel_karakoram_lodge_1794920588523.jpg', 500),
          facilities: sanitizeStringList(hotel.facilities || [], 20, 80),
          checkInTime: sanitizeString(hotel.checkInTime || '02:00 PM', 40),
          checkOutTime: sanitizeString(hotel.checkOutTime || '12:00 PM', 40),
          cancellationPolicy: sanitizeString(hotel.cancellationPolicy || 'Free cancellation 48h prior.', 500),
          rooms: (hotel.rooms || []).slice(0, 10),
          startingPricePkr: Math.max(0, Math.round(hotel.startingPricePkr)),
          updatedAt: serverTimestamp(),
        });
      } else {
        await setDoc(doc(db, 'hotels', id), {
          id,
          ownerUid: firebaseUser.uid,
          ownerName: sanitizeString(profile?.fullName || firebaseUser.displayName || 'Hotel Partner', 100),
          name: sanitizeString(hotel.name, 140),
          destination: sanitizeString(hotel.destination, 120),
          address: sanitizeString(hotel.address, 250),
          description: sanitizeString(hotel.description || '', 1500),
          imageUrl: sanitizeString(hotel.imageUrl || '/src/assets/images/hotel_karakoram_lodge_1794920588523.jpg', 500),
          facilities: sanitizeStringList(hotel.facilities || ['Free Wi-Fi', 'Mountain View'], 20, 80),
          checkInTime: sanitizeString(hotel.checkInTime || '02:00 PM', 40),
          checkOutTime: sanitizeString(hotel.checkOutTime || '12:00 PM', 40),
          cancellationPolicy: sanitizeString(hotel.cancellationPolicy || 'Free cancellation 48h prior.', 500),
          rooms: (hotel.rooms?.length
            ? hotel.rooms
            : [{ roomType: 'Deluxe', pricePerNightPkr: hotel.startingPricePkr, totalRooms: 5, maxGuests: 2 }]
          ).slice(0, 10),
          startingPricePkr: Math.max(0, Math.round(hotel.startingPricePkr)),
          verificationStatus: isAdmin ? 'verified' : 'pending',
          ratingAvg: 5,
          reviewCount: 0,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `hotels/${id}`);
    }
  };

  const deleteHotel = async (hotelId: string) => {
    try {
      await deleteDoc(doc(db, 'hotels', hotelId));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `hotels/${hotelId}`);
    }
  };

  const upsertVehicle: MarketplaceContextValue['upsertVehicle'] = async (vehicle) => {
    if (!firebaseUser) return;
    const id = vehicle.id || createSafeId('veh');
    const isEdit = Boolean(vehicle.id && liveVehicles.some((v) => v.id === vehicle.id));

    try {
      if (isEdit) {
        await updateDoc(doc(db, 'vehicles', id), {
          name: sanitizeString(vehicle.name, 140),
          brand: sanitizeString(vehicle.brand || '', 80),
          model: sanitizeString(vehicle.model || '', 80),
          modelYear: Number(vehicle.modelYear || 2022),
          category: vehicle.category,
          seats: Math.max(1, Math.min(60, Math.round(vehicle.seats))),
          imageUrl: sanitizeString(vehicle.imageUrl || '/src/assets/images/vehicle_land_cruiser_gb_1794920590107.jpg', 500),
          fuelType: sanitizeString(vehicle.fuelType || 'Diesel / Petrol', 40),
          transmission: sanitizeString(vehicle.transmission || 'Automatic', 40),
          acAvailable: Boolean(vehicle.acAvailable ?? true),
          condition: sanitizeString(vehicle.condition || 'Mountain Ready', 60),
          pickupLocation: sanitizeString(vehicle.pickupLocation, 120),
          serviceAreas: sanitizeStringList(vehicle.serviceAreas || [vehicle.pickupLocation], 20, 80),
          pricePerDayPkr: Math.max(0, Math.round(vehicle.pricePerDayPkr)),
          driverOption: vehicle.driverOption,
          driverFeePerDayPkr: Math.max(0, Math.round(vehicle.driverFeePerDayPkr || 0)),
          selfDriveEligibility: sanitizeString(vehicle.selfDriveEligibility || '', 300),
          rentalTerms: sanitizeString(vehicle.rentalTerms || '', 600),
          availableForBooking: Boolean(vehicle.availableForBooking ?? true),
          updatedAt: serverTimestamp(),
        });
      } else {
        await setDoc(doc(db, 'vehicles', id), {
          id,
          ownerUid: firebaseUser.uid,
          ownerName: sanitizeString(profile?.fullName || firebaseUser.displayName || 'Fleet Partner', 100),
          name: sanitizeString(vehicle.name, 140),
          brand: sanitizeString(vehicle.brand || '', 80),
          model: sanitizeString(vehicle.model || '', 80),
          modelYear: Number(vehicle.modelYear || 2022),
          category: vehicle.category,
          seats: Math.max(1, Math.min(60, Math.round(vehicle.seats))),
          imageUrl: sanitizeString(vehicle.imageUrl || '/src/assets/images/vehicle_land_cruiser_gb_1794920590107.jpg', 500),
          fuelType: sanitizeString(vehicle.fuelType || 'Diesel / Petrol', 40),
          transmission: sanitizeString(vehicle.transmission || 'Automatic', 40),
          acAvailable: Boolean(vehicle.acAvailable ?? true),
          condition: sanitizeString(vehicle.condition || 'Mountain Ready', 60),
          pickupLocation: sanitizeString(vehicle.pickupLocation, 120),
          serviceAreas: sanitizeStringList(vehicle.serviceAreas || [vehicle.pickupLocation], 20, 80),
          pricePerDayPkr: Math.max(0, Math.round(vehicle.pricePerDayPkr)),
          driverOption: vehicle.driverOption,
          driverFeePerDayPkr: Math.max(0, Math.round(vehicle.driverFeePerDayPkr || 0)),
          selfDriveEligibility: sanitizeString(
            vehicle.selfDriveEligibility || 'Valid driving license & original CNIC required for self-drive.',
            300
          ),
          rentalTerms: sanitizeString(
            vehicle.rentalTerms || 'Fuel excluded; price is estimated until owner confirmation.',
            600
          ),
          verificationStatus: isAdmin ? 'verified' : 'pending',
          availableForBooking: true,
          ratingAvg: 5,
          reviewCount: 0,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `vehicles/${id}`);
    }
  };

  const deleteVehicle = async (vehicleId: string) => {
    try {
      await deleteDoc(doc(db, 'vehicles', vehicleId));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `vehicles/${vehicleId}`);
    }
  };

  const sendMessage: MarketplaceContextValue['sendMessage'] = async (input) => {
    if (!firebaseUser) throw new Error('Please sign in to send messages.');
    if (!input.text.trim()) throw new Error('Please enter a message before sending.');
    if (input.recipientUid === firebaseUser.uid) {
      throw new Error('You cannot send a direct message to your own account.');
    }
    const id = createSafeId('msg');
    const pair = [firebaseUser.uid, input.recipientUid].sort();
    const conversationKey = `${pair[0]}__${pair[1]}`.slice(0, 180);
    try {
      await setDoc(doc(db, 'messages', id), {
        id,
        conversationKey,
        senderUid: firebaseUser.uid,
        senderName: sanitizeString(profile?.fullName || firebaseUser.displayName || 'Traveler', 100),
        recipientUid: sanitizeString(input.recipientUid, 128),
        recipientName: sanitizeString(input.recipientName, 100),
        relatedListingTitle: sanitizeString(input.relatedListingTitle || '', 140),
        text: sanitizeString(input.text, 1500),
        participants: [firebaseUser.uid, sanitizeString(input.recipientUid, 128)],
        createdAt: serverTimestamp(),
      });
      await pushNotification(
        input.recipientUid,
        `New message from ${profile?.fullName || 'TravelMate User'}`,
        input.text.slice(0, 120),
        'message'
      );
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `messages/${id}`);
    }
  };

  const markNotificationRead = async (id: string) => {
    try {
      await updateDoc(doc(db, 'notifications', id), { isRead: true });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `notifications/${id}`);
    }
  };

  const submitReview: MarketplaceContextValue['submitReview'] = async (input) => {
    if (!firebaseUser) throw new Error('Please sign in first.');
    const id = createSafeId('rev');
    try {
      await setDoc(doc(db, 'reviews', id), {
        id,
        targetType: input.targetType,
        targetId: sanitizeString(input.targetId, 128),
        targetName: sanitizeString(input.targetName, 140),
        providerUid: sanitizeString(input.providerUid, 128),
        bookingId: sanitizeString(input.bookingId, 128),
        authorUid: firebaseUser.uid,
        authorName: sanitizeString(profile?.fullName || firebaseUser.displayName || 'Traveler', 100),
        rating: Math.max(1, Math.min(5, Math.round(input.rating))),
        comment: sanitizeString(input.comment, 1000),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `reviews/${id}`);
    }
  };

  const replyToReview = async (reviewId: string, reply: string) => {
    try {
      await updateDoc(doc(db, 'reviews', reviewId), {
        providerReply: sanitizeString(reply, 800),
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `reviews/${reviewId}`);
    }
  };

  const adminVerifyGuide = async (
    guideId: string,
    status: VerificationStatus,
    remarks = ''
  ) => {
    try {
      const guideExists = liveGuides.some((g) => g.guideId === guideId);
      if (guideExists) {
        await updateDoc(doc(db, 'guides', guideId), {
          verificationStatus: status,
          updatedAt: serverTimestamp(),
        });
      }
      const verExists = allVerifications.some((v) => v.guideId === guideId);
      if (verExists) {
        await updateDoc(doc(db, 'guideVerifications', guideId), {
          status,
          adminRemarks: sanitizeString(remarks, 500),
          updatedAt: serverTimestamp(),
        });
      }
      await pushNotification(
        guideId,
        `Guide Verification: ${status.replace('_', ' ').toUpperCase()}`,
        remarks || `Your tour guide verification status is now ${status}.`,
        'verification'
      );
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `guides/${guideId}`);
    }
  };

  const adminVerifyPartner = async (
    collectionName: 'hotels' | 'vehicles',
    docId: string,
    status: PartnerApprovalStatus
  ) => {
    try {
      await updateDoc(doc(db, collectionName, docId), {
        verificationStatus: status,
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `${collectionName}/${docId}`);
    }
  };

  const adminToggleUserSuspend = async (uid: string, isSuspended: boolean) => {
    try {
      await updateDoc(doc(db, 'users', uid), {
        isSuspended,
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${uid}`);
    }
  };

  const adminUpsertDestination = async (dest: Destination) => {
    try {
      const exists = liveDestinations.some((d) => d.id === dest.id);
      if (exists) {
        await updateDoc(doc(db, 'destinations', dest.id), {
          ...dest,
          updatedAt: serverTimestamp(),
        });
      } else {
        await setDoc(doc(db, 'destinations', dest.id), {
          ...dest,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `destinations/${dest.id}`);
    }
  };

  const adminSeedCatalogToFirestore = async (): Promise<number> => {
    if (!isAdmin) throw new Error('Only administrators can seed Firestore catalog.');
    const batch = writeBatch(db);
    let count = 0;

    for (const d of SEED_DESTINATIONS) {
      batch.set(doc(db, 'destinations', d.id), { ...d, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
      count++;
    }
    for (const g of SEED_GUIDES) {
      batch.set(doc(db, 'guides', g.guideId), { ...g, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
      count++;
    }
    for (const v of SEED_GUIDE_VIDEOS) {
      batch.set(doc(db, 'guideVideos', v.id), { ...v, createdAt: serverTimestamp() });
      count++;
    }
    for (const p of SEED_PACKAGES) {
      batch.set(doc(db, 'packages', p.id), { ...p, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
      count++;
    }
    for (const h of SEED_HOTELS) {
      batch.set(doc(db, 'hotels', h.id), { ...h, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
      count++;
    }
    for (const veh of SEED_VEHICLES) {
      batch.set(doc(db, 'vehicles', veh.id), { ...veh, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
      count++;
    }
    for (const rev of SEED_REVIEWS) {
      batch.set(doc(db, 'reviews', rev.id), { ...rev, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
      count++;
    }

    await batch.commit();
    return count;
  };

  useEffect(() => {
    if (
      authReady &&
      isAdmin &&
      !catalogLoading &&
      liveDestinations.length === 0 &&
      !autoSeededRef.current
    ) {
      autoSeededRef.current = true;
      void adminSeedCatalogToFirestore();
    }
  }, [authReady, isAdmin, catalogLoading, liveDestinations.length]);

  return (
    <MarketplaceContext.Provider
      value={{
        destinations,
        guides,
        guideVideos,
        packages,
        hotels,
        vehicles,
        reviews,
        travelPlans,
        guideRequests,
        bookings,
        messages,
        notifications,
        myVerification,
        allUsers,
        allVerifications,
        catalogLoading,
        messagingTarget,
        setMessagingTarget,
        createBooking,
        updateBookingStatus,
        createTravelPlan,
        updateTravelPlan,
        deleteTravelPlan,
        sendGuideRequest,
        respondToGuideRequest,
        upsertGuideProfile,
        submitGuideVerification,
        addGuideVideo,
        deleteGuideVideo,
        upsertPackage,
        deletePackage,
        upsertHotel,
        deleteHotel,
        upsertVehicle,
        deleteVehicle,
        sendMessage,
        markNotificationRead,
        submitReview,
        replyToReview,
        adminVerifyGuide,
        adminVerifyPartner,
        adminToggleUserSuspend,
        adminUpsertDestination,
        adminSeedCatalogToFirestore,
      }}
    >
      {children}
    </MarketplaceContext.Provider>
  );
}

export function useMarketplace() {
  const ctx = useContext(MarketplaceContext);
  if (!ctx) throw new Error('useMarketplace must be used inside MarketplaceProvider');
  return ctx;
}
