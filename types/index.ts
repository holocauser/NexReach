export interface BusinessCard {
  id: string;
  name: string;
  title?: string;
  company?: string;
  email?: string;
  phone?: string;
  phones?: string[];
  address?: string;
  addresses?: string[];
  city?: string;
  state?: string;
  zip?: string;
  latitude?: number;
  longitude?: number;
  tags: string[];
  notes?: string;
  profileImage?: string;
  cardImage?: string;
  favorited?: boolean;
  files?: Array<{
    id: string;
    name: string;
    type: string;
    url: string;
    createdAt: string;
  }>;
  voiceNotes?: Array<{
    id: string;
    url: string;
    duration: number;
    createdAt: string;
  }>;
  createdAt: string;
  updatedAt: string;
  specialty?: string;
  languages?: string[];
  website?: string;
}

export interface VoiceNote {
  id: string;
  cardId: string;
  recording: string;
  duration: number;
  createdAt: Date;
  name?: string;
}

export interface Referral {
  id: string;
  referrerId: string;
  recipientId: string;
  date: Date;
  caseType: string;
  outcome: 'pending' | 'successful' | 'unsuccessful';
  value: number;
  notes?: string;
}

export interface Provider {
  id: string;
  name: string;
  company: string;
  specialty: string[];
  services: string[];
  languages: string[];
  address: string;
  phone: string;
  email: string;
  rating: number;
  distance?: number;
}

export interface User {
  id: string;
  email: string;
  name: string;
  profession: string;
  company?: string;
  favoriteIds: string[];
}

export interface Filter {
  specialty: string[];
  languages: string[];
  services: string[];
  location: string;
  radius: number;
}