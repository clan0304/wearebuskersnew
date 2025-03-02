'use client';

import Image from 'next/image';
import React from 'react';
import HeroImage from '@/public/assets/heroPhoto.jpg';
import { useRouter } from 'next/navigation';

const Hero = () => {
  const router = useRouter();

  return (
    <section className="relative h-screen">
      <Image
        src={HeroImage}
        alt="Main Photo"
        fill
        objectFit="cover"
        quality={100}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-black/60 to-black/30" />

      {/* Text content */}
      <div className="absolute inset-0 flex flex-col gap-4 items-center justify-center text-white">
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-4 text-center animate-fade-in-down">
          Welcome to Buskers
        </h1>
        <p className="text-md sm:text-xl md:text-2xl mb-8 text-center max-w-2xl animate-fade-in-down animation-delay-300">
          Discover and support street performers from around the world
        </p>
      </div>

      {/* Button at the bottom */}
      <div className="absolute inset-x-0 bottom-[15%] flex justify-center">
        <button
          className="bg-white text-primary py-3 px-8 rounded-full text-lg font-bold hover:scale-110 transition-all duration-300 shadow-lg animate-fade-in-up animation-delay-600"
          onClick={() => router.push('/buskers')}
        >
          Discover Buskers
        </button>
      </div>
    </section>
  );
};

export default Hero;
