export interface ChabeelLocation {
  id: string;
  name: string;
  description?: string;
  lat: number;
  lng: number;
  createdAt: string;
}

export interface CreateChabeelInput {
  name: string;
  description?: string;
  lat: number;
  lng: number;
}
