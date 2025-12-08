/**
 * Restaurant Detail Page
 * Shows full restaurant information after camera scan
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  StatusBar,
  Dimensions,
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowLeft, Heart, Star, MapPin, Clock, Phone, Award } from 'lucide-react-native';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import { useFavorites } from '@/context/FavoritesContext';

const { width, height } = Dimensions.get('window');

export default function RestaurantDetailPage() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { addFavorite, removeFavorite, isFavorite: checkIsFavorite } = useFavorites();

  // Parse the restaurant data from params
  const restaurantData = params.data ? JSON.parse(params.data as string) : null;
  const restaurantId = params.id as string;

  const isFavorite = restaurantData ? checkIsFavorite(restaurantId) : false;

  const toggleFavorite = () => {
    if (!restaurantData) return;

    if (isFavorite) {
      removeFavorite(restaurantId);
    } else {
      addFavorite(restaurantData, restaurantId);
    }
  };

  if (!restaurantData) {
    return (
      <View style={styles.container}>
        <Text>Loading...</Text>
      </View>
    );
  }

  const { google_match, yelp_ai, personalization } = restaurantData;

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar barStyle="light-content" />
      
      <View style={styles.container}>
        <ScrollView 
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          bounces={true}
        >
          {/* Hero Image */}
          <View style={styles.heroContainer}>
            {google_match.images && google_match.images.length > 0 ? (
              <Image
                source={{ uri: google_match.images[0] }}
                style={styles.heroImage}
                resizeMode="cover"
              />
            ) : (
              <View style={[styles.heroImage, styles.placeholderImage]}>
                <Text style={styles.placeholderText}>No Image</Text>
              </View>
            )}
            
            {/* Gradient Overlay */}
            <LinearGradient
              colors={['rgba(0,0,0,0.6)', 'transparent', 'rgba(0,0,0,0.8)']}
              style={styles.heroGradient}
            />

            {/* Header Buttons */}
            <View style={styles.headerButtons}>
              <TouchableOpacity
                style={styles.headerButton}
                onPress={() => router.back()}
                activeOpacity={0.8}
              >
                <BlurView intensity={60} tint="dark" style={styles.buttonBlur}>
                  <ArrowLeft size={24} color="#fff" strokeWidth={2.5} />
                </BlurView>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.headerButton}
                onPress={toggleFavorite}
                activeOpacity={0.8}
              >
                <BlurView intensity={60} tint="dark" style={styles.buttonBlur}>
                  <Heart
                    size={24}
                    color={isFavorite ? "#FF3B30" : "#fff"}
                    fill={isFavorite ? "#FF3B30" : "transparent"}
                    strokeWidth={2.5}
                  />
                </BlurView>
              </TouchableOpacity>
            </View>
          </View>

          {/* Content Card */}
          <Animated.View 
            entering={FadeInDown.duration(400).springify()}
            style={styles.contentCard}
          >
            {/* Restaurant Name & Location */}
            <View style={styles.titleSection}>
              <Text style={styles.restaurantName}>{google_match.name}</Text>
              
              <View style={styles.locationRow}>
                <View style={styles.locationBadge}>
                  <MapPin size={14} color="#34C759" strokeWidth={2} />
                  <Text style={styles.locationText}>
                    {google_match.address.split(',')[1]?.trim() || 'Location'}
                  </Text>
                </View>
                
                <View style={styles.ratingBadge}>
                  <Star size={14} color="#FFD700" fill="#FFD700" strokeWidth={2} />
                  <Text style={styles.ratingText}>{google_match.rating}</Text>
                  <Text style={styles.reviewCount}>
                    {yelp_ai?.review_count || '143'} reviews
                  </Text>
                </View>
              </View>
            </View>

            {/* Personalization Banner */}
            {personalization.personalized_recommendations.length > 0 && (
              <Animated.View entering={FadeIn.delay(200)}>
                <LinearGradient
                  colors={['#FF3B30', '#FF6B58']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.personalBanner}
                >
                  <Award size={18} color="#fff" />
                  <Text style={styles.personalText}>
                    {personalization.personalized_recommendations[0]}
                  </Text>
                </LinearGradient>
              </Animated.View>
            )}

            {/* Description */}
            {yelp_ai?.summary && (
              <View style={styles.descriptionSection}>
                <Text style={styles.description}>
                  {yelp_ai.summary}
                </Text>
                <TouchableOpacity>
                  <Text style={styles.readMore}>Read more</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Quick Info */}
            <View style={styles.infoGrid}>
              <View style={styles.infoItem}>
                <View style={styles.infoIcon}>
                  <Clock size={20} color="#FF3B30" />
                </View>
                <Text style={styles.infoLabel}>Hours</Text>
                <Text style={styles.infoValue} numberOfLines={2}>
                  {google_match.opening_hours?.split(',')[0] || 'See hours'}
                </Text>
              </View>

              <View style={styles.infoItem}>
                <View style={styles.infoIcon}>
                  <Phone size={20} color="#FF3B30" />
                </View>
                <Text style={styles.infoLabel}>Contact</Text>
                <Text style={styles.infoValue} numberOfLines={2}>
                  {google_match.contact || 'Not available'}
                </Text>
              </View>

              <View style={styles.infoItem}>
                <View style={styles.infoIcon}>
                  <Text style={styles.priceIcon}>{google_match.price_level || '$$'}</Text>
                </View>
                <Text style={styles.infoLabel}>Price</Text>
                <Text style={styles.infoValue}>Moderate</Text>
              </View>
            </View>

            {/* Popular Dishes */}
            {yelp_ai?.popular_dishes && yelp_ai.popular_dishes.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Popular Dishes</Text>
                  <TouchableOpacity>
                    <Text style={styles.seeAll}>See all</Text>
                  </TouchableOpacity>
                </View>

                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.dishesScroll}
                >
                  {yelp_ai.popular_dishes.slice(0, 5).map((dish, index) => (
                    <Animated.View
                      key={index}
                      entering={FadeIn.delay(300 + index * 100)}
                    >
                      <View style={styles.dishCard}>
                        <View style={styles.dishImagePlaceholder}>
                          <Text style={styles.dishEmoji}>🍽️</Text>
                        </View>
                        <Text style={styles.dishName} numberOfLines={2}>
                          {dish}
                        </Text>
                      </View>
                    </Animated.View>
                  ))}
                </ScrollView>
              </View>
            )}

            {/* Dietary Labels */}
            {yelp_ai?.dietary_labels && yelp_ai.dietary_labels.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Dietary Options</Text>
                <View style={styles.labelsContainer}>
                  {yelp_ai.dietary_labels.map((label, index) => (
                    <View key={index} style={styles.dietLabel}>
                      <Text style={styles.dietLabelText}>{label}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Photos Gallery */}
            {google_match.images && google_match.images.length > 1 && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Photos</Text>
                  <TouchableOpacity>
                    <Text style={styles.seeAll}>See all</Text>
                  </TouchableOpacity>
                </View>

                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.photosScroll}
                >
                  {google_match.images.slice(0, 6).map((image: string, index: number) => (
                    <Image
                      key={index}
                      source={{ uri: image }}
                      style={styles.photoThumbnail}
                    />
                  ))}
                </ScrollView>
              </View>
            )}

            {/* Address */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Location</Text>
              <View style={styles.addressCard}>
                <MapPin size={20} color="#666" />
                <Text style={styles.addressText}>{google_match.address}</Text>
              </View>
            </View>
          </Animated.View>
        </ScrollView>

        {/* Bottom Action Button */}
        <View style={styles.bottomBar}>
          <TouchableOpacity style={styles.actionButton} activeOpacity={0.8}>
            <LinearGradient
              colors={['#FF3B30', '#FF6B58']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.actionButtonGradient}
            >
              <Text style={styles.actionButtonText}>View on Map</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  scrollView: {
    flex: 1,
  },
  heroContainer: {
    height: height * 0.4,
    position: 'relative',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  placeholderImage: {
    backgroundColor: '#e0e0e0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    color: '#999',
    fontSize: 16,
  },
  heroGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  headerButtons: {
    position: 'absolute',
    top: 60,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  headerButton: {
    borderRadius: 24,
    overflow: 'hidden',
  },
  buttonBlur: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  contentCard: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    marginTop: -32,
    paddingBottom: 100,
  },
  titleSection: {
    padding: 24,
    paddingBottom: 16,
  },
  restaurantName: {
    fontSize: 32,
    fontWeight: '700',
    color: '#000',
    marginBottom: 12,
  },
  locationRow: {
    flexDirection: 'row',
    gap: 12,
  },
  locationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(52, 199, 89, 0.1)',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    gap: 6,
  },
  locationText: {
    fontSize: 14,
    color: '#34C759',
    fontWeight: '600',
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  ratingText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000',
  },
  reviewCount: {
    fontSize: 14,
    color: '#666',
  },
  personalBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    marginHorizontal: 24,
    marginBottom: 20,
    borderRadius: 16,
    gap: 10,
  },
  personalText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
    flex: 1,
  },
  descriptionSection: {
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  description: {
    fontSize: 15,
    color: '#444',
    lineHeight: 24,
    marginBottom: 8,
  },
  readMore: {
    fontSize: 15,
    color: '#FF3B30',
    fontWeight: '600',
  },
  infoGrid: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    marginBottom: 24,
    gap: 12,
  },
  infoItem: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  infoIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 59, 48, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  priceIcon: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FF3B30',
  },
  infoLabel: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 13,
    color: '#000',
    fontWeight: '600',
    textAlign: 'center',
  },
  section: {
    paddingHorizontal: 24,
    marginBottom: 28,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#000',
  },
  seeAll: {
    fontSize: 15,
    color: '#FF3B30',
    fontWeight: '600',
  },
  dishesScroll: {
    paddingRight: 24,
  },
  dishCard: {
    width: 140,
    marginRight: 16,
  },
  dishImagePlaceholder: {
    width: 140,
    height: 140,
    backgroundColor: 'rgba(255, 59, 48, 0.1)',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  dishEmoji: {
    fontSize: 48,
  },
  dishName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
    lineHeight: 18,
  },
  labelsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  dietLabel: {
    backgroundColor: 'rgba(52, 199, 89, 0.1)',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(52, 199, 89, 0.3)',
  },
  dietLabelText: {
    fontSize: 13,
    color: '#34C759',
    fontWeight: '600',
  },
  photosScroll: {
    paddingRight: 24,
  },
  photoThumbnail: {
    width: 120,
    height: 120,
    borderRadius: 16,
    marginRight: 12,
  },
  addressCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 16,
    gap: 12,
  },
  addressText: {
    flex: 1,
    fontSize: 15,
    color: '#444',
    lineHeight: 22,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 24,
    paddingVertical: 20,
    paddingBottom: 40,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.05)',
  },
  actionButton: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#FF3B30',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  actionButtonGradient: {
    paddingVertical: 18,
    alignItems: 'center',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700',
  },
});

