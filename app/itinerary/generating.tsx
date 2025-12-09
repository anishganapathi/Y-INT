/**
 * Generating Itinerary Screen
 * Shows AI generating the food trip itinerary with animations
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { MotiView } from 'moti';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from '@/components/LucideIcons';
import { yelpItineraryService } from '@/services/yelpItineraryService';
import { smartItineraryEngine } from '@/services/aiItineraryEngine';
import { supabaseItineraryService } from '@/services/supabaseItineraryService';

const { width } = Dimensions.get('window');

const GENERATION_STEPS = [
  { icon: 'Search', text: 'Searching restaurants in destination...', delay: 0 },
  { icon: 'Filter', text: 'Applying dietary filters...', delay: 2000 },
  { icon: 'Sparkles', text: 'AI analyzing menus & reviews...', delay: 4000 },
  { icon: 'Calculator', text: 'Optimizing budget allocation...', delay: 6000 },
  { icon: 'MapPin', text: 'Planning optimal routes...', delay: 8000 },
  { icon: 'CheckCircle', text: 'Finalizing your itinerary...', delay: 10000 },
];

export default function GeneratingItineraryScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(0);
  const [restaurants, setRestaurants] = useState<any[]>([]);
  const [itinerary, setItinerary] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [isNavigating, setIsNavigating] = useState(false);

  useEffect(() => {
    // Fetch real restaurants and generate itinerary
    generateCompleteItinerary();
  }, []);

  // Navigate when itinerary is ready and progress is complete
  useEffect(() => {
    if (itinerary && progress >= 100 && !isNavigating) {
      setIsNavigating(true);
      console.log('🚀 Navigating to itinerary:', itinerary.id);
      // Small delay to show 100% completion
      setTimeout(() => {
        router.replace(`/itinerary/${itinerary.id}`);
      }, 500);
    }
  }, [itinerary, progress, isNavigating, router]);

  const generateCompleteItinerary = async () => {
    try {
      const tripData = parseParams();
      
      // Step 1: Fetch restaurants from Yelp
      console.log('🚀 Step 1: Fetching restaurants from Yelp...');
      
      const restaurantList = await yelpItineraryService.searchRestaurantsForItinerary({
        destination: tripData.destination,
        dietaryRestrictions: tripData.dietary,
        cuisinePreferences: tripData.cuisines,
        budget: tripData.budget,
        days: tripData.days,
        partySize: tripData.partySize,
      });

      console.log(`✅ Got ${restaurantList.length} restaurants from Yelp`);
      setRestaurants(restaurantList);

      // Step 2: Generate smart itinerary
      console.log('🎯 Step 2: Generating smart itinerary...');
      
      const generatedItinerary = smartItineraryEngine.generateItinerary({
        destination: tripData.destination,
        startDate: tripData.startDate,
        endDate: tripData.endDate,
        totalBudget: tripData.budget,
        partySize: tripData.partySize,
        mealTypes: tripData.meals,
        restaurants: restaurantList,
      });

      console.log('✅ Itinerary generated successfully!');
      console.log('   Days:', generatedItinerary.days.length);
      console.log('   Total meals:', generatedItinerary.days.reduce((sum, day) => sum + day.meals.length, 0));
      
      // Save itinerary to Supabase
      console.log('💾 Saving to Supabase cloud...');
      const savedTripId = await supabaseItineraryService.saveItinerary(generatedItinerary);
      
      // Update itinerary with Supabase ID
      const updatedItinerary = { ...generatedItinerary, id: savedTripId };
      setItinerary(updatedItinerary);
      
      console.log('✅ Itinerary saved to Supabase cloud! ID:', savedTripId);
    } catch (err) {
      console.error('❌ Error generating itinerary:', err);
      setError('Failed to generate itinerary');
    }
  };

  useEffect(() => {
    // Progress bar animation
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          return 100;
        }
        return prev + 1;
      });
    }, 120); // 12 seconds total

    // Step progression
    const stepTimers = GENERATION_STEPS.map((step, index) => {
      return setTimeout(() => {
        setCurrentStep(index);
      }, step.delay);
    });

    return () => {
      clearInterval(progressInterval);
      stepTimers.forEach(timer => clearTimeout(timer));
    };
  }, []);

  const parseParams = () => {
    try {
      const dietary = params.dietary ? JSON.parse(params.dietary as string) : [];
      const cuisines = params.cuisines ? JSON.parse(params.cuisines as string) : [];
      const meals = params.meals ? JSON.parse(params.meals as string) : ['breakfast', 'lunch', 'dinner'];
      
      const startDate = new Date(params.startDate as string);
      const endDate = new Date(params.endDate as string);
      
      return {
        destination: params.destination as string || 'your destination',
        startDate,
        endDate,
        days: Math.ceil(
          (endDate.getTime() - startDate.getTime()) / 
          (1000 * 60 * 60 * 24)
        ) || 5,
        budget: parseInt(params.budget as string) || 500,
        partySize: parseInt(params.partySize as string) || 2,
        dietary,
        cuisines,
        meals,
      };
    } catch {
      return {
        destination: 'your destination',
        startDate: new Date(),
        endDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
        days: 5,
        budget: 500,
        partySize: 2,
        dietary: [],
        cuisines: [],
        meals: ['breakfast', 'lunch', 'dinner'],
      };
    }
  };

  const tripData = parseParams();

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.content}>
        {/* Header */}
        <MotiView
          from={{ opacity: 0, translateY: -20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 600 }}
          style={styles.header}
        >
          <Text style={styles.headerTitle}>✨ Creating Your</Text>
          <Text style={styles.headerTitle}>Food Journey</Text>
          
          <View style={styles.tripInfoCard}>
            <View style={styles.tripInfoRow}>
              <Icon name="MapPin" size={16} color="#FF3B30" />
              <Text style={styles.tripInfoText}>{tripData.destination}</Text>
            </View>
            <View style={styles.tripInfoDivider} />
            <View style={styles.tripInfoRow}>
              <Icon name="Calendar" size={16} color="#FF3B30" />
              <Text style={styles.tripInfoText}>{tripData.days} days</Text>
            </View>
            <View style={styles.tripInfoDivider} />
            <View style={styles.tripInfoRow}>
              <Icon name="DollarSign" size={16} color="#FF3B30" />
              <Text style={styles.tripInfoText}>${tripData.budget}</Text>
            </View>
          </View>
        </MotiView>

        {/* Animated Center Icon */}
        <View style={styles.centerContainer}>
          <MotiView
            from={{ scale: 0, rotate: '0deg' }}
            animate={{ scale: 1, rotate: '360deg' }}
            transition={{
              type: 'timing',
              duration: 2000,
              loop: true,
            }}
            style={styles.spinnerOuter}
          >
            <LinearGradient
              colors={['#FF3B30', '#FF6B6B', '#FF3B30']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.spinnerGradient}
            >
              <MotiView
                from={{ rotate: '0deg' }}
                animate={{ rotate: '-360deg' }}
                transition={{
                  type: 'timing',
                  duration: 2000,
                  loop: true,
                }}
              >
                <Icon name="Sparkles" size={48} color="#FFF" />
              </MotiView>
            </LinearGradient>
          </MotiView>

          {/* Floating Particles */}
          {[...Array(6)].map((_, index) => (
            <MotiView
              key={index}
              from={{
                opacity: 0,
                translateY: 0,
                translateX: 0,
              }}
              animate={{
                opacity: [0, 1, 0],
                translateY: -100,
                translateX: Math.cos((index * Math.PI) / 3) * 80,
              }}
              transition={{
                type: 'timing',
                duration: 3000,
                delay: index * 500,
                loop: true,
              }}
              style={[
                styles.particle,
                {
                  left: width / 2 - 8,
                  top: '45%',
                },
              ]}
            >
              <Text style={styles.particleEmoji}>
                {['🍕', '🍣', '🌮', '🍝', '🍔', '🍜'][index]}
              </Text>
            </MotiView>
          ))}
        </View>

        {/* Progress Steps */}
        <View style={styles.stepsContainer}>
          {GENERATION_STEPS.map((step, index) => {
            const IconComponent = Icon;
            const isActive = index === currentStep;
            const isCompleted = index < currentStep;

            return (
              <MotiView
                key={index}
                from={{ opacity: 0, translateX: -20 }}
                animate={{
                  opacity: index <= currentStep ? 1 : 0.3,
                  translateX: 0,
                }}
                transition={{
                  type: 'timing',
                  duration: 400,
                  delay: index * 100,
                }}
                style={styles.stepItem}
              >
                <View
                  style={[
                    styles.stepIconContainer,
                    isActive && styles.stepIconActive,
                    isCompleted && styles.stepIconCompleted,
                  ]}
                >
                  <IconComponent
                    name={step.icon as any}
                    size={20}
                    color={isActive || isCompleted ? '#FFF' : '#999'}
                  />
                </View>
                <Text
                  style={[
                    styles.stepText,
                    isActive && styles.stepTextActive,
                  ]}
                >
                  {step.text}
                </Text>
              </MotiView>
            );
          })}
        </View>

        {/* Progress Bar */}
        <MotiView
          from={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', delay: 500 }}
          style={styles.progressContainer}
        >
          <View style={styles.progressBar}>
            <MotiView
              animate={{
                width: `${progress}%`,
              }}
              transition={{
                type: 'timing',
                duration: 100,
              }}
              style={styles.progressFill}
            >
              <LinearGradient
                colors={['#FF3B30', '#FF6B6B']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.progressGradient}
              />
            </MotiView>
          </View>
          <Text style={styles.progressText}>{progress}%</Text>
        </MotiView>

        {/* Fun Fact / Status */}
        <MotiView
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 600, delay: 1000 }}
          style={styles.funFactCard}
        >
          {error ? (
            <>
              <Text style={[styles.funFactLabel, { color: '#FF3B30' }]}>⚠️ Error</Text>
              <Text style={styles.funFactText}>{error}</Text>
            </>
          ) : itinerary ? (
            <>
              <Text style={styles.funFactLabel}>✅ Itinerary Ready!</Text>
              <Text style={styles.funFactText}>
                Created a perfect {itinerary.totalDays}-day food journey with {' '}
                {itinerary.days.reduce((sum: number, day: any) => sum + day.meals.length, 0)} amazing meals 
                planned across {restaurants.length} restaurants!
              </Text>
            </>
          ) : restaurants.length > 0 ? (
            <>
              <Text style={styles.funFactLabel}>✅ Found Restaurants!</Text>
              <Text style={styles.funFactText}>
                Discovered {restaurants.length} amazing restaurants in {tripData.destination}. 
                Now creating your perfect food journey...
              </Text>
            </>
          ) : (
            <>
              <Text style={styles.funFactLabel}>💡 Did you know?</Text>
              <Text style={styles.funFactText}>
                We analyze thousands of reviews to find the perfect dishes for you!
              </Text>
            </>
          )}
        </MotiView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FB',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  header: {
    paddingTop: 40,
    paddingBottom: 30,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 36,
    fontWeight: '800',
    color: '#1A1A1A',
    textAlign: 'center',
  },
  tripInfoCard: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 16,
    marginTop: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  tripInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  tripInfoText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  tripInfoDivider: {
    width: 1,
    height: 20,
    backgroundColor: '#F0F0F0',
    marginHorizontal: 12,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  spinnerOuter: {
    width: 140,
    height: 140,
    borderRadius: 70,
    overflow: 'hidden',
    shadowColor: '#FF3B30',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 10,
  },
  spinnerGradient: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  particle: {
    position: 'absolute',
    fontSize: 24,
  },
  particleEmoji: {
    fontSize: 24,
  },
  stepsContainer: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 16,
  },
  stepIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepIconActive: {
    backgroundColor: '#FF3B30',
  },
  stepIconCompleted: {
    backgroundColor: '#34C759',
  },
  stepText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: '#999',
  },
  stepTextActive: {
    color: '#1A1A1A',
    fontWeight: '700',
  },
  progressContainer: {
    marginBottom: 24,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#F0F0F0',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressGradient: {
    width: '100%',
    height: '100%',
  },
  progressText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FF3B30',
    textAlign: 'center',
  },
  funFactCard: {
    backgroundColor: 'rgba(255, 59, 48, 0.05)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 59, 48, 0.1)',
  },
  funFactLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FF3B30',
    marginBottom: 6,
  },
  funFactText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#666',
    lineHeight: 18,
  },
});

