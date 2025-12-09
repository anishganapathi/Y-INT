/**
 * Itinerary Type Definitions
 */

export interface TripInput {
  destination: string;
  startDate: Date;
  endDate: Date;
  totalBudget: number;
  partySize: number;
  dietaryRestrictions: string[];
  cuisinePreferences: string[];
  mealTypes: string[];
}

export interface ItineraryMeal {
  id: string;
  type: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  scheduledTime: string;
  restaurant: {
    id: string;
    name: string;
    address: string;
    rating: number;
    priceLevel: string;
    photos: string[];
    phone?: string;
    yelpUrl?: string;
  };
  recommendedDishes: {
    name: string;
    price: number;
    description: string;
    why: string;
  }[];
  estimatedCost: number;
  actualCost?: number;
  reservationNeeded: boolean;
  reservationStatus?: 'none' | 'pending' | 'confirmed' | 'cancelled';
  reservationId?: string;
  visited?: boolean;
  rating?: number;
  notes?: string;
}

export interface ItineraryDay {
  dayNumber: number;
  date: string;
  theme?: string;
  totalBudget: number;
  meals: ItineraryMeal[];
}

export interface TripItinerary {
  id: string;
  userId: string;
  destination: string;
  startDate: string;
  endDate: string;
  totalDays: number;
  totalBudget: number;
  spentAmount: number;
  partySize: number;
  dietaryRestrictions: string[];
  cuisinePreferences: string[];
  status: 'draft' | 'confirmed' | 'active' | 'completed';
  days: ItineraryDay[];
  createdAt: Date;
  updatedAt: Date;
}

export interface BudgetBreakdown {
  totalBudget: number;
  spentAmount: number;
  remainingBudget: number;
  perDayBudget: number;
  byMealType: {
    breakfast: number;
    lunch: number;
    dinner: number;
    snack: number;
  };
  byDay: {
    day: number;
    allocated: number;
    spent: number;
  }[];
}

