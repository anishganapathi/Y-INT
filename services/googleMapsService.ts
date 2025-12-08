/**
 * Google Maps Places API Service
 * Identifies restaurants using OCR text and GPS coordinates
 */

import axios from 'axios';
import { ENV } from '@/config/env';

export interface Location {
  lat: number;
  lng: number;
}

export interface GooglePlaceResult {
  name: string;
  address: string;
  rating: number;
  price_level: number;
  opening_hours: string;
  contact: string;
  images: string[];
  place_id: string;
  geometry: {
    location: Location;
  };
}

export class GoogleMapsService {
  private apiKey: string;

  constructor() {
    this.apiKey = ENV.GOOGLE_MAPS_API_KEY;
  }

  /**
   * Find restaurant using OCR text and GPS coordinates
   * Improved: Searches for best match by distance + name similarity
   */
  async findRestaurant(
    restaurantCandidates: string[],
    location: Location
  ): Promise<GooglePlaceResult | null> {
    try {
      console.log('🔍 Searching for:', restaurantCandidates);
      console.log('📍 At location:', location);

      // Strategy 1: Try exact name match within close proximity (more candidates)
      for (const candidate of restaurantCandidates.slice(0, 5)) {
        if (candidate.length < 3) continue;
        
        console.log(`  Trying: "${candidate}"`);
        const result = await this.searchByTextWithValidation(candidate, location);
        if (result) {
          console.log(`  ✅ Found match: ${result.name} at ${result.address}`);
          return result;
        }
        console.log(`  ❌ No match for: "${candidate}"`);
      }

      // Strategy 2: Search very nearby restaurants and match by name
      console.log('  📍 Searching closest restaurants...');
      const nearbyResult = await this.searchNearestWithNameMatch(restaurantCandidates, location);
      if (nearbyResult) {
        console.log(`  ✅ Found nearby: ${nearbyResult.name}`);
        return nearbyResult;
      }

      console.log('  ⚠️ No confident match found');
      return null;
    } catch (error) {
      console.error('Google Maps Search Error:', error);
      return null;
    }
  }

  /**
   * Search by text with validation that it's actually close by
   */
  private async searchByTextWithValidation(
    query: string, 
    location: Location
  ): Promise<GooglePlaceResult | null> {
    try {
      const response = await axios.get(
        'https://maps.googleapis.com/maps/api/place/textsearch/json',
        {
          params: {
            query: `${query}`,
            location: `${location.lat},${location.lng}`,
            radius: 100, // Reduced to 100 meters for more precision
            type: 'restaurant',
            key: this.apiKey,
          },
        }
      );

      if (response.data.results && response.data.results.length > 0) {
        // Get the closest result
        const closestPlace = this.findClosestPlace(response.data.results, location);
        
        if (closestPlace) {
          // Check if it's actually close (within 200m)
          const distance = this.calculateDistance(
            location,
            closestPlace.geometry.location
          );
          
          console.log(`    Closest result: "${closestPlace.name}" at ${distance.toFixed(0)}m`);
          
          if (distance <= 150) { // Reduced to 150 meters for better precision
            return await this.getPlaceDetails(closestPlace.place_id);
          } else {
            console.log(`    ❌ Too far (${distance.toFixed(0)}m > 150m)`);
          }
        }
      }

      return null;
    } catch (error) {
      console.error('Text search error:', error);
      return null;
    }
  }

