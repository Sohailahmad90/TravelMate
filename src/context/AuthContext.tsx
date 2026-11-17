import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import {
  User as FirebaseUser,
  onAuthStateChanged,
  signInWithPopup,
  signOut,
} from 'firebase/auth';
import {
  doc,
  getDoc,
  onSnapshot,
  serverTimestamp,
  setDoc,
  updateDoc,
} from 'firebase/firestore';
import {
  auth,
  db,
  googleProvider,
  handleFirestoreError,
  OperationType,
} from '../lib/firebase';
import {
  sanitizeString,
  sanitizeStringList,
  UserProfile,
  UserRole,
} from '../types/travelmate';

const ADMIN_EMAIL = 'shahsohailahmad001@gmail.com';
const ROLE_STORAGE_KEY = 'tm_preferred_role';

export type AuthModalMode = 'signin' | 'signup';

export interface AuthSelectionInput {
  mode: AuthModalMode;
  role: Exclude<UserRole, 'admin'>;
  fullName?: string;
  phone?: string;
  city?: string;
}

const ROLE_DISPLAY_NAMES: Record<UserRole, string> = {
  tourist: 'Traveller / Tourist',
  guide: 'Tour Guide',
  hotel_owner: 'Hotel Owner',
  vehicle_owner: 'Vehicle / Fleet Owner',
  admin: 'Admin',
};

function readStoredRole(): UserRole | null {
  try {
    const val = sessionStorage.getItem(ROLE_STORAGE_KEY);
    if (
      val === 'tourist' ||
      val === 'guide' ||
      val === 'hotel_owner' ||
      val === 'vehicle_owner' ||
      val === 'admin'
    ) {
      return val;
    }
  } catch {
    // ignore storage access issues
  }
  return null;
}

function writeStoredRole(role: UserRole | null) {
  try {
    if (role) {
      sessionStorage.setItem(ROLE_STORAGE_KEY, role);
    } else {
      sessionStorage.removeItem(ROLE_STORAGE_KEY);
    }
  } catch {
    // ignore storage access issues
  }
}

function formatAuthError(err: unknown): string {
  const code =
    typeof err === 'object' && err !== null && 'code' in err
      ? String((err as { code?: unknown }).code)
      : '';
  switch (code) {
    case 'auth/popup-closed-by-user':
      return 'Google sign-in popup was closed before completing. Please try again.';
    case 'auth/cancelled-popup-request':
      return 'Another sign-in window was already open. Please click Continue with Google once more.';
    case 'auth/popup-blocked':
      return 'Your browser blocked the Google sign-in popup. Allow popups for this site and retry.';
    case 'auth/unauthorized-domain':
      return 'This domain is not authorized for Google Sign-In in Firebase Authentication settings.';
    case 'auth/network-request-failed':
      return 'Network error while contacting Google Sign-In. Please check your connection.';
    case 'permission-denied':
      return 'Firestore permission denied while preparing your profile. Please try again in a moment.';
    default:
      return err instanceof Error ? err.message : 'Unable to sign in with Google.';
  }
}

