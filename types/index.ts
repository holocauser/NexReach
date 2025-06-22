export interface BusinessCard {
  id: string;
  name: string;
  title: string;
  company: string;
  email?: string;
  phone?: string;
  phones?: { label: string; number: string }[];
  address?: string;
  addresses?: { label:string; address: string; }[];
  city?: string;
  state?: string;
  zip?: string;
  website?: string;
  notes?: string;
  tags: string[];
  specialty?: string[];
  languages?: string[];
  favorited: boolean;
  lastContacted?: string;
  reminder?: boolean;
  latitude?: number;
  longitude?: number;
  profileImage?: string;
  cardImage?: string;
  createdAt: string;
  updatedAt: string;
  userId?: string;
  files?: any[];
  voiceNotes?: any[];
  mockReferrals?: Omit<Referral, 'id'>[];
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
  files?: { id: string; url: string; }[];
  direction?: 'sent' | 'received';
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