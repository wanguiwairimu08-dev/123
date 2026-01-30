"use client";

import type React from "react";
import { toast } from "sonner";

import { useState, useEffect, useRef } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Send, MessageSquare, User, Calendar, Clock } from "lucide-react";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  addDoc,
  Timestamp,
  where,
  doc,
  updateDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAdminAuth } from "@/hooks/use-admin-auth";

interface Message {
  id: string;
  text: string;
  senderId: string;
  senderName: string;
  senderType: "admin" | "customer";
  timestamp: Timestamp;
  conversationId: string;
}

interface Conversation {
  id: string;
  customerName: string;
  customerEmail: string;
  lastMessage: string;
  lastMessageTime: Timestamp;
  unreadCount: number;
}

interface Booking {
  id: string;
  customerName: string;
  customerEmail?: string;
  customerPhone?: string;
  service?: string;
  services?: string[];
  stylist: string;
  date: string;
  time: string;
  status: "pending" | "confirmed" | "completed" | "cancelled";
  notes?: string;
  createdAt: Timestamp;
  type?: "admin" | "client";
  amount?: number;
}

export function MessagingCenter() {
  const { user } = useAdminAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<
    string | null
  >(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [upcomingBooking, setUpcomingBooking] = useState<Booking | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Load conversations
    const conversationsQuery = query(
      collection(db, "conversations"),
      orderBy("lastMessageTime", "desc"),
    );

    let timeout: NodeJS.Timeout;
    const unsubscribe = onSnapshot(
      conversationsQuery,
      (snapshot) => {
        const conversationsData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Conversation[];
        setConversations(conversationsData);
        clearTimeout(timeout);
      },
      (err) => {
        console.error("🔥 Firestore conversations listener:", err);
        clearTimeout(timeout);
        if (err.code === "permission-denied") {
          toast.error(
            "Unable to load conversations – please update Firestore security rules.",
          );
        } else {
          toast.error("Unable to load conversations – connection error.");
        }
      },
    );

    // Set timeout in case listener never responds
    timeout = setTimeout(() => {
      console.warn("Conversations listener timeout - setting empty array");
      setConversations([]);
    }, 5000);

    return () => {
      unsubscribe();
      clearTimeout(timeout);
    };
  }, []);

  useEffect(() => {
    if (selectedConversation) {
      // Load messages for selected conversation
      const messagesQuery = query(
        collection(db, "messages"),
        where("conversationId", "==", selectedConversation),
        orderBy("timestamp", "asc"),
      );

      let timeout: NodeJS.Timeout;
      const unsubscribe = onSnapshot(
        messagesQuery,
        (snapshot) => {
          const messagesData = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          })) as Message[];
          setMessages(messagesData);
          clearTimeout(timeout);
        },
        (err) => {
          console.error("Messages listener error:", err);
          clearTimeout(timeout);
        },
      );

      // Set timeout in case listener never responds
      timeout = setTimeout(() => {
        console.warn("Messages listener timeout - setting empty array");
        setMessages([]);
      }, 5000);

      // Reset unread count when selecting conversation
      const selectedConv = conversations.find(
        (c) => c.id === selectedConversation,
      );
      if (selectedConv && selectedConv.unreadCount > 0) {
        updateDoc(doc(db, "conversations", selectedConversation), {
          unreadCount: 0,
        }).catch((err) => console.error("Error resetting unread count:", err));
      }

      return () => {
        unsubscribe();
        clearTimeout(timeout);
      };
    }
  }, [selectedConversation, conversations]);

  // Fetch upcoming booking for selected customer
  useEffect(() => {
    if (selectedConversation) {
      const selectedConv = conversations.find(
        (c) => c.id === selectedConversation,
      );

      if (selectedConv) {
        const bookingsQuery = query(
          collection(db, "bookings"),
          where("customerEmail", "==", selectedConv.customerEmail),
        );

        let timeout: NodeJS.Timeout;
        const unsubscribe = onSnapshot(
          bookingsQuery,
          (snapshot) => {
            const bookingsData = snapshot.docs.map((doc) => ({
              id: doc.id,
              ...doc.data(),
            })) as Booking[];

            // Show the latest booking (most recent by date, regardless of status)
            if (bookingsData.length > 0) {
              // Sort by date in descending order to get the most recent
              const sortedByDate = bookingsData.sort((a, b) =>
                new Date(b.date).getTime() - new Date(a.date).getTime()
              );
              setUpcomingBooking(sortedByDate[0]);
            } else {
              setUpcomingBooking(null);
            }
            clearTimeout(timeout);
          },
          (err) => {
            console.error("Bookings listener error:", err);
            clearTimeout(timeout);
          },
        );

        // Set timeout in case listener never responds
        timeout = setTimeout(() => {
          console.warn("Bookings listener timeout - clearing booking");
          setUpcomingBooking(null);
        }, 5000);

        return () => {
          unsubscribe();
          clearTimeout(timeout);
        };
      }
    } else {
      setUpcomingBooking(null);
    }
  }, [selectedConversation, conversations]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation || !user) return;

    try {
      await addDoc(collection(db, "messages"), {
        text: newMessage,
        senderId: user.uid,
        senderName: "Admin",
        senderType: "admin",
        conversationId: selectedConversation,
        timestamp: Timestamp.now(),
      });

      setNewMessage("");
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[600px]">
      {/* Conversations List */}
      <Card className="lg:col-span-1">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <MessageSquare className="h-5 w-5" />
            <span>Conversations</span>
          </CardTitle>
          <CardDescription>Customer messages and inquiries</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="h-[500px]">
            {conversations.map((conversation) => (
              <div key={conversation.id}>
                <div
                  className={`p-4 cursor-pointer hover:bg-gray-50 ${
                    selectedConversation === conversation.id
                      ? "bg-blue-50 border-r-2 border-blue-500"
                      : ""
                  }`}
                  onClick={() => setSelectedConversation(conversation.id)}
                >
                  <div className="flex items-start space-x-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src="/placeholder-user.jpg" />
                      <AvatarFallback>
                        <User className="h-4 w-4" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {conversation.customerName}
                        </p>
                        {conversation.unreadCount > 0 && (
                          <Badge variant="destructive" className="ml-2">
                            {conversation.unreadCount}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-500 truncate">
                        {conversation.lastMessage}
                      </p>
                      <p className="text-xs text-gray-400">
                        {conversation.lastMessageTime
                          ?.toDate()
                          .toLocaleDateString(undefined, {
                            month: "short",
                            day: "numeric",
                          })} {conversation.lastMessageTime
                          ?.toDate()
                          .toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                </div>
                <Separator />
              </div>
            ))}
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Chat Area */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>
            {selectedConversation
              ? conversations.find((c) => c.id === selectedConversation)
                  ?.customerName || "Customer"
              : "Select a conversation"}
          </CardTitle>
          <CardDescription>
            {selectedConversation
              ? conversations.find((c) => c.id === selectedConversation)
                  ?.customerEmail
              : "Choose a customer to start messaging"}
          </CardDescription>

          {/* Booking Panel */}
          {upcomingBooking && (
            <div className="mt-4 p-4 bg-gradient-to-r from-purple-100 to-indigo-100 border-2 border-purple-400 rounded-lg shadow-md">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-xs font-bold text-purple-900 mb-3 uppercase tracking-wide">
                    📅 LATEST BOOKING
                  </p>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2 text-sm font-semibold text-purple-900">
                      <Calendar className="h-5 w-5 text-purple-600" />
                      <span>{upcomingBooking.date}</span>
                      <Clock className="h-5 w-5 text-purple-600 ml-2" />
                      <span>{upcomingBooking.time}</span>
                    </div>
                    <div className="text-sm text-purple-900 bg-white/50 px-2 py-1 rounded">
                      <span className="font-bold">Service:</span>{" "}
                      {upcomingBooking.service ||
                        (upcomingBooking.services &&
                        upcomingBooking.services.length > 0
                          ? upcomingBooking.services.join(", ")
                          : "N/A")}
                    </div>
                    <div className="text-sm text-purple-900 bg-white/50 px-2 py-1 rounded">
                      <span className="font-bold">Stylist:</span>{" "}
                      {upcomingBooking.stylist}
                    </div>
                  </div>
                </div>
                <Badge
                  className={`ml-3 font-bold text-sm px-3 py-1 ${
                    upcomingBooking.status === "confirmed"
                      ? "bg-green-500 text-white"
                      : upcomingBooking.status === "pending"
                        ? "bg-yellow-500 text-white"
                        : "bg-gray-500 text-white"
                  }`}
                >
                  {upcomingBooking.status.toUpperCase()}
                </Badge>
              </div>
            </div>
          )}
        </CardHeader>
        <CardContent className="flex flex-col h-[500px]">
          {selectedConversation ? (
            <>
              {/* Messages */}
              <ScrollArea className="flex-1 pr-4">
                <div className="space-y-4">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.senderType === "admin" ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                          message.senderType === "admin"
                            ? "bg-blue-500 text-white"
                            : "bg-gray-100 text-gray-900"
                        }`}
                      >
                        <p className="text-sm">{message.text}</p>
                        <p
                          className={`text-xs mt-1 ${
                            message.senderType === "admin"
                              ? "text-blue-100"
                              : "text-gray-500"
                          }`}
                        >
                          {message.timestamp?.toDate().toLocaleDateString(undefined, {
                            month: "short",
                            day: "numeric",
                          })} {message.timestamp?.toDate().toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>

              {/* Message Input */}
              <div className="flex space-x-2 mt-4">
                <Input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Type your message..."
                  className="flex-1"
                />
                <Button onClick={sendMessage} disabled={!newMessage.trim()}>
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-500">
              <div className="text-center">
                <MessageSquare className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>Select a conversation to start messaging</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
