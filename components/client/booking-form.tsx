"use client";

import type React from "react";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { CalendarIcon, Clock, Star, User } from "lucide-react";
import { format } from "date-fns";
import { addDoc, collection, Timestamp, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useClientAuth } from "@/hooks/use-client-auth";
import { useNotifications } from "@/hooks/use-notifications";
import { toast } from "sonner";

const services = [
  {
    id: "Gel+artwork",
    name: "Gel + Artwork",
    duration: 45,
    price: 500,
  },
  {
    id: "Gel+artwork-classic",
    name: "Gel + Artwork (Classic)",
    duration: 60,
    price: 300,
  },
  {
    id: "Acrylics",
    name: "Acrylics",
    duration: 90,
    price: 1500,
  },
  { id: "Pedicure+gel", name: "Pedicure + Gel", duration: 120, price: 800 },
  { id: "Gum-gel", name: "Gum Gel", duration: 30, price: 800 },
  { id: "Gum-gel-extension", name: "Gum Gel Extension", duration: 45, price: 1000 },
  { id: "Pedicure+tips", name: "Pedicure + Tips", duration: 90, price: 1000 },
  { id: "Nail-builder", name: "Nail Builder", duration: 30, price: 500 },
  { id: "Nail-removal", name: "Nail Removal", duration: 15, price: 100 },
];

interface Stylist {
  id: string;
  name: string;
  specialties: string[];
  rating: number;
  experience: string;
  phone?: string;
}

const timeSlots = [
  "9:00 AM",
  "9:30 AM",
  "10:00 AM",
  "10:30 AM",
  "11:00 AM",
  "11:30 AM",
  "12:00 PM",
  "12:30 PM",
  "1:00 PM",
  "1:30 PM",
  "2:00 PM",
  "2:30 PM",
  "3:00 PM",
  "3:30 PM",
  "4:00 PM",
  "4:30 PM",
  "5:00 PM",
  "5:30 PM",
];

interface BookingFormProps {
  onBookingComplete: () => void;
}

