export type UserRole = 'tourist' | 'guide' | 'hotel_owner' | 'vehicle_owner' | 'admin';

export type VerificationStatus =
  | 'not_submitted'
  | 'pending'
  | 'under_review'
  | 'verified'
  | 'rejected'
  | 'resubmission_required';

export type PartnerApprovalStatus = 'pending' | 'verified' | 'rejected';

export type DriverOption = 'with_driver_only' | 'without_driver_only' | 'both';

export type BookingType = 'package' | 'guide_custom' | 'hotel' | 'vehicle';

export type BookingStatus =
  | 'pending'
  | 'accepted'
  | 'rejected'
  | 'confirmed'
  | 'active'
  | 'completed'
  | 'cancelled';

export type PaymentPlaceholderStatus = 'not_required_yet' | 'coming_soon';

export type GuideRequestStatus =
  | 'pending'
  | 'viewed'
  | 'quotation_sent'
  | 'accepted'
  | 'rejected'
  | 'cancelled'
  | 'booking_requested'
  | 'completed';

export type DestinationRegion =
  | 'Gilgit-Baltistan'
  | 'Swat & Kaghan'
  | 'High Passes'
  | 'Lakes & Meadows';

export type ActivePage =
  | 'home'
  | 'destinations'
  | 'guides'
  | 'packages'
  | 'trip-planner'
  | 'hotels'
  | 'vehicles'
  | 'about'
  | 'dashboard';

