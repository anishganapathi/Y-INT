/**
 * Supabase Itinerary Service
 * Save and load trip itineraries to/from Supabase
 */

import { supabase, ensureUser } from './supabaseClient';
import { TripItinerary, ItineraryDay, ItineraryMeal } from '@/types/itinerary';

export class SupabaseItineraryService {
  /**
   * Save complete itinerary to Supabase
   */
  async saveItinerary(itinerary: TripItinerary): Promise<string> {
    try {
      console.log('💾 Saving itinerary to Supabase...');
      
      // Ensure user is authenticated
      const user = await ensureUser();
      if (!user) throw new Error('User not authenticated');

      // 1. Save main trip
      const { data: trip, error: tripError } = await supabase
        .from('trip_itineraries')
        .insert({
          user_id: user.id,
          destination: itinerary.destination,
          start_date: itinerary.startDate.split('T')[0],
          end_date: itinerary.endDate.split('T')[0],
          total_days: itinerary.totalDays,
          total_budget: itinerary.totalBudget,
          spent_amount: itinerary.spentAmount || 0,
          party_size: itinerary.partySize,
          dietary_restrictions: itinerary.dietaryRestrictions || [],
          cuisine_preferences: itinerary.cuisinePreferences || [],
          status: 'draft',
        })
        .select()
        .single();

      if (tripError) {
        console.error('❌ Error saving trip:', tripError);
        throw tripError;
      }

      console.log('✅ Trip saved:', trip.id);

      // 2. Save days and meals
      for (const day of itinerary.days) {
        // Save day
        const { data: savedDay, error: dayError } = await supabase
          .from('itinerary_days')
          .insert({
            trip_id: trip.id,
            day_number: day.dayNumber,
            date: day.date,
            theme: day.theme,
            total_budget: day.totalBudget,
          })
          .select()
          .single();

        if (dayError) {
          console.error('❌ Error saving day:', dayError);
          continue;
        }

        // Save meals for this day
        const mealsToInsert = day.meals.map(meal => ({
          day_id: savedDay.id,
          trip_id: trip.id,
          meal_type: meal.type,
          scheduled_time: meal.scheduledTime,
          restaurant_id: meal.restaurant.id,
          restaurant_name: meal.restaurant.name,
          restaurant_address: meal.restaurant.address,
          restaurant_rating: meal.restaurant.rating,
          restaurant_price_level: meal.restaurant.priceLevel,
          restaurant_phone: meal.restaurant.phone,
          restaurant_yelp_url: meal.restaurant.yelpUrl,
          restaurant_photos: meal.restaurant.photos || [],
          recommended_dishes: meal.recommendedDishes || [],
          estimated_cost: meal.estimatedCost,
          reservation_needed: meal.reservationNeeded || false,
        }));

        const { error: mealsError } = await supabase
          .from('itinerary_meals')
          .insert(mealsToInsert);

        if (mealsError) {
          console.error('❌ Error saving meals:', mealsError);
        }
      }

      console.log('✅ Complete itinerary saved to Supabase!');
      return trip.id;
    } catch (error) {
      console.error('❌ Error in saveItinerary:', error);
      throw error;
    }
  }

  /**
   * Load itinerary from Supabase
   */
  async loadItinerary(tripId: string): Promise<TripItinerary | null> {
    try {
      console.log('📥 Loading itinerary from Supabase:', tripId);

      // Load trip with nested days and meals
      const { data: trip, error: tripError } = await supabase
        .from('trip_itineraries')
        .select(`
          *,
          itinerary_days (
            *,
            itinerary_meals (*)
          )
        `)
        .eq('id', tripId)
        .single();

      if (tripError) {
        console.error('❌ Error loading trip:', tripError);
        return null;
      }

      if (!trip) {
        console.log('⚠️ Trip not found');
        return null;
      }

      // Transform Supabase data to TripItinerary format
      const itinerary: TripItinerary = {
        id: trip.id,
        userId: trip.user_id,
        destination: trip.destination,
        startDate: trip.start_date,
        endDate: trip.end_date,
        totalDays: trip.total_days,
        totalBudget: trip.total_budget,
        spentAmount: trip.spent_amount || 0,
        partySize: trip.party_size,
        dietaryRestrictions: trip.dietary_restrictions || [],
        cuisinePreferences: trip.cuisine_preferences || [],
        status: trip.status as any,
        days: trip.itinerary_days.map((day: any) => ({
          dayNumber: day.day_number,
          date: day.date,
          theme: day.theme,
          totalBudget: day.total_budget,
          meals: day.itinerary_meals.map((meal: any) => ({
            id: meal.id,
            type: meal.meal_type,
            scheduledTime: meal.scheduled_time,
            restaurant: {
              id: meal.restaurant_id,
              name: meal.restaurant_name,
              address: meal.restaurant_address,
              rating: meal.restaurant_rating,
              priceLevel: meal.restaurant_price_level,
              photos: meal.restaurant_photos || [],
              phone: meal.restaurant_phone,
              yelpUrl: meal.restaurant_yelp_url,
            },
            recommendedDishes: meal.recommended_dishes || [],
            estimatedCost: meal.estimated_cost,
            actualCost: meal.actual_cost,
            reservationNeeded: meal.reservation_needed,
            reservationStatus: meal.reservation_status,
            visited: meal.visited,
            rating: meal.rating,
            notes: meal.review_notes,
          })),
        })),
        createdAt: new Date(trip.created_at),
        updatedAt: new Date(trip.updated_at),
      };

      console.log('✅ Itinerary loaded successfully');
      return itinerary;
    } catch (error) {
      console.error('❌ Error in loadItinerary:', error);
      return null;
    }
  }

  /**
   * Get all trips for current user
   */
  async getUserTrips(): Promise<TripItinerary[]> {
    try {
      const user = await ensureUser();
      if (!user) return [];

      const { data: trips, error } = await supabase
        .from('trip_itineraries')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Error loading trips:', error);
        return [];
      }

      return trips.map(trip => ({
        id: trip.id,
        userId: trip.user_id,
        destination: trip.destination,
        startDate: trip.start_date,
        endDate: trip.end_date,
        totalDays: trip.total_days,
        totalBudget: trip.total_budget,
        spentAmount: trip.spent_amount || 0,
        partySize: trip.party_size,
        dietaryRestrictions: trip.dietary_restrictions || [],
        cuisinePreferences: trip.cuisine_preferences || [],
        status: trip.status as any,
        days: [], // Don't load full days for list view
        createdAt: new Date(trip.created_at),
        updatedAt: new Date(trip.updated_at),
      }));
    } catch (error) {
      console.error('❌ Error in getUserTrips:', error);
      return [];
    }
  }

  /**
   * Update trip status
   */
  async updateTripStatus(tripId: string, status: 'draft' | 'confirmed' | 'active' | 'completed'): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('trip_itineraries')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', tripId);

      if (error) {
        console.error('❌ Error updating trip status:', error);
        return false;
      }

      console.log('✅ Trip status updated to:', status);
      return true;
    } catch (error) {
      console.error('❌ Error in updateTripStatus:', error);
      return false;
    }
  }

  /**
   * Delete itinerary
   */
  async deleteItinerary(tripId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('trip_itineraries')
        .delete()
        .eq('id', tripId);

      if (error) {
        console.error('❌ Error deleting trip:', error);
        return false;
      }

      console.log('✅ Trip deleted');
      return true;
    } catch (error) {
      console.error('❌ Error in deleteItinerary:', error);
      return false;
    }
  }
}

// Singleton instance
export const supabaseItineraryService = new SupabaseItineraryService();

