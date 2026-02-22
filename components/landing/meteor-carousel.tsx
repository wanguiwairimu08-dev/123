"use client";

import * as React from "react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { Meteors } from "@/components/ui/meteors";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Calendar, Sparkles } from "lucide-react";

const carouselItems = [
  {
    title: "Luxury Nail Art",
    description: "Experience the finest nail art designs crafted by our expert stylists.",
    image: "https://images.pexels.com/photos/9099607/pexels-photo-9099607.jpeg",
    badge: "New Trend",
    buttonText: "Book Appointment",
  },
  {
    title: "Relaxing Pedicure",
    description: "Pamper your feet with our signature spa pedicure treatments.",
    image: "https://images.pexels.com/photos/34930117/pexels-photo-34930117.jpeg",
    badge: "Popular",
    buttonText: "View Services",
  },
  {
    title: "Gel + Artwork",
    description: "Long-lasting gel polish with custom artwork for any occasion.",
    image: "https://images.pexels.com/photos/704815/pexels-photo-704815.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2",
    badge: "Classic",
    buttonText: "Book Now",
  },
];

export function MeteorCarousel() {
  return (
    <div className="relative w-full max-w-5xl mx-auto px-4 py-12 overflow-hidden">
      <Carousel
        opts={{
          align: "start",
          loop: true,
        }}
        className="w-full"
      >
        <CarouselContent>
          {carouselItems.map((item, index) => (
            <CarouselItem key={index} className="md:basis-full lg:basis-full">
              <div className="relative group overflow-hidden rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl h-[500px]">
                {/* Image Overlay */}
                <div className="absolute inset-0 z-0">
                  <img
                    src={item.image}
                    alt={item.title}
                    className="w-full h-full object-cover opacity-40 group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/60 to-transparent" />
                </div>

                {/* Meteor Effect */}
                <div className="absolute inset-0 z-10 pointer-events-none">
                  <Meteors number={25} />
                </div>

                {/* Content */}
                <div className="relative z-20 h-full flex flex-col justify-end p-8 sm:p-12 text-white">
                  <div className="max-w-xl">
                    <Badge className="mb-4 bg-purple-500/20 text-purple-300 border-purple-500/30 backdrop-blur-sm">
                      <Sparkles className="mr-1 h-3 w-3" />
                      {item.badge}
                    </Badge>
                    <h2 className="text-3xl sm:text-5xl font-bold mb-4 tracking-tight">
                      {item.title}
                    </h2>
                    <p className="text-lg text-slate-300 mb-8 leading-relaxed">
                      {item.description}
                    </p>
                    <div className="flex gap-4">
                      <Link href="/auth/client/signup">
                        <Button
                          size="lg"
                          className="bg-purple-600 hover:bg-purple-700 text-white border-none shadow-lg shadow-purple-600/20"
                        >
                          <Calendar className="mr-2 h-5 w-5" />
                          {item.buttonText}
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
        <div className="hidden sm:block">
          <CarouselPrevious className="left-4 bg-white/10 hover:bg-white/20 border-white/20 text-white backdrop-blur-md" />
          <CarouselNext className="right-4 bg-white/10 hover:bg-white/20 border-white/20 text-white backdrop-blur-md" />
        </div>
      </Carousel>
    </div>
  );
}
