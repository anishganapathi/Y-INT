/**
 * Yelp Itinerary Service
 * Searches restaurants for trip planning with advanced filters
 */

import axios from 'axios';
import { ENV } from '@/config/env';

export interface ItineraryRestaurant {
  id: string;
  name: string;
  address: string;
  location: {
    lat: number;
    lng: number;
  };
  rating: number;
  reviewCount: number;
  priceLevel: string; // $, $$, $$$, $$$$
  categories: string[];
  photos: string[];
  phone?: string;
  hours?: {
    open: Array<{
      day: number;
      start: string;
      end: string;
    }>;
  };
  yelpUrl?: string;
  isClosed?: boolean;
  dietaryOptions: string[];
  popularDishes: string[];
  reviewSummary: string;
  distance?: number; // in meters
}

export interface ItinerarySearchParams {
  destination: string; // City name
  dietaryRestrictions: string[]; // vegan, vegetarian, gluten_free, etc.
  cuisinePreferences: string[]; // italian, japanese, mexican, etc.
  budget: number; // Total trip budget
  days: number; // Number of days
  partySize: number;
}

export class YelpItineraryService {
  private apiKey: string;
  private baseUrl: string;

  constructor() {
    this.apiKey = ENV.YELP_API_KEY;
    this.baseUrl = ENV.YELP_API_BASE_URL;
  }

  /**
   * Search restaurants for itinerary planning
   * Returns 50-100 restaurants matching criteria
   */
  async searchRestaurantsForItinerary(
    params: ItinerarySearchParams
  ): Promise<ItineraryRestaurant[]> {
    try {
      console.log('🔍 Searching Yelp for itinerary restaurants...');
      console.log('   Destination:', params.destination);
      console.log('   Dietary:', params.dietaryRestrictions);
      console.log('   Cuisines:', params.cuisinePreferences);

      // Calculate price range based on budget per day
      const budgetPerDay = params.budget / params.days;
      const priceRange = this.calculatePriceRange(budgetPerDay, params.partySize);

      console.log('   Budget per day:', budgetPerDay);
      console.log('   Price range:', priceRange);

      const allRestaurants: ItineraryRestaurant[] = [];

      // Search by each cuisine preference
      if (params.cuisinePreferences.length > 0) {
        for (const cuisine of params.cuisinePreferences) {
          const restaurants = await this.searchByCuisine(
            params.destination,
            cuisine,
            priceRange,
            params.dietaryRestrictions,
            20 // Get 20 per cuisine
          );
          allRestaurants.push(...restaurants);
        }
      } else {
        // General search if no cuisine preferences
        const restaurants = await this.searchByCuisine(
          params.destination,
          'restaurants',
          priceRange,
          params.dietaryRestrictions,
          50
        );
        allRestaurants.push(...restaurants);
      }

      // Remove duplicates
      const uniqueRestaurants = this.removeDuplicates(allRestaurants);

      // Sort by rating and review count
      const sortedRestaurants = this.sortByQuality(uniqueRestaurants);

      console.log(`✅ Found ${sortedRestaurants.length} unique restaurants`);

      return sortedRestaurants.slice(0, 50); // Return top 50
    } catch (error) {
      console.error('❌ Yelp itinerary search error:', error);
      throw error;
    }
  }