export function BookingForm({ onBookingComplete }: BookingFormProps) {
  const { clientProfile } = useClientAuth();
  const { createNotification } = useNotifications(clientProfile?.uid);
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [selectedStylist, setSelectedStylist] = useState("");
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [selectedTime, setSelectedTime] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [stylists, setStylists] = useState<Stylist[]>([]);
  const [loadingStylists, setLoadingStylists] = useState(true);

  useEffect(() => {
    fetchStylists();
  }, []);

  const fetchStylists = async () => {
    try {
      setLoadingStylists(true);
      const snapshot = await getDocs(collection(db, "stylists"));
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Stylist[];
      setStylists(data);
    } catch (error) {
      console.error("Error fetching stylists:", error);
      toast.error("Failed to load stylists");
    } finally {
      setLoadingStylists(false);
    }
  };

  const selectedServicesData = services.filter((s) =>
    selectedServices.includes(s.id),
  );
  const selectedStylistData = stylists.find((s) => s.id === selectedStylist);
  const totalPrice = selectedServicesData.reduce((sum, s) => sum + s.price, 0);
  const totalDuration = selectedServicesData.reduce((sum, s) => sum + s.duration, 0);

  const toggleService = (serviceId: string) => {
    setSelectedServices((prev) =>
      prev.includes(serviceId)
        ? prev.filter((id) => id !== serviceId)
        : [...prev, serviceId],
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientProfile || !selectedDate || selectedServices.length === 0) return;

    setLoading(true);

    try {
      const bookingData = {
        customerName: clientProfile.displayName,
        customerEmail: clientProfile.email,
        customerPhone: clientProfile.phone,
        customerId: clientProfile.uid,
        services: selectedServicesData.map((s) => s.name),
        serviceIds: selectedServices,
        stylist: selectedStylistData?.name,
        stylistId: selectedStylist,
        date: format(selectedDate, "yyyy-MM-dd"),
        time: selectedTime,
        status: "pending",
        notes,
        price: totalPrice,
        revenue: totalPrice, // Add revenue field for admin tracking
        duration: totalDuration,
        createdAt: Timestamp.now(),
      };

      await addDoc(collection(db, "bookings"), bookingData);

      // Create notification for admin (using correct admin UID)
      const serviceNames = selectedServicesData.map((s) => s.name).join(", ");
      await createNotification(
        "VJdxemjpYTfR3TAfAQDmZ9ucjxB2", // Admin UID from useAdminAuth
        "New Booking Request",
        `${clientProfile.displayName} requested ${serviceNames} with ${selectedStylistData?.name}`,
        "booking",
        bookingData,
      );

      // Create notification for client
      await createNotification(
        clientProfile.uid,
        "Booking Submitted",
        `Your booking request for ${serviceNames} has been submitted and is pending confirmation.`,
        "booking",
        bookingData,
      );

      toast.success(
        "🎉 Booking submitted successfully! You'll receive a confirmation soon.",
      );

      // Reset form
      setSelectedServices([]);
      setSelectedStylist("");
      setSelectedDate(undefined);
      setSelectedTime("");
      setNotes("");

      onBookingComplete();
    } catch (error) {
      console.error("Error creating booking:", error);
      toast.error("Failed to submit booking. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Book Your Appointment</CardTitle>
        <CardDescription>
          Choose your service, stylist, and preferred time
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Service Selection */}
          <div className="space-y-3">
            <Label>Select Services (You can choose multiple)</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {services.map((service) => (
                <Card
                  key={service.id}
                  className={`cursor-pointer transition-all ${
                    selectedServices.includes(service.id)
                      ? "ring-2 ring-purple-500 bg-purple-50"
                      : "hover:bg-gray-50"
                  }`}
                  onClick={() => toggleService(service.id)}
                >
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="font-medium">{service.name}</h3>
                        <p className="text-sm text-gray-500">
                          {service.duration} minutes
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <Badge variant="secondary">Ksh{service.price}</Badge>
                        {selectedServices.includes(service.id) && (
                          <div className="text-xs text-purple-600 font-semibold">
                            ✓ Selected
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            {selectedServices.length > 0 && (
              <div className="text-sm text-gray-600 mt-2">
                {selectedServices.length} service{selectedServices.length !== 1 ? "s" : ""} selected
              </div>
            )}
          </div>

          {/* Stylist Selection */}
          <div className="space-y-3">
            <Label>Choose Your Stylist</Label>
            {loadingStylists ? (
              <div className="text-center py-4 text-gray-500">
                Loading stylists...
              </div>
            ) : stylists.length === 0 ? (
              <div className="text-center py-4 text-gray-500">
                <p>No stylists available at the moment.</p>
                <p className="text-sm">Please check back later.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3">
                {stylists.map((stylist) => (
                  <Card
                    key={stylist.id}
                    className={`cursor-pointer transition-all ${
                      selectedStylist === stylist.id
                        ? "ring-2 ring-purple-500 bg-purple-50"
                        : "hover:bg-gray-50"
                    }`}
                    onClick={() => setSelectedStylist(stylist.id)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-4">
                        <Avatar className="h-12 w-12">
                          <AvatarFallback>
                            <User className="h-6 w-6" />
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <h3 className="font-medium">{stylist.name}</h3>
                          <p className="text-sm text-gray-500">
                            {stylist.experience}
                          </p>
                          <div className="flex items-center space-x-2 mt-1">
                            <div className="flex items-center">
                              <Star className="h-4 w-4 text-yellow-400 fill-current" />
                              <span className="text-sm ml-1">
                                {stylist.rating}
                              </span>
                            </div>
                            <div className="flex flex-wrap gap-1">
                              {stylist.specialties.map((specialty) => (
                                <Badge
                                  key={specialty}
                                  variant="outline"
                                  className="text-xs"
                                >
                                  {specialty}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Date Selection */}
          <div className="space-y-3">
            <Label>Select Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start text-left font-normal bg-transparent"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {selectedDate ? format(selectedDate, "PPP") : "Pick a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  disabled={(date) => date < new Date() || date.getDay() === 0} // Disable past dates and Sundays
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Time Selection */}
          <div className="space-y-3">
            <Label>Select Time</Label>
            <div className="grid grid-cols-3 md:grid-cols-4 gap-2">
              {timeSlots.map((time) => (
                <Button
                  key={time}
                  type="button"
                  variant={selectedTime === time ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedTime(time)}
                  className="text-sm"
                >
                  <Clock className="mr-1 h-3 w-3" />
                  {time}
                </Button>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-3">
            <Label htmlFor="notes">Special Requests (Optional)</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any special requests or preferences..."
              rows={3}
            />
          </div>

          {/* Booking Summary */}
          {selectedServices.length > 0 &&
            selectedStylistData &&
            selectedDate &&
            selectedTime && (
              <Card className="bg-purple-50 border-purple-200">
                <CardContent className="p-4">
                  <h3 className="font-medium mb-3">Booking Summary</h3>
                  <div className="space-y-2 text-sm">
                    <div>
                      <p className="font-semibold mb-1">Services:</p>
                      <div className="ml-2 space-y-1">
                        {selectedServicesData.map((service) => (
                          <p key={service.id} className="text-gray-700">
                            • {service.name} ({service.duration} min) - Ksh{service.price}
                          </p>
                        ))}
                      </div>
                    </div>
                    <div className="border-t border-purple-200 pt-2 mt-2">
                      <p>
                        <strong>Stylist:</strong> {selectedStylistData.name}
                      </p>
                      <p>
                        <strong>Date:</strong> {format(selectedDate, "PPP")}
                      </p>
                      <p>
                        <strong>Time:</strong> {selectedTime}
                      </p>
                      <p>
                        <strong>Total Duration:</strong> {totalDuration} minutes
                      </p>
                      <p className="text-base font-bold text-purple-600 mt-2">
                        <strong>Total Price:</strong> Ksh{totalPrice}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

          <Button
            type="submit"
            className="w-full"
            disabled={
              selectedServices.length === 0 ||
              !selectedStylist ||
              !selectedDate ||
              !selectedTime ||
              loading
            }
          >
            {loading ? "Submitting..." : "Book Appointment"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
