/**
 * AR Result Card Component
 * Displays restaurant recognition results in a beautiful glass card
 */

import React from 'react';
import { View, Text, StyleSheet, ScrollView, Image, Dimensions, TouchableOpacity } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Star, MapPin, Clock, Phone, Heart, Award } from 'lucide-react-native';
import { RecognitionOutput } from '@/services/cameraRecognitionEngine';
import { useFavorites } from '@/context/FavoritesContext';

interface ARResultCardProps {
  result: RecognitionOutput;
}

const { width } = Dimensions.get('window');

export default function ARResultCard({ result }: ARResultCardProps): React.JSX.Element {
  const { google_match, yelp_ai, personalization, confidence_score } = result;
  const { addFavorite, removeFavorite, isFavorite } = useFavorites();
  const restaurantId = google_match.place_id || `restaurant_${Date.now()}`;
  const isFav = isFavorite(restaurantId);

  const handleToggleFavorite = () => {
    if (isFav) {
      removeFavorite(restaurantId);
    } else {
      addFavorite(result, restaurantId);
    }
  };

  if (!google_match.name) {
    return (
      <View style={styles.container}>
        <BlurView intensity={90} tint="light" style={styles.card}>
          <Text style={styles.noResultText}>👋 Point camera at a restaurant sign</Text>
        </BlurView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <BlurView intensity={90} tint="light" style={styles.card}>
        <ScrollView 
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          {/* Header Image */}
          {google_match.images.length > 0 && (
            <Image 
              source={{ uri: google_match.images[0] }} 
              style={styles.headerImage}
            />
          )}

          {/* Restaurant Name & Rating */}
          <View style={styles.header}>
            <View style={styles.titleRow}>
              <Text style={styles.restaurantName}>{google_match.name}</Text>
              <TouchableOpacity
                onPress={handleToggleFavorite}
                activeOpacity={0.7}
                style={styles.heartButton}
              >
                <Heart 
                  size={24} 
                  color={isFav ? "#FF3B30" : "#666"} 
                  fill={isFav ? "#FF3B30" : "transparent"}
                />
              </TouchableOpacity>
            </View>
            
            <View style={styles.ratingRow}>
              <Star size={16} color="#FFD700" fill="#FFD700" />
              <Text style={styles.rating}>{google_match.rating}</Text>
              <Text style={styles.priceLevel}>{google_match.price_level}</Text>
            </View>
          </View>

          {/* Personalization Banner */}
          {personalization.personalized_recommendations.length > 0 && (
            <LinearGradient
              colors={['#FF3B30', '#FF6B58']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.personalBanner}
            >
              <Award size={16} color="#fff" />
              <Text style={styles.personalText}>
                {personalization.personalized_recommendations[0]}
              </Text>
            </LinearGradient>
          )}

          {/* Address */}
          <View style={styles.infoRow}>
            <MapPin size={16} color="#666" />
            <Text style={styles.infoText}>{google_match.address}</Text>
          </View>

          {/* Contact */}
          {google_match.contact && (
            <View style={styles.infoRow}>
              <Phone size={16} color="#666" />
              <Text style={styles.infoText}>{google_match.contact}</Text>
            </View>
          )}

          {/* Hours */}
          {google_match.opening_hours && (
            <View style={styles.infoRow}>
              <Clock size={16} color="#666" />
              <Text style={styles.infoText} numberOfLines={2}>
                {google_match.opening_hours.split(',')[0]}
              </Text>
            </View>
          )}

          {/* Yelp Summary */}
          {yelp_ai.summary && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>About</Text>
              <Text style={styles.summaryText}>{yelp_ai.summary}</Text>
            </View>
          )}

          {/* Popular Dishes */}
          {yelp_ai.popular_dishes.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Popular Dishes</Text>
              <View style={styles.dishContainer}>
                {yelp_ai.popular_dishes.map((dish, index) => (
                  <View key={index} style={styles.dishPill}>
                    <Text style={styles.dishText}>🍽️ {dish}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Dietary Labels */}
          {yelp_ai.dietary_labels.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Dietary Options</Text>
              <View style={styles.labelContainer}>
                {yelp_ai.dietary_labels.map((label, index) => (
                  <View key={index} style={styles.dietPill}>
                    <Text style={styles.dietText}>{label}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Review Highlights */}
          {yelp_ai.review_highlights && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>What People Say</Text>
              <Text style={styles.reviewText}>"{yelp_ai.review_highlights}"</Text>
            </View>
          )}

          {/* Debug Info - OCR Text Detected */}
          {result.ocr_text && (
            <View style={styles.debugSection}>
              <Text style={styles.debugTitle}>📝 Detected Text:</Text>
              <Text style={styles.debugText} numberOfLines={2}>
                {result.ocr_text.slice(0, 100)}...
              </Text>
            </View>
          )}

          {/* Confidence Score */}
          <View style={styles.footer}>
            <Text style={styles.confidenceText}>
              Confidence: {(confidence_score * 100).toFixed(0)}%
            </Text>
          </View>
        </ScrollView>
      </BlurView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingBottom: 120,
    paddingHorizontal: 16,
  },
  card: {
    borderRadius: 28,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.4)',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 15 },
    shadowOpacity: 0.35,
    shadowRadius: 25,
    elevation: 20,
    maxHeight: width * 1.3,
  },
  scrollView: {
    maxHeight: '100%',
  },
  noResultText: {
    padding: 32,
    textAlign: 'center',
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  headerImage: {
    width: '100%',
    height: 200,
    resizeMode: 'cover',
  },
  header: {
    padding: 20,
    paddingBottom: 12,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  heartButton: {
    padding: 4,
  },
  restaurantName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#000',
    flex: 1,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  rating: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  priceLevel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
    marginLeft: 8,
  },
  personalBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    gap: 8,
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 12,
  },
  personalText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    marginBottom: 12,
    gap: 10,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    flex: 1,
    lineHeight: 20,
  },
  section: {
    paddingHorizontal: 20,
    marginTop: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000',
    marginBottom: 12,
  },
  summaryText: {
    fontSize: 14,
    color: '#444',
    lineHeight: 22,
  },
  dishContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  dishPill: {
    backgroundColor: 'rgba(255, 59, 48, 0.1)',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 59, 48, 0.2)',
  },
  dishText: {
    fontSize: 13,
    color: '#FF3B30',
    fontWeight: '600',
  },
  labelContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  dietPill: {
    backgroundColor: 'rgba(52, 199, 89, 0.1)',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(52, 199, 89, 0.3)',
  },
  dietText: {
    fontSize: 12,
    color: '#34C759',
    fontWeight: '600',
  },
  reviewText: {
    fontSize: 14,
    color: '#555',
    fontStyle: 'italic',
    lineHeight: 22,
  },
  debugSection: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    marginTop: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.03)',
    borderRadius: 12,
    marginHorizontal: 20,
  },
  debugTitle: {
    fontSize: 12,
    color: '#666',
    fontWeight: '600',
    marginBottom: 4,
  },
  debugText: {
    fontSize: 11,
    color: '#888',
    fontStyle: 'italic',
    lineHeight: 16,
  },
  footer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    marginTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.1)',
  },
  confidenceText: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    fontWeight: '500',
  },
});

