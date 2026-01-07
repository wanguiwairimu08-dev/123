"use client";

import { useEffect } from "react";
import { collection, doc, setDoc, addDoc, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAdminAuth } from "@/hooks/use-admin-auth";

export function useSampleData() {
  const { isAdmin, user } = useAdminAuth();

  useEffect(() => {
    if (!isAdmin || !user) return;

    const initializeSampleData = async () => {
      try {
        // Check if sample data initialization is disabled
        const sampleDataDisabled = localStorage.getItem(
          "sampleDataDisabled",
        );

        if (sampleDataDisabled) {
          console.log("Sample data initialization is disabled");
          return;
        }

        // Add sample bookings for today
        const today = new Date().toISOString().split("T")[0];

        const sampleBookings = [
          {
            customerId: "client1",
            customerName: "Sarah Johnson",
            customerEmail: "sarah@example.com",
            customerPhone: "+1234567890",
            service: "Gel + Artwork",
            stylist: "Sarah",
            date: today,
            time: "10:00 AM",
            status: "completed",
            notes: "Regular customer",
            createdAt: Timestamp.now(),
            revenue: 500,
          },
          {
            customerId: "client2",
            customerName: "Maria Garcia",
            customerEmail: "maria@example.com",
            customerPhone: "+1234567891",
            service: "Pedicure + Gel",
            stylist: "Emma",
            date: today,
            time: "2:00 PM",
            status: "completed",
            notes: "First time client",
            createdAt: Timestamp.now(),
            revenue: 800,
          },
          {
            customerId: "client3",
            customerName: "Lisa Chen",
            customerEmail: "lisa@example.com",
            customerPhone: "+1234567892",
            service: "Acrylics",
            stylist: "Lisa",
            date: today,
            time: "4:00 PM",
            status: "completed",
            notes: "Special design requested",
            createdAt: Timestamp.now(),
            revenue: 1500,
          },
        ];

        // Add sample clients
        const sampleClients = [
          {
            uid: "client1",
            email: "sarah@example.com",
            displayName: "Sarah Johnson",
            phone: "+1234567890",
            createdAt: new Date(),
            isClient: true,
          },
          {
            uid: "client2",
            email: "maria@example.com",
            displayName: "Maria Garcia",
            phone: "+1234567891",
            createdAt: new Date(),
            isClient: true,
          },
          {
            uid: "client3",
            email: "lisa@example.com",
            displayName: "Lisa Chen",
            phone: "+1234567892",
            createdAt: new Date(),
            isClient: true,
          },
        ];

        // Add sample conversations
        const sampleConversations = [
          {
            id: "client1_admin",
            customerName: "Sarah Johnson",
            customerEmail: "sarah@example.com",
            customerId: "client1",
            lastMessage: "Thank you for confirming my appointment!",
            lastMessageTime: Timestamp.now(),
            unreadCount: 1,
          },
          {
            id: "client2_admin",
            customerName: "Maria Garcia",
            customerEmail: "maria@example.com",
            customerId: "client2",
            lastMessage: "What time slots do you have available?",
            lastMessageTime: Timestamp.now(),
            unreadCount: 2,
          },
        ];

        // Add sample messages
        const sampleMessages = [
          {
            text: "Hi! I'd like to book an appointment",
            senderId: "client1",
            senderName: "Sarah Johnson",
            senderType: "customer",
            conversationId: "client1_admin",
            timestamp: Timestamp.now(),
          },
          {
            text: "Of course! What service are you interested in?",
            senderId: "VJdxemjpYTfR3TAfAQDmZ9ucjxB2",
            senderName: "Admin",
            senderType: "admin",
            conversationId: "client1_admin",
            timestamp: Timestamp.now(),
          },
          {
            text: "Thank you for confirming my appointment!",
            senderId: "client1",
            senderName: "Sarah Johnson",
            senderType: "customer",
            conversationId: "client1_admin",
            timestamp: Timestamp.now(),
          },
        ];

        // Initialize data (only run once - use localStorage to track)
        const sampleDataInitialized = localStorage.getItem(
          "sampleDataInitialized",
        );

        if (!sampleDataInitialized) {
          console.log("Initializing sample data as admin...");

          try {
            // Add clients first
            console.log("Adding sample clients...");
            for (const client of sampleClients) {
              await setDoc(doc(db, "clients", client.uid), client);
            }

            // Add bookings
            console.log("Adding sample bookings...");
            for (const booking of sampleBookings) {
              await addDoc(collection(db, "bookings"), booking);
            }

            // Add conversations
            console.log("Adding sample conversations...");
            for (const conversation of sampleConversations) {
              await setDoc(
                doc(db, "conversations", conversation.id),
                conversation,
              );
            }

            // Add messages
            console.log("Adding sample messages...");
            for (const message of sampleMessages) {
              await addDoc(collection(db, "messages"), message);
            }

            // Add a notification for testing
            console.log("Adding sample notifications...");
            await addDoc(collection(db, "notifications"), {
              userId: user.uid,
              title: "Welcome Admin!",
              message: "Sample data has been initialized successfully",
              type: "message",
              read: false,
              createdAt: Timestamp.now(),
            });

            localStorage.setItem("sampleDataInitialized", "true");
            console.log("✅ Sample data initialized successfully");
          } catch (dataError) {
            console.error("❌ Error adding sample data:", dataError);
            // Don't throw - just log and continue
          }
        } else {
          console.log("Sample data already initialized");
        }
      } catch (error) {
        console.error("Error initializing sample data:", error);
      }
    };

    // Run once on mount with delay to ensure auth is ready
    const timer = setTimeout(initializeSampleData, 2000);
    return () => clearTimeout(timer);
  }, [isAdmin, user]);
}
