import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  User, 
  onAuthStateChanged, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut 
} from 'firebase/auth';
import { 
  doc, 
  getDoc, 
  setDoc, 
  getDocFromServer 
} from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { UserProfile, UserRole } from '../types';

interface FirebaseContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
}

const FirebaseContext = createContext<FirebaseContextType | undefined>(undefined);

export const FirebaseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  useEffect(() => {
    // Validate connection to Firestore
    async function testConnection() {
      try {
        await getDocFromServer(doc(db, '_connection_test', 'init'));
      } catch (error) {
        if (error instanceof Error) {
          if (error.message.includes('the client is offline')) {
            console.error("Firestore is offline. Check if your database exists and project ID is correct.");
          } else if (error.message.includes('permission-denied')) {
            // This is actually GOOD - it means we reached the server and were rejected by rules
            console.log("Firestore connection verified (Permission Denied as expected).");
          } else {
            console.warn("Firestore connection test produced an unexpected result:", error.message);
          }
        }
      }
    }
    testConnection();

    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
    });

    return () => unsubscribe();
  }, []);

  // Sync profile logic
  const syncProfile = async (currentUser: User) => {
    try {
      const profileDoc = await getDoc(doc(db, 'users', currentUser.uid));
      const preferredRole = localStorage.getItem('acx_preferred_role');
      const preferredName = localStorage.getItem('acx_preferred_display_name');
      const registrationDataRaw = localStorage.getItem('acx_registration_data');
      const registrationData = registrationDataRaw ? JSON.parse(registrationDataRaw) : null;

      if (profileDoc.exists()) {
        let currentProfile = profileDoc.data() as UserProfile;
        let hasUpdates = false;
        const updates: Partial<UserProfile> = {};
        
        if (preferredRole && (preferredRole as UserRole) !== currentProfile.role) {
          updates.role = preferredRole as UserRole;
          
          if (preferredRole === UserRole.BORROWER && (currentProfile.creditScore === 0 || !currentProfile.creditScore)) {
            updates.creditScore = 650;
          }
          hasUpdates = true;
        }

        if (preferredName && preferredName !== currentProfile.displayName) {
          updates.displayName = preferredName;
          hasUpdates = true;
        }

        if (registrationData) {
          if (registrationData.country) updates.country = registrationData.country;
          if (registrationData.phoneCode) updates.phoneCode = registrationData.phoneCode;
          if (registrationData.languages) updates.languages = registrationData.languages;
          if (registrationData.preferredCurrencies) updates.preferredCurrencies = registrationData.preferredCurrencies;
          if (registrationData.photoURL) updates.photoURL = registrationData.photoURL;
          if (registrationData.organizationDetails) updates.organizationDetails = registrationData.organizationDetails;
          
          // CRITICAL: Overwrite borrowerDetails.profile fields with the new display name 
          // to prevent "sticky" old identity info in the UI.
          const finalName = preferredName || currentProfile.displayName;
          const [fName, ...lNames] = finalName.split(' ');
          const lName = lNames.join(' ');

          updates.borrowerDetails = {
            ...(currentProfile.borrowerDetails || {
              uploads: {},
              verificationResults: {},
              scoreResult: null
            }),
            profile: {
              ...(currentProfile.borrowerDetails?.profile || {}),
              businessName: finalName,
              firstName: fName || '',
              lastName: lName || '',
              nationality: registrationData.country || currentProfile.country || '',
              taxNumber: registrationData.organizationDetails?.taxId || currentProfile.borrowerDetails?.profile?.taxNumber || ''
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
            } as any
          };
          
          hasUpdates = true;
        }

        if (hasUpdates) {
          await setDoc(doc(db, 'users', currentUser.uid), updates, { merge: true });
          currentProfile = { ...currentProfile, ...updates };
          localStorage.removeItem('acx_preferred_role');
          localStorage.removeItem('acx_preferred_display_name');
          localStorage.removeItem('acx_registration_data');
        }
        
        setProfile(currentProfile);
      } else {
        const newProfile: UserProfile = {
          uid: currentUser.uid,
          email: currentUser.email || '',
          displayName: preferredName || currentUser.displayName || 'New User',
          role: (preferredRole as UserRole) || UserRole.BORROWER,
          creditScore: (preferredRole === UserRole.BORROWER) ? 650 : 0,
          kycStatus: 'PENDING',
          currency: (registrationData?.preferredCurrencies?.[0]) || 'USD',
          preferredCurrencies: registrationData?.preferredCurrencies || ['USD'],
          balance: 0,
          is2FAEnabled: false,
          country: registrationData?.country,
          phoneCode: registrationData?.phoneCode,
          languages: registrationData?.languages,
          photoURL: registrationData?.photoURL,
          organizationDetails: registrationData?.organizationDetails,
          borrowerDetails: (preferredRole === UserRole.BORROWER || registrationData?.organizationDetails) ? {
            profile: {
              firstName: registrationData?.displayName?.split(' ')[0] || '',
              lastName: registrationData?.displayName?.split(' ')[1] || '',
              businessName: registrationData?.displayName || '',
              taxNumber: registrationData?.organizationDetails?.taxId || '',
              nationality: registrationData?.country || ''
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
            } as any,
            uploads: {},
            scoreResult: null
          } : undefined
        };

        await setDoc(doc(db, 'users', currentUser.uid), newProfile);
        setProfile(newProfile);
        localStorage.removeItem('acx_preferred_role');
        localStorage.removeItem('acx_preferred_display_name');
        localStorage.removeItem('acx_registration_data');
      }
    } catch (error) {
      console.error("Failed to sync profile:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user) {
      setProfile(null);
      setLoading(false);
      return;
    }

    syncProfile(user);
  }, [user]);

  const login = async () => {
    if (isLoggingIn) return;
    setIsLoggingIn(true);
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      if (result.user) {
        await syncProfile(result.user);
      }
    } catch (error: unknown) {
      const authError = error as { code?: string };
      if (authError.code === 'auth/cancelled-popup-request' || authError.code === 'auth/popup-closed-by-user') {
        console.warn("Login popup was closed or cancelled.");
      } else {
        console.error("Login failed:", error);
      }
    } finally {
      setIsLoggingIn(false);
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!user || !profile) return;
    const updatedProfile = { ...profile, ...updates };
    try {
      await setDoc(doc(db, 'users', user.uid), updatedProfile, { merge: true });
      setProfile(updatedProfile);
    } catch (error) {
      console.error("Profile update failed:", error);
    }
  };

  return (
    <FirebaseContext.Provider value={{ user, profile, loading, login, logout, updateProfile }}>
      {children}
    </FirebaseContext.Provider>
  );
};

export const useFirebase = () => {
  const context = useContext(FirebaseContext);
  if (context === undefined) {
    throw new Error('useFirebase must be used within a FirebaseProvider');
  }
  return context;
};
