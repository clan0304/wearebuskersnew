'use client';

import Image from 'next/image';
import BuskingMapImage from '@/public/assets/buskingmap.png';
import { motion } from 'framer-motion';

const BuskingMap = () => {
  return (
    <section className="w-full bg-gradient-to-b from-white to-gray-50">
      <div className="w-full max-w-6xl mx-auto px-4 md:px-12 py-16 md:py-24 flex flex-col gap-5">
        <div>
          <h2 className="text-3xl md:text-5xl lg:text-6xl font-bold text-center mb-8 md:mb-6 tracking-wide">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-indigo-600">
              Busking
            </span>{' '}
            Map
          </h2>
          <p className="text-center text-gray-600 max-w-2xl mx-auto mb-8 md:mb-16">
            Discover street performers in your area with our interactive map.
            Find buskers near you and enjoy live performances wherever you go.
          </p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true, margin: '-100px' }}
          className="w-full"
        >
          <div className="w-full flex flex-col items-center">
            <div className="relative w-full aspect-[16/9] overflow-hidden rounded-xl md:rounded-2xl shadow-lg md:shadow-xl">
              <div className="absolute inset-0 bg-gradient-to-tr from-indigo-600/20 to-purple-600/10 z-10 mix-blend-overlay" />
              <Image
                src={BuskingMapImage}
                alt="Busking Map"
                fill
                className="object-cover transition-transform duration-700 hover:scale-105"
                sizes="(max-width: 768px) 100vw, 100vw"
                priority
              />
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default BuskingMap;
