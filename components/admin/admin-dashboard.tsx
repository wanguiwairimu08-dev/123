"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useAdminAuth } from "@/hooks/use-admin-auth";
import { BookingsManager } from "./bookings-manager";
import { MessagingCenter } from "./messaging-center";
import { StylistsManager } from "./stylists-manager";
import {
  Calendar,
  MessageSquare,
  Users,
  TrendingUp,
  LogOut,
  Crown,
} from "lucide-react";
import { NotificationBell } from "@/components/notifications/notification-bell";
import { useSampleData } from "@/hooks/use-sample-data";
import { AdminUtilities } from "@/components/admin/admin-utilities";
import { useSystemValidation } from "@/hooks/use-system-validation";
import { RevenueMetrics } from "@/components/admin/revenue-metrics";

export default function AdminDashboard() {
  const { logout, user } = useAdminAuth();
  const [activeTab, setActiveTab] = useState("overview");
  const [recentActivity, setRecentActivity] = useState<any[]>([]);

  // Initialize sample data and get real-time stats
  useSampleData();
  const { stats, isValidated, lastUpdate } = useSystemValidation();

  // Generate some recent activity based on stats
  useEffect(() => {
    if (isValidated && stats.todaysBookings > 0) {
      const activities = Array.from(
        { length: Math.min(4, stats.todaysBookings) },
        (_, index) => ({
          time: new Date(Date.now() - index * 3600000).toLocaleTimeString(),
          action: `Booking ${index === 0 ? "confirmed" : index === 1 ? "pending" : "completed"}`,
          customer: `Customer ${index + 1}`,
          service: "Beauty Service",
        }),
      );
      setRecentActivity(activities);
    }
  }, [stats, isValidated]);

  interface StatDisplay {
    title: string;
    value: string;
    icon: any;
    color: string;
    status: string;
    showMetrics?: boolean;
  }

  const statsDisplay: StatDisplay[] = [
    {
      title: "Today's Bookings",
      value: stats.todaysBookings.toString(),
      icon: Calendar,
      color: "text-blue-600",
      status: isValidated ? "✅" : "⏳",
    },
    {
      title: "Pending Messages",
      value: stats.pendingMessages.toString(),
      icon: MessageSquare,
      color: "text-green-600",
      status: isValidated ? "✅" : "⏳",
    },
    {
      title: "Active Customers",
      value: stats.activeCustomers.toString(),
      icon: Users,
      color: "text-purple-600",
      status: isValidated ? "✅" : "⏳",
    },
    {
      title: "Revenue Today",
      value: `Ksh${stats.revenueToday.toLocaleString()}`,
      icon: TrendingUp,
      color: "text-orange-600",
      status: isValidated ? "✅" : "⏳",
      showMetrics: true,
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <Crown className="h-8 w-8 text-purple-600" />
              <div>
                <h1 className="text-xl font-bold text-gray-900">
                  BeautyExpress Admin
                </h1>
                <p className="text-sm text-gray-500">
                  Welcome back, {user?.email}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <NotificationBell userId={user?.uid || ""} />
              <Button variant="outline" onClick={logout}>
                <LogOut className="mr-2 h-4 w-4" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="space-y-6"
        >
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="bookings">Bookings</TabsTrigger>
            <TabsTrigger value="stylists">Stylists</TabsTrigger>
            <TabsTrigger value="messages">Messages</TabsTrigger>
            <TabsTrigger value="utilities">Utilities</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {statsDisplay.map((stat, index) => (
                <Card
                  key={index}
                  className={`${isValidated ? "border-green-200" : "border-gray-200"}`}
                >
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <p className="text-sm font-medium text-gray-600">
                            {stat.title}
                          </p>
                          <span className="text-xs">{stat.status}</span>
                        </div>
                        <p className="text-2xl font-bold text-gray-900">
                          {stat.value}
                        </p>
                        {isValidated && (
                          <p className="text-xs text-gray-500">
                            Last updated: {lastUpdate.toLocaleTimeString()}
                          </p>
                        )}
                        {stat.showMetrics && (
                          <div className="mt-2">
                            <RevenueMetrics />
                          </div>
                        )}
                      </div>
                      <stat.icon className={`h-8 w-8 ${stat.color}`} />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>
                  Latest bookings and customer interactions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentActivity.length > 0 ? (
                    recentActivity.map((activity, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between py-2 border-b last:border-b-0"
                      >
                        <div className="flex items-center space-x-3">
                          <Badge variant="outline">{activity.time}</Badge>
                          <div>
                            <p className="font-medium">{activity.action}</p>
                            <p className="text-sm text-gray-600">
                              {activity.customer} - {activity.service}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <p>No recent activity today</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="bookings">
            <BookingsManager />
          </TabsContent>

          <TabsContent value="stylists">
            <StylistsManager />
          </TabsContent>

          <TabsContent value="messages">
            <MessagingCenter />
          </TabsContent>

          <TabsContent value="utilities">
            <AdminUtilities />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
