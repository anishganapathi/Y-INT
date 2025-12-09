/**
 * Smart Itinerary Engine
 * Generates optimal food itinerary using algorithmic approach (no AI API needed!)
 * Uses Yelp data + smart algorithms for budget optimization and variety
 */

import { ItineraryRestaurant } from './yelpItineraryService';
import { TripItinerary, ItineraryDay, ItineraryMeal } from '@/types/itinerary';

export interface ItineraryGenerationInput {
  destination: string;
  startDate: Date;
  endDate: Date;
  totalBudget: number;
  partySize: number;
  mealTypes: string[]; // ['breakfast', 'lunch', 'dinner']
  restaurants: ItineraryRestaurant[];
}

export class SmartItineraryEngine {
  /**
   * Generate optimized food itinerary
   */
  generateItinerary(input: ItineraryGenerationInput): TripItinerary {
    console.log('🎯 Generating smart itinerary...');
    
    const days = this.calculateDays(input.startDate, input.endDate);
    console.log(`   Planning ${days} days with ${input.mealTypes.length} meals/day`);

    // Calculate budget allocation
    const budgetAllocation = this.allocateBudget(
      input.totalBudget,
      days,
      input.mealTypes.length,
      input.partySize
    );

    console.log('   Budget per day:', budgetAllocation.perDay);
    console.log('   Budget per meal:', budgetAllocation.perMeal);

    // Categorize restaurants by meal type and price
    const categorizedRestaurants = this.categorizeRestaurants(
      input.restaurants,
      input.mealTypes,
      budgetAllocation
    );

    console.log('   Categorized restaurants:');
    console.log('      Breakfast:', categorizedRestaurants.breakfast?.length || 0);
    console.log('      Lunch:', categorizedRestaurants.lunch?.length || 0);
    console.log('      Dinner:', categorizedRestaurants.dinner?.length || 0);

    // Generate day-by-day itinerary
    const itineraryDays = this.generateDays(
      days,
      input.startDate,
      input.mealTypes,
      categorizedRestaurants,
      budgetAllocation,
      input.partySize
    );

    console.log('✅ Itinerary generated successfully!');

    return {
      id: 'trip_' + Date.now(),
      userId: 'user_' + Date.now(), // Will be replaced with actual user ID
      destination: input.destination,
      startDate: input.startDate.toISOString(),
      endDate: input.endDate.toISOString(),
      totalDays: days,
      totalBudget: input.totalBudget,
      spentAmount: 0,
      partySize: input.partySize,
      dietaryRestrictions: [],
      cuisinePreferences: [],
      status: 'draft',
      days: itineraryDays,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  /**
   * Calculate number of days
   */
  private calculateDays(startDate: Date, endDate: Date): number {
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) || 1;
  }

  /**
   * Allocate budget across meals
   */
  private allocateBudget(
    totalBudget: number,
    days: number,
    mealsPerDay: number,
    partySize: number
  ) {
    const perDay = totalBudget / days;
    const perMeal = perDay / mealsPerDay;
    const perPerson = perMeal / partySize;

    // Meal type budget weights
    const weights = {
      breakfast: 0.20, // 20% of daily budget
      lunch: 0.35,     // 35% of daily budget
      dinner: 0.45,    // 45% of daily budget
      snacks: 0.10,    // 10% of daily budget
    };

    return {
      total: totalBudget,
      perDay,
      perMeal,
      perPerson,
      weights,
      byMealType: {
        breakfast: perDay * weights.breakfast,
        lunch: perDay * weights.lunch,
        dinner: perDay * weights.dinner,
        snacks: perDay * weights.snacks,
      },
    };
  }

  /**
   * Categorize restaurants by meal type suitability
   */
  private categorizeRestaurants(
    restaurants: ItineraryRestaurant[],
    mealTypes: string[],
    budgetAllocation: any
  ) {
    const categorized: any = {};

    for (const mealType of mealTypes) {
      categorized[mealType] = this.filterRestaurantsForMeal(
        restaurants,
        mealType,
        budgetAllocation.byMealType[mealType]
      );
    }

    return categorized;
  }

  /**
   * Filter restaurants suitable for a specific meal
   */
  private filterRestaurantsForMeal(
    restaurants: ItineraryRestaurant[],
    mealType: string,
    budgetForMeal: number
  ): ItineraryRestaurant[] {
    // Keywords for meal types
    const mealKeywords: any = {
      breakfast: ['breakfast', 'brunch', 'cafe', 'coffee', 'bakery', 'bagel', 'diner'],
      lunch: ['lunch', 'sandwich', 'salad', 'casual', 'fast', 'deli', 'cafe'],
      dinner: ['dinner', 'fine dining', 'steakhouse', 'seafood', 'upscale'],
      snacks: ['snacks', 'dessert', 'ice cream', 'coffee', 'tea', 'bakery'],
    };

    const keywords = mealKeywords[mealType] || [];

    // Filter and score restaurants
    const scored = restaurants.map(restaurant => {
      let score = 0;

      // Check categories for meal type match
      const categoryText = restaurant.categories.join(' ').toLowerCase();
      for (const keyword of keywords) {
        if (categoryText.includes(keyword)) {
          score += 2;
        }
      }

      // Price compatibility (prefer restaurants within 150% of meal budget)
      const priceScore = this.calculatePriceScore(restaurant.priceLevel, budgetForMeal);
      score += priceScore;

      // Rating boost
      score += restaurant.rating * 0.5;

      return { restaurant, score };
    });

    // Sort by score and return top candidates
    return scored
      .sort((a, b) => b.score - a.score)
      .slice(0, 20) // Top 20 for this meal type
      .map(item => item.restaurant);
  }

  /**
   * Calculate price compatibility score
   */
  private calculatePriceScore(priceLevel: string, budgetForMeal: number): number {
    const priceValue = priceLevel.length; // $=1, $$=2, $$$=3, $$$$=4
    const avgMealCost = priceValue * 15; // Rough estimate: $=15, $$=30, $$$=45, $$$$=60

    if (avgMealCost <= budgetForMeal * 1.5) {
      return 3; // Good match
    } else if (avgMealCost <= budgetForMeal * 2) {
      return 1; // Acceptable
    }
    return 0; // Too expensive
  }

  /**
   * Generate day-by-day itinerary
   */
  private generateDays(
    days: number,
    startDate: Date,
    mealTypes: string[],
    categorizedRestaurants: any,
    budgetAllocation: any,
    partySize: number
  ): ItineraryDay[] {
    const itineraryDays: ItineraryDay[] = [];
    const usedRestaurants = new Set<string>();

    for (let dayNum = 1; dayNum <= days; dayNum++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + (dayNum - 1));

      // Determine day theme based on cuisine variety
      const theme = this.getDayTheme(dayNum, days);

      const meals: ItineraryMeal[] = [];

      // Generate meals for this day
      for (const mealType of mealTypes) {
        const meal = this.generateMeal(
          mealType,
          categorizedRestaurants[mealType] || [],
          usedRestaurants,
          budgetAllocation.byMealType[mealType],
          partySize,
          dayNum
        );

        if (meal) {
          meals.push(meal);
        }
      }

      itineraryDays.push({
        dayNumber: dayNum,
        date: date.toISOString().split('T')[0],
        theme,
        totalBudget: budgetAllocation.perDay,
        meals,
      });
    }

    return itineraryDays;
  }

