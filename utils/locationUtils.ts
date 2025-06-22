import { BusinessCard } from '@/types';

// Cache for city coordinates to avoid repeated API calls
const cityCoordinatesCache: Record<string, { lat: number; lng: number }> = {};

// Get coordinates for any US city using OpenStreetMap Nominatim API
export const getCityCoordinates = async (city: string, state?: string): Promise<{ lat: number; lng: number } | null> => {
  // Check cache first
  const cacheKey = `${city},${state || ''}`.toLowerCase();
  if (cityCoordinatesCache[cacheKey]) {
    console.log(`Using cached coordinates for ${cacheKey}`);
    return cityCoordinatesCache[cacheKey];
  }

  try {
    // Format the query for US cities
    const query = state 
      ? `${city}, ${state}, USA`
      : `${city}, USA`;
    
    const encodedQuery = encodeURIComponent(query);
    const url = `https://nominatim.openstreetmap.org/search?q=${encodedQuery}&format=json&countrycodes=us&limit=1`;
    
    console.log(`Fetching coordinates for: ${query}`);
    
    const response = await fetch(url);
    const data = await response.json();
    
    if (data && data.length > 0) {
      const coords = {
        lat: parseFloat(data[0].lat),
        lng: parseFloat(data[0].lon)
      };
      
      // Cache the result
      cityCoordinatesCache[cacheKey] = coords;
      console.log(`Found coordinates for ${query}:`, coords);
      return coords;
    }
    
    console.log(`No coordinates found for ${query}`);
    return null;
  } catch (error) {
    console.error('Error fetching city coordinates:', error);
    return null;
  }
};

// Haversine formula to calculate distance between two points
export const calculateDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  const R = 3959; // Earth's radius in miles
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const toRad = (value: number): number => {
  return (value * Math.PI) / 180;
};

// Filter providers by location
export const filterByLocation = async (
  providers: BusinessCard[],
  city: string,
  state?: string,
  radiusMiles: number = 50
): Promise<BusinessCard[]> => {
  const cityCoords = await getCityCoordinates(city, state);
  if (!cityCoords) {
    console.log(`No coordinates found for ${city}, ${state || ''}, falling back to city name matching`);
    return providers.filter(provider => 
      provider.city?.toLowerCase() === city.toLowerCase() &&
      (!state || provider.state?.toLowerCase() === state.toLowerCase())
    );
  }

  console.log(`Filtering by location for ${city}, ${state || ''} with coordinates:`, cityCoords);

  return providers.filter(provider => {
    // If provider is missing city, state, or coordinates, INCLUDE them in the results
    if (!provider.city || !provider.state || provider.latitude == null || provider.longitude == null) {
      console.log(`Provider ${provider.name} is missing location info, including in results.`);
      return true;
    }

    const distance = calculateDistance(
      cityCoords.lat,
      cityCoords.lng,
      provider.latitude,
      provider.longitude
    );

    console.log(`Provider ${provider.name} distance: ${distance.toFixed(2)} miles`);
    return distance <= radiusMiles;
  });
};

// Filter providers by tags with improved matching
export const filterByTags = (
  providers: BusinessCard[],
  searchTag: string
): BusinessCard[] => {
  if (!searchTag) return providers;

  const searchTagLower = searchTag.toLowerCase();
  console.log('Searching for tag:', searchTagLower);

  // If searching for 'personal injury' or 'pi', show all providers
  if (["personal injury", "pi"].includes(searchTagLower)) {
    console.log('Search is for Personal Injury or PI, returning all providers');
    return providers;
  }

  return providers.filter(provider => {
    console.log(`Checking provider: ${provider.name}, specialty: ${provider.specialty}, tags: ${JSON.stringify(provider.tags)}`);
    // Match on tags
    const tagMatch = (provider.tags || []).some(tag => {
      const tagLower = tag.toLowerCase();
      const isMatch = tagLower.includes(searchTagLower) ||
        searchTagLower.includes(tagLower) ||
        (["personal injury", "pi"].includes(searchTagLower) && ["personal injury", "pi attorney", "pi"].includes(tagLower));
      if (isMatch) {
        console.log(`Match found: ${provider.name} with tag: ${tag}`);
      }
      return isMatch;
    });

    // ALSO match on specialty if tags are missing or empty
    const specialtyLower = provider.specialty ? provider.specialty.join(' ').toLowerCase() : '';
    const specialtyMatch =
      (!provider.tags || provider.tags.length === 0) &&
      (specialtyLower.includes(searchTagLower) ||
        (["personal injury", "pi"].includes(searchTagLower) && ["personal injury", "pi"].some(s => specialtyLower.includes(s))));

    if (tagMatch || specialtyMatch) {
      console.log(`Provider ${provider.name} included in results.`);
    } else {
      console.log(`Provider ${provider.name} NOT included in results.`);
    }

    return tagMatch || specialtyMatch;
  });
};

// Combined filter function with logging
export const filterProviders = async (
  providers: BusinessCard[],
  city: string,
  state: string | undefined,
  searchTag: string,
  radiusMiles: number = 50
): Promise<BusinessCard[]> => {
  console.log(`Total providers before filtering: ${providers.length}`);

  // If a tag is selected, first filter by tag
  let tagFiltered = providers;
  if (searchTag) {
    tagFiltered = filterByTags(providers, searchTag);
    console.log(`Providers matched by tag: ${tagFiltered.length}`);
  }

  // Then filter by location (city match or within radius)
  const locationFiltered = await filterByLocation(tagFiltered, city, state, radiusMiles);
  console.log(`Providers matched by tag and location: ${locationFiltered.length}`);
  console.log('Matched providers:', locationFiltered.map(p => p.name));
  return locationFiltered;
}; 