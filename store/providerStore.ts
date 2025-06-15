import { create } from 'zustand';
import { Provider, Filter } from '@/types';
import { mockProviders } from '@/data/mockData';

interface ProviderState {
  providers: Provider[];
  filteredProviders: Provider[];
  filter: Filter;
  loading: boolean;
  updateFilter: (filter: Partial<Filter>) => void;
  resetFilter: () => void;
  searchProviders: () => void;
}

const defaultFilter: Filter = {
  specialty: [],
  languages: [],
  services: [],
  location: '',
  radius: 25,
};

export const useProviderStore = create<ProviderState>((set, get) => ({
  providers: mockProviders,
  filteredProviders: mockProviders,
  filter: defaultFilter,
  loading: false,
  
  updateFilter: (partialFilter) => set((state) => ({
    filter: { ...state.filter, ...partialFilter }
  })),
  
  resetFilter: () => set({
    filter: defaultFilter,
    filteredProviders: get().providers
  }),
  
  searchProviders: () => {
    set({ loading: true });
    
    const { filter, providers } = get();
    
    // Simulate API call with timeout
    setTimeout(() => {
      const filtered = providers.filter(provider => {
        // Filter by specialty
        if ((filter.specialty || []).length > 0 && 
            !provider.specialty.some(s => filter.specialty.includes(s))) {
          return false;
        }
        
        // Filter by languages
        if ((filter.languages || []).length > 0 && 
            !provider.languages.some(l => filter.languages.includes(l))) {
          return false;
        }
        
        // Filter by services
        if ((filter.services || []).length > 0 && 
            !provider.services.some(s => filter.services.includes(s))) {
          return false;
        }
        
        // Filter by location (just a simple check for demo purposes)
        if (filter.location && !provider.address.toLowerCase().includes(filter.location.toLowerCase())) {
          return false;
        }
        
        return true;
      });
      
      set({ 
        filteredProviders: filtered,
        loading: false 
      });
    }, 1000);
  }
}));