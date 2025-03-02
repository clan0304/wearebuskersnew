import React from 'react';
import Link from 'next/link';

const CallToAction = () => {
  return (
    <section className="bg-primary text-white py-16">
      <div className="container mx-auto px-4 text-center">
        <h2 className="text-3xl md:text-4xl font-bold mb-6 animate-fade-in-up">
          Ready to showcase your talent?
        </h2>
        <p className="text-xl mb-8 max-w-2xl mx-auto animate-fade-in-up animation-delay-300">
          Join our community of talented street performers and start sharing
          your art with the world.
        </p>
        <div className="animate-fade-in-up animation-delay-600">
          <Link href="/buskers">
            <button className="bg-white text-[#01182F] font-semibold rounded-full px-6 py-2 hover:bg-opacity-90 transition-all">
              Upload Profile
            </button>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default CallToAction;
