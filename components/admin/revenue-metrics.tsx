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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  TrendingUp,
  Calendar,
  DollarSign,
  BarChart3,
  Users,
  PieChart,
} from "lucide-react";
import {
  collection,
  query,
  where,
  getDocs,
  orderBy,
  Timestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { format, subDays, startOfDay, endOfDay } from "date-fns";

interface RevenueData {
  date: string;
  revenue: number;
  bookings: number;
  averageBookingValue: number;
}

interface ServiceStats {
  serviceName: string;
  totalRevenue: number;
  bookingCount: number;
  averagePrice: number;
}

export function RevenueMetrics() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [dailyRevenue, setDailyRevenue] = useState<RevenueData[]>([]);
  const [weeklyRevenue, setWeeklyRevenue] = useState<RevenueData[]>([]);
  const [monthlyRevenue, setMonthlyRevenue] = useState<RevenueData[]>([]);
  const [serviceStats, setServiceStats] = useState<ServiceStats[]>([]);
  const [totalStats, setTotalStats] = useState({
    totalRevenue: 0,
    totalBookings: 0,
    averageBookingValue: 0,
    topService: "",
  });

  // Auto-load data when dialog opens
  useEffect(() => {
    if (open && dailyRevenue.length === 0) {
      fetchRevenueData();
    }
  }, [open, dailyRevenue.length]);

  const fetchRevenueData = async () => {
    setLoading(true);
    try {
      const now = new Date();
      const thirtyDaysAgo = subDays(now, 30);
      const sevenDaysAgo = subDays(now, 7);

      // Fetch all bookings and filter completed ones in memory to avoid index requirement
      const bookingsQuery = query(
        collection(db, "bookings"),
        orderBy("createdAt", "desc"),
      );

      const snapshot = await getDocs(bookingsQuery);
      const allBookings = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as any[];

      // Filter completed bookings in memory
      const bookings = allBookings.filter(
        (booking) => booking.status === "completed",
      );

      console.log(
        `📊 Fetched ${allBookings.length} total bookings, ${bookings.length} completed for metrics`,
      );

      // Calculate daily revenue for last 7 days
      const dailyData: RevenueData[] = [];
      for (let i = 6; i >= 0; i--) {
        const date = subDays(now, i);
        const dateStr = format(date, "yyyy-MM-dd");
        const dayBookings = bookings.filter(
          (booking) => booking.date === dateStr,
        );
        const revenue = dayBookings.reduce(
          (sum, booking) => sum + (booking.amount || booking.revenue || booking.price || 0),
          0,
        );
        dailyData.push({
          date: format(date, "MMM dd"),
          revenue,
          bookings: dayBookings.length,
          averageBookingValue:
            dayBookings.length > 0 ? revenue / dayBookings.length : 0,
        });
      }

      // Calculate weekly revenue for last 4 weeks
      const weeklyData: RevenueData[] = [];
      for (let i = 3; i >= 0; i--) {
        const weekStart = subDays(now, i * 7 + 6);
        const weekEnd = subDays(now, i * 7);
        const weekBookings = bookings.filter((booking) => {
          const bookingDate = new Date(booking.date);
          return bookingDate >= weekStart && bookingDate <= weekEnd;
        });
        const revenue = weekBookings.reduce(
          (sum, booking) => sum + (booking.amount || booking.revenue || booking.price || 0),
          0,
        );
        weeklyData.push({
          date: `Week ${4 - i}`,
          revenue,
          bookings: weekBookings.length,
          averageBookingValue:
            weekBookings.length > 0 ? revenue / weekBookings.length : 0,
        });
      }

      // Calculate service statistics
      const serviceMap = new Map<
        string,
        { revenue: number; count: number; prices: number[] }
      >();
      bookings.forEach((booking) => {
        const service = booking.service || "Unknown Service";
        const revenue = booking.amount || booking.revenue || booking.price || 0;

        if (!serviceMap.has(service)) {
          serviceMap.set(service, { revenue: 0, count: 0, prices: [] });
        }

        const stats = serviceMap.get(service)!;
        stats.revenue += revenue;
        stats.count += 1;
        stats.prices.push(revenue);
      });

      const serviceStats: ServiceStats[] = Array.from(serviceMap.entries())
        .map(([serviceName, stats]) => ({
          serviceName,
          totalRevenue: stats.revenue,
          bookingCount: stats.count,
          averagePrice: stats.revenue / stats.count,
        }))
        .sort((a, b) => b.totalRevenue - a.totalRevenue);

      // Calculate total stats
      const totalRevenue = bookings.reduce(
        (sum, booking) => sum + (booking.amount || booking.revenue || booking.price || 0),
        0,
      );
      const totalBookings = bookings.length;
      const averageBookingValue =
        totalBookings > 0 ? totalRevenue / totalBookings : 0;
      const topService =
        serviceStats.length > 0 ? serviceStats[0].serviceName : "None";

      setDailyRevenue(dailyData);
      setWeeklyRevenue(weeklyData);
      setServiceStats(serviceStats);
      setTotalStats({
        totalRevenue,
        totalBookings,
        averageBookingValue,
        topService,
      });
    } catch (error) {
      console.error("Error fetching revenue data:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="ml-2">
          <BarChart3 className="mr-2 h-4 w-4" />
          View Metrics
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <TrendingUp className="mr-2 h-5 w-5 text-green-600" />
            Revenue Metrics & Analytics
          </DialogTitle>
          <DialogDescription>
            Detailed insights into your business performance
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <DollarSign className="h-4 w-4 text-green-600" />
                  <div>
                    <p className="text-xs text-gray-600">Total Revenue (30d)</p>
                    <p className="font-bold">
                      Ksh{totalStats.totalRevenue.toLocaleString()}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4 text-blue-600" />
                  <div>
                    <p className="text-xs text-gray-600">Total Bookings</p>
                    <p className="font-bold">{totalStats.totalBookings}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <BarChart3 className="h-4 w-4 text-purple-600" />
                  <div>
                    <p className="text-xs text-gray-600">Avg Booking Value</p>
                    <p className="font-bold">
                      Ksh{Math.round(totalStats.averageBookingValue)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <PieChart className="h-4 w-4 text-orange-600" />
                  <div>
                    <p className="text-xs text-gray-600">Top Service</p>
                    <p className="font-bold text-xs">{totalStats.topService}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Button
            onClick={fetchRevenueData}
            disabled={loading}
            className="w-full"
          >
            {loading ? "Loading..." : "Refresh Data"}
          </Button>

          <Tabs defaultValue="daily" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="daily">Daily (7 days)</TabsTrigger>
              <TabsTrigger value="weekly">Weekly (4 weeks)</TabsTrigger>
              <TabsTrigger value="services">Services</TabsTrigger>
            </TabsList>

            <TabsContent value="daily" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Daily Revenue Breakdown</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {dailyRevenue.map((day, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 border rounded-lg"
                      >
                        <div>
                          <p className="font-medium">{day.date}</p>
                          <p className="text-sm text-gray-600">
                            {day.bookings} bookings
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold">
                            Ksh{day.revenue.toLocaleString()}
                          </p>
                          <p className="text-sm text-gray-600">
                            Avg: Ksh{Math.round(day.averageBookingValue)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="weekly" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Weekly Revenue Breakdown</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {weeklyRevenue.map((week, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 border rounded-lg"
                      >
                        <div>
                          <p className="font-medium">{week.date}</p>
                          <p className="text-sm text-gray-600">
                            {week.bookings} bookings
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold">
                            Ksh{week.revenue.toLocaleString()}
                          </p>
                          <p className="text-sm text-gray-600">
                            Avg: Ksh{Math.round(week.averageBookingValue)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="services" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Service Performance</CardTitle>
                  <CardDescription>
                    Revenue breakdown by service type
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {serviceStats.map((service, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 border rounded-lg"
                      >
                        <div className="flex items-center space-x-3">
                          <Badge variant="outline">#{index + 1}</Badge>
                          <div>
                            <p className="font-medium">{service.serviceName}</p>
                            <p className="text-sm text-gray-600">
                              {service.bookingCount} bookings
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold">
                            Ksh{service.totalRevenue.toLocaleString()}
                          </p>
                          <p className="text-sm text-gray-600">
                            Avg: Ksh{Math.round(service.averagePrice)}
                          </p>
                        </div>
                      </div>
                    ))}
                    {serviceStats.length === 0 && (
                      <div className="text-center py-8 text-gray-500">
                        <BarChart3 className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                        <p>
                          No completed bookings found. Revenue data will appear
                          here once services are completed.
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}
