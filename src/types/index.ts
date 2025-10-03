export interface Snake {
  id: string;
  name: string;
  species: string;
  morph?: string;
  sex: 'Male' | 'Female' | 'Unknown';
  birthDate: string;
  weight: number; // in grams
  length: number; // in centimeters
  imageUrl?: string;
  notes?: string;
  userId: string;
}

export interface Event {
  id: string;
  snakeId: string;
  type: 'feeding' | 'shed' | 'vet_visit' | 'handling' | 'other';
  date: string;
  notes?: string;
  weight?: number; // weight at time of event
  photos?: string[]; // array of photo URLs
  userId: string;
}

export interface User {
  id: string;
  email: string;
  createdAt: string;
  trialStartDate?: string;
  subscriptionStatus?: 'trial' | 'active' | 'expired';
}