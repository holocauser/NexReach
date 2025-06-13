export interface BusinessCard {
  id: string;
  name: string;
  company: string;
  title: string;
  phone: string;
  email: string;
  address: string;
  website?: string;
  specialty: string[];
  languages: string[];
  tags: string[];
  notes?: string;
  image?: string;
  profileImage?: string; // New field for profile pictures
  cardImage?: string; // New field for business card photos
  lastContacted?: Date;
  reminder?: boolean;
  favorited: boolean;
  voiceNotes?: VoiceNote[];
  createdAt: Date;
  updatedAt: Date;
  files?: { name: string; url: string }[];
}

export interface VoiceNote {
  id: string;
  cardId: string;
  recording: string;
  duration: number;
  createdAt: Date;
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