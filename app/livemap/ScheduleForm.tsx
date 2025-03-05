import toast from 'react-hot-toast';
import { getCurrentMelbourneTime } from '@/utils/dateUtils';

interface ScheduleFormProps {
  startTime: string;
  setStartTime: (value: string) => void;
  endTime: string;
  setEndTime: (value: string) => void;
  handleSubmit: () => Promise<void>;
  onClose: () => void;
}

export default function ScheduleForm({
  startTime,
  setStartTime,
  endTime,
  setEndTime,
  handleSubmit,
  onClose,
}: ScheduleFormProps) {
  return (
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
          onClick={onClose}
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
      <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
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
            <div style={{ position: 'relative', display: 'inline-block' }}>
              <input
                type="time"
                value={startTime}
                onChange={(e) => {
                  const newStartTime: string = e.target.value;

                  // Get current time in Melbourne
                  const currentTime: Date = getCurrentMelbourneTime();

                  // Calculate one hour after current time
                  const oneHourAfter: Date = new Date(currentTime);
                  oneHourAfter.setHours(currentTime.getHours() + 1);

                  // Convert input time to Date object for comparison
                  const selectedTime: Date = new Date(currentTime);
                  const [hours, minutes]: number[] = newStartTime
                    .split(':')
                    .map(Number);
                  selectedTime.setHours(hours, minutes, 0, 0);

                  // Validate if time is within allowed range
                  if (
                    selectedTime < currentTime ||
                    selectedTime > oneHourAfter
                  ) {
                    toast.error(
                      'Start time must be between now and 1 hour from now'
                    );
                    return;
                  }

                  setStartTime(newStartTime);

                  // Clear end time if it's before new start time
                  if (endTime) {
                    const endTimeDate: Date = new Date(currentTime);
                    const [endHours, endMinutes]: number[] = endTime
                      .split(':')
                      .map(Number);
                    endTimeDate.setHours(endHours, endMinutes, 0, 0);

                    if (endTimeDate < selectedTime) {
                      setEndTime('');
                    }
                  }
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
            <span style={{ flexGrow: 1 }}>{endTime || ''}</span>
            <div style={{ position: 'relative', display: 'inline-block' }}>
              <input
                type="time"
                value={endTime}
                onChange={(e) => {
                  const newEndTime: string = e.target.value;

                  if (!startTime) {
                    toast.error('Please set a start time first');
                    return;
                  }

                  // Get current time in Melbourne
                  const currentTime: Date = getCurrentMelbourneTime();

                  // Convert start time to Date object
                  const startTimeDate: Date = new Date(currentTime);
                  const [startHours, startMinutes]: number[] = startTime
                    .split(':')
                    .map(Number);
                  startTimeDate.setHours(startHours, startMinutes, 0, 0);

                  // Convert end time to Date object
                  const endTimeDate: Date = new Date(currentTime);
                  const [endHours, endMinutes]: number[] = newEndTime
                    .split(':')
                    .map(Number);
                  endTimeDate.setHours(endHours, endMinutes, 0, 0);

                  // If end time is earlier in the day than start time, assume it's the next day
                  if (endTimeDate < startTimeDate) {
                    endTimeDate.setDate(endTimeDate.getDate() + 1);
                  }

                  // Calculate the difference in hours
                  const hoursBetween: number =
                    (endTimeDate.getTime() - startTimeDate.getTime()) /
                    (1000 * 60 * 60);

                  if (hoursBetween > 3) {
                    toast.error(
                      'End time cannot be more than 3 hours after start time'
                    );
                    return;
                  }

                  if (endTimeDate <= startTimeDate) {
                    toast.error('End time must be after start time');
                    return;
                  }

                  setEndTime(newEndTime);
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
  );
}
