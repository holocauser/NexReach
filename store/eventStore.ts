import { create } from 'zustand';
import { format } from 'date-fns';

export interface Event {
  id: string;
  title: string;
  description: string;
  date: Date;
  time: string;
  location: string;
  organizer: string;
  organizerAvatar?: string;
  image?: string;
  attendees: number;
  maxAttendees?: number;
  isRSVPed: boolean;
  likes: number;
  isLiked: boolean;
  comments: Comment[];
  tags: string[];
  price: number | null; // null means free
  ticketStatus?: 'none' | 'reserved' | 'purchased';
}

export interface Comment {
  id: string;
  author: string;
  authorAvatar?: string;
  text: string;
  timestamp: Date;
  userId: string;
}

interface EventStore {
  events: Event[];
  addEvent: (event: Omit<Event, 'id' | 'attendees' | 'isRSVPed' | 'likes' | 'isLiked' | 'comments' | 'ticketStatus'>) => void;
  updateEvent: (id: string, event: Partial<Event>) => void;
  deleteEvent: (id: string) => void;
  toggleRSVP: (id: string) => void;
  toggleLike: (id: string) => void;
  addComment: (eventId: string, comment: Omit<Comment, 'id' | 'timestamp'>) => void;
}

export const useEventStore = create<EventStore>((set) => ({
  events: [],
  addEvent: (eventData) => set((state) => ({
    events: [
      {
        ...eventData,
        id: Math.random().toString(36).substring(2, 11),
        attendees: 0,
        isRSVPed: false,
        likes: 0,
        isLiked: false,
        comments: [],
        ticketStatus: 'none',
      },
      ...state.events,
    ],
  })),
  updateEvent: (id, eventData) => set((state) => ({
    events: state.events.map((event) =>
      event.id === id ? { ...event, ...eventData } : event
    ),
  })),
  deleteEvent: (id) => set((state) => ({
    events: state.events.filter((event) => event.id !== id),
  })),
  toggleRSVP: (id) => set((state) => ({
    events: state.events.map((event) =>
      event.id === id
        ? {
            ...event,
            isRSVPed: !event.isRSVPed,
            attendees: event.isRSVPed ? event.attendees - 1 : event.attendees + 1,
          }
        : event
    ),
  })),
  toggleLike: (id) => set((state) => ({
    events: state.events.map((event) =>
      event.id === id
        ? {
            ...event,
            isLiked: !event.isLiked,
            likes: event.isLiked ? event.likes - 1 : event.likes + 1,
          }
        : event
    ),
  })),
  addComment: (eventId, commentData) => set((state) => ({
    events: state.events.map((event) =>
      event.id === eventId
        ? {
            ...event,
            comments: [
              {
                ...commentData,
                id: Math.random().toString(36).substring(2, 11),
                timestamp: new Date(),
              },
              ...event.comments,
            ],
          }
        : event
    ),
  })),
})); 