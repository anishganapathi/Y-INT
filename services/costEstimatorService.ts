/**
 * Cost Estimator Service
 * Compares restaurant options based on calories, quantity, and value
 */

import { YelpService } from './yelpService';
import { Location } from './googleMapsService';
import * as LocationLib from 'expo-location';

export interface CostEstimateOption {
  restaurantName: string;
  dishName?: string; // Specific dish being compared
  restaurantId?: string;
  priceLevel: string; // $, $$, $$$, $$$$
  estimatedCost: number;
  estimatedCalories: number;
  estimatedQuantity: string; // e.g., "2-3 servings", "Large portion"
  valueScore: number; // Calculated score (0-100)
  summary: string;
  categories: string[];
}

export interface CostComparison {
  option1: CostEstimateOption;
  option2: CostEstimateOption;
  budget: number;
  winner: 'option1' | 'option2' | 'tie';
  comparison: {
    betterCalories: 'option1' | 'option2' | 'tie';
    betterQuantity: 'option1' | 'option2' | 'tie';
    betterValue: 'option1' | 'option2' | 'tie';
    personalizedReason: string;
  };
}

export interface ComparisonError {
  success: false;
  missingRestaurants: string[];
  error: string;
}

export class CostEstimatorService {
  private yelpService: YelpService;

  constructor() {
    this.yelpService = new YelpService();
  }

  /**
   * Estimate cost, calories, and quantity for a restaurant option
   */
  async estimateOption(
    restaurantName: string,
    budget: number,
    location?: Location,
    dishName?: string,
    specificCost?: number
  ): Promise<CostEstimateOption | null> {
    try {
      // Get user location if not provided
      if (!location) {
        try {
          const { status } = await LocationLib.requestForegroundPermissionsAsync();
          if (status === 'granted') {
            const userLocation = await LocationLib.getCurrentPositionAsync({});
            location = {
              lat: userLocation.coords.latitude,
              lng: userLocation.coords.longitude,
            };
          } else {
            // Use default location (San Francisco) if permission denied
            console.log('Location permission denied, using default location');
            location = {
              lat: 37.7749,
              lng: -122.4194,
            };
          }
        } catch (error) {
          // Silently use default location on error
          location = {
            lat: 37.7749,
            lng: -122.4194,
          };
        }
      }

      if (!location) {
        // Fallback to default location
        location = {
          lat: 37.7749,
          lng: -122.4194,
        };
      }

      // Get restaurant data from Yelp
      const business = await this.searchRestaurantByName(restaurantName, location);
      
      if (!business) {
        // Silently return null - error will be handled by caller
        return null;
      }

      // Get detailed information - make reviews optional
      let details;
      let reviews: any[] = [];
      
      details = await this.yelpService.getBusinessDetails(business.id);
      
      // If details fetch failed, use search result data
      if (!details) {
        details = {
          name: business.name,
          rating: business.rating || 0,
          review_count: business.review_count || 0,
          categories: business.categories || [],
        };
      }

      // Try to get reviews, but continue even if it fails
      reviews = await this.yelpService.getReviews(business.id);
      if (!reviews) {
        reviews = [];
      }

      // Calculate estimates based on price level, reviews, and categories
      const priceLevel = business.price || '$$';
      
      // Use specific cost if provided (for dish-specific comparisons)
      const estimatedCost = specificCost || this.estimateCostFromPriceLevel(priceLevel, budget);
      
      // If dish name is provided, estimate for specific dish
      const estimatedCalories = dishName 
        ? this.estimateCaloriesForDish(dishName, business.categories, reviews, priceLevel, estimatedCost)
        : this.estimateCaloriesFromCategory(business.categories, reviews, priceLevel, budget);
      
      const estimatedQuantity = dishName
        ? this.estimateQuantityForDish(dishName, reviews, business.categories, priceLevel)
        : this.estimateQuantityFromReviews(reviews, business.categories, priceLevel);

      // Calculate value score (higher is better)
      const valueScore = this.calculateValueScore(
        estimatedCost,
        estimatedCalories,
        estimatedQuantity,
        budget
      );

      // Generate summary from business data
      const summary = dishName 
        ? this.generateDishSummary(details, reviews, priceLevel, dishName, estimatedCost)
        : this.generateSummary(details, reviews, priceLevel);

      return {
        restaurantName: business.name,
        dishName: dishName,
        restaurantId: business.id,
        priceLevel,
        estimatedCost,
        estimatedCalories,
        estimatedQuantity,
        valueScore,
        summary,
        categories: business.categories.map(cat => cat.title),
      };
    } catch (error: any) {
      // Only log unexpected errors
      if (error?.message && !error?.message.includes('404')) {
        console.warn('Cost estimation error:', error?.message);
      }
      return null;
    }
  }

