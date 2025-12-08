/**
 * Favorite Page
 * Displays user's saved favorite restaurants
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Heart, Star, MapPin } from 'lucide-react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useFavorites } from '@/context/FavoritesContext';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width - 48;

export default function FavoritePage() {
  const router = useRouter();
  const { favorites, removeFavorite } = useFavorites();

  const handleCardPress = (favorite: any) => {
    router.push({
      pathname: '/restaurant/[id]',
      params: {
        id: favorite.restaurantId,
        data: JSON.stringify(favorite),
      },
    });
  };

  const handleUnfavorite = (restaurantId: string, event: any) => {
    event.stopPropagation(); // Prevent card press
    removeFavorite(restaurantId);
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Favorites</Text>
        <Text style={styles.headerSubtitle}>{favorites.length} saved places</Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {favorites.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>❤️</Text>
            <Text style={styles.emptyTitle}>No Favorites Yet</Text>
            <Text style={styles.emptyText}>
              Scan restaurants and tap the heart to save them here!
            </Text>
          </View>
        ) : (
          favorites.map((favorite, index) => (
            <Animated.View
              key={favorite.restaurantId}
              entering={FadeInDown.delay(index * 100).duration(400).springify()}
            >
              <TouchableOpacity
                style={styles.card}
                onPress={() => handleCardPress(favorite)}
                activeOpacity={0.9}
              >
                {/* Restaurant Image */}
                <View style={styles.imageContainer}>
                  {favorite.google_match.images && favorite.google_match.images.length > 0 ? (
                    <Image
                      source={{ uri: favorite.google_match.images[0] }}
                      style={styles.cardImage}
                      resizeMode="cover"
                    />
                  ) : (
                    <View style={[styles.cardImage, styles.placeholderImage]}>
                      <Text style={styles.placeholderEmoji}>🍽️</Text>
                    </View>
                  )}

                  {/* Favorite Button Overlay */}
                  <TouchableOpacity
                    style={styles.favoriteButton}
                    onPress={(e) => handleUnfavorite(favorite.restaurantId, e)}
                    activeOpacity={0.8}
                  >
                    <View style={styles.favoriteButtonInner}>
                      <Heart size={20} color="#FF3B30" fill="#FF3B30" strokeWidth={2} />
                    </View>
                  </TouchableOpacity>
                </View>

                {/* Card Content */}
                <View style={styles.cardContent}>
                  {/* Restaurant Name */}
                  <Text style={styles.restaurantName} numberOfLines={1}>
                    {favorite.google_match.name}
                  </Text>

                  {/* Location Badge */}
                  <View style={styles.locationBadge}>
                    <MapPin size={12} color="#34C759" strokeWidth={2} />
                    <Text style={styles.locationText} numberOfLines={1}>
                      {favorite.google_match.address.split(',')[1]?.trim() || 'Location'}
                    </Text>
                  </View>

                  {/* Description */}
                  {favorite.yelp_ai?.summary && (
                    <Text style={styles.description} numberOfLines={2}>
                      {favorite.yelp_ai.summary}
                    </Text>
                  )}

                  {/* Read More Link */}
                  <Text style={styles.readMore}>Read more</Text>

                  {/* Popular Dishes Preview */}
                  {favorite.yelp_ai?.popular_dishes && favorite.yelp_ai.popular_dishes.length > 0 && (
                    <View style={styles.dishesPreview}>
                      <Text style={styles.dishesLabel}>Popular:</Text>
                      <Text style={styles.dishesText} numberOfLines={1}>
                        {favorite.yelp_ai.popular_dishes.slice(0, 2).join(', ')}
                      </Text>
                    </View>
                  )}

                  {/* Rating Row */}
                  <View style={styles.ratingRow}>
                    <View style={styles.ratingBadge}>
                      <Star size={14} color="#FFD700" fill="#FFD700" />
                      <Text style={styles.ratingText}>{favorite.google_match.rating}</Text>
                    </View>
                    <Text style={styles.priceLevel}>{favorite.google_match.price_level}</Text>
                  </View>
                </View>
              </TouchableOpacity>
            </Animated.View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    paddingTop: 70,
    paddingBottom: 20,
    paddingHorizontal: 24,
    backgroundColor: '#fff',
  },
  headerTitle: {
    fontSize: 34,
    fontWeight: '700',
    color: '#000',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 15,
    color: '#666',
    fontWeight: '500',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 100,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 80,
  },
  emptyEmoji: {
    fontSize: 80,
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#000',
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
    maxWidth: 280,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 24,
    marginBottom: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
  },
  imageContainer: {
    position: 'relative',
  },
  cardImage: {
    width: '100%',
    height: 200,
  },
  placeholderImage: {
    backgroundColor: 'rgba(255, 59, 48, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderEmoji: {
    fontSize: 64,
  },
  favoriteButton: {
    position: 'absolute',
    top: 16,
    right: 16,
  },
  favoriteButtonInner: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  cardContent: {
    padding: 20,
  },
  restaurantName: {
    fontSize: 22,
    fontWeight: '700',
    color: '#000',
    marginBottom: 8,
  },
  locationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(52, 199, 89, 0.1)',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
    gap: 6,
    alignSelf: 'flex-start',
    marginBottom: 12,
  },
  locationText: {
    fontSize: 13,
    color: '#34C759',
    fontWeight: '600',
  },
  description: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 8,
  },
  readMore: {
    fontSize: 14,
    color: '#FF3B30',
    fontWeight: '600',
    marginBottom: 12,
  },
  dishesPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 59, 48, 0.05)',
    padding: 10,
    borderRadius: 12,
    marginBottom: 12,
    gap: 8,
  },
  dishesLabel: {
    fontSize: 13,
    color: '#FF3B30',
    fontWeight: '700',
  },
  dishesText: {
    flex: 1,
    fontSize: 13,
    color: '#FF3B30',
    fontWeight: '500',
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
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
  priceLevel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
});
