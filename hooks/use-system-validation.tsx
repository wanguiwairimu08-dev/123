"use client";

import { useEffect, useState } from "react";
import {
  collection,
  getDocs,
  query,
  where,
  onSnapshot,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAdminAuth } from "@/hooks/use-admin-auth";
import { toast } from "sonner";

interface StylistStat {
  id: string;
  name: string;
  count: number;
  revenue: number;
}

interface SystemStats {
  todaysBookings: number;
  pendingMessages: number;
  activeCustomers: number;
  revenueToday: number;
  mpesaCount: number;
  cashCount: number;
  totalPayments: number;
  stylistStats: StylistStat[];
  lastUpdate: Date;
}

export function useSystemValidation() {
  const { user, isAdmin } = useAdminAuth();
  const [stats, setStats] = useState<SystemStats>({
    todaysBookings: 0,
    pendingMessages: 0,
    activeCustomers: 0,
    revenueToday: 0,
    mpesaCount: 0,
    cashCount: 0,
    totalPayments: 0,
    stylistStats: [],
    lastUpdate: new Date(),
  });
  const [isValidated, setIsValidated] = useState(false);

  useEffect(() => {
    if (!isAdmin || !user || isValidated) return;

    const runValidation = async () => {
      try {
        console.log("🔍 Running system validation...");

        const today = new Date().toISOString().split("T")[0];

        // Test 1: Check bookings - Use a query for today's bookings
        const todaysBookingsQuery = query(
          collection(db, "bookings"),
          where("date", "==", today)
        );
        const todaysBookingsSnapshot = await getDocs(todaysBookingsQuery);
        const todaysBookings = todaysBookingsSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        // Calculate revenue and counts
        const completedTodaysBookings = todaysBookings.filter(
          (booking: any) => booking.status === "completed",
        );
        const revenue = completedTodaysBookings.reduce(
          (sum: number, booking: any) =>
            sum + (booking.revenue || booking.price || 0),
          0,
        );

        // For mpesa/cash counts, we still need more bookings or we could query specifically
        // Let's query only completed bookings for payment counts to be more efficient
        const completedBookingsQuery = query(
          collection(db, "bookings"),
          where("status", "==", "completed")
        );
        const completedBookingsSnapshot = await getDocs(completedBookingsQuery);
        const completedBookings = completedBookingsSnapshot.docs.map(doc => doc.data());

        const mpesaCount = completedBookings.filter((b: any) => b.paymentMethod === "mpesa").length;
        const cashCount = completedBookings.filter((b: any) => b.paymentMethod === "cash").length;
        const totalPayments = mpesaCount + cashCount;

        // Calculate stylist stats
        const stylistsSnapshot = await getDocs(collection(db, "stylists"));
        const stylists = stylistsSnapshot.docs.map(doc => ({ id: doc.id, name: doc.data().name }));

        const stylistStats = stylists.map(stylist => {
          const stylistBookings = completedBookings.filter((b: any) => b.stylistId === stylist.id);
          const stylistRevenue = stylistBookings
            .reduce((sum: number, b: any) => sum + (b.revenue || b.price || 0), 0);
          return {
            id: stylist.id,
            name: stylist.name,
            count: stylistBookings.length,
            revenue: stylistRevenue
          };
        });

        // Test 2: Check conversations
        const conversationsSnapshot = await getDocs(
          collection(db, "conversations"),
        );
        const conversations = conversationsSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        const pendingMessages = conversations.reduce(
          (sum: number, conv: any) => sum + (conv.unreadCount || 0),
          0,
        );

        // Test 3: Check clients
        const clientsSnapshot = await getDocs(collection(db, "clients"));
        const activeCustomers = clientsSnapshot.docs.length;

        const newStats = {
          todaysBookings: todaysBookings.length,
          pendingMessages,
          activeCustomers,
          revenueToday: revenue,
          mpesaCount,
          cashCount,
          totalPayments,
          stylistStats,
          lastUpdate: new Date(),
        };

        setStats(newStats);
        setIsValidated(true);

        // Show success notification
        toast.success(
          `✅ System Validated: ${newStats.todaysBookings} bookings, ${newStats.pendingMessages} messages, ${newStats.activeCustomers} customers, Ksh${newStats.revenueToday} revenue`,
          { duration: 5000 },
        );

        console.log("✅ System validation complete:", newStats);
      } catch (error: any) {
        console.error("❌ System validation failed:", error);
        toast.error(`System validation failed: ${error.message}`);
      }
    };

    // Run validation after a short delay
    const timer = setTimeout(runValidation, 1000);
    return () => clearTimeout(timer);
  }, [isAdmin, user, isValidated]);

  // Setup real-time listeners after initial validation
  useEffect(() => {
    if (!isValidated || !isAdmin) return;

    console.log("🔄 Setting up real-time listeners...");

    const getToday = () => new Date().toISOString().split("T")[0];

    // Real-time bookings listener - listener for COMPLETED or TODAY's bookings
    // To keep it simple but efficient, we'll listen to bookings from the last 7 days maybe?
    // Or just listen to all and hope it's not too many, but the initial fetch was the slow part.
    // Actually, onSnapshot is fine if the collection isn't huge. The problem was getDocs(collection(db, "bookings"))
    // without any filters which fetches EVERYTHING every time the component mounts or isAdmin changes.

    // Let's use a query that limits to recent bookings for the real-time listener if possible,
    // but the dashboard might need all time stats.
    // If they need all time stats, we should use a summary document or aggregated queries (Firestore count()).

    const bookingsQuery = query(collection(db, "bookings"));

    const unsubscribeBookings = onSnapshot(
      bookingsQuery,
      (snapshot) => {
        const currentDate = getToday();
        const allBookings = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        // Filter bookings for today and completed status
        const todaysBookings = allBookings.filter(
          (booking: any) => booking.date === currentDate,
        );
        const completedBookings = todaysBookings.filter(
          (booking: any) => booking.status === "completed",
        );
        const revenue = completedBookings.reduce(
          (sum: number, booking: any) =>
            sum + (booking.revenue || booking.price || 0),
          0,
        );

        const mpesaCount = allBookings.filter((b: any) => b.paymentMethod === "mpesa" && b.status === "completed").length;
        const cashCount = allBookings.filter((b: any) => b.paymentMethod === "cash" && b.status === "completed").length;
        const totalPayments = mpesaCount + cashCount;

        // Update stylist stats in real-time
        const stylistMap = new Map();
        allBookings.forEach((b: any) => {
          if (!b.stylistId) return;
          const current = stylistMap.get(b.stylistId) || { id: b.stylistId, name: b.stylist, count: 0, revenue: 0 };
          if (b.status === "completed") {
            current.count += 1;
            current.revenue += (b.revenue || b.price || 0);
          }
          stylistMap.set(b.stylistId, current);
        });

        const stylistStats = Array.from(stylistMap.values());

        setStats((prev) => ({
          ...prev,
          todaysBookings: todaysBookings.length,
          revenueToday: revenue,
          mpesaCount,
          cashCount,
          totalPayments,
          stylistStats,
          lastUpdate: new Date(),
        }));
      },
      (error) => {
        console.error("Bookings listener error:", error);
      },
    );

    // Real-time conversations listener
    const unsubscribeConversations = onSnapshot(
      collection(db, "conversations"),
      (snapshot) => {
        const conversations = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        const pendingMessages = conversations.reduce(
          (sum: number, conv: any) => sum + (conv.unreadCount || 0),
          0,
        );

        setStats((prev) => ({
          ...prev,
          pendingMessages,
          lastUpdate: new Date(),
        }));
      },
      (error) => {
        console.error("Conversations listener error:", error);
      },
    );

    // Real-time clients listener
    const unsubscribeClients = onSnapshot(
      collection(db, "clients"),
      (snapshot) => {
        setStats((prev) => ({
          ...prev,
          activeCustomers: snapshot.docs.length,
          lastUpdate: new Date(),
        }));
      },
      (error) => {
        console.error("Clients listener error:", error);
      },
    );

    return () => {
      unsubscribeBookings();
      unsubscribeConversations();
      unsubscribeClients();
    };
  }, [isValidated, isAdmin]);

  return {
    stats,
    isValidated,
    lastUpdate: stats.lastUpdate,
  };
}
