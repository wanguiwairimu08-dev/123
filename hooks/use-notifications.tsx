"use client"

import { useState, useEffect } from "react"
import { collection, query, where, onSnapshot, addDoc, updateDoc, doc, Timestamp } from "firebase/firestore"
import { db } from "@/lib/firebase"

interface Notification {
  id: string
  userId: string
  title: string
  message: string
  type: "booking" | "message" | "payment" | "reminder"
  read: boolean
  createdAt: Timestamp
  data?: any
}

export function useNotifications(userId: string | undefined) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    if (!userId) return

    // Single-field query → no composite index needed
    const q = query(collection(db, "notifications"), where("userId", "==", userId))

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const notificationsData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Notification[]

        const getMillis = (date: any) => {
          if (!date) return 0;
          if (typeof date.toMillis === "function") return date.toMillis();
          if (date instanceof Date) return date.getTime();
          return 0;
        };

        // Order by createdAt DESC on the client side
        notificationsData.sort((a, b) => getMillis(b.createdAt) - getMillis(a.createdAt))

        setNotifications(notificationsData)
        setUnreadCount(notificationsData.filter((n) => !n.read).length)
      },
      (err) => {
        console.error("Firestore notifications listener:", err)
      },
    )

    return unsubscribe
  }, [userId])

  const createNotification = async (
    targetUserId: string,
    title: string,
    message: string,
    type: Notification["type"],
    data?: any,
  ) => {
    try {
      await addDoc(collection(db, "notifications"), {
        userId: targetUserId,
        title,
        message,
        type,
        read: false,
        createdAt: Timestamp.now(),
        data: data || null,
      })
    } catch (error) {
      console.error("Error creating notification:", error)
    }
  }

  const markAsRead = async (notificationId: string) => {
    try {
      await updateDoc(doc(db, "notifications", notificationId), {
        read: true,
      })
    } catch (error) {
      console.error("Error marking notification as read:", error)
    }
  }

  const markAllAsRead = async () => {
    try {
      const unreadNotifications = notifications.filter((n) => !n.read)
      await Promise.all(
        unreadNotifications.map((notification) => updateDoc(doc(db, "notifications", notification.id), { read: true })),
      )
    } catch (error) {
      console.error("Error marking all notifications as read:", error)
    }
  }

  return {
    notifications,
    unreadCount,
    createNotification,
    markAsRead,
    markAllAsRead,
  }
}
