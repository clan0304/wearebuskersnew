'use client';

import { GoogleMap, LoadScript, Marker } from '@react-google-maps/api';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import toast from 'react-hot-toast';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

const mapContainerStyle = {
  width: '100vw',
  height: 'calc(100vh - 100px)',
};

const center = {
  lat: -37.8136,
  lng: 144.9631,
};

type BuskingLocation = {
  id: string;
  lat: number;
  lng: number;
  startTime: string;
  endTime: string;
  date: string;
  buskerId: string;
  user_name: string;
  main_photo: string;
  genre: string;
  description: string;
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

      setMarkers(formattedData);
    };

    if (!loading) {
      fetchBuskingLocations();
    }
  }, [loading]);

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
                router.push('/busker');
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

    const melbourneDate = new Date(
      new Date().toLocaleString('en-US', { timeZone: 'Australia/Melbourne' })
    );
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
          <span className="sr-only">Loading...</span>
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
          <div
            style={{
              position: 'absolute',
              top: '80px',
              left: '20px',
              background: '#01182F',
              color: 'white',
              padding: '10px 20px',
              borderRadius: '4px',
              zIndex: 900,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              width: '220px',
              height: '60px',
            }}
          >
            <span className="font-semibold">Select the Location</span>
            <button
              onClick={() => setIsSelectingLocation(false)}
              style={{
                background: 'none',
                border: 'none',
                color: 'white',
                fontSize: '16px',
                fontWeight: 'semi-bold',
                cursor: 'pointer',
                marginLeft: '10px',
              }}
            >
              ✕
            </button>
          </div>
        )}
        {showForm && newMarker && (
          <div
            style={{
              position: 'fixed',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              background: 'white',
              padding: '20px',
              borderRadius: '8px',
              boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)',
              zIndex: 1000,
              width: '300px',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '20px',
              }}
            >
              <h3 style={{ margin: 0 }}>Today&apos;s Performing Schedule</h3>
              <button
                onClick={() => setShowForm(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '20px',
                  cursor: 'pointer',
                  padding: 0,
                }}
              >
                ✕
              </button>
            </div>
            <div
              style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                }}
              >
                <label style={{ minWidth: '90px' }}>Start Time: </label>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    width: '100%',
                  }}
                >
                  <span style={{ flexGrow: 1 }}>{startTime || ''}</span>
                  <div
                    style={{ position: 'relative', display: 'inline-block' }}
                  >
                    <input
                      type="time"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      style={{
                        position: 'absolute',
                        opacity: 0,
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        cursor: 'default',
                      }}
                    />
                    <span
                      style={{
                        fontSize: '24px',
                        cursor: 'pointer',
                        display: 'inline-block',
                        padding: '5px',
                      }}
                    >
                      ⏰
                    </span>
                  </div>
                </div>
              </div>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                }}
              >
                <label style={{ minWidth: '90px' }}>Finish Time: </label>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    width: '100%',
                  }}
                >
                  <span style={{ flexGrow: 1 }}>{endTime || ''}</span>
                  <div
                    style={{ position: 'relative', display: 'inline-block' }}
                  >
                    <input
                      type="time"
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                      style={{
                        position: 'absolute',
                        opacity: 0,
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        cursor: 'default',
                      }}
                    />
                    <span
                      style={{
                        fontSize: '24px',
                        cursor: 'pointer',
                        display: 'inline-block',
                        padding: '5px',
                      }}
                    >
                      ⏰
                    </span>
                  </div>
                </div>
              </div>

              <button
                onClick={handleSubmit}
                style={{
                  marginTop: '10px',
                  padding: '10px',
                  background: '#01182F',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                }}
              >
                Save
              </button>
            </div>
          </div>
        )}
        {selectedMarker && (
          <div
            style={{
              position: 'absolute',
              top: '80px',
              right: '20px',
              background: 'white',
              padding: '20px',
              borderRadius: '8px',
              boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)',
              zIndex: 900,
              width: '300px',
              maxHeight: '80vh',
              overflowY: 'auto',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '15px',
              }}
            >
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 'bold' }}>
                Busker Info
              </h3>
              <button
                onClick={() => setSelectedMarker(null)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '20px',
                  cursor: 'pointer',
                  padding: '0',
                }}
              >
                ✕
              </button>
            </div>

            <div
              style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}
            >
              {selectedMarker.main_photo ? (
                <div
                  style={{
                    width: '100%',
                    height: '200px',
                    borderRadius: '8px',
                    overflow: 'hidden',
                    position: 'relative',
                  }}
                >
                  <Image
                    src={selectedMarker.main_photo}
                    alt={selectedMarker.user_name || 'Busker'}
                    fill
                    style={{
                      objectFit: 'cover',
                    }}
                  />
                </div>
              ) : (
                <div
                  style={{
                    width: '100%',
                    height: '200px',
                    borderRadius: '8px',
                    backgroundColor: '#f0f0f0',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}
                >
                  <span>No Photo Available</span>
                </div>
              )}

              <div>
                <h4 style={{ margin: '0 0 5px 0', fontWeight: 'bold' }}>
                  {selectedMarker.user_name || 'Unknown Busker'}
                </h4>
                <p style={{ margin: '0 0 10px 0', color: '#666' }}>
                  <strong>Genre:</strong>{' '}
                  {selectedMarker.genre || 'Not specified'}
                </p>
                <p style={{ margin: '0 0 10px 0' }}>
                  <strong>Performance:</strong> {selectedMarker.date},{' '}
                  {selectedMarker.startTime} - {selectedMarker.endTime}
                </p>
                <div>
                  <p style={{ margin: '0 0 5px 0', fontWeight: 'bold' }}>
                    About:
                  </p>
                  <p style={{ margin: '0', lineHeight: '1.5' }}>
                    {selectedMarker.description || 'No description available.'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </LoadScript>
    </div>
  );
}