  /**
   * Generate a single meal
   */
  private generateMeal(
    mealType: string,
    candidates: ItineraryRestaurant[],
    usedRestaurants: Set<string>,
    budget: number,
    partySize: number,
    dayNumber: number
  ): ItineraryMeal | null {
    // Find unused restaurant (or reuse if necessary)
    let restaurant = candidates.find(r => !usedRestaurants.has(r.id));
    
    if (!restaurant && candidates.length > 0) {
      // If all used, pick from candidates (round-robin)
      const index = (dayNumber - 1) % candidates.length;
      restaurant = candidates[index];
    }

    if (!restaurant) {
      console.warn(`No restaurant found for ${mealType}`);
      return null;
    }

    usedRestaurants.add(restaurant.id);

    // Generate meal time
    const time = this.getMealTime(mealType as any);

    // Select recommended dishes
    const recommendedDishes = this.selectDishes(
      restaurant,
      budget,
      partySize
    );

    // Calculate estimated cost
    const estimatedCost = this.calculateMealCost(
      restaurant.priceLevel,
      partySize
    );

    return {
      id: `meal_${Date.now()}_${Math.random()}`,
      type: mealType as any,
      scheduledTime: time,
      restaurant: {
        id: restaurant.id,
        name: restaurant.name,
        address: restaurant.address,
        rating: restaurant.rating,
        priceLevel: restaurant.priceLevel,
        photos: restaurant.photos,
        phone: restaurant.phone,
        yelpUrl: restaurant.yelpUrl,
      },
      recommendedDishes,
      estimatedCost,
      reservationNeeded: this.needsReservation(restaurant, mealType as any),
    };
  }

