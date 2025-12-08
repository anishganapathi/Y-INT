/**
 * Shared TypeScript types for API responses
 */

export interface Location {
  lat: number;
  lng: number;
}

export interface RestaurantData {
  name: string;
  address: string;
  rating: number;
  price_level: number;
  categories: string[];
  photos: string[];
  place_id: string;
}

export interface UserData {
  user_id: string;
  favorites: string[];
  dietary_preferences: string[];
  past_visits: Array<{
    place_id: string;
    name: string;
    visited_at: string;
  }>;
  liked_cuisines: string[];
}

