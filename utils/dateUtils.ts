export const getCurrentMelbourneTime = (): Date => {
  return new Date(
    new Date().toLocaleString('en-US', { timeZone: 'Australia/Melbourne' })
  );
};

export const formatDate = (date: Date): string => {
  return (
    date.getFullYear() +
    '-' +
    String(date.getMonth() + 1).padStart(2, '0') +
    '-' +
    String(date.getDate()).padStart(2, '0')
  );
};

export const formatTimeForInput = (date: Date): string => {
  return date.toTimeString().substring(0, 5);
};
