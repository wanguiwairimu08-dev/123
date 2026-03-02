"use client";

import { useState, useEffect } from "react";
import {
  type User,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import { auth } from "@/lib/firebase";

const ADMIN_WHITELIST = {
  uid: "VJdxemjpYTfR3TAfAQDmZ9ucjxB2",
  email: "beautyexpress211@gmail.com",
} as const;

export function useAdminAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    // Set a timeout to prevent infinite loading
    const timeout = setTimeout(() => {
      console.log("Auth timeout reached - forcing loading to false");
      setLoading(false);
      setUser(null);
      setIsAdmin(false);
    }, 3000);

    const unsubscribe = onAuthStateChanged(
      auth,
      (user) => {
        console.log("🔐 Auth state changed:", user?.email, user?.uid);
        console.log("🔍 Admin whitelist:", ADMIN_WHITELIST);
        setUser(user);

        if (
          user && // we have a user
          user.uid === ADMIN_WHITELIST.uid && // UID matches
          user.email === ADMIN_WHITELIST.email
        ) {
          // email matches
          console.log("✅ Admin user verified");
          setIsAdmin(true);
        } else {
          console.log(
            "❌ Not admin user - UID match:",
            user?.uid === ADMIN_WHITELIST.uid,
            "Email match:",
            user?.email === ADMIN_WHITELIST.email,
          );
          setIsAdmin(false);
        }

        setLoading(false);
        clearTimeout(timeout);
      },
      (error) => {
        console.error("Auth state change error:", error);
        clearTimeout(timeout);
        setLoading(false);
      },
    );

    return () => {
      unsubscribe();
      clearTimeout(timeout);
    };
  }, [mounted]);

  const loginAdmin = async (email: string, password: string) => {
    const result = await signInWithEmailAndPassword(auth, email, password);

    // Validate against local whitelist
    if (
      result.user.uid !== ADMIN_WHITELIST.uid ||
      result.user.email !== ADMIN_WHITELIST.email
    ) {
      await signOut(auth);
      throw new Error("Unauthorized: Admin access only");
    }

    return result;
  };

  const logout = () => signOut(auth);

  return {
    user,
    isAdmin,
    loading: loading || !mounted,
    loginAdmin,
    logout,
  };
}
