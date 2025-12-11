/**
 * Saved Itineraries Page
 * Displays all saved itineraries in card containers
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MotiView } from 'moti';
import Icon from '@/components/LucideIcons';
import { useSavedItineraries } from '@/context/SavedItinerariesContext';
import { LinearGradient } from 'expo-linear-gradient';

export default function SavedItinerariesPage() {
  const router = useRouter();
  const { savedItineraries, loadSavedItineraries, removeSavedItinerary } = useSavedItineraries();

  useEffect(() => {
    loadSavedItineraries();
  }, []);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <MotiView
        from={{ opacity: 0, translateY: -20 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: 'timing', duration: 600 }}
        style={styles.header}
      >
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <Icon name="ChevronLeft" size={24} color="#1A1A1A" />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>Saved Itineraries</Text>
          <Text style={styles.headerSubtitle}>
            {savedItineraries.length} {savedItineraries.length === 1 ? 'trip' : 'trips'} saved
          </Text>
        </View>
        <View style={styles.headerRight} />
      </MotiView>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {savedItineraries.length === 0 ? (
          <MotiView
            from={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring' }}
            style={styles.emptyContainer}
          >
            <Icon name="MapPin" size={64} color="#C7C7CC" />
            <Text style={styles.emptyText}>No saved itineraries yet</Text>
            <Text style={styles.emptySubtext}>Save an itinerary to see it here</Text>
          </MotiView>
        ) : (
          <View style={styles.itinerariesList}>
            {savedItineraries.map((itinerary, index) => {
              const startDate = new Date(itinerary.startDate);
              const endDate = new Date(itinerary.endDate);
              const totalMeals = itinerary.days.reduce((sum, day) => sum + day.meals.length, 0);
              const remainingBudget = itinerary.totalBudget - itinerary.spentAmount;

              return (
                <MotiView
                  key={itinerary.id}
                  from={{ opacity: 0, translateY: 20 }}
                  animate={{ opacity: 1, translateY: 0 }}
                  transition={{ type: 'spring', delay: index * 100 }}
                >
                  <TouchableOpacity
                    style={styles.itineraryCard}
                    activeOpacity={0.8}
                    onPress={() => router.push(`/itinerary/${itinerary.id}`)}
                  >
                    <LinearGradient
                      colors={['#FFF', '#FAFAFA']}
                      style={styles.itineraryCardGradient}
                    >
                      {/* Card Header */}
                      <View style={styles.itineraryCardHeader}>
                        <View style={styles.itineraryCardHeaderLeft}>
                          <View style={styles.itineraryIconContainer}>
                            <Icon name="MapPin" size={20} color="#FA6868" />
                          </View>
                          <View style={styles.itineraryInfoContainer}>
                            <Text style={styles.itineraryDestination}>{itinerary.destination}</Text>
                            <Text style={styles.itineraryDates}>
                              {startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                            </Text>
                          </View>
                        </View>
                        <TouchableOpacity
                          style={styles.deleteButton}
                          onPress={(e) => {
                            e.stopPropagation();
                            removeSavedItinerary(itinerary.id);
                          }}
                          activeOpacity={0.7}
                        >
                          <Icon name="Trash2" size={18} color="#FA6868" />
                        </TouchableOpacity>
                      </View>

                      {/* Budget Info */}
                      <View style={styles.itineraryBudgetRow}>
                        <View style={styles.budgetItem}>
                          <Text style={styles.budgetLabel}>Budget</Text>
                          <Text style={styles.budgetValue}>${itinerary.totalBudget}</Text>
                        </View>
                        <View style={styles.budgetDivider} />
                        <View style={styles.budgetItem}>
                          <Text style={styles.budgetLabel}>Remaining</Text>
                          <Text style={[styles.budgetValue, { color: '#34C759' }]}>
                            ${remainingBudget.toFixed(0)}
                          </Text>
                        </View>
                        <View style={styles.budgetDivider} />
                        <View style={styles.budgetItem}>
                          <Text style={styles.budgetLabel}>Meal</Text>
                          <Text style={styles.budgetValue}>{totalMeals}</Text>
                        </View>
                      </View>
                    </LinearGradient>
                  </TouchableOpacity>
                </MotiView>
              );
            })}
          </View>
        )}

        {/* Bottom Spacing */}
        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F7',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#F5F5F7',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 16,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1A1A1A',
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#8E8E93',
  },
  headerRight: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 100,
    gap: 16,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  emptySubtext: {
    fontSize: 15,
    fontWeight: '500',
    color: '#8E8E93',
  },
  itinerariesList: {
    gap: 16,
  },
  itineraryCard: {
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 4,
    marginBottom: 4,
  },
  itineraryCardGradient: {
    padding: 20,
  },
  itineraryCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  itineraryCardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    flex: 1,
  },
  itineraryIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FFF5F5',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#FFE5E5',
  },
  itineraryInfoContainer: {
    flex: 1,
  },
  itineraryDestination: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1A1A1A',
    marginBottom: 6,
  },
  itineraryDates: {
    fontSize: 14,
    fontWeight: '500',
    color: '#8E8E93',
  },
  deleteButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#FFE5E5',
  },
  itineraryBudgetRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    backgroundColor: '#FFF',
    borderRadius: 16,
  },
  budgetItem: {
    flex: 1,
    alignItems: 'center',
  },
  budgetLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#8E8E93',
    marginBottom: 6,
  },
  budgetValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  budgetDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#F0F0F0',
  },
});
