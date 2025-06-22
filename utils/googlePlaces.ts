import axios from "axios";

const GOOGLE_API_KEY = "AIzaSyAnq_9RS1M8XG2dnihSttcw4EljE9HaoLM";

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function searchProviders(specialty: string, city: string) {
  const query = `${specialty} in ${city}`;
  let url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(
    query
  )}&key=${GOOGLE_API_KEY}`;

  let allResults: any[] = [];
  let nextPageToken: string | undefined = undefined;
  let first = true;

  do {
    if (!first && nextPageToken) {
      // Google requires a short delay before using next_page_token
      await sleep(2000);
      url = `https://maps.googleapis.com/maps/api/place/textsearch/json?pagetoken=${nextPageToken}&key=${GOOGLE_API_KEY}`;
    }
    first = false;
    try {
      const res = await axios.get(url);
      allResults = allResults.concat(res.data.results || []);
      nextPageToken = res.data.next_page_token;
    } catch (error) {
      console.error("Google Places error:", error);
      break;
    }
  } while (nextPageToken);

  return allResults.map((place: any) => ({
    name: place.name,
    address: place.formatted_address,
    rating: place.rating,
    location: place.geometry && place.geometry.location ? place.geometry.location : null,
    place_id: place.place_id,
    types: place.types,
  }));
} 