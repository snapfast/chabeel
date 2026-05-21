import { ChabeelLocation } from '@/types';

export function calculateStatus(location: ChabeelLocation): 'active' | 'upcoming' | 'ended' {
  if (!location.startDate) return 'active'; // Default or fallback

  const now = new Date();
  // Using UTC to avoid timezone shifts as per memory instructions
  const start = new Date(location.startDate);
  const duration = location.durationDays || 1;

  // Calculate end date: startDate + durationDays
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + duration);

  if (now < start) {
    return 'upcoming';
  } else if (now >= start && now < end) {
    return 'active';
  } else {
    return 'ended';
  }
}