interface AuthContextValue {
  firebaseUser: FirebaseUser | null;
  profile: UserProfile | null;
  authReady: boolean;
  needsOnboarding: boolean;
  isAdmin: boolean;
  effectiveRole: UserRole | null;
  preferredDashboardRole: UserRole | null;
  setPreferredDashboardRole: (role: UserRole | null) => void;
  switchRole: (role: UserRole) => Promise<void>;
  authModalOpen: boolean;
  authModalMode: AuthModalMode;
  authModalDefaultRole: Exclude<UserRole, 'admin'>;
  openAuthModal: (
    mode?: AuthModalMode,
    options?: {
      redirectToDashboard?: boolean;
      defaultRole?: Exclude<UserRole, 'admin'>;
    }
  ) => void;
  closeAuthModal: () => void;
  profileSettingsOpen: boolean;
  openProfileSettings: () => void;
  closeProfileSettings: () => void;
  dashboardTargetTab: string | null;
  setDashboardTargetTab: (tab: string | null) => void;
  pendingDashboardRedirect: boolean;
  clearDashboardRedirect: () => void;
  signInWithGoogle: (selection?: AuthSelectionInput) => Promise<boolean>;
  logout: () => Promise<void>;
  completeOnboarding: (data: {
    fullName: string;
    phone: string;
    city: string;
    role: Exclude<UserRole, 'admin'>;
  }) => Promise<void>;
  updateProfileInfo: (data: {
    fullName: string;
    email?: string;
    phone: string;
    city: string;
    avatarUrl?: string;
  }) => Promise<void>;
  toggleSavedDestination: (destId: string) => Promise<void>;
  toggleSavedGuide: (guideId: string) => Promise<void>;
  authError: string | null;
  clearAuthError: () => void;
  authNotice: string | null;
  clearAuthNotice: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);
  const [preferredDashboardRole, setPreferredDashboardRoleState] = useState<UserRole | null>(() =>
    readStoredRole()
  );
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<AuthModalMode>('signin');
  const [authModalDefaultRole, setAuthModalDefaultRole] =
    useState<Exclude<UserRole, 'admin'>>('tourist');
  const [profileSettingsOpen, setProfileSettingsOpen] = useState(false);
  const [dashboardTargetTab, setDashboardTargetTab] = useState<string | null>(null);
  const [redirectToDashboardOnAuth, setRedirectToDashboardOnAuth] = useState(false);
  const [pendingDashboardRedirect, setPendingDashboardRedirect] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authNotice, setAuthNotice] = useState<string | null>(null);

  const pendingSelectionRef = useRef<AuthSelectionInput | null>(null);
  const activeSyncPromiseRef = useRef<{ uid: string; promise: Promise<void> } | null>(null);

  const setPreferredDashboardRole = (role: UserRole | null) => {
    setPreferredDashboardRoleState(role);
    writeStoredRole(role);
  };

  const ensureGuideDocument = async (
    user: FirebaseUser,
    displayName: string,
    city: string
  ) => {
    const guideRef = doc(db, 'guides', user.uid);
    const existingGuide = await getDoc(guideRef);
    if (!existingGuide.exists()) {
      const safeName = sanitizeString(displayName, 100, 'TravelMate Guide');
      const finalName = safeName.length >= 2 ? safeName : 'TravelMate Guide';
      const safeAvatar = sanitizeString(user.photoURL || '', 120000);
      await setDoc(guideRef, {
        guideId: user.uid,
        ownerUid: user.uid,
        displayName: finalName,
        avatarUrl: safeAvatar,
        bio: `Local tour guide based in ${city || 'Pakistan'} ready to customize northern Pakistan expeditions.`,
        experienceYears: 2,
        languages: ['Urdu', 'English'],
        specializations: ['Custom Tours'],
        availableDestinations: ['Hunza Valley', 'Skardu & Kachura'],
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
  };

  const syncUserProfile = async (
    user: FirebaseUser,
    selection: AuthSelectionInput | null
  ): Promise<void> => {
    if (activeSyncPromiseRef.current?.uid === user.uid) {
      return activeSyncPromiseRef.current.promise;
    }

    const promise = (async () => {
      const userRef = doc(db, 'users', user.uid);
      const snap = await getDoc(userRef);
      const isUserAdminAccount = user.email === ADMIN_EMAIL && user.emailVerified;

      if (!snap.exists()) {
        if (isUserAdminAccount) {
          const rawName = sanitizeString(
            selection?.fullName?.trim() || user.displayName || 'TravelMate Admin',
            100,
            'TravelMate Admin'
          );
          const fullName = rawName.length >= 2 ? rawName : 'TravelMate Admin';
          const city = sanitizeString(selection?.city?.trim() || 'Islamabad', 80, 'Islamabad');
          const phone = sanitizeString(
            selection?.phone?.trim() || '+92 300 0000000',
            32,
            '+92 300 0000000'
          );

          await setDoc(userRef, {
            uid: user.uid,
            email: sanitizeString(user.email || '', 160),
            fullName,
            phone,
            role: 'admin',
            avatarUrl: sanitizeString(user.photoURL || '', 120000),
            city,
            isSuspended: false,
            savedDestinationIds: [],
            savedGuideIds: [],
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });

          const chosenRole = selection?.role || readStoredRole() || 'admin';
          setPreferredDashboardRole(chosenRole);
          if (chosenRole === 'guide') {
            await ensureGuideDocument(user, fullName, city);
          }
          setNeedsOnboarding(false);
        } else if (selection?.role) {
          const rawName = sanitizeString(
            selection.fullName?.trim() || user.displayName || 'Traveler',
            100,
            'Traveler'
          );
          const fullName = rawName.length >= 2 ? rawName : 'Traveler';
          const city = sanitizeString(selection.city?.trim() || 'Islamabad', 80, 'Islamabad');
          const phone = sanitizeString(selection.phone?.trim() || '', 32);

          await setDoc(userRef, {
            uid: user.uid,
            email: sanitizeString(user.email || '', 160),
            fullName,
            phone,
            role: selection.role,
            avatarUrl: sanitizeString(user.photoURL || '', 120000),
            city,
            isSuspended: false,
            savedDestinationIds: [],
            savedGuideIds: [],
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });

          if (selection.role === 'guide') {
            await ensureGuideDocument(user, fullName, city);
          }
          setPreferredDashboardRole(selection.role);
          setNeedsOnboarding(false);
          setAuthNotice(
            `Welcome to TravelMate! Your ${ROLE_DISPLAY_NAMES[selection.role]} workspace is ready.`
          );
        } else {
          setNeedsOnboarding(true);
        }
      } else {
        const existingUser = snap.data() as UserProfile;
        setNeedsOnboarding(false);

        if (isUserAdminAccount) {
          const targetRole = selection?.role || readStoredRole() || 'admin';
          setPreferredDashboardRole(targetRole);
          if (targetRole === 'guide') {
            await ensureGuideDocument(
              user,
              existingUser.fullName || user.displayName || 'TravelMate Guide',
              existingUser.city || 'Islamabad'
            );
          }
        } else if (selection?.role) {
          // Allow seamless role switch among non-admin marketplace roles
          if (selection.role !== existingUser.role) {
            await updateDoc(userRef, {
              role: selection.role,
              updatedAt: serverTimestamp(),
            });
            setAuthNotice(
              `Switched active account role to ${ROLE_DISPLAY_NAMES[selection.role]}.`
            );
          }
          if (selection.role === 'guide') {
            await ensureGuideDocument(
              user,
              existingUser.fullName || user.displayName || 'TravelMate Guide',
              existingUser.city || 'Islamabad'
            );
          }
          setPreferredDashboardRole(selection.role);
        } else {
          setPreferredDashboardRole(existingUser.role);
        }
      }
    })();

    activeSyncPromiseRef.current = { uid: user.uid, promise };
    try {
      await promise;
    } finally {
      if (activeSyncPromiseRef.current?.promise === promise) {
        activeSyncPromiseRef.current = null;
      }
    }
  };

  useEffect(() => {
    let unsubProfile: (() => void) | undefined;

    const unsubAuth = onAuthStateChanged(auth, async (user) => {
      if (unsubProfile) {
        unsubProfile();
        unsubProfile = undefined;
      }

      setFirebaseUser(user);
      if (!user) {
        setProfile(null);
        setNeedsOnboarding(false);
        setPreferredDashboardRole(null);
        setAuthReady(true);
        return;
      }

      const userRef = doc(db, 'users', user.uid);
      try {
        await syncUserProfile(user, pendingSelectionRef.current);
        pendingSelectionRef.current = null;
      } catch (err) {
        setAuthError(formatAuthError(err));
      }

      unsubProfile = onSnapshot(
        userRef,
        (docSnap) => {
          if (docSnap.exists()) {
            const loaded = docSnap.data() as UserProfile;
            setProfile(loaded);
            setNeedsOnboarding(false);
          } else {
            setProfile(null);
          }
          setAuthReady(true);
        },
        (err) => {
          setAuthError(formatAuthError(err));
          setAuthReady(true);
        }
      );
    });

    return () => {
      unsubAuth();
      if (unsubProfile) unsubProfile();
    };
  }, []);

  const openAuthModal: AuthContextValue['openAuthModal'] = (
    mode = 'signin',
    options
  ) => {
    setAuthError(null);
    setAuthModalMode(mode);
    setAuthModalDefaultRole(options?.defaultRole || 'tourist');
    setRedirectToDashboardOnAuth(Boolean(options?.redirectToDashboard));
    setAuthModalOpen(true);
  };

  const closeAuthModal = () => {
    setAuthModalOpen(false);
  };

  const signInWithGoogle = async (selection?: AuthSelectionInput): Promise<boolean> => {
    setAuthError(null);
    setAuthNotice(null);
    pendingSelectionRef.current = selection || null;

    try {
      const cred = await signInWithPopup(auth, googleProvider);
      await syncUserProfile(cred.user, selection || null);
      pendingSelectionRef.current = null;
      setAuthModalOpen(false);
      setDashboardTargetTab(null);
      if (redirectToDashboardOnAuth) {
        setPendingDashboardRedirect(true);
        setRedirectToDashboardOnAuth(false);
      }
      return true;
    } catch (err) {
      pendingSelectionRef.current = null;
      setAuthError(formatAuthError(err));
      return false;
    }
  };

  const logout = async () => {
    setAuthError(null);
    setAuthNotice(null);
    setProfileSettingsOpen(false);
    setPreferredDashboardRole(null);
    pendingSelectionRef.current = null;
    await signOut(auth);
  };

  const isAdmin = Boolean(
    firebaseUser?.emailVerified &&
      (firebaseUser.email === ADMIN_EMAIL || profile?.role === 'admin')
  );

  const effectiveRole: UserRole | null = !firebaseUser
    ? null
    : isAdmin
    ? preferredDashboardRole || 'admin'
    : profile?.role || preferredDashboardRole || 'tourist';

  const switchRole = async (role: UserRole) => {
    if (!firebaseUser) return;
    if (isAdmin) {
      setPreferredDashboardRole(role);
      if (role === 'guide') {
        await ensureGuideDocument(
          firebaseUser,
          profile?.fullName || firebaseUser.displayName || 'TravelMate Guide',
          profile?.city || 'Islamabad'
        );
      }
      return;
    }
    if (role === 'admin') return;

    const userRef = doc(db, 'users', firebaseUser.uid);
    try {
      await updateDoc(userRef, {
        role,
        updatedAt: serverTimestamp(),
      });
      if (role === 'guide') {
        await ensureGuideDocument(
          firebaseUser,
          profile?.fullName || firebaseUser.displayName || 'TravelMate Guide',
          profile?.city || 'Islamabad'
        );
      }
      setPreferredDashboardRole(role);
      setAuthNotice(`Switched workspace to ${ROLE_DISPLAY_NAMES[role]}.`);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${firebaseUser.uid}`);
    }
  };

  const completeOnboarding = async (data: {
    fullName: string;
    phone: string;
    city: string;
    role: Exclude<UserRole, 'admin'>;
  }) => {
    if (!firebaseUser) return;
    const userRef = doc(db, 'users', firebaseUser.uid);
    const rawName = sanitizeString(
      data.fullName,
      100,
      firebaseUser.displayName || 'Traveler'
    );
    const fullName = rawName.length >= 2 ? rawName : 'Traveler';
    const phone = sanitizeString(data.phone, 32);
    const city = sanitizeString(data.city, 80, 'Islamabad');
    const avatarUrl = sanitizeString(firebaseUser.photoURL || '', 120000);

    try {
      await setDoc(userRef, {
        uid: firebaseUser.uid,
        email: sanitizeString(firebaseUser.email || '', 160),
        fullName,
        phone,
        role: data.role,
        avatarUrl,
        city,
        isSuspended: false,
        savedDestinationIds: [],
        savedGuideIds: [],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      if (data.role === 'guide') {
        await ensureGuideDocument(firebaseUser, fullName, city);
      }

      setPreferredDashboardRole(data.role);
      setNeedsOnboarding(false);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `users/${firebaseUser.uid}`);
    }
  };

  const updateProfileInfo = async (data: {
    fullName: string;
    email?: string;
    phone: string;
    city: string;
    avatarUrl?: string;
  }) => {
    if (!firebaseUser) return;
    const userRef = doc(db, 'users', firebaseUser.uid);
    const safeName = sanitizeString(data.fullName, 100, profile?.fullName || 'Traveler');
    const finalName = safeName.length >= 2 ? safeName : 'Traveler';
    const patch: Record<string, unknown> = {
      fullName: finalName,
      phone: sanitizeString(data.phone, 32),
      city: sanitizeString(data.city, 80),
      updatedAt: serverTimestamp(),
    };
    if (data.email && data.email.trim().length >= 3) {
      patch.email = sanitizeString(data.email, 160);
    }
    if (data.avatarUrl !== undefined) {
      patch.avatarUrl = sanitizeString(data.avatarUrl, 120000);
    }

    try {
      await updateDoc(userRef, patch);
      // Sync public guide displayName / short URL avatar if guide doc exists
      const guideRef = doc(db, 'guides', firebaseUser.uid);
      const guideSnap = await getDoc(guideRef);
      if (guideSnap.exists()) {
        const guidePatch: Record<string, unknown> = {
          displayName: finalName,
          updatedAt: serverTimestamp(),
        };
        if (data.avatarUrl !== undefined) {
          guidePatch.avatarUrl = sanitizeString(data.avatarUrl, 120000);
        }
        await updateDoc(guideRef, guidePatch);
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${firebaseUser.uid}`);
    }
  };

  const toggleSavedDestination = async (destId: string) => {
    if (!firebaseUser || !profile) return;
    const current = sanitizeStringList(profile.savedDestinationIds, 50);
    const next = current.includes(destId)
      ? current.filter((id) => id !== destId)
      : [...current, destId].slice(0, 50);
    const userRef = doc(db, 'users', firebaseUser.uid);
    try {
      await updateDoc(userRef, {
        savedDestinationIds: next,
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${firebaseUser.uid}`);
    }
  };

  const toggleSavedGuide = async (guideId: string) => {
    if (!firebaseUser || !profile) return;
    const current = sanitizeStringList(profile.savedGuideIds, 50);
    const next = current.includes(guideId)
      ? current.filter((id) => id !== guideId)
      : [...current, guideId].slice(0, 50);
    const userRef = doc(db, 'users', firebaseUser.uid);
    try {
      await updateDoc(userRef, {
        savedGuideIds: next,
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${firebaseUser.uid}`);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        firebaseUser,
        profile,
        authReady,
        needsOnboarding,
        isAdmin,
        effectiveRole,
        preferredDashboardRole,
        setPreferredDashboardRole,
        switchRole,
        authModalOpen,
        authModalMode,
        authModalDefaultRole,
        openAuthModal,
        closeAuthModal,
        profileSettingsOpen,
        openProfileSettings: () => setProfileSettingsOpen(true),
        closeProfileSettings: () => setProfileSettingsOpen(false),
        dashboardTargetTab,
        setDashboardTargetTab,
        pendingDashboardRedirect,
        clearDashboardRedirect: () => setPendingDashboardRedirect(false),
        signInWithGoogle,
        logout,
        completeOnboarding,
        updateProfileInfo,
        toggleSavedDestination,
        toggleSavedGuide,
        authError,
        clearAuthError: () => setAuthError(null),
        authNotice,
        clearAuthNotice: () => setAuthNotice(null),
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
