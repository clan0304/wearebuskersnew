import Image from 'next/image';
import { BuskingLocation } from '@/types/supabase';

interface BuskerInfoCardProps {
  marker: BuskingLocation;
  isOwner: boolean;
  isEditing: boolean;
  setIsEditing: (value: boolean) => void;
  editStartTime: string;
  setEditStartTime: (value: string) => void;
  editEndTime: string;
  setEditEndTime: (value: string) => void;
  handleEdit: () => Promise<void>;
  handleDelete: () => Promise<void>;
  onClose: () => void;
}

export default function BuskerInfoCard({
  marker,
  isOwner,
  isEditing,
  setIsEditing,
  editStartTime,
  setEditStartTime,
  editEndTime,
  setEditEndTime,
  handleEdit,
  handleDelete,
  onClose,
}: BuskerInfoCardProps) {
  return (
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
          onClick={onClose}
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

      <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        {marker.main_photo ? (
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
              src={marker.main_photo}
              alt={marker.user_name || 'Busker'}
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
            {marker.user_name || 'Unknown Busker'}
          </h4>
          <p style={{ margin: '0 0 10px 0', color: '#666' }}>
            <strong>Genre:</strong> {marker.genre || 'Not specified'}
          </p>
          <p style={{ margin: '0 0 10px 0' }}>
            <strong>Performance:</strong> {marker.date}, {marker.startTime} -{' '}
            {marker.endTime}
          </p>
          <div>
            <p style={{ margin: '0 0 5px 0', fontWeight: 'bold' }}>About:</p>
            <p style={{ margin: '0', lineHeight: '1.5' }}>
              {marker.description || 'No description available.'}
            </p>
          </div>
        </div>

        {/* Edit and Delete buttons - only shown to owner */}
        {isOwner && (
          <div style={{ marginTop: '15px' }}>
            {isEditing ? (
              <div style={{ marginTop: '15px' }}>
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '15px',
                    marginBottom: '15px',
                    padding: '10px',
                    backgroundColor: '#f9f9f9',
                    borderRadius: '8px',
                  }}
                >
                  <h4 style={{ margin: '0', fontSize: '16px' }}>
                    Edit Schedule
                  </h4>
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
                      <span style={{ flexGrow: 1 }}>{editStartTime || ''}</span>
                      <div
                        style={{
                          position: 'relative',
                          display: 'inline-block',
                        }}
                      >
                        <input
                          type="time"
                          value={editStartTime}
                          onChange={(e) => {
                            setEditStartTime(e.target.value);
                          }}
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
                      <span style={{ flexGrow: 1 }}>{editEndTime || ''}</span>
                      <div
                        style={{
                          position: 'relative',
                          display: 'inline-block',
                        }}
                      >
                        <input
                          type="time"
                          value={editEndTime}
                          onChange={(e) => {
                            setEditEndTime(e.target.value);
                          }}
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
                      gap: '10px',
                      marginTop: '10px',
                    }}
                  >
                    <button
                      onClick={() => setIsEditing(false)}
                      style={{
                        flex: '1',
                        padding: '8px',
                        background: '#f0f0f0',
                        color: '#333',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleEdit}
                      style={{
                        flex: '1',
                        padding: '8px',
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
              </div>
            ) : (
              <div
                style={{
                  display: 'flex',
                  gap: '10px',
                }}
              >
                <button
                  onClick={() => setIsEditing(true)}
                  style={{
                    flex: '1',
                    padding: '10px',
                    background: '#4299E1',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontWeight: 'bold',
                  }}
                >
                  Edit
                </button>
                <button
                  onClick={handleDelete}
                  style={{
                    flex: '1',
                    padding: '10px',
                    background: '#F56565',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontWeight: 'bold',
                  }}
                >
                  Delete
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
