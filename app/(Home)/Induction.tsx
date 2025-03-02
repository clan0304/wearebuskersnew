'use client';

import Image from 'next/image';
import IntroImage1 from '@/public/assets/introImage1.png';
import IntroImage2 from '@/public/assets/introImage2.jpg';
import { motion } from 'framer-motion';

const Induction = () => {
  // Content for each section
  const sections = [
    {
      number: '01',
      title: 'We promote your work',
      description:
        'We expose your talent through various platforms such as YouTube, Instagram, and TikTok, helping you reach a wider audience and gain recognition.',
      image: IntroImage1,
    },
    {
      number: '02',
      title: 'We support you',
      description:
        'We provide various ways for fans to support your art. Create your profile and start receiving the recognition and support you deserve!',
      image: IntroImage2,
    },
  ];

  return (
    <section className="w-full bg-gradient-to-b from-white to-gray-50">
      <div className="w-full max-w-6xl mx-auto px-4 md:px-12 py-16 md:py-24 flex flex-col gap-5">
        <div>
          <h2 className="text-3xl md:text-5xl lg:text-6xl font-bold text-center mb-4 md:mb-6 tracking-tight">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-indigo-600">
              What we do
            </span>{' '}
            for Buskers?
          </h2>
          <p className="text-center text-gray-600 max-w-2xl mx-auto mb-8 md:mb-16">
            Our platform is designed to help street performers thrive in the
            digital age with tools that amplify your talent and connect you with
            supporters.
          </p>
        </div>

        {/* Flex container for sections */}
        <div className="flex flex-col gap-16 md:gap-24">
          {sections.map((section) => (
            <motion.div
              key={section.number}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true, margin: '-100px' }}
              className="w-full"
            >
              <div className="w-full flex flex-col md:flex-row items-center gap-8 md:gap-16">
                <div className="section-number hidden lg:block text-[120px] font-bold opacity-10 mb-4 md:mb-0 text-indigo-600">
                  {section.number}
                </div>

                <div className="flex flex-col md:flex-row w-full gap-8 md:gap-12 items-center">
                  <div className="md:w-1/2 space-y-3 md:space-y-4 px-2 md:px-0">
                    <div className="inline-block px-3 py-1 md:hidden rounded-full bg-indigo-100 text-indigo-700 text-sm font-medium mb-1">
                      Section {section.number}
                    </div>
                    <h3 className="text-xl md:text-4xl font-bold mb-2 md:mb-4 text-gray-900">
                      {section.title}
                    </h3>
                    <p className="text-gray-600 text-base md:text-lg leading-relaxed">
                      {section.description}
                    </p>
                    <div className="pt-2 md:pt-4"></div>
                  </div>

                  <div className="relative md:w-1/2 w-full aspect-[12/9] md:aspect-[4/3] overflow-hidden rounded-xl md:rounded-2xl shadow-lg md:shadow-xl">
                    <div className="absolute inset-0 bg-gradient-to-tr from-indigo-600/20 to-purple-600/10 z-10 mix-blend-overlay" />
                    <Image
                      src={section.image || '/placeholder.svg'}
                      alt={section.title}
                      fill
                      className="object-cover transition-transform duration-700 hover:scale-105"
                      sizes="(max-width: 768px) 100vw, 50vw"
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Induction;
