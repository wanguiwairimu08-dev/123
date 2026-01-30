"use client";

import { useState, useEffect } from "react";
import { useAdminAuth } from "@/hooks/use-admin-auth";
import AdminLoginForm from "@/components/auth/admin-login-form";
import AdminDashboard from "@/components/admin/admin-dashboard";
import { Loader2, Crown, AlertCircle } from "lucide-react";

export default function AdminPage() {
  const { isAdmin, loading, user } = useAdminAuth();
  const [timeoutExceeded, setTimeoutExceeded] = useState(false);

  useEffect(() => {
    if (loading) {
      const timer = setTimeout(() => {
        setTimeoutExceeded(true);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [loading]);

  console.log("Admin page render:", {
    isAdmin,
    loading,
    userEmail: user?.email,
  });

  if (loading || timeoutExceeded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-50 to-purple-50">
        <div className="text-center max-w-md">
          <Crown className="h-16 w-16 mx-auto mb-4 text-purple-600 animate-pulse" />
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600 mb-2">Loading admin dashboard...</p>
          {timeoutExceeded && (
            <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-start space-x-2">
                <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-yellow-800 text-left">
                  <p className="font-medium mb-1">Still loading...</p>
                  <p>If this takes longer than 10 seconds, please refresh the page.</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return <AdminLoginForm />;
  }

  return <AdminDashboard />;
}