export interface UserProfile {
  uid: string;
  email: string;
  fullName: string;
  phone?: string;
  role: UserRole;
  avatarUrl?: string;
  city?: string;
  isSuspended: boolean;
  savedDestinationIds?: string[];
  savedGuideIds?: string[];
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface Destination {
  id: string;
  name: string;
  region: DestinationRegion;
  province?: string;
  tagline?: string;
  description: string;
  imageUrl: string;
  bestTimeToVisit: string;
  estimatedBudgetPkr: number;
  elevationMeters?: number;
  latitude?: number;
  longitude?: number;
  highlights?: string[];
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface GuideProfile {
  guideId: string;
  ownerUid: string;
  displayName: string;
  avatarUrl?: string;
  bio: string;
  experienceYears: number;
  languages?: string[];
  specializations?: string[];
  availableDestinations?: string[];
  startingPricePkr: number;
  verificationStatus: VerificationStatus;
  ratingAvg?: number;
  reviewCount?: number;
  completedToursCount?: number;
  availabilityStatus?: string;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface GuideVerification {
  guideId: string;
  ownerUid: string;
  legalFullName: string;
  cnicNumber: string;
  contactNumber: string;
  address: string;
  cnicFrontReference?: string;
  cnicBackReference?: string;
  certificateTitle?: string;
  status: VerificationStatus;
  adminRemarks?: string;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface GuideVideo {
  id: string;
  guideId: string;
  ownerUid: string;
  title: string;
  description?: string;
  destination: string;
  tourDate: string;
  videoUrl: string;
  thumbnailUrl?: string;
  createdAt?: unknown;
}

export interface GuidePackage {
  id: string;
  guideId: string;
  ownerUid: string;
  guideName: string;
  title: string;
  destination: string;
  imageUrl?: string;
  description?: string;
  days: number;
  nights: number;
  pricePerPersonPkr: number;
  groupPricePkr?: number;
  minTravelers?: number;
  maxTravelers?: number;
  includedServices?: string[];
  excludedServices?: string[];
  accommodationSummary?: string;
  transportSummary?: string;
  dailyItinerary?: string[];
  availableDates?: string;
  cancellationPolicy?: string;
  isPublished: boolean;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface TravelPlan {
  id: string;
  touristUid: string;
  touristName: string;
  title: string;
  startingLocation: string;
  destinations: string[];
  departureDate: string;
  returnDate: string;
  travelersCount: number;
  budgetPkr: number;
  preferredTransport?: string;
  hotelRequirement?: string;
  activities?: string[];
  specialInstructions?: string;
  estimatedCostPkr?: number;
  status: 'draft' | 'sent' | 'quoted' | 'booked' | 'completed' | 'cancelled';
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface GuideRequest {
  id: string;
  planId?: string;
  touristUid: string;
  touristName: string;
  guideId: string;
  guideOwnerUid: string;
  guideName: string;
  tripTitle: string;
  startingLocation?: string;
  destinations: string[];
  departureDate: string;
  returnDate: string;
  travelersCount: number;
  budgetPkr: number;
  preferredTransport?: string;
  hotelRequirement?: string;
  notes?: string;
  status: GuideRequestStatus;
  quotedPricePkr?: number;
  proposedItinerary?: string;
  guideMessage?: string;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface HotelRoomType {
  roomType: 'Single' | 'Double' | 'Deluxe' | 'Family' | 'Suite';
  pricePerNightPkr: number;
  totalRooms: number;
  maxGuests: number;
}

export interface Hotel {
  id: string;
  ownerUid: string;
  ownerName: string;
  name: string;
  destination: string;
  address: string;
  description?: string;
  imageUrl?: string;
  facilities?: string[];
  checkInTime?: string;
  checkOutTime?: string;
  cancellationPolicy?: string;
  rooms?: HotelRoomType[];
  startingPricePkr: number;
  verificationStatus: PartnerApprovalStatus;
  ratingAvg?: number;
  reviewCount?: number;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface Vehicle {
  id: string;
  ownerUid: string;
  ownerName: string;
  name: string;
  brand?: string;
  model?: string;
  modelYear?: number;
  category: '4x4 Jeep' | 'SUV' | 'Car' | 'Hiace Van' | 'Coaster';
  seats: number;
  imageUrl?: string;
  fuelType?: string;
  transmission?: string;
  acAvailable?: boolean;
  condition?: string;
  pickupLocation: string;
  serviceAreas?: string[];
  pricePerDayPkr: number;
  driverOption: DriverOption;
  driverFeePerDayPkr?: number;
  selfDriveEligibility?: string;
  rentalTerms?: string;
  verificationStatus: PartnerApprovalStatus;
  availableForBooking: boolean;
  ratingAvg?: number;
  reviewCount?: number;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface Booking {
  id: string;
  bookingType: BookingType;
  touristUid: string;
  touristName: string;
  providerUid: string;
  providerName: string;
  listingId: string;
  listingTitle: string;
  destination?: string;
  startDate: string;
  endDate: string;
  daysCount: number;
  guestsCount?: number;
  roomType?: string;
  driverSelected?: boolean;
  pickupLocation?: string;
  estimatedTotalPkr: number;
  notes?: string;
  bookingStatus: BookingStatus;
  paymentStatus: PaymentPlaceholderStatus;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface Message {
  id: string;
  conversationKey: string;
  senderUid: string;
  senderName: string;
  recipientUid: string;
  recipientName: string;
  relatedListingTitle?: string;
  text: string;
  participants: string[];
  createdAt?: unknown;
}

export interface NotificationItem {
  id: string;
  recipientUid: string;
  title: string;
  body: string;
  type: 'booking' | 'quotation' | 'verification' | 'message' | 'system';
  isRead: boolean;
  createdAt?: unknown;
}

export interface Review {
  id: string;
  targetType: 'guide' | 'hotel' | 'vehicle';
  targetId: string;
  targetName?: string;
  providerUid: string;
  bookingId: string;
  authorUid: string;
  authorName: string;
  rating: number;
  comment: string;
  providerReply?: string;
  createdAt?: unknown;
  updatedAt?: unknown;
}

// Defensive Payload Sanitizers synchronized with firebase-blueprint.json
export function sanitizeString(val: unknown, maxLen: number, fallback = ''): string {
  const s = typeof val === 'string' ? val.trim() : fallback;
  return s.slice(0, maxLen);
}

export function sanitizeStringList(arr: unknown, maxItems: number, maxItemLen = 100): string[] {
  if (!Array.isArray(arr)) return [];
  return arr
    .filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
    .map((item) => item.trim().slice(0, maxItemLen))
    .slice(0, maxItems);
}

export function createSafeId(prefix: string): string {
  const cleanPrefix = prefix.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 24) || 'tm';
  const rand = Math.random().toString(36).slice(2, 10);
  return `${cleanPrefix}_${Date.now()}_${rand}`.slice(0, 128);
}

export function formatPkr(amount: number | undefined): string {
  if (typeof amount !== 'number' || Number.isNaN(amount)) return 'PKR 0';
  return `PKR ${Math.round(amount).toLocaleString('en-PK')}`;
}

export function calculateDaysBetween(startDate: string, endDate: string): number {
  if (!startDate || !endDate) return 1;
  const start = new Date(startDate);
  const end = new Date(endDate);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return 1;
  const diff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  return Math.max(1, Math.min(90, diff));
}
