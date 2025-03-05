'use client';

import { GoogleMap, LoadScript, Marker } from '@react-google-maps/api';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

// Import our components
import ScheduleForm from './ScheduleForm';
import BuskerInfoCard from './BuskerInfoCard';
import LocationSelector from './LocationSelector';

// Import types and utils
import { BuskingLocation } from '@/types/supabase';
import { getCurrentMelbourneTime } from '@/utils/dateUtils';

const mapContainerStyle = {
  width: '100vw',
  height: 'calc(100vh - 100px)',
};

const center = {
  lat: -37.8136,
  lng: 144.9631,
};

export default function MapPage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [markers, setMarkers] = useState<BuskingLocation[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [newMarker, setNewMarker] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [isBusker, setIsBusker] = useState(false);
  const [isSelectingLocation, setIsSelectingLocation] = useState(false);
  const [startTime, setStartTime] = useState<string>('');
  const [endTime, setEndTime] = useState<string>('');
  const [selectedMarker, setSelectedMarker] = useState<BuskingLocation | null>(
    null
  );
  const [isEditing, setIsEditing] = useState(false);
  const [editStartTime, setEditStartTime] = useState<string>('');
  const [editEndTime, setEditEndTime] = useState<string>('');
  const [isOwner, setIsOwner] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Check if user is authenticated and get session
    const getUser = async () => {
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();
      if (error) {
        console.error('Error getting session:', error);
        setLoading(false);
        return;
      }

      if (session?.user) {
        setUser(session.user);
        // Check if user is a busker
        const { data, error: buskerError } = await supabase
          .from('buskers')
          .select('*')
          .eq('user_id', session.user.id)
          .single();

        if (buskerError && buskerError.code !== 'PGRST116') {
          console.error('Error checking busker status:', buskerError);
        }

        setIsBusker(!!data);
      }

      setLoading(false);
    };

    getUser();

    // Set up auth state change listener
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
      if (!session?.user) {
        setIsBusker(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Function to check if a busking session has expired
  const isExpired = (date: string, endTime: string): boolean => {
    const currentTime = getCurrentMelbourneTime();
    const currentDate = currentTime.toISOString().split('T')[0];

    // If the date is before today, it's expired
    if (date < currentDate) {
      return true;
    }

    // If it's today, check if the end time has passed
    if (date === currentDate) {
      const [endHours, endMinutes] = endTime.split(':').map(Number);
      const endTimeDate = new Date(currentTime);
      endTimeDate.setHours(endHours, endMinutes, 0, 0);

      return currentTime > endTimeDate;
    }

    return false;
  };

  // Function to delete expired busking locations
  const deleteExpiredLocations = async (
    expiredLocations: BuskingLocation[]
  ) => {
    if (expiredLocations.length === 0) return;

    try {
      // Get IDs of expired locations
      const expiredIds = expiredLocations.map((location) => location.id);

      // Delete expired locations from Supabase
      const { error } = await supabase
        .from('busking_locations')
        .delete()
        .in('id', expiredIds);

      if (error) {
        console.error('Error deleting expired busking locations:', error);
      } else {
        console.log(
          `Successfully deleted ${expiredIds.length} expired busking locations`
        );
      }
    } catch (error) {
      console.error('Unexpected error deleting expired locations:', error);
    }
  };

  useEffect(() => {
    // Fetch busking locations from Supabase
    const fetchBuskingLocations = async () => {
      const { data, error } = await supabase.from('busking_locations').select(`
          id,
          lat,
          lng,
          startTime,
          endTime,
          date,
          buskerId,
          user_name,
          main_photo,
          genre,
          description
        `);

      if (error) {
        console.error('Error fetching busking locations:', error);
        return;
      }

      // Format the data to match BuskingLocation type
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const formattedData: BuskingLocation[] = data.map((item: any) => ({
        id: item.id,
        lat: item.lat,
        lng: item.lng,
        startTime: item.startTime,
        endTime: item.endTime,
        date: item.date,
        buskerId: item.buskerId,
        user_name: item.user_name || 'Unknown',
        main_photo: item.main_photo || '',
        genre: item.genre || '',
        description: item.description || '',
      }));

      // Filter out expired busking locations
      const currentLocations: BuskingLocation[] = [];
      const expiredLocations: BuskingLocation[] = [];

      formattedData.forEach((location) => {
        if (isExpired(location.date, location.endTime)) {
          expiredLocations.push(location);
        } else {
          currentLocations.push(location);
        }
      });

      // Update markers with only current locations
      setMarkers(currentLocations);

      // Delete expired locations from the database
      if (expiredLocations.length > 0) {
        deleteExpiredLocations(expiredLocations);
      }
    };

    if (!loading) {
      fetchBuskingLocations();

      // Set up interval to periodically check for expired locations
      const intervalId = setInterval(() => {
        const updatedMarkers = markers.filter(
          (marker) => !isExpired(marker.date, marker.endTime)
        );

        // If any markers were filtered out, they're newly expired
        if (updatedMarkers.length < markers.length) {
          const newlyExpired = markers.filter((marker) =>
            isExpired(marker.date, marker.endTime)
          );
          deleteExpiredLocations(newlyExpired);
          setMarkers(updatedMarkers);

          // If the selected marker has expired, deselect it
          if (
            selectedMarker &&
            isExpired(selectedMarker.date, selectedMarker.endTime)
          ) {
            setSelectedMarker(null);
          }
        }
      }, 60000); // Check every minute

      return () => clearInterval(intervalId);
    }
  }, [loading, markers, selectedMarker]);

  // Memoize the checkOwnership function with useCallback
  const checkOwnership = useCallback(async () => {
    if (!user || !selectedMarker) {
      setIsOwner(false);
      return;
    }

    try {
      // Get user's busker profile
      const { data, error } = await supabase
        .from('buskers')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (error || !data) {
        setIsOwner(false);
        return;
      }

      setIsOwner(data.id === selectedMarker.buskerId);
    } catch (error) {
      console.error('Error checking ownership:', error);
      setIsOwner(false);
    }
  }, [user, selectedMarker]); // Include dependencies for the checkOwnership function

  // Then in your useEffect hook
  useEffect(() => {
    // Initialize edit form values when a marker is selected
    if (selectedMarker) {
      setEditStartTime(selectedMarker.startTime);
      setEditEndTime(selectedMarker.endTime);
      checkOwnership();
    } else {
      setIsEditing(false);
      setIsOwner(false);
    }
  }, [selectedMarker, checkOwnership]); // Now checkOwnership is properly included
  const handleAddScheduleClick = () => {
    if (!isBusker) {
      toast.custom(
        (t) => (
          <div
            className={`${
              t.visible ? 'animate-enter' : 'animate-leave'
            } max-w-md w-full bg-white shadow-lg rounded-lg pointer-events-auto flex flex-col`}
            style={{
              padding: '20px',
              fontSize: '18px',
            }}
          >
            <div className="mb-3">
              Only registered buskers can add schedules.
            </div>
            <button
              onClick={() => {
                router.push('/buskers');
                toast.dismiss(t.id);
              }}
              className="bg-green-500 text-white font-semibold px-4 py-2 rounded hover:bg-green-600"
            >
              Go to Busking Profile
            </button>
          </div>
        ),
        {
          duration: Infinity,
        }
      );
      return;
    }

    setIsSelectingLocation(true);
  };

  const handleMapClick = (event: google.maps.MapMouseEvent) => {
    if (!isBusker || !isSelectingLocation) return;
    const lat = event.latLng?.lat();
    const lng = event.latLng?.lng();
    if (lat && lng) {
      setNewMarker({ lat, lng });
      setShowForm(true);
      setIsSelectingLocation(false);
      setStartTime('');
      setEndTime('');
    }
  };

  const handleSubmit = async () => {
    if (!newMarker || !user) return;

    if (!startTime || !endTime) {
      toast.error('Please set both start and end times.');
      return;
    }

    // Validate time restrictions
    const currentTime: Date = getCurrentMelbourneTime();
    const oneHourAfter: Date = new Date(currentTime);
    oneHourAfter.setHours(currentTime.getHours() + 1);

    const selectedStartTime: Date = new Date(currentTime);
    const [startHours, startMinutes]: number[] = startTime
      .split(':')
      .map(Number);
    selectedStartTime.setHours(startHours, startMinutes, 0, 0);

    // Validate start time is within the allowed range
    if (selectedStartTime < currentTime || selectedStartTime > oneHourAfter) {
      toast.error('Start time must be between now and 1 hour from now');
      return;
    }

    const selectedEndTime: Date = new Date(currentTime);
    const [endHours, endMinutes]: number[] = endTime.split(':').map(Number);
    selectedEndTime.setHours(endHours, endMinutes, 0, 0);

    // Check if the selected end time is before start time (might be next day)
    if (selectedEndTime < selectedStartTime) {
      selectedEndTime.setDate(selectedEndTime.getDate() + 1); // Move to next day
    }

    // Calculate time differences
    const hoursBetween: number =
      (selectedEndTime.getTime() - selectedStartTime.getTime()) /
      (1000 * 60 * 60);

    if (hoursBetween > 3) {
      toast.error('End time cannot be more than 3 hours after start time.');
      return;
    }

    const melbourneDate = getCurrentMelbourneTime();
    const today =
      melbourneDate.getFullYear() +
      '-' +
      String(melbourneDate.getMonth() + 1).padStart(2, '0') +
      '-' +
      String(melbourneDate.getDate()).padStart(2, '0');

    try {
      // Get busker ID and details
      const { data: buskerData, error: buskerError } = await supabase
        .from('buskers')
        .select('id, user_name, main_photo, genre, description')
        .eq('user_id', user.id)
        .single();

      if (buskerError) {
        toast.error('Could not find your busker profile.');
        return;
      }

      // Use toast.promise to handle the main operation with a single toast
      await toast.promise(
        (async () => {
          // Insert new busking location with all required data - using your actual column names
          const { data, error } = await supabase
            .from('busking_locations')
            .insert([
              {
                lat: newMarker.lat,
                lng: newMarker.lng,
                startTime: startTime, // Using camelCase as per your table structure
                endTime: endTime, // Using camelCase as per your table structure
                date: today,
                buskerId: buskerData.id, // Using camelCase as per your table structure
                // Store busker details directly in the busking_locations table
                user_name: buskerData.user_name || user.email,
                main_photo: buskerData.main_photo || '',
                genre: buskerData.genre || '',
                description: buskerData.description || '',
              },
            ])
            .select();

          if (error) {
            console.error('Insert error:', error);
            throw new Error(error.message || 'Failed to create location.');
          }

          // Create new location object
          const newLocation: BuskingLocation = {
            id: data[0].id,
            lat: newMarker.lat,
            lng: newMarker.lng,
            startTime: startTime,
            endTime: endTime,
            date: today,
            buskerId: buskerData.id,
            user_name: buskerData.user_name || user.email,
            main_photo: buskerData.main_photo || '',
            genre: buskerData.genre || '',
            description: buskerData.description || '',
          };

          // Update markers
          setMarkers([...markers, newLocation]);

          return true;
        })(),
        {
          loading: 'Adding your busking schedule...',
          success: 'Busking location added successfully!',
          error: (err) => `${err.message}`,
        }
      );

      // Clear form only on success
      setNewMarker(null);
      setShowForm(false);
      setStartTime('');
      setEndTime('');

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      console.error('Unexpected error:', error);
    }
  };

  const handleEdit = async () => {
    if (!selectedMarker || !user) return;

    if (!editStartTime || !editEndTime) {
      toast.error('Please set both start and end times.');
      return;
    }

    // Get current time in Melbourne
    const currentTime: Date = getCurrentMelbourneTime();

    // Convert start time to Date object
    const startTimeDate: Date = new Date(currentTime);
    const [startHours, startMinutes]: number[] = editStartTime
      .split(':')
      .map(Number);
    startTimeDate.setHours(startHours, startMinutes, 0, 0);

    // Convert end time to Date object
    const endTimeDate: Date = new Date(currentTime);
    const [endHours, endMinutes]: number[] = editEndTime.split(':').map(Number);
    endTimeDate.setHours(endHours, endMinutes, 0, 0);

    // If end time is earlier in the day than start time, assume it's the next day
    if (endTimeDate < startTimeDate) {
      endTimeDate.setDate(endTimeDate.getDate() + 1);
    }

    // Calculate the difference in hours
    const hoursBetween: number =
      (endTimeDate.getTime() - startTimeDate.getTime()) / (1000 * 60 * 60);

    if (hoursBetween > 3) {
      toast.error('End time cannot be more than 3 hours after start time');
      return;
    }

    if (endTimeDate <= startTimeDate) {
      toast.error('End time must be after start time');
      return;
    }

    try {
      // First check if the user is the owner of this busking location
      const { data: buskerData, error: buskerError } = await supabase
        .from('buskers')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (buskerError) {
        toast.error('Could not verify your busker profile.');
        return;
      }

      if (buskerData.id !== selectedMarker.buskerId) {
        toast.error('You can only edit your own busking schedules.');
        return;
      }

      // Update busking location
      await toast.promise(
        (async () => {
          const { error } = await supabase
            .from('busking_locations')
            .update({
              startTime: editStartTime,
              endTime: editEndTime,
            })
            .eq('id', selectedMarker.id);

          if (error) {
            console.error('Update error:', error);
            throw new Error(error.message || 'Failed to update schedule.');
          }

          // Update local state
          const updatedMarkers = markers.map((marker) => {
            if (marker.id === selectedMarker.id) {
              return {
                ...marker,
                startTime: editStartTime,
                endTime: editEndTime,
              };
            }
            return marker;
          });

          setMarkers(updatedMarkers);

          // Update the selected marker
          if (selectedMarker) {
            setSelectedMarker({
              ...selectedMarker,
              startTime: editStartTime,
              endTime: editEndTime,
            });
          }

          return true;
        })(),
        {
          loading: 'Updating your busking schedule...',
          success: 'Schedule updated successfully!',
          error: (err) => `${err.message}`,
        }
      );

      // Exit edit mode after successful update
      setIsEditing(false);
    } catch (error) {
      console.error('Unexpected error:', error);
    }
  };

  const handleDelete = async () => {
    if (!selectedMarker || !user) return;

    try {
      // First check if the user is the owner of this busking location
      const { data: buskerData, error: buskerError } = await supabase
        .from('buskers')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (buskerError) {
        toast.error('Could not verify your busker profile.');
        return;
      }

      if (buskerData.id !== selectedMarker.buskerId) {
        toast.error('You can only delete your own busking schedules.');
        return;
      }

      // Confirm deletion
      if (!window.confirm('Are you sure you want to delete this schedule?')) {
        return;
      }

      // Delete busking location
      await toast.promise(
        (async () => {
          const { error } = await supabase
            .from('busking_locations')
            .delete()
            .eq('id', selectedMarker.id);

          if (error) {
            console.error('Delete error:', error);
            throw new Error(error.message || 'Failed to delete schedule.');
          }

          // Update local state
          const updatedMarkers = markers.filter(
            (marker) => marker.id !== selectedMarker.id
          );
          setMarkers(updatedMarkers);

          // Clear selected marker
          setSelectedMarker(null);

          return true;
        })(),
        {
          loading: 'Deleting your busking schedule...',
          success: 'Schedule deleted successfully!',
          error: (err) => `${err.message}`,
        }
      );
    } catch (error) {
      console.error('Unexpected error:', error);
    }
  };

  if (loading)
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div role="status">
          <svg
            aria-hidden="true"
            className="w-16 h-16 text-gray-200 animate-spin fill-indigo-600"
            viewBox="0 0 100 101"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z"
              fill="currentColor"
            />
            <path
              d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z"
              fill="currentFill"
            />
          </svg>
        </div>
      </div>
    );

  return (
    <div className="relative">
      <div className="flex justify-end my-5 px-2">
        <button
          className="bg-[#01182F] text-white font-semibold px-6 py-2 rounded-xl z-10 hover:opacity-70"
          onClick={handleAddScheduleClick}
        >
          Add a schedule
        </button>
      </div>
      <LoadScript
        googleMapsApiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ''}
      >
        <GoogleMap
          mapContainerStyle={mapContainerStyle}
          center={center}
          zoom={15}
          onClick={handleMapClick}
        >
          {markers.map((marker) => (
            <Marker
              key={marker.id}
              position={{ lat: marker.lat, lng: marker.lng }}
              title={`Schedule: ${marker.date} ${marker.startTime} ~ ${marker.endTime}`}
              onClick={() =>
                setSelectedMarker(marker === selectedMarker ? null : marker)
              }
            />
          ))}
        </GoogleMap>

        {isSelectingLocation && (
          <LocationSelector onClose={() => setIsSelectingLocation(false)} />
        )}

        {showForm && newMarker && (
          <ScheduleForm
            startTime={startTime}
            setStartTime={setStartTime}
            endTime={endTime}
            setEndTime={setEndTime}
            handleSubmit={handleSubmit}
            onClose={() => setShowForm(false)}
          />
        )}

        {selectedMarker && (
          <BuskerInfoCard
            marker={selectedMarker}
            isOwner={isOwner}
            isEditing={isEditing}
            setIsEditing={setIsEditing}
            editStartTime={editStartTime}
            setEditStartTime={setEditStartTime}
            editEndTime={editEndTime}
            setEditEndTime={setEditEndTime}
            handleEdit={handleEdit}
            handleDelete={handleDelete}
            onClose={() => setSelectedMarker(null)}
          />
        )}
      </LoadScript>
    </div>
  );
}
