'use client';
import Image from "next/image";
import { useState } from 'react';
import AuthModal from '@/components/shared/AuthModal';
import Hero from "@/components-page/home/Hero";
import Features from "@/components-page/home/Features";
import HowItWorks from "@/components-page/home/HowItWorks";
import Testimonials from "@/components-page/home/Testimonials";

export default function Home() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Hero/>
      <Features/>
      <HowItWorks/>
      <Testimonials/>
    </>
  );
}
