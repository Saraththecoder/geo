"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import {
  User,
  GoogleAuthProvider,
  signInWithPopup,
  signOut as firebaseSignOut,
  onIdTokenChanged,
} from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase/client";
import { UserProfile, UserRole } from "@/types";
import { isAllowedCollegeEmail } from "@/lib/auth/domain";

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  role: UserRole | null;
  isLoading: boolean;
  error: string | null;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onIdTokenChanged(auth, async (currentUser) => {
      if (!currentUser) {
        setUser(null);
        setProfile(null);
        setRole(null);
        setIsLoading(false);
        return;
      }

      // Check email domain immediately on the client side
      if (!isAllowedCollegeEmail(currentUser.email)) {
        await firebaseSignOut(auth);
        setUser(null);
        setProfile(null);
        setRole(null);
        const domain =
          process.env.NEXT_PUBLIC_ALLOWED_EMAIL_DOMAIN ||
          process.env.ALLOWED_EMAIL_DOMAIN ||
          "aits.edu";
        setError(
          `Access restricted: please sign in with an authorized email address (@${domain}).`
        );
        setIsLoading(false);
        return;
      }

      try {
        const idToken = await currentUser.getIdToken();

        // Sync session with server to establish HTTP-only session cookie
        const res = await fetch("/api/auth/session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ idToken }),
        });

        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData?.error?.message || "Failed to create server session");
        }

        // Force refresh ID token so custom claims (role, allocatedBusId) are immediately available in the client token
        try {
          await currentUser.getIdToken(true);
        } catch (tokenRefreshErr) {
          console.warn("Non-fatal token refresh warning:", tokenRefreshErr);
        }

        const sessionJson = await res.json();
        const serverData = sessionJson?.data;

        let userRole: UserRole = (serverData?.role as UserRole) || "student";
        let userProfile: UserProfile = {
          uid: currentUser.uid,
          email: currentUser.email || "",
          name: currentUser.displayName || currentUser.email?.split("@")[0] || "User",
          role: userRole,
          allocatedBusId: serverData?.allocatedBusId || null,
          stopId: serverData?.stopId || null,
          fcmTokens: [],
        };

        // Fetch user profile from Firestore if available on client
        try {
          const userDocRef = doc(db, "users", currentUser.uid);
          const userDocSnap = await getDoc(userDocRef);

          if (userDocSnap.exists()) {
            const data = userDocSnap.data() as UserProfile;
            userProfile = { ...userProfile, ...data };
            if (data.role) {
              userRole = data.role;
            }
          }
        } catch (clientFsErr) {
          console.warn(
            "Client Firestore profile read fallback (using server session profile):",
            clientFsErr
          );
        }

        setProfile(userProfile);
        setRole(userRole);
        setUser(currentUser);
        setError(null);
      } catch (err: unknown) {
        console.error("Auth state synchronization error:", err);
        setError(err instanceof Error ? err.message : "Authentication error occurred");
      } finally {
        setIsLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    setError(null);
    setIsLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      const domain =
        process.env.NEXT_PUBLIC_ALLOWED_EMAIL_DOMAIN ||
        process.env.ALLOWED_EMAIL_DOMAIN ||
        "aits.edu";

      const customParams: Record<string, string> = {
        prompt: "select_account",
      };
      if (domain && domain !== "gmail.com" && domain !== "googlemail.com") {
        customParams.hd = domain;
      }
      provider.setCustomParameters(customParams);

      const credential = await signInWithPopup(auth, provider);
      const email = credential.user.email;

      if (!isAllowedCollegeEmail(email)) {
        await firebaseSignOut(auth);
        throw new Error(`Unauthorized domain. Only @${domain} accounts are permitted.`);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Google sign-in failed";
      setError(msg);
      setIsLoading(false);
      throw err;
    }
  };

  const signOut = async () => {
    try {
      await fetch("/api/auth/session", { method: "DELETE" });
      await firebaseSignOut(auth);
      setUser(null);
      setProfile(null);
      setRole(null);
      setError(null);
    } catch (err: unknown) {
      console.error("Sign-out error:", err);
    }
  };

  const clearError = () => setError(null);

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        role,
        isLoading,
        error,
        signInWithGoogle,
        signOut,
        clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
