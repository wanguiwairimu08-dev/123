"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Calendar,
  Clock,
  Phone,
  Mail,
  CheckCircle,
  XCircle,
  Edit,
} from "lucide-react";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  doc,
  updateDoc,
  type Timestamp,
  addDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { toast } from "sonner";

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
  type?: "admin" | "client"; // admin = in-shop, client = online
  amount?: number; // for admin in-shop bookings
}

export function BookingsManager() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [filteredBookings, setFilteredBookings] = useState<Booking[]>([]);
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  // Admin in-shop booking form state
  const [isAdminBookingDialogOpen, setIsAdminBookingDialogOpen] = useState(false);
  const [adminBookingForm, setAdminBookingForm] = useState({
    customerName: "",
    service: "",
    stylist: "",
    date: "",
    time: "",
    amount: "",
  });

  useEffect(() => {
    const q = query(collection(db, "bookings"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const bookingsData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Booking[];
        setBookings(bookingsData);
      },
      (err) => {
        console.error("🔥 Firestore bookings listener:", err);
        if (err.code === "permission-denied") {
          toast.error(
            "Unable to load bookings – please update Firestore security rules.",
          );
        } else {
          toast.error("Unable to load bookings – connection error.");
        }
      },
    );

    return unsubscribe;
  }, []);

  useEffect(() => {
    let filtered = bookings;

    if (statusFilter !== "all") {
      filtered = filtered.filter((booking) => booking.status === statusFilter);
    }

    if (searchTerm) {
      filtered = filtered.filter(
        (booking) =>
          booking.customerName
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          booking.customerEmail
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          (booking.service?.toLowerCase().includes(searchTerm.toLowerCase()) || false) ||
          (booking.services?.some((s) => s.toLowerCase().includes(searchTerm.toLowerCase())) || false),
      );
    }

    setFilteredBookings(filtered);
  }, [bookings, statusFilter, searchTerm]);

  const updateBookingStatus = async (
    bookingId: string,
    status: Booking["status"],
  ) => {
    try {
      await updateDoc(doc(db, "bookings", bookingId), { status });
    } catch (error) {
      console.error("Error updating booking status:", error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "confirmed":
        return "bg-blue-100 text-blue-800";
      case "completed":
        return "bg-green-100 text-green-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getBookingTypeColor = (type?: string) => {
    switch (type) {
      case "admin":
        return "bg-orange-100 text-orange-800"; // In-shop bookings
      case "client":
        return "bg-blue-100 text-blue-800"; // Online bookings
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const createAdminBooking = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!adminBookingForm.customerName.trim() || !adminBookingForm.service.trim() ||
        !adminBookingForm.stylist.trim() || !adminBookingForm.date || !adminBookingForm.time || !adminBookingForm.amount) {
      toast.error("Please fill in all fields");
      return;
    }

    try {
      await addDoc(collection(db, "bookings"), {
        customerName: adminBookingForm.customerName,
        customerEmail: "", // Empty for in-shop bookings
        customerPhone: "", // Empty for in-shop bookings
        service: adminBookingForm.service,
        stylist: adminBookingForm.stylist,
        date: adminBookingForm.date,
        time: adminBookingForm.time,
        status: "confirmed", // In-shop bookings are confirmed immediately
        amount: parseFloat(adminBookingForm.amount),
        type: "admin", // Mark as admin/in-shop booking
        notes: "In-shop booking",
        createdAt: new Date(),
      });

      toast.success(`Booking created for ${adminBookingForm.customerName}`);
      setAdminBookingForm({
        customerName: "",
        service: "",
        stylist: "",
        date: "",
        time: "",
        amount: "",
      });
      setIsAdminBookingDialogOpen(false);
    } catch (error) {
      console.error("Error creating booking:", error);
      toast.error("Failed to create booking");
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Bookings Management</CardTitle>
        <CardDescription>
          Manage customer appointments and reservations
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Filters and Admin Booking Button */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6 justify-between">
          <div className="flex flex-col sm:flex-row gap-4">
            <Input
              placeholder="Search customers, services..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="sm:max-w-xs"
            />
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="sm:max-w-xs">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Bookings</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="confirmed">Confirmed</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Dialog open={isAdminBookingDialogOpen} onOpenChange={setIsAdminBookingDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-green-600 hover:bg-green-700">
                + Book In-Shop
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Book Customer In-Shop</DialogTitle>
                <DialogDescription>
                  Create a booking for a customer at the shop (no email required)
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={createAdminBooking} className="space-y-4">
                <div>
                  <Label htmlFor="customerName">Customer Name</Label>
                  <Input
                    id="customerName"
                    placeholder="Enter customer name"
                    value={adminBookingForm.customerName}
                    onChange={(e) =>
                      setAdminBookingForm({
                        ...adminBookingForm,
                        customerName: e.target.value,
                      })
                    }
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="service">Service</Label>
                  <Input
                    id="service"
                    placeholder="e.g., Haircut, Manicure"
                    value={adminBookingForm.service}
                    onChange={(e) =>
                      setAdminBookingForm({
                        ...adminBookingForm,
                        service: e.target.value,
                      })
                    }
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="stylist">Stylist</Label>
                  <Input
                    id="stylist"
                    placeholder="Enter stylist name"
                    value={adminBookingForm.stylist}
                    onChange={(e) =>
                      setAdminBookingForm({
                        ...adminBookingForm,
                        stylist: e.target.value,
                      })
                    }
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="date">Date</Label>
                    <Input
                      id="date"
                      type="date"
                      value={adminBookingForm.date}
                      onChange={(e) =>
                        setAdminBookingForm({
                          ...adminBookingForm,
                          date: e.target.value,
                        })
                      }
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="time">Time</Label>
                    <Input
                      id="time"
                      type="time"
                      value={adminBookingForm.time}
                      onChange={(e) =>
                        setAdminBookingForm({
                          ...adminBookingForm,
                          time: e.target.value,
                        })
                      }
                      required
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="amount">Amount (Ksh)</Label>
                  <Input
                    id="amount"
                    type="number"
                    placeholder="e.g., 500"
                    value={adminBookingForm.amount}
                    onChange={(e) =>
                      setAdminBookingForm({
                        ...adminBookingForm,
                        amount: e.target.value,
                      })
                    }
                    required
                  />
                </div>
                <Button type="submit" className="w-full bg-green-600 hover:bg-green-700">
                  Create Booking
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Bookings Table */}
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Customer</TableHead>
                <TableHead>Service</TableHead>
                <TableHead>Date & Time</TableHead>
                <TableHead>Stylist</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredBookings.map((booking) => (
                <TableRow key={booking.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{booking.customerName}</div>
                      <div className="text-sm text-gray-500">
                        {booking.customerEmail}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {booking.service || (booking.services && booking.services.length > 0 ? booking.services.join(", ") : "N/A")}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      <span>{booking.date}</span>
                      <Clock className="h-4 w-4 text-gray-400" />
                      <span>{booking.time}</span>
                    </div>
                  </TableCell>
                  <TableCell>{booking.stylist}</TableCell>
                  <TableCell>
                    <Badge className={getBookingTypeColor(booking.type)}>
                      {booking.type === "admin" ? "🏪 In-Shop" : booking.type === "client" ? "💻 Online" : "Standard"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(booking.status)}>
                      {booking.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      {booking.status === "pending" && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              updateBookingStatus(booking.id, "confirmed")
                            }
                          >
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              updateBookingStatus(booking.id, "cancelled")
                            }
                          >
                            <XCircle className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                      {booking.status === "confirmed" && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            updateBookingStatus(booking.id, "completed")
                          }
                        >
                          Complete
                        </Button>
                      )}
                      <Dialog
                        open={isEditDialogOpen}
                        onOpenChange={setIsEditDialogOpen}
                      >
                        <DialogTrigger asChild>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setSelectedBooking(booking)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Booking Details</DialogTitle>
                            <DialogDescription>
                              View and manage booking information
                            </DialogDescription>
                          </DialogHeader>
                          {selectedBooking && (
                            <div className="space-y-4">
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <Label>Customer Name</Label>
                                  <p className="font-medium">
                                    {selectedBooking.customerName}
                                  </p>
                                </div>
                                <div>
                                  <Label>Services</Label>
                                  <p className="font-medium">
                                    {selectedBooking.service || (selectedBooking.services && selectedBooking.services.length > 0 ? selectedBooking.services.join(", ") : "N/A")}
                                  </p>
                                </div>
                                <div>
                                  <Label>Date</Label>
                                  <p className="font-medium">
                                    {selectedBooking.date}
                                  </p>
                                </div>
                                <div>
                                  <Label>Time</Label>
                                  <p className="font-medium">
                                    {selectedBooking.time}
                                  </p>
                                </div>
                              </div>
                              <div>
                                <Label>Contact Information</Label>
                                <div className="space-y-1 mt-1">
                                  <div className="flex items-center space-x-2">
                                    <Mail className="h-4 w-4 text-gray-400" />
                                    <span>{selectedBooking.customerEmail}</span>
                                  </div>
                                  <div className="flex items-center space-x-2">
                                    <Phone className="h-4 w-4 text-gray-400" />
                                    <span>{selectedBooking.customerPhone}</span>
                                  </div>
                                </div>
                              </div>
                              {selectedBooking.notes && (
                                <div>
                                  <Label>Notes</Label>
                                  <p className="mt-1 text-sm text-gray-600">
                                    {selectedBooking.notes}
                                  </p>
                                </div>
                              )}
                            </div>
                          )}
                        </DialogContent>
                      </Dialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
