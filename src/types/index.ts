export interface ChabeelLocation {
  id: string;
  name: string;
  description?: string;
  lat: number;
  lng: number;
  createdAt: string;
  status?: 'active' | 'upcoming' | 'ended';
  distance?: string;
}

export interface CreateChabeelInput {
  name: string;
  description?: string;
  lat: number;
  lng: number;
}