  /**
   * Compare two restaurant options (can include specific dishes)
   */
  async compareOptions(
    option1Input: string | { restaurant: string; dish?: string; cost?: number },
    option2Input: string | { restaurant: string; dish?: string; cost?: number },
    budget: number,
    location?: Location
  ): Promise<CostComparison | ComparisonError | null> {
    // Parse inputs
    const opt1 = typeof option1Input === 'string' 
      ? this.parseRestaurantDishInput(option1Input, budget)
      : { restaurant: option1Input.restaurant, dish: option1Input.dish, cost: option1Input.cost };
    
    const opt2 = typeof option2Input === 'string'
      ? this.parseRestaurantDishInput(option2Input, budget)
      : { restaurant: option2Input.restaurant, dish: option2Input.dish, cost: option2Input.cost };

    const [option1, option2] = await Promise.all([
      this.estimateOption(opt1.restaurant, budget, location, opt1.dish, opt1.cost),
      this.estimateOption(opt2.restaurant, budget, location, opt2.dish, opt2.cost),
    ]);

    if (!option1 || !option2) {
      const missing: string[] = [];
      if (!option1) {
        missing.push(opt1.dish ? `${opt1.dish} at ${opt1.restaurant}` : opt1.restaurant);
      }
      if (!option2) {
        missing.push(opt2.dish ? `${opt2.dish} at ${opt2.restaurant}` : opt2.restaurant);
      }
      
      return {
        success: false,
        missingRestaurants: missing,
        error: `Could not find: ${missing.join(' and ')}`,
      };
    }

    // Determine winner
    let winner: 'option1' | 'option2' | 'tie' = 'tie';
    if (option1.valueScore > option2.valueScore) {
      winner = 'option1';
    } else if (option2.valueScore > option1.valueScore) {
      winner = 'option2';
    }

    // Compare individual metrics
    const betterCalories = 
      option1.estimatedCalories > option2.estimatedCalories ? 'option1' :
      option2.estimatedCalories > option1.estimatedCalories ? 'option2' : 'tie';

    const betterQuantity = 
      this.parseQuantity(option1.estimatedQuantity) > this.parseQuantity(option2.estimatedQuantity) ? 'option1' :
      this.parseQuantity(option2.estimatedQuantity) > this.parseQuantity(option1.estimatedQuantity) ? 'option2' : 'tie';

    const betterValue = winner;

    // Generate personalized reason
    const personalizedReason = this.generatePersonalizedReason(
      option1,
      option2,
      betterCalories,
      betterQuantity,
      betterValue,
      budget
    );

    return {
      option1,
      option2,
      budget,
      winner,
      comparison: {
        betterCalories,
        betterQuantity,
        betterValue,
        personalizedReason,
      },
    };
  }

  /**
   * Search for restaurant by name with multiple strategies
   */
  private async searchRestaurantByName(name: string, location: Location): Promise<any> {
    try {
      // Clean restaurant name - remove common location prefixes and dish names
      const cleanedName = this.cleanRestaurantName(name);
      
      // Strategy 1: Try exact search with cleaned name (without category restriction)
      let restaurants = await this.yelpService.searchRestaurants(location.lat, location.lng, cleanedName, 5, false);
      
      // Check if we found a match (fuzzy match on name)
      let match = this.findBestMatch(restaurants, cleanedName);
      if (match) return match;

      // Strategy 2: Try with original name
      restaurants = await this.yelpService.searchRestaurants(location.lat, location.lng, name, 5, false);
      match = this.findBestMatch(restaurants, cleanedName);
      if (match) return match;

      // Strategy 3: Try broader search with more results
      restaurants = await this.yelpService.searchRestaurants(location.lat, location.lng, cleanedName, 10, false);
      match = this.findBestMatch(restaurants, cleanedName);
      if (match) return match;

      // Strategy 4: Try partial name match (split and search)
      const nameParts = cleanedName.split(/\s+/).filter(part => part.length > 3);
      if (nameParts.length > 1) {
        for (const part of nameParts) {
          restaurants = await this.yelpService.searchRestaurants(location.lat, location.lng, part, 10, false);
          match = this.findBestMatch(restaurants, cleanedName);
          if (match) return match;
        }
      }

      // Last resort: return first result if available
      return restaurants[0] || null;
    } catch (error: any) {
      // Silently return null - this is expected for some searches
      return null;
    }
  }