  /**
   * Get typical meal time
   */
  private getMealTime(mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack'): string {
    const times: any = {
      breakfast: '9:00 AM',
      lunch: '1:00 PM',
      dinner: '7:00 PM',
      snacks: '3:00 PM',
    };
    return times[mealType] || '12:00 PM';
  }

  /**
   * Select dishes to recommend
   */
  private selectDishes(
    restaurant: ItineraryRestaurant,
    budget: number,
    partySize: number
  ) {
    const dishes: any[] = [];
    
    // Use popular dishes from reviews
    if (restaurant.popularDishes && restaurant.popularDishes.length > 0) {
      const dishesPerPerson = Math.min(2, restaurant.popularDishes.length);
      const selectedDishes = restaurant.popularDishes.slice(0, dishesPerPerson);
      
      for (const dishName of selectedDishes) {
        const price = this.estimateDishPrice(restaurant.priceLevel);
        dishes.push({
          name: dishName,
          price,
          description: 'Highly recommended by reviewers',
          why: 'Popular choice based on reviews',
        });
      }
    } else {
      // Generic recommendations based on categories
      const categoryDish = this.getCategoryDish(restaurant.categories[0] || 'Restaurant');
      const price = this.estimateDishPrice(restaurant.priceLevel);
      
      dishes.push({
        name: categoryDish,
        price,
        description: `Classic ${restaurant.categories[0]} dish`,
        why: 'House specialty',
      });
    }

    return dishes;
  }

  /**
   * Estimate dish price based on restaurant price level
   */
  private estimateDishPrice(priceLevel: string): number {
    const level = priceLevel.length;
    const basePrices = [8, 15, 25, 40]; // $, $$, $$$, $$$$
    return basePrices[level - 1] || 15;
  }

  /**
   * Get typical dish for category
   */
  private getCategoryDish(category: string): string {
    const dishes: any = {
      'Italian': 'Pasta Carbonara',
      'Japanese': 'Sushi Platter',
      'Mexican': 'Tacos Al Pastor',
      'Chinese': 'Kung Pao Chicken',
      'American': 'Classic Burger',
      'Thai': 'Pad Thai',
      'Indian': 'Butter Chicken',
      'French': 'Coq au Vin',
    };

    for (const [key, dish] of Object.entries(dishes)) {
      if (category.includes(key)) {
        return dish;
      }
    }

    return 'Chef\'s Special';
  }

  /**
   * Calculate total meal cost
   */
  private calculateMealCost(priceLevel: string, partySize: number): number {
    const perPerson = this.estimateDishPrice(priceLevel) * 1.5; // Dish + drink
    return perPerson * partySize;
  }

  /**
   * Determine if reservation is needed
   */
  private needsReservation(
    restaurant: ItineraryRestaurant,
    mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack'
  ): boolean {
    // High-end restaurants for dinner usually need reservations
    if (mealType === 'dinner' && restaurant.priceLevel.length >= 3) {
      return true;
    }

    // Very popular restaurants (high review count + high rating)
    if (restaurant.reviewCount > 1000 && restaurant.rating >= 4.5) {
      return true;
    }

    return false;
  }

  /**
   * Get day theme based on variety
   */
  private getDayTheme(dayNum: number, totalDays: number): string {
    const themes = [
      'Culinary Adventure',
      'Local Favorites',
      'Hidden Gems',
      'Foodie Exploration',
      'Taste Journey',
      'Gourmet Discovery',
      'Flavor Safari',
    ];

    return themes[(dayNum - 1) % themes.length];
  }
}

// Singleton instance
export const smartItineraryEngine = new SmartItineraryEngine();