  /**
   * Search restaurants by cuisine type
   */
  private async searchByCuisine(
    location: string,
    cuisine: string,
    priceRange: string,
    dietaryRestrictions: string[],
    limit: number = 20
  ): Promise<ItineraryRestaurant[]> {
    try {
      const response = await axios.get(`${this.baseUrl}/businesses/search`, {
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
        },
        params: {
          location,
          term: cuisine,
          categories: this.mapCuisineToCategory(cuisine),
          price: priceRange,
          limit: Math.min(limit, 50), // Yelp max is 50
          sort_by: 'rating',
          open_now: false,
        },
      });

      const businesses = response.data.businesses || [];
      
      console.log(`   Found ${businesses.length} ${cuisine} restaurants`);

      // Process each business
      const restaurants: ItineraryRestaurant[] = [];

      for (const business of businesses) {
        // Check dietary restrictions
        if (dietaryRestrictions.length > 0) {
          const matchesDietary = this.checkDietaryMatch(
            business,
            dietaryRestrictions
          );
          if (!matchesDietary) continue;
        }

        const restaurant = await this.processRestaurant(business);
        restaurants.push(restaurant);
      }

      return restaurants;
    } catch (error) {
      console.error(`Error searching ${cuisine}:`, error);
      return [];
    }
  }

  /**
   * Process raw Yelp business data into ItineraryRestaurant
   */
  private async processRestaurant(business: any): Promise<ItineraryRestaurant> {
    // Get reviews for popular dishes
    const reviews = await this.getReviews(business.id);
    const popularDishes = this.extractPopularDishes(reviews);
    const dietaryOptions = this.extractDietaryOptions(business, reviews);

    return {
      id: business.id,
      name: business.name,
      address: business.location?.address1 || business.location?.display_address?.join(', ') || 'Address unavailable',
      location: {
        lat: business.coordinates?.latitude || 0,
        lng: business.coordinates?.longitude || 0,
      },
      rating: business.rating || 0,
      reviewCount: business.review_count || 0,
      priceLevel: business.price || '$$',
      categories: business.categories?.map((cat: any) => cat.title) || [],
      photos: business.photos || (business.image_url ? [business.image_url] : []),
      phone: business.phone || business.display_phone,
      yelpUrl: business.url,
      isClosed: business.is_closed,
      dietaryOptions,
      popularDishes,
      reviewSummary: reviews[0]?.text?.slice(0, 150) + '...' || '',
      distance: business.distance,
    };
  }

  /**
   * Get reviews for a business
   */
  private async getReviews(businessId: string): Promise<any[]> {
    try {
      const response = await axios.get(
        `${this.baseUrl}/businesses/${businessId}/reviews`,
        {
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
          },
          params: {
            limit: 3, // Just need a few for dish extraction
          },
        }
      );

      return response.data.reviews || [];
    } catch (error) {
      return [];
    }
  }

  /**
   * Extract popular dishes from reviews
   */
  private extractPopularDishes(reviews: any[]): string[] {
    const dishes = new Set<string>();

    // Enhanced food pattern matching
    const dishPatterns = [
      /(?:the |their |order |try |recommend |love |best )([a-z\s]+(?:burger|pizza|pasta|salad|steak|chicken|fish|taco|burrito|sandwich|soup|curry|noodles|rice|sushi|roll))/gi,
      /([a-z\s]+(?:burger|pizza|pasta|salad|steak|chicken|fish|taco|burrito|sandwich|soup|curry|noodles|rice|sushi|roll)) (?:is|was|are|were) (?:amazing|delicious|great|excellent|perfect|incredible)/gi,
    ];

    for (const review of reviews) {
      const text = review.text;

      for (const pattern of dishPatterns) {
        const matches = text.matchAll(pattern);
        for (const match of matches) {
          if (match[1]) {
            const dish = match[1]
              .trim()
              .split(' ')
              .map(word => word.charAt(0).toUpperCase() + word.slice(1))
              .join(' ');
            
            if (dish.length > 3 && dish.length < 40) {
              dishes.add(dish);
            }
          }
        }
      }
    }

    return Array.from(dishes).slice(0, 3);
  }

  /**
   * Extract dietary options from business data and reviews
   */
  private extractDietaryOptions(business: any, reviews: any[]): string[] {
    const options = new Set<string>();

    // Check categories
    const categories = business.categories?.map((cat: any) => cat.title.toLowerCase()) || [];

    if (categories.some((cat: string) => cat.includes('vegan'))) options.add('Vegan');
    if (categories.some((cat: string) => cat.includes('vegetarian'))) options.add('Vegetarian');
    if (categories.some((cat: string) => cat.includes('gluten'))) options.add('Gluten-Free');
    if (categories.some((cat: string) => cat.includes('halal'))) options.add('Halal');
    if (categories.some((cat: string) => cat.includes('kosher'))) options.add('Kosher');

    // Check reviews
    const reviewText = reviews.map(r => r.text.toLowerCase()).join(' ');

    if (reviewText.includes('vegan option') || reviewText.includes('vegan menu')) {
      options.add('Vegan Options');
    }
    if (reviewText.includes('vegetarian option') || reviewText.includes('vegetarian menu')) {
      options.add('Vegetarian Options');
    }
    if (reviewText.includes('gluten free') || reviewText.includes('gluten-free')) {
      options.add('Gluten-Free Options');
    }

    return Array.from(options);
  }

  /**
   * Calculate price range based on budget
   */
  private calculatePriceRange(budgetPerDay: number, partySize: number): string {
    const budgetPerMeal = budgetPerDay / 3 / partySize; // Assume 3 meals

    if (budgetPerMeal < 15) return '1'; // $
    if (budgetPerMeal < 30) return '1,2'; // $, $$
    if (budgetPerMeal < 60) return '1,2,3'; // $, $$, $$$
    return '1,2,3,4'; // All price ranges
  }

  /**
   * Map cuisine preference to Yelp category
   */
  private mapCuisineToCategory(cuisine: string): string {
    const mapping: { [key: string]: string } = {
      italian: 'italian',
      japanese: 'japanese,sushi',
      mexican: 'mexican',
      indian: 'indian',
      chinese: 'chinese',
      american: 'american,newamerican',
      thai: 'thai',
      mediterranean: 'mediterranean',
      korean: 'korean',
      vietnamese: 'vietnamese',
      french: 'french',
      spanish: 'spanish',
    };

    return mapping[cuisine.toLowerCase()] || cuisine;
  }

  /**
   * Check if restaurant matches dietary restrictions
   */
  private checkDietaryMatch(business: any, restrictions: string[]): boolean {
    const categories = business.categories?.map((cat: any) => cat.title.toLowerCase()) || [];
    const categoryText = categories.join(' ');

    for (const restriction of restrictions) {
      const restrictionLower = restriction.toLowerCase().replace('_', ' ');
      
      // Must have at least one match
      if (
        categoryText.includes(restrictionLower) ||
        categoryText.includes(restriction.replace('_', '-'))
      ) {
        return true;
      }
    }

    // If no specific dietary category found, allow all restaurants
    // (they might have options even if not specialized)
    return restrictions.length === 0;
  }

  /**
   * Remove duplicate restaurants by ID
   */
  private removeDuplicates(restaurants: ItineraryRestaurant[]): ItineraryRestaurant[] {
    const seen = new Set<string>();
    const unique: ItineraryRestaurant[] = [];

    for (const restaurant of restaurants) {
      if (!seen.has(restaurant.id)) {
        seen.add(restaurant.id);
        unique.push(restaurant);
      }
    }

    return unique;
  }

  /**
   * Sort restaurants by quality (rating + review count)
   */
  private sortByQuality(restaurants: ItineraryRestaurant[]): ItineraryRestaurant[] {
    return restaurants.sort((a, b) => {
      // Calculate quality score: 70% rating, 30% review count (normalized)
      const scoreA = a.rating * 0.7 + Math.min(a.reviewCount / 1000, 1) * 0.3 * 5;
      const scoreB = b.rating * 0.7 + Math.min(b.reviewCount / 1000, 1) * 0.3 * 5;
      return scoreB - scoreA;
    });
  }

  /**
   * Get restaurant details by ID (for later use)
   */
  async getRestaurantDetails(restaurantId: string): Promise<any> {
    try {
      const response = await axios.get(`${this.baseUrl}/businesses/${restaurantId}`, {
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
        },
      });

      return response.data;
    } catch (error) {
      console.error('Error fetching restaurant details:', error);
      return null;
    }
  }
}

// Singleton instance
export const yelpItineraryService = new YelpItineraryService();