  /**
   * Clean restaurant name by removing location names, dish names, etc.
   */
  private cleanRestaurantName(name: string): string {
    let cleaned = name.trim();
    
    // Remove common location prefixes
    const locationPrefixes = ['hoboken', 'new york', 'nyc', 'manhattan', 'brooklyn', 'queens', 'bronx'];
    for (const prefix of locationPrefixes) {
      const regex = new RegExp(`^${prefix}\\s+`, 'i');
      cleaned = cleaned.replace(regex, '');
    }

    // Remove common dish names that might be in the name
    const commonDishes = ['biryani', 'biriyani', 'burrito', 'pizza', 'burger', 'taco', 'tacos', 'bowl', 'salad'];
    for (const dish of commonDishes) {
      const regex = new RegExp(`\\s+${dish}`, 'i');
      cleaned = cleaned.replace(regex, '');
    }

    // Remove price info
    cleaned = cleaned.replace(/\$\d+/g, '').trim();
    
    // Remove common separators at start/end
    cleaned = cleaned.replace(/^[,\-–]\s*|\s*[,\-–]$/g, '').trim();

    return cleaned || name; // Return original if cleaned is empty
  }

  /**
   * Find best matching restaurant from search results
   */
  private findBestMatch(restaurants: any[], searchName: string): any | null {
    if (!restaurants || restaurants.length === 0) return null;

    const searchLower = searchName.toLowerCase();
    const searchWords = searchLower.split(/\s+/).filter(w => w.length > 2);

    // Try exact match first
    for (const restaurant of restaurants) {
      const restaurantName = restaurant.name.toLowerCase();
      if (restaurantName === searchLower) {
        return restaurant;
      }
    }

    // Try partial match (all search words present)
    for (const restaurant of restaurants) {
      const restaurantName = restaurant.name.toLowerCase();
      const matchCount = searchWords.filter(word => restaurantName.includes(word)).length;
      if (matchCount >= Math.min(searchWords.length, 2)) {
        return restaurant;
      }
    }

    // Try fuzzy match (most words match)
    let bestMatch = null;
    let bestScore = 0;
    
    for (const restaurant of restaurants) {
      const restaurantName = restaurant.name.toLowerCase();
      const matchScore = searchWords.filter(word => restaurantName.includes(word)).length;
      if (matchScore > bestScore) {
        bestScore = matchScore;
        bestMatch = restaurant;
      }
    }

    return bestScore >= 1 ? bestMatch : null;
  }

  /**
   * Estimate cost from price level
   */
  private estimateCostFromPriceLevel(priceLevel: string, budget: number): number {
    // Price levels: $ (cheap), $$ (moderate), $$$ (expensive), $$$$ (very expensive)
    const priceMultipliers: { [key: string]: number } = {
      '$': 0.6,      // Use 60% of budget
      '$$': 0.8,     // Use 80% of budget
      '$$$': 0.95,   // Use 95% of budget
      '$$$$': 1.1,   // Might exceed budget
    };

    const multiplier = priceMultipliers[priceLevel] || 0.8;
    return Math.min(budget * multiplier, budget * 1.1);
  }

  /**
   * Estimate calories from category and reviews
   */
  private estimateCaloriesFromCategory(
    categories: Array<{ alias: string; title: string }>,
    reviews: any[],
    priceLevel: string,
    budget: number
  ): number {
    // Base calories by category
    const categoryCalories: { [key: string]: number } = {
      'pizza': 800,
      'italian': 900,
      'burgers': 1000,
      'american': 950,
      'mexican': 850,
      'asian': 700,
      'chinese': 750,
      'japanese': 650,
      'indian': 800,
      'thai': 700,
      'seafood': 600,
      'mediterranean': 750,
      'fast food': 1100,
      'sandwiches': 700,
      'salad': 400,
    };

    // Find matching category
    const categoryTitles = categories.map(c => c.title.toLowerCase());
    let baseCalories = 700; // Default

    for (const [key, calories] of Object.entries(categoryCalories)) {
      if (categoryTitles.some(ct => ct.includes(key))) {
        baseCalories = calories;
        break;
      }
    }

    // Adjust based on price level (more expensive usually means more/better food)
    const priceAdjustment: { [key: string]: number } = {
      '$': 0.9,
      '$$': 1.0,
      '$$$': 1.2,
      '$$$$': 1.4,
    };

    const adjustment = priceAdjustment[priceLevel] || 1.0;
    let calories = baseCalories * adjustment;

    // Adjust based on budget (more budget = more food)
    calories = calories * (budget / 25); // Normalize to $25 baseline

    // Review-based adjustments (look for portion size mentions)
    const reviewText = reviews.map(r => r.text.toLowerCase()).join(' ');
    if (reviewText.includes('large') || reviewText.includes('big') || reviewText.includes('huge')) {
      calories *= 1.3;
    } else if (reviewText.includes('small') || reviewText.includes('tiny')) {
      calories *= 0.8;
    }

    return Math.round(calories);
  }

