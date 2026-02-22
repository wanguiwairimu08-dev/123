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
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import {
  Calendar,
  MessageSquare,
  Users,
  TrendingUp,
  LogOut,
  Crown,
  Smartphone,
  Banknote,
  PieChart,
  Scissors,
  PlusCircle,
  Settings,
  Bell,
  Search,
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

  const quickActions = [
    { name: "New Booking", icon: PlusCircle, color: "bg-blue-500", tab: "bookings" },
    { name: "Add Stylist", icon: Scissors, color: "bg-purple-500", tab: "stylists" },
    { name: "Send Message", icon: MessageSquare, color: "bg-green-500", tab: "messages" },
    { name: "Settings", icon: Settings, color: "bg-gray-500", tab: "utilities" },
  ];

  // Mock chart data for overview
  const chartData = [
    { name: "Mon", revenue: 4000 },
    { name: "Tue", revenue: 3000 },
    { name: "Wed", revenue: 2000 },
    { name: "Thu", revenue: 2780 },
    { name: "Fri", revenue: 1890 },
    { name: "Sat", revenue: 2390 },
    { name: "Sun", revenue: stats.revenueToday || 3490 },
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
                  className={`${isValidated ? "border-green-200" : "border-gray-200"} hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1`}
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
                            Updated {lastUpdate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        )}
                        {stat.showMetrics && (
                          <div className="mt-2">
                            <RevenueMetrics />
                          </div>
                        )}
                      </div>
                      <div className={`p-3 rounded-full bg-opacity-10 ${stat.color.replace('text', 'bg')}`}>
                        <stat.icon className={`h-6 w-6 ${stat.color}`} />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Revenue Chart */}
              <Card className="lg:col-span-2 shadow-sm hover:shadow-md transition-shadow">
                <CardHeader>
                  <CardTitle className="text-lg font-semibold flex items-center">
                    <TrendingUp className="h-5 w-5 mr-2 text-orange-500" />
                    Revenue Overview
                  </CardTitle>
                  <CardDescription>Weekly revenue performance</CardDescription>
                </CardHeader>
                <CardContent className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>
                      <defs>
                        <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#f97316" stopOpacity={0.1}/>
                          <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                      <XAxis
                        dataKey="name"
                        axisLine={false}
                        tickLine={false}
                        tick={{fill: '#94a3b8', fontSize: 12}}
                        dy={10}
                      />
                      <YAxis
                        hide
                      />
                      <Tooltip
                        contentStyle={{
                          borderRadius: '8px',
                          border: 'none',
                          boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="revenue"
                        stroke="#f97316"
                        strokeWidth={3}
                        fillOpacity={1}
                        fill="url(#colorRevenue)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card className="shadow-sm hover:shadow-md transition-shadow">
                <CardHeader>
                  <CardTitle className="text-lg font-semibold flex items-center">
                    <PlusCircle className="h-5 w-5 mr-2 text-blue-500" />
                    Quick Actions
                  </CardTitle>
                  <CardDescription>Common administrative tasks</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-3">
                    {quickActions.map((action, idx) => (
                      <Button
                        key={idx}
                        variant="outline"
                        className="h-24 flex flex-col items-center justify-center space-y-2 hover:border-purple-200 hover:bg-purple-50 transition-all group"
                        onClick={() => setActiveTab(action.tab)}
                      >
                        <div className={`p-2 rounded-lg ${action.color} text-white group-hover:scale-110 transition-transform`}>
                          <action.icon className="h-5 w-5" />
                        </div>
                        <span className="text-xs font-medium">{action.name}</span>
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Stylist Stats Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center">
                <Scissors className="h-5 w-5 mr-2 text-purple-500" />
                Stylist Performance
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {stats.stylistStats.map((stylist) => (
                  <Card key={stylist.id} className="border-purple-100 hover:border-purple-300 transition-colors">
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-center">
                        <CardTitle className="text-sm font-semibold truncate max-w-[120px]">
                          {stylist.name}
                        </CardTitle>
                        <Badge variant="secondary" className="bg-purple-50 text-purple-700 hover:bg-purple-100">
                          {stylist.count} jobs
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-col">
                        <p className="text-xs text-gray-500">Revenue</p>
                        <p className="text-lg font-bold text-gray-900">
                          Ksh{stylist.revenue.toLocaleString()}
                        </p>
                        <div className="w-full bg-gray-100 h-1.5 rounded-full mt-2 overflow-hidden">
                          <div
                            className="bg-purple-500 h-full rounded-full transition-all duration-1000"
                            style={{ width: `${Math.min(100, (stylist.revenue / (stats.revenueToday || 1000)) * 100)}%` }}
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Payment Method Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg font-semibold flex items-center">
                    <PieChart className="h-5 w-5 mr-2 text-indigo-500" />
                    Payment Methods
                  </CardTitle>
                  <CardDescription>Completed payments by type</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-around h-40">
                    <div className="text-center">
                      <div className="flex items-center justify-center p-4 bg-green-50 rounded-full mb-2">
                        <Smartphone className="h-8 w-8 text-green-600" />
                      </div>
                      <p className="font-bold text-xl">{stats.mpesaCount}</p>
                      <p className="text-xs text-gray-500 uppercase tracking-wider">M-Pesa</p>
                    </div>
                    <div className="h-12 w-px bg-gray-100" />
                    <div className="text-center">
                      <div className="flex items-center justify-center p-4 bg-blue-50 rounded-full mb-2">
                        <Banknote className="h-8 w-8 text-blue-600" />
                      </div>
                      <p className="font-bold text-xl">{stats.cashCount}</p>
                      <p className="text-xs text-gray-500 uppercase tracking-wider">Cash</p>
                    </div>
                    <div className="h-12 w-px bg-gray-100" />
                    <div className="text-center">
                      <div className="flex items-center justify-center p-4 bg-gray-50 rounded-full mb-2">
                        <TrendingUp className="h-8 w-8 text-gray-600" />
                      </div>
                      <p className="font-bold text-xl">{stats.totalPayments}</p>
                      <p className="text-xs text-gray-500 uppercase tracking-wider">Total</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Recent Activity */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-lg font-semibold">Recent Activity</CardTitle>
                    <CardDescription>Latest customer interactions</CardDescription>
                  </div>
                  <Badge variant="outline" className="text-xs font-normal">Real-time</Badge>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {recentActivity.length > 0 ? (
                      recentActivity.map((activity, index) => (
                        <div
                          key={index}
                          className="flex items-center space-x-4 p-2 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                          <div className={`p-2 rounded-full ${index % 2 === 0 ? 'bg-blue-100 text-blue-600' : 'bg-green-100 text-green-600'}`}>
                            {index % 2 === 0 ? <Calendar className="h-4 w-4" /> : <MessageSquare className="h-4 w-4" />}
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium">{activity.action}</p>
                            <p className="text-xs text-gray-500">{activity.customer} • {activity.service}</p>
                          </div>
                          <p className="text-xs text-gray-400">{activity.time}</p>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <Search className="h-12 w-12 mx-auto mb-3 text-gray-200" />
                        <p className="text-sm italic">Waiting for activity...</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
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
