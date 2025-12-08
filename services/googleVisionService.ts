/**
 * Google Vision OCR Service
 * Extracts text from camera images using Google Cloud Vision API
 */

import axios from 'axios';
import { ENV } from '@/config/env';

export interface OCRResult {
  fullText: string;
  detectedTexts: string[];
  restaurantNameCandidates: string[];
  confidence: number;
}

export class GoogleVisionService {
  private apiKey: string;

  constructor() {
    this.apiKey = ENV.GOOGLE_VISION_API_KEY;
  }

  /**
   * Process camera image and extract text using Google Vision OCR
   */
  async extractText(base64Image: string): Promise<OCRResult> {
    try {
      const response = await axios.post(
        `https://vision.googleapis.com/v1/images:annotate?key=${this.apiKey}`,
        {
          requests: [
            {
              image: {
                content: base64Image,
              },
              features: [
                {
                  type: 'TEXT_DETECTION',
                  maxResults: 50,
                },
                {
                  type: 'LOGO_DETECTION',
                  maxResults: 10,
                },
              ],
            },
          ],
        }
      );

      const result = response.data.responses[0];
      
      if (!result.textAnnotations && !result.logoAnnotations) {
        return {
          fullText: '',
          detectedTexts: [],
          restaurantNameCandidates: [],
          confidence: 0,
        };
      }

      // Extract full text
      const fullText = result.textAnnotations?.[0]?.description || '';
      
      // Extract individual text blocks
      const detectedTexts = result.textAnnotations
        ?.slice(1)
        .map((annotation: any) => annotation.description)
        .filter((text: string) => text.length > 2) || [];

      // Extract logo names
      const logoNames = result.logoAnnotations?.map((logo: any) => logo.description) || [];

      // Clean and deduplicate
      const allTexts = [...new Set([...detectedTexts, ...logoNames])];
      
      // Extract restaurant name candidates (heuristic-based)
      const restaurantNameCandidates = this.extractRestaurantCandidates(allTexts, fullText);

      return {
        fullText,
        detectedTexts: allTexts,
        restaurantNameCandidates,
        confidence: result.textAnnotations?.[0]?.score || 0.8,
      };
    } catch (error) {
      console.error('Google Vision OCR Error:', error);
      throw new Error('Failed to extract text from image');
    }
  }

  /**
   * Heuristic to extract likely restaurant names
   * Improved with better filtering
   */
  private extractRestaurantCandidates(texts: string[], fullText: string): string[] {
    const candidates: string[] = [];
    
    // Restaurant-related keywords
    const restaurantKeywords = ['restaurant', 'cafe', 'coffee', 'bar', 'grill', 'kitchen', 'bistro', 'eatery', 'diner', 'pizzeria', 'steakhouse', 'brewery', 'tavern'];
    const stopWords = ['open', 'closed', 'hours', 'menu', 'welcome', 'delivery', 'takeout', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun', 'am', 'pm', 'the', 'and', 'or'];
    
    console.log('🔍 All OCR texts:', texts);

    // First pass: Look for proper names (capitalized words)
    for (const text of texts) {
      const trimmed = text.trim();
      if (trimmed.length < 3 || trimmed.length > 50) continue;
      
      const lowerText = trimmed.toLowerCase();
      
      // Skip stop words
      if (stopWords.some(word => lowerText === word || lowerText.includes(' ' + word + ' '))) {
        continue;
      }
      
      // Skip pure numbers or prices
      if (/^[\d\$\.\,\-]+$/.test(trimmed)) continue;
      
      // Skip common phrases
      if (/^(we|our|your|you|all|for|from|with|the|and|or|not)$/i.test(trimmed)) continue;
      
      // High priority: Contains restaurant keywords
      if (restaurantKeywords.some(keyword => lowerText.includes(keyword))) {
        console.log('  ✅ High priority (has keyword):', trimmed);
        candidates.unshift(trimmed);
      }
      // Medium priority: Starts with capital letter (proper noun)
      else if (/^[A-Z][a-z]/.test(trimmed) && /^[A-Za-z\s'&.-]+$/.test(trimmed)) {
        console.log('  ⭐ Medium priority (proper noun):', trimmed);
        candidates.push(trimmed);
      }
      // Low priority: All caps (might be signage)
      else if (/^[A-Z]{2,}$/.test(trimmed) && /^[A-Z\s'&-]+$/.test(trimmed)) {
        console.log('  💡 Low priority (all caps):', trimmed);
        candidates.push(trimmed);
      }
    }

    const unique = [...new Set(candidates)].slice(0, 8);
    console.log('🎯 Final candidates:', unique);
    return unique;
  }
}

