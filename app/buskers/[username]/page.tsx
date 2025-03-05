'use client';

import React, { Suspense, useEffect, useState } from 'react';
import { Instagram, Youtube, Globe, DollarSign } from 'lucide-react';
import Image from 'next/image';
import { GalleryUploader } from './GalleryUploader';
import { supabase } from '@/lib/supabase';
import { BuskerType } from '@/types/supabase';
import toast from 'react-hot-toast';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

interface BuskerProfilePageProps {
  params: Promise<{
    username: string;
  }>;
}

interface GalleryItem {
  url: string;
  type: 'image' | 'video';
}

interface Busker {
  user_name: string;
  user_id: string;
  main_photo: string;
  genre: string;
  location: string;
  description: string;
  instagram_url?: string | null;
  youtube_url?: string | null;
  website_url?: string | null;
  tip_url?: string | null;
  gallery_contents: GalleryItem[];
}

// Separate MediaItem into a client component if needed
const MediaItem = ({ item }: { item: GalleryItem }) => {
  return (
    <div className="relative aspect-square overflow-hidden rounded-lg">
      {item.type === 'video' ? (
        <video src={item.url} controls className="w-full h-full object-cover">
          Your browser does not support the video tag.
        </video>
      ) : (
        <Image
          src={item.url}
          alt={`Gallery item`}
          fill
          className="object-cover hover:scale-105 transition-transform duration-200"
        />
      )}
    </div>
  );
};

// Params unwrapper component
const ParamsUnwrapper = ({
  params,
  children,
}: {
  params: Promise<{ username: string }>;
  children: (username: string) => React.ReactNode;
}) => {
  const unwrappedParams = React.use(params);
  return <>{children(unwrappedParams.username)}</>;
};

// Busker profile detail view component
const BuskerProfileDetailView = ({ busker }: { busker: Busker }) => {
  return (
    <>
      <div className="flex items-center px-8 mb-4 gap-10">
        <Image
          src={busker.main_photo}
          alt="mainPhoto"
          width={70}
          height={70}
          className="rounded-full"
        />

        <div className="mb-4">
          <p className="text-xl text-muted-foreground mb-2">
            {busker.user_name}
          </p>
          <p className="text-gray-700">
            {busker.genre}, {busker.location}
          </p>

          {/* Social Media Links */}
          <div className="flex gap-3 mt-3">
            {busker.instagram_url && (
              <a
                href={busker.instagram_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-700 hover:text-pink-600 transition-colors"
              >
                <Instagram size={20} />
              </a>
            )}

            {busker.youtube_url && (
              <a
                href={busker.youtube_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-700 hover:text-red-600 transition-colors"
              >
                <Youtube size={20} />
              </a>
            )}

            {busker.website_url && (
              <a
                href={busker.website_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-700 hover:text-blue-600 transition-colors"
              >
                <Globe size={20} />
              </a>
            )}

            {busker.tip_url && (
              <a
                href={busker.tip_url}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full flex items-center gap-1 text-sm hover:bg-emerald-200 transition-colors"
              >
                <DollarSign size={14} />
                <span>Tip</span>
              </a>
            )}
          </div>
        </div>
      </div>

      <div className="pl-10 pt-6">{busker.description}</div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-10 pt-20 px-20">
        {busker.gallery_contents &&
          busker.gallery_contents.map((item, index) => (
            <MediaItem key={`${item.url}-${index}`} item={item} />
          ))}
      </div>
    </>
  );
};

// Main profile wrapper component
const BuskerProfileContent = ({ username }: { username: string }) => {
  const [busker, setBusker] = useState<BuskerType | null>(null);

  useEffect(() => {
    const fetchBuskerDetails = async () => {
      try {
        // Fetch busker details from Supabase
        const { data, error } = await supabase
          .from('buskers')
          .select('*')
          .eq('user_name', username)
          .single();

        if (error) throw error;

        // Make sure gallery_contents exists and is an array
        const processedData = {
          ...data,
          gallery_contents: data.gallery_contents || [],
        };

        setBusker(processedData);
      } catch (error) {
        console.error('Error fetching busker details:', error);
        toast.error('Failed to load busker profile. Please try again.');
      }
    };

    if (username) {
      fetchBuskerDetails();
    }
  }, [username]);

  if (!busker) {
    return (
      <div className="container mx-auto p-4 max-w-5xl text-center py-20">
        <h1 className="text-3xl font-bold mb-4">Busker Not Found</h1>
        <p className="text-muted-foreground mb-8">
          The busker profile you&apos;re looking for doesn&apos;t exist or has
          been removed.
        </p>
        <Button asChild>
          <Link href="/buskers">Back to All Buskers</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 flex flex-col min-h-screen">
      <div className="flex justify-end pr-10">
        <GalleryUploader
          userName={username}
          initialGallery={busker.gallery_contents || []}
          userId={busker.user_id}
        />
      </div>

      <Suspense fallback={<div>Loading profile...</div>}>
        <BuskerProfileDetailView busker={busker} />
      </Suspense>
    </div>
  );
};

// Main page component
const BuskerProfilePage = ({ params }: BuskerProfilePageProps) => {
  return (
    <ParamsUnwrapper params={params}>
      {(username) => <BuskerProfileContent username={username} />}
    </ParamsUnwrapper>
  );
};

export default BuskerProfilePage;
