"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Sparkles,
  Star,
  Calendar,
  MapPin,
  Phone,
  Mail,
  Clock,
  Heart,
} from "lucide-react";
import Link from "next/link";

const services = [
  {
    name: "Gel + Artwork",
    description: "Professional nail tips with long-lasting gel polish and artwork",
    price: "Ksh 500",
    duration: "45 min",
    popular: true,
  },
  {
    name: "Gel + Artwork (Classic)",
    description: "Traditional gel manicure on natural nails with artwork",
    price: "Ksh 300",
    duration: "60 min",
    popular: false,
  },
  {
    name: "Acrylics",
    description: "Custom acrylic nails with intricate nail art designs",
    price: "Ksh 1,500",
    duration: "90 min",
    popular: true,
  },
  {
    name: "Pedicure + Gel",
    description: "Complete foot care with relaxing spa treatment and gel polish",
    price: "Ksh 800",
    duration: "120 min",
    popular: false,
  },
  {
    name: "Gum Gel",
    description: "Strengthening gel treatment for healthy nails",
    price: "Ksh 800",
    duration: "30 min",
    popular: false,
  },
  {
    name: "Gum Gel Extension",
    description: "Extended strengthening gel treatment for nail growth",
    price: "Ksh 1,000",
    duration: "45 min",
    popular: false,
  },
  {
    name: "Pedicure + Tips",
    description: "Complete pedicure with nail tips application",
    price: "Ksh 1,000",
    duration: "90 min",
    popular: false,
  },
  {
    name: "Nail Builder",
    description: "Base builder for healthy and strong nails",
    price: "Ksh 500",
    duration: "30 min",
    popular: false,
  },
  {
    name: "Nail Removal",
    description: "Professional and safe nail removal service",
    price: "Ksh 100",
    duration: "15 min",
    popular: false,
  },
];

const testimonials = [
  {
    name: "Sarah M.",
    rating: 5,
    text: "Amazing service! My nails have never looked better. The team is so professional and talented.",
  },
  {
    name: "Maria K.",
    rating: 5,
    text: "Love the nail art here! Always creative designs and excellent quality. Highly recommend!",
  },
  {
    name: "Lisa J.",
    rating: 5,
    text: "Best pedicure in town! Such a relaxing experience and great attention to detail.",
  },
];

export function HeroSection() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50">
      {/* Header */}
      <header className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
        <div className="flex justify-between items-center flex-wrap gap-4">
          <div className="flex items-center space-x-2">
            <Sparkles className="h-6 sm:h-8 w-6 sm:w-8 text-purple-600" />
            <span className="text-xl sm:text-2xl font-bold text-gray-900">
              BeautyExpress
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/auth/client/signin">
              <Button variant="outline" size="sm" className="text-xs sm:text-sm">Client Sign In</Button>
            </Link>
            <Link href="/auth/client/signup">
              <Button className="bg-purple-600 hover:bg-purple-700 text-xs sm:text-sm">
                Book Now
              </Button>
            </Link>
            <Link href="/auth/admin/signin">
              <Button variant="ghost" size="sm" className="text-gray-500 text-xs">
                Admin
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20">
        <div className="text-center max-w-4xl mx-auto">
          <Badge className="mb-3 sm:mb-4 bg-purple-100 text-purple-800 hover:bg-purple-100 text-xs sm:text-sm">
            ✨ Premium Nail Spa Experience
          </Badge>
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-4 sm:mb-6">
            Where Beauty Meets
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600">
              {" "}
              Perfection
            </span>
          </h1>
          <p className="text-base sm:text-lg md:text-xl text-gray-600 mb-6 sm:mb-8 max-w-2xl mx-auto px-2">
            Experience luxury nail care with our expert stylists. From classic
            manicures to intricate nail art, we create beautiful nails that
            express your unique style.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center px-2">
            <Link href="/auth/client/signup" className="w-full sm:w-auto">
              <Button
                size="lg"
                className="w-full sm:w-auto bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
              >
                <Calendar className="mr-2 h-4 sm:h-5 w-4 sm:w-5" />
                Book Appointment
              </Button>
            </Link>
            <Link href="/auth" className="w-full sm:w-auto">
              <Button size="lg" variant="outline" className="w-full sm:w-auto">
                <Heart className="mr-2 h-4 sm:h-5 w-4 sm:w-5" />
                View Services
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20">
        <div className="text-center mb-8 sm:mb-12">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-3 sm:mb-4">
            Our Premium Services
          </h2>
          <p className="text-sm sm:text-base md:text-lg text-gray-600 max-w-2xl mx-auto px-2">
            Choose from our range of professional nail services, each designed
            to pamper and perfect your nails.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {services.map((service, index) => (
            <Card
              key={index}
              className="relative group hover:shadow-lg transition-shadow"
            >
              {service.popular && (
                <Badge className="absolute -top-2 left-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white">
                  Most Popular
                </Badge>
              )}
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  {service.name}
                  <span className="text-purple-600 font-bold">
                    {service.price}
                  </span>
                </CardTitle>
                <CardDescription>{service.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-1 text-sm text-gray-500">
                    <Clock className="h-4 w-4" />
                    <span>{service.duration}</span>
                  </div>
                  <Link href="/auth/client/signup">
                    <Button
                      size="sm"
                      variant="outline"
                      className="group-hover:bg-purple-50"
                    >
                      Book Now
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Testimonials */}
      <section className="container mx-auto px-4 py-16 bg-white/50 rounded-2xl mx-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            What Our Clients Say
          </h2>
          <p className="text-lg text-gray-600">
            Join hundreds of satisfied clients who trust us with their nail
            care.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonials.map((testimonial, index) => (
            <Card key={index} className="text-center">
              <CardHeader>
                <div className="flex justify-center space-x-1 mb-2">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star
                      key={i}
                      className="h-5 w-5 fill-yellow-400 text-yellow-400"
                    />
                  ))}
                </div>
                <CardTitle className="text-lg">{testimonial.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 italic">"{testimonial.text}"</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Contact Info */}
      <section className="container mx-auto px-4 py-16">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-8">
            Visit Us Today
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="flex flex-col items-center space-y-2">
              <MapPin className="h-8 w-8 text-purple-600" />
              <h3 className="font-semibold">Location</h3>
              <p className="text-gray-600 text-center">
                Philadelphia House, Room 8
                <br />
                Nairobi, Kenya
              </p>
            </div>
            <div className="flex flex-col items-center space-y-2">
              <Phone className="h-8 w-8 text-purple-600" />
              <h3 className="font-semibold">Phone</h3>
              <p className="text-gray-600">+254727796332</p>
            </div>
            <div className="flex flex-col items-center space-y-2">
              <Mail className="h-8 w-8 text-purple-600" />
              <h3 className="font-semibold">Email</h3>
              <p className="text-gray-600">beautyexpress211@gmail.com</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="container mx-auto px-4 py-8 text-center text-gray-600">
        <div className="flex items-center justify-center space-x-2 mb-4">
          <Sparkles className="h-6 w-6 text-purple-600" />
          <span className="text-xl font-bold text-gray-900">BeautyExpress</span>
        </div>
        <p>
          &copy; 2025 BeautyExpress. All rights reserved. Crafted with ❤️ for
          beautiful nails.
        </p>
        <p className="mt-2 text-sm">Santos*Kerosi</p>
      </footer>
    </div>
  );
}
