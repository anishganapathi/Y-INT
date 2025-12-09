/**
 * Full Itinerary Display
 * Shows complete day-by-day food trip itinerary
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import Icon from '@/components/LucideIcons';
import { MotiView } from 'moti';
import { LinearGradient } from 'expo-linear-gradient';
import { supabaseItineraryService } from '@/services/supabaseItineraryService';
import { TripItinerary } from '@/types/itinerary';

const { width } = Dimensions.get('window');

export default function ItineraryScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [itinerary, setItinerary] = useState<TripItinerary | null>(null);
  const [selectedDay, setSelectedDay] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadItinerary();
  }, []);

  const loadItinerary = async () => {
    try {
      const tripId = params.trip_id as string;
      console.log('📥 Loading itinerary from Supabase:', tripId);
      
      const data = await supabaseItineraryService.loadItinerary(tripId);
      
      if (data) {
        setItinerary(data);
        console.log('✅ Loaded itinerary from Supabase:', data.destination);
      } else {
        console.log('⚠️ Itinerary not found in Supabase');
      }
    } catch (error) {
      console.error('❌ Error loading itinerary:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading your itinerary...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!itinerary) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorEmoji}>😕</Text>
          <Text style={styles.errorText}>Itinerary not found</Text>
          <TouchableOpacity
            style={styles.errorButton}
            onPress={() => router.back()}
          >
            <Text style={styles.errorButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const currentDay = itinerary.days[selectedDay - 1];
  const totalMeals = itinerary.days.reduce((sum, day) => sum + day.meals.length, 0);
  const spentBudget = itinerary.days
    .slice(0, selectedDay)
    .reduce((sum, day) => sum + day.meals.reduce((mealSum, meal) => mealSum + meal.estimatedCost, 0), 0);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Icon name="ArrowLeft" size={24} color="#1A1A1A" />
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>{itinerary.destination}</Text>
          <Text style={styles.headerSubtitle}>
            {itinerary.totalDays} days • {totalMeals} meals
          </Text>
        </View>

        <TouchableOpacity style={styles.shareButton}>
          <Icon name="Share2" size={24} color="#1A1A1A" />
        </TouchableOpacity>
      </View>

      {/* Budget Overview Card */}
      <MotiView
        from={{ opacity: 0, translateY: -20 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: 'spring', delay: 100 }}
        style={styles.budgetCard}
      >
        <View style={styles.budgetHeader}>
          <View>
            <Text style={styles.budgetLabel}>Total Budget</Text>
            <Text style={styles.budgetValue}>${itinerary.totalBudget}</Text>
          </View>
          <View style={styles.budgetPerDay}>
            <Text style={styles.budgetPerDayLabel}>Per Day</Text>
            <Text style={styles.budgetPerDayValue}>
              ${Math.round(itinerary.totalBudget / itinerary.totalDays)}
            </Text>
          </View>
        </View>

        <View style={styles.budgetProgress}>
          <View style={styles.progressBarBg}>
            <View
              style={[
                styles.progressBarFill,
                { width: `${(spentBudget / itinerary.totalBudget) * 100}%` },
              ]}
            >
              <LinearGradient
                colors={['#34C759', '#30D158']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.progressGradient}
              />
            </View>
          </View>
          <Text style={styles.budgetRemaining}>
            ${itinerary.totalBudget - spentBudget} remaining
          </Text>
        </View>
      </MotiView>

      {/* Day Tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.dayTabs}
      >
        {itinerary.days.map((day, index) => {
          const isActive = selectedDay === day.dayNumber;
          const date = new Date(day.date);
          
          return (
            <TouchableOpacity
              key={day.dayNumber}
              style={[styles.dayTab, isActive && styles.dayTabActive]}
              onPress={() => setSelectedDay(day.dayNumber)}
            >
              <Text style={[styles.dayTabLabel, isActive && styles.dayTabLabelActive]}>
                Day {day.dayNumber}
              </Text>
              <Text style={[styles.dayTabDate, isActive && styles.dayTabDateActive]}>
                {date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Day Content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Day Theme */}
        <MotiView
          key={`theme-${selectedDay}`}
          from={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring' }}
          style={styles.themeCard}
        >
          <Icon name="Sparkles" size={20} color="#FF3B30" />
          <Text style={styles.themeText}>{currentDay.theme}</Text>
        </MotiView>

        {/* Meals */}
        {currentDay.meals.map((meal, index) => (
          <MotiView
            key={meal.id}
            from={{ opacity: 0, translateY: 30 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'spring', delay: index * 100 + 200 }}
            style={styles.mealCard}
          >
            {/* Meal Header */}
            <View style={styles.mealHeader}>
              <View style={styles.mealTimeContainer}>
                <View style={styles.mealIconCircle}>
                  <Text style={styles.mealEmoji}>
                    {meal.type === 'breakfast' ? '🍳' : meal.type === 'lunch' ? '🍱' : '🍽️'}
                  </Text>
                </View>
                <View>
                  <Text style={styles.mealType}>
                    {meal.type.charAt(0).toUpperCase() + meal.type.slice(1)}
                  </Text>
                  <Text style={styles.mealTime}>{meal.scheduledTime}</Text>
                </View>
              </View>
              <View style={styles.costBadge}>
                <Text style={styles.costText}>${meal.estimatedCost}</Text>
              </View>
            </View>

            {/* Restaurant Image */}
            {meal.restaurant.photos && meal.restaurant.photos.length > 0 && (
              <Image
                source={{ uri: meal.restaurant.photos[0] }}
                style={styles.restaurantImage}
                resizeMode="cover"
              />
            )}

            {/* Restaurant Info */}
            <View style={styles.restaurantInfo}>
              <Text style={styles.restaurantName}>{meal.restaurant.name}</Text>
              
              <View style={styles.restaurantMeta}>
                <View style={styles.ratingContainer}>
                  <Icon name="Star" size={14} color="#FFD700" fill="#FFD700" />
                  <Text style={styles.ratingText}>{meal.restaurant.rating}</Text>
                </View>
                <Text style={styles.priceLevel}>{meal.restaurant.priceLevel}</Text>
                {meal.reservationNeeded && (
                  <View style={styles.reservationBadge}>
                    <Icon name="Calendar" size={12} color="#FF3B30" />
                    <Text style={styles.reservationText}>Reserve</Text>
                  </View>
                )}
              </View>

              {/* Address */}
              <View style={styles.addressContainer}>
                <Icon name="MapPin" size={14} color="#8E8E93" />
                <Text style={styles.addressText} numberOfLines={1}>
                  {meal.restaurant.address}
                </Text>
              </View>

              {/* Recommended Dishes */}
              {meal.recommendedDishes.length > 0 && (
                <View style={styles.dishesContainer}>
                  <Text style={styles.dishesLabel}>🍴 Recommended</Text>
                  {meal.recommendedDishes.map((dish, dishIndex) => (
                    <View key={dishIndex} style={styles.dishItem}>
                      <View style={styles.dishLeft}>
                        <Text style={styles.dishName}>{dish.name}</Text>
                        <Text style={styles.dishWhy}>{dish.why}</Text>
                      </View>
                      <Text style={styles.dishPrice}>${dish.price}</Text>
                    </View>
                  ))}
                </View>
              )}

              {/* Action Buttons */}
              <View style={styles.actionButtons}>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => {
                    // Open restaurant detail
                    console.log('View restaurant:', meal.restaurant.id);
                  }}
                >
                  <Icon name="Info" size={18} color="#FF3B30" />
                  <Text style={styles.actionButtonText}>Details</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => {
                    // Open maps
                    console.log('Open maps for:', meal.restaurant.name);
                  }}
                >
                  <Icon name="Map" size={18} color="#FF3B30" />
                  <Text style={styles.actionButtonText}>Directions</Text>
                </TouchableOpacity>

                {meal.reservationNeeded && (
                  <TouchableOpacity
                    style={[styles.actionButton, styles.actionButtonPrimary]}
                  >
                    <LinearGradient
                      colors={['#FF3B30', '#FF6B6B']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.actionButtonGradient}
                    >
                      <Icon name="Calendar" size={18} color="#FFF" />
                      <Text style={styles.actionButtonTextPrimary}>Book</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </MotiView>
        ))}

        {/* Day Summary */}
        <View style={styles.daySummaryCard}>
          <Text style={styles.daySummaryTitle}>Day {selectedDay} Summary</Text>
          <View style={styles.daySummaryRow}>
            <Text style={styles.daySummaryLabel}>Meals</Text>
            <Text style={styles.daySummaryValue}>{currentDay.meals.length}</Text>
          </View>
          <View style={styles.daySummaryRow}>
            <Text style={styles.daySummaryLabel}>Estimated Cost</Text>
            <Text style={styles.daySummaryValue}>
              ${currentDay.meals.reduce((sum, meal) => sum + meal.estimatedCost, 0)}
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FB',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#8E8E93',
    fontWeight: '600',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  errorEmoji: {
    fontSize: 64,
    marginBottom: 20,
  },
  errorText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 24,
  },
  errorButton: {
    backgroundColor: '#FF3B30',
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 12,
  },
  errorButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F8F9FB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCenter: {
    flex: 1,
    marginHorizontal: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1A1A1A',
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#8E8E93',
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 2,
  },
  shareButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F8F9FB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  budgetCard: {
    backgroundColor: '#FFF',
    marginHorizontal: 20,
    marginTop: 16,
    marginBottom: 16,
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  budgetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  budgetLabel: {
    fontSize: 14,
    color: '#8E8E93',
    fontWeight: '600',
    marginBottom: 4,
  },
  budgetValue: {
    fontSize: 32,
    fontWeight: '800',
    color: '#1A1A1A',
  },
  budgetPerDay: {
    alignItems: 'flex-end',
  },
  budgetPerDayLabel: {
    fontSize: 12,
    color: '#8E8E93',
    fontWeight: '600',
    marginBottom: 4,
  },
  budgetPerDayValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FF3B30',
  },
  budgetProgress: {
    marginTop: 8,
  },
  progressBarBg: {
    height: 8,
    backgroundColor: '#F0F0F0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressGradient: {
    width: '100%',
    height: '100%',
  },
  budgetRemaining: {
    fontSize: 13,
    color: '#34C759',
    fontWeight: '700',
    marginTop: 8,
    textAlign: 'right',
  },
  dayTabs: {
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 16,
  },
  dayTab: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderWidth: 1.5,
    borderColor: '#F0F0F0',
    minWidth: 80,
    alignItems: 'center',
  },
  dayTabActive: {
    backgroundColor: '#FF3B30',
    borderColor: '#FF3B30',
  },
  dayTabLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#8E8E93',
    marginBottom: 2,
  },
  dayTabLabelActive: {
    color: '#FFF',
  },
  dayTabDate: {
    fontSize: 12,
    fontWeight: '600',
    color: '#8E8E93',
  },
  dayTabDateActive: {
    color: 'rgba(255,255,255,0.9)',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  themeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 59, 48, 0.05)',
    borderRadius: 16,
    padding: 16,
    gap: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 59, 48, 0.1)',
  },
  themeText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FF3B30',
  },
  mealCard: {
    backgroundColor: '#FFF',
    borderRadius: 24,
    marginBottom: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
  },
  mealHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingBottom: 16,
  },
  mealTimeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  mealIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F8F9FB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  mealEmoji: {
    fontSize: 24,
  },
  mealType: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  mealTime: {
    fontSize: 14,
    color: '#8E8E93',
    fontWeight: '600',
    marginTop: 2,
  },
  costBadge: {
    backgroundColor: '#34C759',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  costText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFF',
  },
  restaurantImage: {
    width: '100%',
    height: 180,
  },
  restaurantInfo: {
    padding: 20,
  },
  restaurantName: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  restaurantMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  priceLevel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#8E8E93',
  },
  reservationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 59, 48, 0.1)',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 8,
    gap: 4,
  },
  reservationText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FF3B30',
  },
  addressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  addressText: {
    flex: 1,
    fontSize: 14,
    color: '#8E8E93',
    fontWeight: '500',
  },
  dishesContainer: {
    backgroundColor: '#F8F9FB',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  dishesLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FF3B30',
    marginBottom: 12,
  },
  dishItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  dishLeft: {
    flex: 1,
    marginRight: 16,
  },
  dishName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  dishWhy: {
    fontSize: 12,
    color: '#8E8E93',
    fontWeight: '500',
  },
  dishPrice: {
    fontSize: 16,
    fontWeight: '800',
    color: '#34C759',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8F9FB',
    borderRadius: 12,
    paddingVertical: 12,
    gap: 6,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FF3B30',
  },
  actionButtonPrimary: {
    backgroundColor: 'transparent',
    borderWidth: 0,
    overflow: 'hidden',
  },
  actionButtonGradient: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 6,
  },
  actionButtonTextPrimary: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFF',
  },
  daySummaryCard: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 20,
    marginTop: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  daySummaryTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1A1A1A',
    marginBottom: 16,
  },
  daySummaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  daySummaryLabel: {
    fontSize: 15,
    color: '#8E8E93',
    fontWeight: '600',
  },
  daySummaryValue: {
    fontSize: 17,
    fontWeight: '800',
    color: '#1A1A1A',
  },
});

