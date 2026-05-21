export interface ChabeelLocation {
  id: string;
  name: string;
  description?: string;
  lat: number;
  lng: number;
  createdAt: string;
  updatedAt?: string;
  status?: 'active' | 'upcoming' | 'ended';
  distance?: string;
  locationName?: string;
  durationDays?: number;
  startDate?: string;
  operatingHours?: string;
  contactName?: string;
  contactPhone?: string;
  serviceType?: string;
  isVerified?: boolean;
  verificationCount?: number;
  source?: string;
}

export interface CreateChabeelInput {
  name: string;
  description?: string;
  lat: number;
  lng: number;
  locationName?: string;
  durationDays?: number;
  startDate?: string;
  operatingHours?: string;
  contactName?: string;
  contactPhone?: string;
  serviceType?: string;
  source?: string;
}
