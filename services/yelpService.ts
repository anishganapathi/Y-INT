/**
 * Yelp AI API Service
 * Enriches restaurant data with AI insights
 */

import axios from 'axios';
import { ENV } from '@/config/env';
import { Location } from './googleMapsService';

export interface YelpRestaurantData {
  summary: string;
  review_highlights: string;
  popular_dishes: string[];
  menu_items: Array<{
    name: string;
    description: string;
    price: string;
  }>;
  dietary_labels: string[];
  photos: string[];
  categories: string[];
  yelp_rating: number;
  review_count: number;
}

export class YelpService {
  private apiKey: string;
  private baseUrl: string;

  constructor() {
    this.apiKey = ENV.YELP_API_KEY;
    this.baseUrl = ENV.YELP_API_BASE_URL;
  }

  /**
   * Get restaurant intelligence from Yelp
   */
  async getRestaurantIntelligence(
    restaurantName: string,
    location: Location
  ): Promise<YelpRestaurantData | null> {
    try {
      // Search for business
      const business = await this.searchBusiness(restaurantName, location);
      
      if (!business) {
        return null;
      }

      // Get business details
      const details = await this.getBusinessDetails(business.id);
      
      // Get reviews for AI insights
      const reviews = await this.getReviews(business.id);

      return {
        summary: this.generateSummary(details, reviews),
        review_highlights: this.extractReviewHighlights(reviews),
        popular_dishes: this.extractPopularDishes(reviews),
        menu_items: [], // Yelp doesn't always have structured menu data
        dietary_labels: this.extractDietaryLabels(details, reviews),
        photos: details.photos || [],
        categories: details.categories?.map((cat: any) => cat.title) || [],
        yelp_rating: details.rating || 0,
        review_count: details.review_count || 0,
      };
    } catch (error) {
      console.error('Yelp API Error:', error);
      return null;
    }
  }

  /**
   * Search for business by name and location
   */
  private async searchBusiness(name: string, location: Location): Promise<any> {
    try {
      const response = await axios.get(`${this.baseUrl}/businesses/search`, {
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
        },
        params: {
          term: name,
          latitude: location.lat,
          longitude: location.lng,
          limit: 1,
        },
      });

      return response.data.businesses?.[0] || null;
    } catch (error) {
      console.error('Yelp search error:', error);
      return null;
    }
  }

  /**
   * Get detailed business information
   */
  private async getBusinessDetails(businessId: string): Promise<any> {
    try {
      const response = await axios.get(`${this.baseUrl}/businesses/${businessId}`, {
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
        },
      });

      return response.data;
    } catch (error) {
      console.error('Yelp details error:', error);
      throw error;
    }
  }

  /**
   * Get business reviews
   */
  private async getReviews(businessId: string): Promise<any[]> {
    try {
      const response = await axios.get(`${this.baseUrl}/businesses/${businessId}/reviews`, {
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
        },
        params: {
          limit: 20,
        },
      });

      return response.data.reviews || [];
    } catch (error) {
      console.error('Yelp reviews error:', error);
      return [];
    }
  }

  /**
   * Generate AI summary
   */
  private generateSummary(details: any, reviews: any[]): string {
    const rating = details.rating || 0;
    const reviewCount = details.review_count || 0;
    const categories = details.categories?.map((cat: any) => cat.title).join(', ') || 'Restaurant';
    
    return `${details.name} is a ${categories} with ${rating} stars from ${reviewCount} reviews. ${
      reviews.length > 0 ? reviews[0].text.slice(0, 150) + '...' : ''
    }`;
  }

  /**
   * Extract review highlights using keyword analysis
   */
  private extractReviewHighlights(reviews: any[]): string {
    if (reviews.length === 0) return 'No reviews available';

    // Simple keyword extraction (can be enhanced with NLP)
    const positiveKeywords = ['amazing', 'excellent', 'delicious', 'great', 'best', 'loved', 'perfect'];
    const highlights: string[] = [];

    for (const review of reviews.slice(0, 5)) {
      const text = review.text.toLowerCase();
      if (positiveKeywords.some(keyword => text.includes(keyword))) {
        highlights.push(review.text.split('.')[0]);
      }
    }

    return highlights.slice(0, 3).join('. ') || reviews[0].text.slice(0, 200);
  }

  /**
   * Extract popular dishes from reviews
   */
  private extractPopularDishes(reviews: any[]): string[] {
    const dishes = new Set<string>();
    
    // Common food-related patterns
    const dishPatterns = [
      /the ([a-z\s]+(?:burger|pizza|pasta|salad|steak|chicken|fish|taco|burrito|sandwich))/gi,
      /([a-z\s]+(?:burger|pizza|pasta|salad|steak|chicken|fish|taco|burrito|sandwich)) (?:is|was|are)/gi,
    ];

    for (const review of reviews) {
      const text = review.text;
      
      for (const pattern of dishPatterns) {
        const matches = text.matchAll(pattern);
        for (const match of matches) {
          if (match[1]) {
            const dish = match[1].trim();
            if (dish.length > 3 && dish.length < 50) {
              dishes.add(dish);
            }
          }
        }
      }
    }

    return Array.from(dishes).slice(0, 5);
  }

  /**
   * Extract dietary labels
   */
  private extractDietaryLabels(details: any, reviews: any[]): string[] {
    const labels = new Set<string>();
    
    // Check categories
    const categories = details.categories?.map((cat: any) => cat.title.toLowerCase()) || [];
    
    if (categories.some((cat: string) => cat.includes('vegan'))) labels.add('Vegan');
    if (categories.some((cat: string) => cat.includes('vegetarian'))) labels.add('Vegetarian');
    if (categories.some((cat: string) => cat.includes('gluten-free'))) labels.add('Gluten-Free');
    
    // Check reviews for dietary mentions
    const reviewText = reviews.map(r => r.text.toLowerCase()).join(' ');
    
    if (reviewText.includes('vegan')) labels.add('Vegan Options');
    if (reviewText.includes('vegetarian')) labels.add('Vegetarian Options');
    if (reviewText.includes('gluten free') || reviewText.includes('gluten-free')) labels.add('Gluten-Free Options');
    if (reviewText.includes('halal')) labels.add('Halal');
    if (reviewText.includes('kosher')) labels.add('Kosher');

    return Array.from(labels);
  }
}