  /**
   * Estimate quantity from reviews
   */
  private estimateQuantityFromReviews(
    reviews: any[],
    categories: Array<{ alias: string; title: string }>,
    priceLevel: string
  ): string {
    const reviewText = reviews.map(r => r.text.toLowerCase()).join(' ');
    
    // Look for quantity indicators in reviews
    if (reviewText.includes('share') || reviewText.includes('splitting')) {
      return '2-3 servings (sharable)';
    }
    
    if (reviewText.includes('large') || reviewText.includes('big') || reviewText.includes('huge')) {
      return 'Large portion (1-2 servings)';
    }
    
    if (reviewText.includes('small') || reviewText.includes('tiny') || reviewText.includes('little')) {
      return 'Single serving';
    }

    // Default based on price level
    const quantityByPrice: { [key: string]: string } = {
      '$': 'Single serving',
      '$$': '1-2 servings',
      '$$$': '2-3 servings',
      '$$$$': '2-3 servings (premium)',
    };

    return quantityByPrice[priceLevel] || '1-2 servings';
  }

  /**
   * Calculate value score (0-100)
   */
  private calculateValueScore(
    cost: number,
    calories: number,
    quantity: string,
    budget: number
  ): number {
    // Cost efficiency (lower cost relative to budget = better)
    const costEfficiency = (budget - cost) / budget * 40; // 40 points max

    // Calorie value (more calories per dollar = better)
    const calorieValue = (calories / cost) * 30; // 30 points max, normalize

    // Quantity value (larger servings = better)
    const quantityValue = this.parseQuantity(quantity) * 30; // 30 points max

    // Normalize and cap scores
    const score = Math.min(100, costEfficiency + Math.min(calorieValue, 30) + Math.min(quantityValue, 30));
    return Math.round(score);
  }

  /**
   * Parse quantity string to numeric value
   */
  private parseQuantity(quantity: string): number {
    if (quantity.includes('3')) return 3;
    if (quantity.includes('2')) return 2;
    if (quantity.includes('large') || quantity.includes('big')) return 2.5;
    return 1;
  }

  /**
   * Generate business summary
   */
  private generateSummary(details: any, reviews: any[], priceLevel: string): string {
    const rating = details.rating || 0;
    const reviewCount = details.review_count || 0;
    const categories = details.categories?.map((cat: any) => cat.title).join(', ') || 'Restaurant';
    
    return `${details.name} (${priceLevel}) - ${categories} with ${rating}⭐ from ${reviewCount} reviews. ${
      reviews.length > 0 ? reviews[0].text.slice(0, 100) + '...' : 'Well-rated establishment.'
    }`;
  }

  /**
   * Generate dish-specific summary
   */
  private generateDishSummary(details: any, reviews: any[], priceLevel: string, dishName: string, cost: number): string {
    const rating = details.rating || 0;
    const reviewCount = details.review_count || 0;
    return `${details.name} - ${dishName} for $${cost.toFixed(2)}. ${rating}⭐ rating from ${reviewCount} reviews.`;
  }