  /**
   * Search nearest restaurants and match by name similarity
   */
  private async searchNearestWithNameMatch(
    restaurantCandidates: string[],
    location: Location
  ): Promise<GooglePlaceResult | null> {
    try {
      const response = await axios.get(
        'https://maps.googleapis.com/maps/api/place/nearbysearch/json',
        {
          params: {
            location: `${location.lat},${location.lng}`,
            rankby: 'distance', // Sort by distance instead of radius
            type: 'restaurant',
            key: this.apiKey,
          },
        }
      );

      if (response.data.results && response.data.results.length > 0) {
        // Get top 5 closest restaurants
        const nearbyPlaces = response.data.results.slice(0, 5);
        
        // Find best match by name similarity
        let bestMatch = null;
        let bestScore = 0;
        
        for (const place of nearbyPlaces) {
          // Calculate distance
          const distance = this.calculateDistance(location, place.geometry.location);
          
          // Skip if too far (>150m)
          if (distance > 150) continue;
          
          // Calculate name similarity score
          const nameScore = this.calculateNameSimilarity(
            place.name,
            restaurantCandidates
          );
          
          // Combined score: name similarity (80%) + distance proximity (20%)
          // Increased name weight for better accuracy
          const distanceScore = Math.max(0, 1 - (distance / 150));
          const combinedScore = (nameScore * 0.8) + (distanceScore * 0.2);
          
          console.log(`    ${place.name}: score=${combinedScore.toFixed(2)} (name=${nameScore.toFixed(2)}, dist=${distance.toFixed(0)}m)`);
          
          if (combinedScore > bestScore) {
            bestScore = combinedScore;
            bestMatch = place;
          }
        }
        
        // Only return if we have a good match (score > 0.4)
        // Increased threshold for better accuracy
        if (bestMatch && bestScore > 0.4) {
          console.log(`  ✅ Best match: "${bestMatch.name}" (score: ${bestScore.toFixed(2)})`);
          return await this.getPlaceDetails(bestMatch.place_id);
        } else if (bestMatch) {
          console.log(`  ⚠️ Match too weak: "${bestMatch.name}" (score: ${bestScore.toFixed(2)} < 0.4)`);
        }
      }

      return null;
    } catch (error) {
      console.error('Nearby search error:', error);
      return null;
    }
  }
  
  /**
   * Calculate distance between two coordinates (Haversine formula)
   */
  private calculateDistance(point1: Location, point2: Location): number {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = (point1.lat * Math.PI) / 180;
    const φ2 = (point2.lat * Math.PI) / 180;
    const Δφ = ((point2.lat - point1.lat) * Math.PI) / 180;
    const Δλ = ((point2.lng - point1.lng) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distance in meters
  }
  
  /**
   * Find the closest place from a list
   */
  private findClosestPlace(places: any[], location: Location): any {
    let closest = null;
    let minDistance = Infinity;
    
    for (const place of places) {
      const distance = this.calculateDistance(location, place.geometry.location);
      if (distance < minDistance) {
        minDistance = distance;
        closest = place;
      }
    }
    
    return closest;
  }
  
  /**
   * Calculate name similarity score (simple string matching)
   */
  private calculateNameSimilarity(placeName: string, candidates: string[]): number {
    const placeNameLower = placeName.toLowerCase();
    let maxScore = 0;
    
    for (const candidate of candidates) {
      const candidateLower = candidate.toLowerCase();
      
      // Exact match
      if (placeNameLower === candidateLower) return 1.0;
      
      // Contains match
      if (placeNameLower.includes(candidateLower)) {
        maxScore = Math.max(maxScore, 0.8);
      } else if (candidateLower.includes(placeNameLower)) {
        maxScore = Math.max(maxScore, 0.7);
      }
      
      // Word overlap
      const placeWords = new Set(placeNameLower.split(/\s+/));
      const candidateWords = new Set(candidateLower.split(/\s+/));
      const intersection = new Set([...placeWords].filter(x => candidateWords.has(x)));
      
      if (intersection.size > 0) {
        const overlapScore = intersection.size / Math.max(placeWords.size, candidateWords.size);
        maxScore = Math.max(maxScore, overlapScore * 0.6);
      }
    }
    
    return maxScore;
  }

  /**
   * Get detailed place information
   */
  private async getPlaceDetails(placeId: string): Promise<GooglePlaceResult> {
    try {
      const response = await axios.get(
        'https://maps.googleapis.com/maps/api/place/details/json',
        {
          params: {
            place_id: placeId,
            fields: 'name,formatted_address,rating,price_level,opening_hours,formatted_phone_number,photos,geometry',
            key: this.apiKey,
          },
        }
      );

      const place = response.data.result;

      // Get photo URLs
      const images = place.photos
        ? place.photos.slice(0, 5).map((photo: any) => 
            `https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photoreference=${photo.photo_reference}&key=${this.apiKey}`
          )
        : [];

      return {
        name: place.name || '',
        address: place.formatted_address || '',
        rating: place.rating || 0,
        price_level: place.price_level || 0,
        opening_hours: place.opening_hours?.weekday_text?.join(', ') || 'Hours not available',
        contact: place.formatted_phone_number || '',
        images,
        place_id: placeId,
        geometry: place.geometry,
      };
    } catch (error) {
      console.error('Place details error:', error);
      throw error;
    }
  }
}

