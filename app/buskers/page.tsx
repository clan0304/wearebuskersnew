'use client';

import type React from 'react';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import toast from 'react-hot-toast';
import BuskerModalForm from './FormModal';
import { useRouter } from 'next/navigation';
import { Edit, Trash2, Filter, Music, User } from 'lucide-react';
import Link from 'next/link';
import Modal from '@/components/Modal';
import Image from 'next/image';
import EmptyProfile from '@/public/assets/emptyimage.webp';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { supabase } from '@/lib/supabase';
import type { BuskerType } from '@/types/supabase';
import { useAuth } from '@/hooks/useAuth';

type ValidGenre =
  | 'Musician'
  | 'Dancer'
  | 'Magician'
  | 'Artist'
  | 'Circus'
  | 'Statue'
  | 'Performer'
  | 'Other';

const GENRE_OPTIONS: ValidGenre[] = [
  'Musician',
  'Dancer',
  'Magician',
  'Artist',
  'Circus',
  'Statue',
  'Performer',
  'Other',
];

// Map genres to their respective icons
const genreIcons: Record<ValidGenre, React.ReactNode> = {
  Musician: <Music className="h-3 w-3" />,
  Dancer: <span>💃</span>,
  Magician: <span>✨</span>,
  Artist: <span>🎨</span>,
  Circus: <span>🎪</span>,
  Statue: <span>🗿</span>,
  Performer: <span>🎭</span>,
  Other: <span>🌟</span>,
};

