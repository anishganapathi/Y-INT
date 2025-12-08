/**
 * Supabase Service
 * Handles user personalization data
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { ENV } from '@/config/env';

export interface UserPreferences {
  user_id: string;
  favorites: string[]; // Array of place_ids
  dietary_preferences: string[]; // e.g., ['vegan', 'gluten-free']
  past_visits: Array<{
    place_id: string;
    name: string;
    visited_at: string;
  }>;
  liked_cuisines: string[]; // e.g., ['Italian', 'Japanese']
}

export interface PersonalizationResult {
  is_favorite: boolean;
  cuisine_match_score: number;
  user_diet_match: string;
  personalized_recommendations: string[];
}

export class SupabaseService {
  private client: SupabaseClient;

  constructor() {
    this.client = createClient(ENV.SUPABASE_URL, ENV.SUPABASE_ANON_KEY);
  }

  /**
   * Get user preferences
   */
  async getUserPreferences(userId: string): Promise<UserPreferences | null> {
    try {
      const { data, error } = await this.client
        .from('user_preferences')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) {
        console.error('Supabase error:', error);
        return null;
      }

      return data as UserPreferences;
    } catch (error) {
      console.error('Failed to fetch user preferences:', error);
      return null;
    }
  }

  /**
   * Add to favorites
   */
  async addToFavorites(userId: string, placeId: string): Promise<boolean> {
    try {
      const preferences = await this.getUserPreferences(userId);
      
      if (!preferences) return false;

      const favorites = [...new Set([...preferences.favorites, placeId])];

      const { error } = await this.client
        .from('user_preferences')
        .update({ favorites })
        .eq('user_id', userId);

      return !error;
    } catch (error) {
      console.error('Failed to add favorite:', error);
      return false;
    }
  }

  /**
   * Log restaurant visit
   */
  async logVisit(userId: string, placeId: string, name: string): Promise<boolean> {
    try {
      const preferences = await this.getUserPreferences(userId);
      
      if (!preferences) return false;

      const visit = {
        place_id: placeId,
        name,
        visited_at: new Date().toISOString(),
      };

      const pastVisits = [...preferences.past_visits, visit];

      const { error } = await this.client
        .from('user_preferences')
        .update({ past_visits: pastVisits })
        .eq('user_id', userId);

      return !error;
    } catch (error) {
      console.error('Failed to log visit:', error);
      return false;
    }
  }

  /**
   * Calculate personalization based on user preferences
   */
  calculatePersonalization(
    userPreferences: UserPreferences | null,
    restaurantData: {
      place_id: string;
      categories: string[];
      dietary_labels: string[];
      popular_dishes: string[];
    }
  ): PersonalizationResult {
    if (!userPreferences) {
      return {
        is_favorite: false,
        cuisine_match_score: 0,
        user_diet_match: '',
        personalized_recommendations: [],
      };
    }

    // Check if favorite
    const is_favorite = userPreferences.favorites.includes(restaurantData.place_id);

    // Calculate cuisine match score
    const cuisineMatches = restaurantData.categories.filter(category =>
      userPreferences.liked_cuisines.some(liked => 
        category.toLowerCase().includes(liked.toLowerCase())
      )
    );
    const cuisine_match_score = cuisineMatches.length > 0 
      ? Math.min(cuisineMatches.length * 0.33, 1) 
      : 0;

    // Check dietary match
    const dietMatches = restaurantData.dietary_labels.filter(label =>
      userPreferences.dietary_preferences.some(pref =>
        label.toLowerCase().includes(pref.toLowerCase())
      )
    );
    const user_diet_match = dietMatches.length > 0 
      ? `Matches your ${dietMatches.join(', ')} preferences` 
      : '';

    // Generate personalized recommendations
    const personalized_recommendations: string[] = [];
    
    if (is_favorite) {
      personalized_recommendations.push('⭐ One of your favorites!');
    }
    
    if (cuisineMatches.length > 0) {
      personalized_recommendations.push(`You love ${cuisineMatches.join(', ')} cuisine`);
    }
    
    if (dietMatches.length > 0) {
      personalized_recommendations.push(`Has ${dietMatches.join(', ')} options for you`);
    }

    // Check if visited before
    const previousVisit = userPreferences.past_visits.find(
      visit => visit.place_id === restaurantData.place_id
    );
    if (previousVisit) {
      personalized_recommendations.push(`You visited on ${new Date(previousVisit.visited_at).toLocaleDateString()}`);
    }

    // Recommend dishes based on preferences
    if (restaurantData.popular_dishes.length > 0) {
      personalized_recommendations.push(`Try their ${restaurantData.popular_dishes[0]}`);
    }

    return {
      is_favorite,
      cuisine_match_score,
      user_diet_match,
      personalized_recommendations,
    };
  }
}