  /**
   * Estimate calories for specific dish
   */
  private estimateCaloriesForDish(
    dishName: string,
    categories: Array<{ alias: string; title: string }>,
    reviews: any[],
    priceLevel: string,
    cost: number
  ): number {
    const dishLower = dishName.toLowerCase();
    
    // Base calories by dish type
    const dishCalories: { [key: string]: number } = {
      'biryani': 800,
      'burrito': 900,
      'burrito bowl': 700,
      'bowl': 700,
      'pizza': 600,
      'burger': 800,
      'taco': 300,
      'tacos': 600,
      'salad': 400,
      'sandwich': 600,
      'pasta': 700,
      'curry': 650,
      'noodles': 550,
      'rice': 400,
      'wrap': 500,
      'quesadilla': 600,
      'nachos': 700,
      'chicken': 600,
      'beef': 700,
      'pork': 650,
      'fish': 500,
      'seafood': 550,
    };

    // Find matching dish type
    let baseCalories = 600; // Default
    for (const [key, calories] of Object.entries(dishCalories)) {
      if (dishLower.includes(key)) {
        baseCalories = calories;
        break;
      }
    }

    // Adjust based on price level and cost
    const priceAdjustment: { [key: string]: number } = {
      '$': 0.9,
      '$$': 1.0,
      '$$$': 1.2,
      '$$$$': 1.4,
    };
    const adjustment = priceAdjustment[priceLevel] || 1.0;
    let calories = baseCalories * adjustment;

    // Adjust based on cost (more expensive usually means more/better food)
    calories = calories * (cost / 15); // Normalize to $15 baseline

    // Review-based adjustments for this specific dish
    const reviewText = reviews.map(r => r.text.toLowerCase()).join(' ');
    const dishInReviews = reviewText.includes(dishLower) || reviewText.includes(dishName.toLowerCase());
    
    if (dishInReviews) {
      if (reviewText.includes('large') || reviewText.includes('big') || reviewText.includes('huge')) {
        calories *= 1.3;
      }
      if (reviewText.includes('small') || reviewText.includes('tiny')) {
        calories *= 0.8;
      }
    }

    return Math.round(calories);
  }

  /**
   * Estimate quantity for specific dish
   */
  private estimateQuantityForDish(
    dishName: string,
    reviews: any[],
    categories: Array<{ alias: string; title: string }>,
    priceLevel: string
  ): string {
    const dishLower = dishName.toLowerCase();
    const reviewText = reviews.map(r => r.text.toLowerCase()).join(' ');
    
    // Look for dish-specific mentions in reviews
    if (reviewText.includes(dishLower) || reviewText.includes(dishName.toLowerCase())) {
      if (reviewText.includes('share') || reviewText.includes('splitting')) {
        return '2-3 servings (sharable)';
      }
      if (reviewText.includes('large') || reviewText.includes('big') || reviewText.includes('huge')) {
        return 'Large portion (1-2 servings)';
      }
      if (reviewText.includes('small') || reviewText.includes('tiny')) {
        return 'Single serving';
      }
    }

    // Dish-specific defaults
    if (dishLower.includes('biryani')) {
      return 'Large portion (1-2 servings)';
    }
    if (dishLower.includes('burrito') || dishLower.includes('bowl')) {
      return 'Single serving (generous)';
    }
    if (dishLower.includes('pizza')) {
      return '2-3 servings';
    }
    if (dishLower.includes('taco') || dishLower.includes('tacos')) {
      return '2-3 pieces (single serving)';
    }

    // Default based on price level
    const quantityByPrice: { [key: string]: string } = {
      '$': 'Single serving',
      '$$': '1-2 servings',
      '$$$': '2-3 servings',
      '$$$$': '2-3 servings (premium)',
    };

    return quantityByPrice[priceLevel] || '1-2 servings';
  }

  /**
   * Parse restaurant and dish from input string
   * Supports formats like:
   * - "Karma Kafe biryani"
   * - "biriyani at Karma Kafe"
   * - "Karma Kafe, biryani"
   */
  private parseRestaurantDishInput(input: string, budget: number): { restaurant: string; dish?: string; cost?: number } {
    const lowerInput = input.toLowerCase();
    
    // Try to extract cost from input
    const costMatch = input.match(/\$?(\d+)/);
    const cost = costMatch ? parseFloat(costMatch[1]) : undefined;

    // Common patterns
    // Pattern 1: "dish at restaurant" or "dish from restaurant"
    const atPattern = /(.+?)\s+(?:at|from|in)\s+(.+)/i;
    const atMatch = input.match(atPattern);
    if (atMatch) {
      return {
        restaurant: atMatch[2].trim(),
        dish: atMatch[1].trim(),
        cost,
      };
    }

    // Pattern 2: "restaurant, dish" or "restaurant - dish"
    const commaPattern = /(.+?)[,\-–]\s*(.+)/i;
    const commaMatch = input.match(commaPattern);
    if (commaMatch) {
      return {
        restaurant: commaMatch[1].trim(),
        dish: commaMatch[2].trim(),
        cost,
      };
    }

    // Pattern 3: "restaurant dish" (common dish names)
    const commonDishes = ['biryani', 'biriyani', 'burrito', 'pizza', 'burger', 'taco', 'tacos', 'bowl', 'salad', 'curry', 'pasta', 'noodles'];
    for (const dish of commonDishes) {
      const dishPattern = new RegExp(`(.+?)\\s+${dish}\\s*`, 'i');
      const dishMatch = input.match(dishPattern);
      if (dishMatch) {
        return {
          restaurant: dishMatch[1].trim(),
          dish: dish,
          cost,
        };
      }

      // Reverse: "dish restaurant"
      const reversePattern = new RegExp(`${dish}\\s+(.+)`, 'i');
      const reverseMatch = input.match(reversePattern);
      if (reverseMatch) {
        return {
          restaurant: reverseMatch[1].trim(),
          dish: dish,
          cost,
        };
      }
    }

    // No dish found, treat as restaurant only
    return {
      restaurant: input.replace(/\$\d+/g, '').trim(),
      cost,
    };
  }

