/**
 * Itinerary Preview Screen (Placeholder)
 * Shows success message - will be replaced with full itinerary in Step 5
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { MotiView } from 'moti';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from '@/components/LucideIcons';

export default function ItineraryPreviewScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.content}>
        {/* Success Animation */}
        <MotiView
          from={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{
            type: 'spring',
            damping: 12,
            stiffness: 100,
          }}
          style={styles.successContainer}
        >
          <View style={styles.checkCircle}>
            <LinearGradient
              colors={['#34C759', '#30D158']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.checkGradient}
            >
              <Icon name="Check" size={64} color="#FFF" strokeWidth={4} />
            </LinearGradient>
          </View>
        </MotiView>

        {/* Success Message */}
        <MotiView
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 600, delay: 300 }}
          style={styles.messageContainer}
        >
          <Text style={styles.successTitle}>Itinerary Generated! 🎉</Text>
          <Text style={styles.successSubtitle}>
            Your food journey to {params.destination} is ready
          </Text>

          <View style={styles.statsCard}>
            <View style={styles.statItem}>
              <Icon name="Calendar" size={20} color="#FF3B30" />
              <Text style={styles.statValue}>
                {(() => {
                  try {
                    const start = new Date(params.startDate as string);
                    const end = new Date(params.endDate as string);
                    const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
                    return days || 5;
                  } catch {
                    return 5;
                  }
                })()} Days
              </Text>
              <Text style={styles.statLabel}>Trip Duration</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Icon name="UtensilsCrossed" size={20} color="#FF3B30" />
              <Text style={styles.statValue}>
                {(() => {
                  try {
                    const start = new Date(params.startDate as string);
                    const end = new Date(params.endDate as string);
                    const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
                    const meals = params.meals ? JSON.parse(params.meals as string).length : 3;
                    return (days || 5) * meals;
                  } catch {
                    return 15;
                  }
                })()} Meals
              </Text>
              <Text style={styles.statLabel}>Planned</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Icon name="MapPin" size={20} color="#FF3B30" />
              <Text style={styles.statValue}>{params.restaurantCount || '50'} Places</Text>
              <Text style={styles.statLabel}>Discovered</Text>
            </View>
          </View>
        </MotiView>

        {/* Coming Soon Badge */}
        <MotiView
          from={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', delay: 600 }}
          style={styles.comingSoonCard}
        >
          <Text style={styles.comingSoonEmoji}>🚧</Text>
          <Text style={styles.comingSoonTitle}>Full Itinerary Coming Soon!</Text>
          <Text style={styles.comingSoonText}>
            We're building the complete itinerary display with:
          </Text>
          <View style={styles.featuresList}>
            <Text style={styles.featureItem}>✓ Day-by-day meal plans</Text>
            <Text style={styles.featureItem}>✓ Restaurant details & dishes</Text>
            <Text style={styles.featureItem}>✓ Budget tracking</Text>
            <Text style={styles.featureItem}>✓ Map view & reservations</Text>
          </View>
        </MotiView>

        {/* Action Buttons */}
        <View style={styles.buttonsContainer}>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => router.push('/(tabs)')}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['#FF3B30', '#FF6B6B']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.buttonGradient}
            >
              <Icon name="Home" size={20} color="#FFF" />
              <Text style={styles.primaryButtonText}>Back to Home</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => router.back()}
            activeOpacity={0.8}
          >
            <Icon name="RotateCcw" size={20} color="#FF3B30" />
            <Text style={styles.secondaryButtonText}>Plan Another Trip</Text>
          </TouchableOpacity>
        </View>
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
    paddingTop: 60,
  },
  successContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  checkCircle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    overflow: 'hidden',
    shadowColor: '#34C759',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 10,
  },
  checkGradient: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  messageContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  successTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: '#1A1A1A',
    textAlign: 'center',
    marginBottom: 12,
  },
  successSubtitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#666',
    textAlign: 'center',
    marginBottom: 32,
  },
  statsCard: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    gap: 8,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1A1A1A',
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#999',
  },
  statDivider: {
    width: 1,
    backgroundColor: '#F0F0F0',
    marginHorizontal: 12,
  },
  comingSoonCard: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 24,
    marginBottom: 32,
    borderWidth: 2,
    borderColor: '#FFD700',
    borderStyle: 'dashed',
  },
  comingSoonEmoji: {
    fontSize: 48,
    textAlign: 'center',
    marginBottom: 16,
  },
  comingSoonTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1A1A1A',
    textAlign: 'center',
    marginBottom: 12,
  },
  comingSoonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 20,
  },
  featuresList: {
    gap: 8,
  },
  featureItem: {
    fontSize: 14,
    fontWeight: '600',
    color: '#34C759',
    textAlign: 'center',
  },
  buttonsContainer: {
    gap: 12,
  },
  primaryButton: {
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#FF3B30',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  buttonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    gap: 12,
  },
  primaryButtonText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFF',
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF',
    borderRadius: 20,
    paddingVertical: 18,
    gap: 12,
    borderWidth: 2,
    borderColor: '#FF3B30',
  },
  secondaryButtonText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FF3B30',
  },
});

