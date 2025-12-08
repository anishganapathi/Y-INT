/**
 * Camera Recognition Engine
 * Orchestrates OCR → Google Maps → Yelp AI → Supabase pipeline
 */

import { GoogleVisionService } from './googleVisionService';
import { GoogleMapsService, Location } from './googleMapsService';
import { YelpService } from './yelpService';
import { SupabaseService, UserPreferences } from './supabaseService';

export interface RecognitionInput {
  frame_id: string;
  camera_image_base64: string;
  gps: Location;
  supabase_user: {
    user_id: string;
    favorites: string[];
    dietary_preferences: string[];
    past_visits: Array<{
      place_id: string;
      name: string;
      visited_at: string;
    }>;
    liked_cuisines: string[];
  };
}

export interface RecognitionOutput {
  ocr_text: string;
  google_match: {
    name: string;
    address: string;
    rating: string;
    price_level: string;
    opening_hours: string;
    contact: string;
    images: string[];
  };
  yelp_ai: {
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
  };
  personalization: {
    is_favorite: boolean;
    cuisine_match_score: number;
    user_diet_match: string;
    personalized_recommendations: string[];
  };
  confidence_score: number;
}

export class CameraRecognitionEngine {
  private visionService: GoogleVisionService;
  private mapsService: GoogleMapsService;
  private yelpService: YelpService;
  private supabaseService: SupabaseService;

  constructor() {
    this.visionService = new GoogleVisionService();
    this.mapsService = new GoogleMapsService();
    this.yelpService = new YelpService();
    this.supabaseService = new SupabaseService();
  }

  /**
   * Main processing pipeline
   * Returns strict JSON only
   */
  async processFrame(input: RecognitionInput): Promise<RecognitionOutput> {
    try {
      console.log('🔍 Starting AR Camera Recognition...');
      
      // STEP 1: OCR - Extract text from camera frame
      console.log('📸 Step 1: Running Google Vision OCR...');
      const ocrResult = await this.visionService.extractText(input.camera_image_base64);
      
      if (!ocrResult.restaurantNameCandidates.length) {
        return this.createEmptyResponse('No text detected in image');
      }

      // STEP 2: Google Maps - Identify restaurant
      console.log('🗺️ Step 2: Identifying restaurant with Google Maps...');
      const googleMatch = await this.mapsService.findRestaurant(
        ocrResult.restaurantNameCandidates,
        input.gps
      );

      if (!googleMatch) {
        return this.createEmptyResponse('No restaurant found nearby', ocrResult.fullText);
      }

      // STEP 3: Yelp AI - Get restaurant intelligence
      console.log('🍽️ Step 3: Fetching Yelp AI insights...');
      const yelpData = await this.yelpService.getRestaurantIntelligence(
        googleMatch.name,
        googleMatch.geometry.location
      );

      // STEP 4: Supabase - Personalization
      console.log('👤 Step 4: Personalizing with user data...');
      const personalization = this.supabaseService.calculatePersonalization(
        input.supabase_user as UserPreferences,
        {
          place_id: googleMatch.place_id,
          categories: yelpData?.categories || [],
          dietary_labels: yelpData?.dietary_labels || [],
          popular_dishes: yelpData?.popular_dishes || [],
        }
      );

      // Calculate confidence score
      const confidence_score = this.calculateConfidence(
        ocrResult.confidence,
        googleMatch,
        yelpData
      );

      console.log('✅ Recognition complete!');

      // STEP 5: Return unified JSON
      return {
        ocr_text: ocrResult.fullText,
        google_match: {
          name: googleMatch.name,
          address: googleMatch.address,
          rating: googleMatch.rating.toString(),
          price_level: '$'.repeat(googleMatch.price_level || 2),
          opening_hours: googleMatch.opening_hours,
          contact: googleMatch.contact,
          images: googleMatch.images,
        },
        yelp_ai: {
          summary: yelpData?.summary || '',
          review_highlights: yelpData?.review_highlights || '',
          popular_dishes: yelpData?.popular_dishes || [],
          menu_items: yelpData?.menu_items || [],
          dietary_labels: yelpData?.dietary_labels || [],
          photos: yelpData?.photos || [],
        },
        personalization,
        confidence_score,
      };
    } catch (error) {
      console.error('❌ Recognition pipeline error:', error);
      return this.createEmptyResponse('Processing error occurred');
    }
  }

  /**
   * Calculate overall confidence score
   */
  private calculateConfidence(
    ocrConfidence: number,
    googleMatch: any,
    yelpData: any
  ): number {
    let score = 0;

    // OCR confidence (30%)
    score += ocrConfidence * 0.3;

    // Google Maps match quality (40%)
    if (googleMatch.rating > 0) score += 0.2;
    if (googleMatch.images.length > 0) score += 0.2;

    // Yelp data availability (30%)
    if (yelpData) {
      score += 0.15;
      if (yelpData.popular_dishes.length > 0) score += 0.15;
    }

    return Math.min(Math.round(score * 100) / 100, 1.0);
  }

  /**
   * Create empty/error response
   */
  private createEmptyResponse(reason: string, ocrText: string = ''): RecognitionOutput {
    console.log(`⚠️ ${reason}`);
    
    return {
      ocr_text: ocrText,
      google_match: {
        name: '',
        address: '',
        rating: '',
        price_level: '',
        opening_hours: '',
        contact: '',
        images: [],
      },
      yelp_ai: {
        summary: '',
        review_highlights: '',
        popular_dishes: [],
        menu_items: [],
        dietary_labels: [],
        photos: [],
      },
      personalization: {
        is_favorite: false,
        cuisine_match_score: 0,
        user_diet_match: '',
        personalized_recommendations: [],
      },
      confidence_score: 0.0,
    };
  }
}