  /**
   * Generate personalized comparison reason
   */
  private generatePersonalizedReason(
    option1: CostEstimateOption,
    option2: CostEstimateOption,
    betterCalories: string,
    betterQuantity: string,
    betterValue: string,
    budget: number
  ): string {
    const winner = betterValue === 'option1' ? option1 : option2;
    const loser = betterValue === 'option1' ? option2 : option1;
    
    const winnerLabel = winner.dishName 
      ? `${winner.dishName} at ${winner.restaurantName}`
      : winner.restaurantName;
    const loserLabel = loser.dishName
      ? `${loser.dishName} at ${loser.restaurantName}`
      : loser.restaurantName;

    let reason = `${winnerLabel} offers the best value for your $${budget} budget.\n\n`;

    // Calories comparison
    if (betterCalories !== 'tie') {
      const calorieWinner = betterCalories === 'option1' ? option1 : option2;
      const calorieLoser = betterCalories === 'option1' ? option2 : option1;
      const winnerLabel = calorieWinner.dishName 
        ? `${calorieWinner.dishName} at ${calorieWinner.restaurantName}`
        : calorieWinner.restaurantName;
      const loserLabel = calorieLoser.dishName
        ? `${calorieLoser.dishName} at ${calorieLoser.restaurantName}`
        : calorieLoser.restaurantName;
      reason += `• More Calories: ${winnerLabel} provides ${calorieWinner.estimatedCalories} calories vs ${calorieLoser.estimatedCalories} calories (${calorieWinner.estimatedCalories - calorieLoser.estimatedCalories} more).\n\n`;
    }

    // Quantity comparison
    if (betterQuantity !== 'tie') {
      const quantityWinner = betterQuantity === 'option1' ? option1 : option2;
      const quantityLoser = betterQuantity === 'option1' ? option2 : option1;
      const winnerLabel = quantityWinner.dishName 
        ? `${quantityWinner.dishName} at ${quantityWinner.restaurantName}`
        : quantityWinner.restaurantName;
      const loserLabel = quantityLoser.dishName
        ? `${quantityLoser.dishName} at ${quantityLoser.restaurantName}`
        : quantityLoser.restaurantName;
      reason += `• Better Portion Size: ${winnerLabel} offers "${quantityWinner.estimatedQuantity}" compared to "${quantityLoser.estimatedQuantity}" from ${loserLabel}.\n\n`;
    }

    // Cost efficiency
    const costDiff = Math.abs(option1.estimatedCost - option2.estimatedCost);
    if (costDiff > 0.5) {
      const cheaper = option1.estimatedCost < option2.estimatedCost ? option1 : option2;
      const expensive = option1.estimatedCost < option2.estimatedCost ? option2 : option1;
      const cheaperLabel = cheaper.dishName 
        ? `${cheaper.dishName} at ${cheaper.restaurantName}`
        : cheaper.restaurantName;
      const expensiveLabel = expensive.dishName
        ? `${expensive.dishName} at ${expensive.restaurantName}`
        : expensive.restaurantName;
      reason += `• Cost: ${cheaperLabel} costs $${cheaper.estimatedCost.toFixed(2)}, ${costDiff > 0.01 ? `saving you $${costDiff.toFixed(2)} compared to ${expensiveLabel} ($${expensive.estimatedCost.toFixed(2)})` : 'same price'}.\n\n`;
    }

    // Overall recommendation
    reason += `Recommendation: Choose ${winnerLabel} for the best combination of calories, quantity, and value within your budget!`;

    return reason;
  }
}