const BuskersPage = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [buskers, setBuskers] = useState<BuskerType[]>([]);
  const [filteredBuskers, setFilteredBuskers] = useState<BuskerType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  const [selectedGenre, setSelectedGenre] = useState<'all' | ValidGenre>('all');

  const { user, isSignedIn } = useAuth();

  const [isEditMode, setIsEditMode] = useState(false);
  const [initialData, setInitialData] = useState<BuskerType | null>(null);

  useEffect(() => {
    const fetchBuskers = async () => {
      try {
        setIsLoading(true);

        // Fetch buskers from Supabase
        const { data, error } = await supabase.from('buskers').select('*');

        if (error) throw error;

        setBuskers(data || []);
        setFilteredBuskers(sortBuskersWithUserFirst(data || [], user?.id));
      } catch (error) {
        console.log(error);
        toast.error('Failed to fetch busker profiles. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchBuskers();
  }, [user?.id]);

  // Sort function to put user's profile first
  const sortBuskersWithUserFirst = (
    buskersList: BuskerType[],
    userId: string | undefined
  ) => {
    if (!userId) return buskersList;

    return [...buskersList].sort((a, b) => {
      if (a.user_id === userId) return -1;
      if (b.user_id === userId) return 1;
      return 0;
    });
  };

  // Filter buskers when genre selection changes
  useEffect(() => {
    const filterBuskers = () => {
      let filtered = [...buskers];

      if (selectedGenre !== 'all') {
        filtered = filtered.filter((busker) => busker.genre === selectedGenre);
      }

      // Apply the user-first sorting after filtering
      filtered = sortBuskersWithUserFirst(filtered, user?.id);
      setFilteredBuskers(filtered);
    };

    filterBuskers();
  }, [selectedGenre, buskers, user?.id]);

  const openCreateModal = () => {
    // Check if the current user already has a profile
    const existingProfile = buskers.find(
      (busker) => busker.user_id === user?.id
    );

    if (existingProfile) {
      toast.error('You already have a busker profile.');
      return;
    }

    setIsEditMode(false);
    setInitialData(null);
    setIsModalOpen(true);
  };

  const openEditModal = (data: BuskerType) => {
    setIsEditMode(true);
    setInitialData(data);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  const handleDeleteBusker = async (id: string | undefined, userId: string) => {
    try {
      if (!id || !userId) {
        toast.error('Busker ID and User ID are required');
        return;
      }

      // Check if user owns this busker profile
      if (userId !== user?.id) {
        toast.error('You can only delete your own profile');
        return;
      }

      // Delete from Supabase
      const { error } = await supabase
        .from('buskers')
        .delete()
        .eq('id', id)
        .eq('user_id', userId);

      if (error) throw error;

      // Update the buskers state and maintain sorting
      const updatedBuskers = buskers.filter((busker) => busker.id !== id);
      setBuskers(updatedBuskers);
      setFilteredBuskers(sortBuskersWithUserFirst(updatedBuskers, user?.id));

      toast.success('Busker profile deleted successfully!');
    } catch (error) {
      console.error('Error deleting busker:', error);
      toast.error('Failed to delete busker profile. Please try again.');
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="space-y-6">
          <Skeleton className="w-[250px] h-[40px]" />
          <div className="flex justify-between">
            <Skeleton className="w-[180px] h-[40px]" />
            <Skeleton className="w-[150px] h-[40px]" />
          </div>
          <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {[...Array(8)].map((_, index) => (
              <div key={index} className="space-y-3">
                <Skeleton className="h-[200px] w-full rounded-lg" />
                <Skeleton className="h-5 w-2/3" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <section className="container mx-auto px-4 py-8 min-h-screen">
      <div className="space-y-6">
        <div className="flex flex-col space-y-2">
          <h1 className="text-4xl font-bold tracking-tight">Busker Profiles</h1>
          <p className="text-sm text-gray-500">
            Discover talented street performers in your area
          </p>
        </div>

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 py-2 border-b border-gray-200">
          <div className="flex items-center gap-3 bg-gray-100/50 p-2 rounded-lg">
            <Filter className="h-4 w-4 text-gray-500" />
            <Select
              value={selectedGenre}
              onValueChange={(value) =>
                setSelectedGenre(value as 'all' | ValidGenre)
              }
            >
              <SelectTrigger
                className="w-[180px] border-none bg-transparent"
                style={{ boxShadow: 'none' }}
              >
                <SelectValue placeholder="Select Genre" />
              </SelectTrigger>
              <SelectContent className="z-50 bg-white">
                <SelectItem value="all">All Genres</SelectItem>
                {GENRE_OPTIONS.map((genre) => (
                  <SelectItem key={genre} value={genre}>
                    <div className="flex items-center gap-2">
                      {genreIcons[genre]}
                      <span>{genre}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {isSignedIn ? (
            <Button
              onClick={openCreateModal}
              className="w-full sm:w-auto bg-[#01182F]  text-white font-semibold hover:opacity-70 hover:cursor-pointer"
              style={{ height: '42px', fontSize: '14px' }}
            >
              <User className="mr-2 h-4 w-4" />
              Upload Your Profile
            </Button>
          ) : (
            <Button
              onClick={() => router.push('/auth')}
              className="w-full sm:w-auto bg-white text-gray-800 border border-gray-300 hover:bg-gray-50"
              style={{ height: '42px', fontSize: '14px' }}
            >
              Sign in to create profile
            </Button>
          )}
        </div>

        {filteredBuskers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="rounded-full bg-gray-100 p-6 mb-4">
              <Music className="h-10 w-10 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold mb-2">No buskers found</h3>
            <p className="text-gray-500 max-w-md">
              {selectedGenre !== 'all'
                ? `There are no ${selectedGenre} buskers available. Try selecting a different genre.`
                : 'There are no busker profiles available at the moment.'}
            </p>
          </div>
        ) : (
          <div className="grid gap-6 grid-cols-1  md:grid-cols-2 lg:grid-cols-3">
            {filteredBuskers.map((busker) => (
              <div
                key={busker.id}
                className="animate-fadeIn"
                style={{
                  animation: 'fadeIn 0.5s ease-out',
                }}
              >
                <Card
                  className="overflow-hidden hover:shadow-lg transition-all duration-300"
                  style={{
                    borderColor:
                      busker.user_id === user?.id ? '#3b82f6' : '#e5e7eb',
                    boxShadow:
                      busker.user_id === user?.id
                        ? '0 0 0 2px rgba(59, 130, 246, 0.5)'
                        : 'none',
                  }}
                >
                  <Link
                    href={`/buskers/${busker.user_name}`}
                    className="focus:outline-none"
                    style={{
                      display: 'block',
                    }}
                  >
                    <div className="relative w-full aspect-square overflow-hidden">
                      {busker.user_id === user?.id && (
                        <div className="absolute top-2 right-2 z-10">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            Your Profile
                          </span>
                        </div>
                      )}
                      {busker.main_photo ? (
                        <div className="relative w-full h-full transform transition-transform duration-500 hover:scale-105">
                          <Image
                            src={busker.main_photo || '/placeholder.svg'}
                            alt={`${busker.user_name}'s photo`}
                            fill
                            className="object-cover"
                          />
                          <div
                            className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300"
                            style={{
                              background:
                                'linear-gradient(to top, rgba(0,0,0,0.6) 0%, transparent 100%)',
                            }}
                          />
                        </div>
                      ) : (
                        <div className="relative w-full h-full transform transition-transform duration-500 hover:scale-105">
                          <Image
                            src={EmptyProfile || '/placeholder.svg'}
                            alt={`${busker.user_name}'s photo`}
                            fill
                            className="object-cover"
                          />
                          <div
                            className="absolute inset-0 opacity-0 hover:opacity-100 transition-opacity duration-300"
                            style={{
                              background:
                                'linear-gradient(to top, rgba(0,0,0,0.6) 0%, transparent 100%)',
                            }}
                          />
                        </div>
                      )}
                    </div>

                    <CardContent className="p-4">
                      <div className="space-y-2">
                        <h3 className="font-semibold text-lg truncate">
                          {busker.user_name}
                        </h3>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span
                            className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium"
                            style={{
                              backgroundColor: 'rgba(243, 244, 246, 1)',
                              color: 'rgba(55, 65, 81, 1)',
                              border: '1px solid rgba(229, 231, 235, 1)',
                            }}
                          >
                            <div className="flex items-center gap-1">
                              {busker.genre &&
                                genreIcons[busker.genre as ValidGenre]}
                              <span>{busker.genre}</span>
                            </div>
                          </span>
                          {busker.location && (
                            <span className="text-xs text-gray-500">
                              {busker.location}
                            </span>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Link>

                  {user?.id === busker.user_id && (
                    <CardFooter className="flex justify-end gap-2 p-4 pt-0">
                      <Button
                        onClick={() => openEditModal(busker)}
                        className="h-8 bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
                        style={{ fontSize: '12px' }}
                      >
                        <Edit className="h-3.5 w-3.5 mr-1" />
                        Edit
                      </Button>
                      <Button
                        onClick={() => {
                          if (user?.id) {
                            handleDeleteBusker(busker.id, user.id);
                          }
                        }}
                        className="h-8 bg-red-600 hover:bg-red-700 text-white"
                        style={{ fontSize: '12px' }}
                      >
                        <Trash2 className="h-3.5 w-3.5 mr-1" />
                        Delete
                      </Button>
                    </CardFooter>
                  )}
                </Card>
              </div>
            ))}
          </div>
        )}
      </div>

      <style jsx global>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.5s ease-out;
        }
      `}</style>

      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={isEditMode ? 'Update Profile' : 'Upload Profile'}
      >
        <BuskerModalForm
          initialData={initialData}
          onClose={closeModal}
          isEditMode={isEditMode}
          userId={user?.id}
          email={user?.email}
          userName={user?.user_metadata?.username || ''}
        />
      </Modal>
    </section>
  );
};

export default BuskersPage;
