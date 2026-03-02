"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAdminAuth } from "@/hooks/use-admin-auth";
import { useClientAuth } from "@/hooks/use-client-auth";
import { Loader2, Sparkles } from "lucide-react";
import { HeroSection } from "@/components/landing/hero-section";

export default function HomePage() {
  const router = useRouter();
  const { isAdmin, loading: adminLoading } = useAdminAuth();
  const { clientProfile, loading: clientLoading } = useClientAuth();
  const [mounted, setMounted] = useState(false);
  const [safetyTimeoutExceeded, setSafetyTimeoutExceeded] = useState(false);

  // Prevent hydration mismatch by only running client-side logic after mount
  useEffect(() => {
    setMounted(true);

    // Safety timeout to prevent stuck loading screen
    const timer = setTimeout(() => {
      setSafetyTimeoutExceeded(true);
      console.log("HomePage safety timeout reached - force clearing loading state");
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    if ((!adminLoading && !clientLoading) || safetyTimeoutExceeded) {
      if (isAdmin) {
        router.push("/admin");
      } else if (clientProfile) {
        router.push("/client");
      }
      // If neither admin nor client, show the landing page (don't redirect)
    }
  }, [isAdmin, clientProfile, adminLoading, clientLoading, router, mounted, safetyTimeoutExceeded]);

  // Show loading state until mounted and auth is resolved
  if (!mounted || ((adminLoading || clientLoading) && !safetyTimeoutExceeded)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50">
        <div className="text-center">
          <div className="flex justify-center mb-6">
            <Sparkles className="h-16 w-16 text-purple-600 animate-pulse" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            BeautyExpress
          </h1>
          <div className="flex items-center justify-center space-x-2">
            <Loader2 className="h-5 w-5 animate-spin text-purple-600" />
            <p className="text-gray-600">Loading your experience...</p>
          </div>
        </div>
      </div>
    );
  }

  // Show landing page for unauthenticated users
  if (!isAdmin && !clientProfile) {
    return <HeroSection />;
  }

  // Fallback (should rarely be seen)
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50">
      <div className="text-center">
        <div className="flex justify-center mb-6">
          <Sparkles className="h-16 w-16 text-purple-600" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-4">BeautyExpress</h1>
        <p className="text-gray-600">Redirecting...</p>
      </div>
    </div>
  );
}
