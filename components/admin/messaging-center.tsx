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
import { Send, MessageSquare, User } from "lucide-react";
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

export function MessagingCenter() {
  const { user } = useAdminAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<
    string | null
  >(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Load conversations
    const conversationsQuery = query(
      collection(db, "conversations"),
      orderBy("lastMessageTime", "desc"),
    );

    const unsubscribe = onSnapshot(
      conversationsQuery,
      (snapshot) => {
        const conversationsData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Conversation[];
        setConversations(conversationsData);
      },
      (err) => {
        console.error("🔥 Firestore conversations listener:", err);
        if (err.code === "permission-denied") {
          toast.error(
            "Unable to load conversations – please update Firestore security rules.",
          );
        } else {
          toast.error("Unable to load conversations – connection error.");
        }
      },
    );

    return unsubscribe;
  }, []);

  useEffect(() => {
    if (selectedConversation) {
      // Load messages for selected conversation
      const messagesQuery = query(
        collection(db, "messages"),
        where("conversationId", "==", selectedConversation),
        orderBy("timestamp", "asc"),
      );

      const unsubscribe = onSnapshot(messagesQuery, (snapshot) => {
        const messagesData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Message[];
        setMessages(messagesData);
      });

      // Reset unread count when selecting conversation
      const selectedConv = conversations.find(
        (c) => c.id === selectedConversation,
      );
      if (selectedConv && selectedConv.unreadCount > 0) {
        updateDoc(doc(db, "conversations", selectedConversation), {
          unreadCount: 0,
        }).catch((err) => console.error("Error resetting unread count:", err));
      }

      return unsubscribe;
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
