import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Image, Dimensions, FlatList, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Icon from '@/components/LucideIcons';
import { MotiView, MotiText } from 'moti';
import { LinearGradient } from 'expo-linear-gradient';
import * as Location from 'expo-location';
import { YelpService, YelpBusiness } from '@/services/yelpService';
import { useFavorites } from '@/context/FavoritesContext';

const { width } = Dimensions.get('window');

const yelpService = new YelpService();

export default function ExplorePage() {
    const router = useRouter();
    const { addFavorite, removeFavorite, isFavorite, loadFavorites } = useFavorites();
    const [newRestaurants, setNewRestaurants] = useState<YelpBusiness[]>([]);
    const [nearbyRestaurants, setNearbyRestaurants] = useState<YelpBusiness[]>([]);
    const [loading, setLoading] = useState(true);
    const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);

    useEffect(() => {
        loadFavorites();
        loadRestaurants();
    }, []);

    const loadRestaurants = async () => {
        try {
            // Get user location
            let { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                // Use default location (San Francisco)
                const defaultLat = 37.7749;
                const defaultLng = -122.4194;
                setUserLocation({ latitude: defaultLat, longitude: defaultLng });
                await fetchRestaurants(defaultLat, defaultLng);
                return;
            }

            let location = await Location.getCurrentPositionAsync({});
            setUserLocation({
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
            });

            await fetchRestaurants(location.coords.latitude, location.coords.longitude);
        } catch (error) {
            console.error('Error loading restaurants:', error);
            // Use default location on error
            const defaultLat = 37.7749;
            const defaultLng = -122.4194;
            setUserLocation({ latitude: defaultLat, longitude: defaultLng });
            await fetchRestaurants(defaultLat, defaultLng);
        }
    };

    const fetchRestaurants = async (lat: number, lng: number) => {
        try {
            setLoading(true);
            
            // Fetch restaurants for "Discover" section - sorted by rating (highly rated/top restaurants)
            const allRestaurants = await yelpService.searchRestaurants(lat, lng, 'restaurants', 30);
            
            // Sort by rating for "new restaurants" (top rated restaurants)
            const sortedByRating = [...allRestaurants]
                .filter(r => r.rating >= 4.0) // Filter for highly rated (4+ stars)
                .sort((a, b) => {
                    // Primary sort by rating, secondary by review count
                    if ((b.rating || 0) !== (a.rating || 0)) {
                        return (b.rating || 0) - (a.rating || 0);
                    }
                    return (b.review_count || 0) - (a.review_count || 0);
                })
                .slice(0, 10);
            
            setNewRestaurants(sortedByRating.length > 0 ? sortedByRating : allRestaurants.slice(0, 10));

            // For nearby restaurants - sort by distance (closest first)
            const sortedByDistance = [...allRestaurants]
                .filter(r => r.distance !== undefined && r.distance > 0)
                .sort((a, b) => (a.distance || Infinity) - (b.distance || Infinity))
                .slice(0, 10);
            
            // If no distance data available, use first results from API (which should be sorted by distance)
            setNearbyRestaurants(sortedByDistance.length > 0 ? sortedByDistance : allRestaurants.slice(0, 10));
        } catch (error) {
            console.error('Error fetching restaurants:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleToggleFavorite = (restaurant: YelpBusiness) => {
        if (isFavorite(restaurant.id)) {
            removeFavorite(restaurant.id);
        } else {
            addFavorite(restaurant, restaurant.id);
        }
    };

    const handleRestaurantPress = (restaurant: YelpBusiness) => {
        // Prepare restaurant data for the detail page
        const restaurantData = {
            google_match: {
                name: restaurant.name,
                address: `${restaurant.location.address1}, ${restaurant.location.city}, ${restaurant.location.state}`,
                rating: restaurant.rating,
                images: [restaurant.image_url],
                phone: restaurant.phone || '',
                opening_hours: null,
                hours: null,
                location: {
                    lat: restaurant.coordinates.latitude,
                    lng: restaurant.coordinates.longitude,
                },
            },
            yelp_ai: {
                summary: `${restaurant.name} is a highly-rated restaurant in ${restaurant.location.city}.`,
                review_highlights: `With ${restaurant.review_count} reviews and a ${restaurant.rating} star rating.`,
                popular_dishes: [],
                menu_items: [],
                dietary_labels: [],
                photos: [restaurant.image_url],
                categories: restaurant.categories.map(cat => cat.title),
                yelp_rating: restaurant.rating,
                review_count: restaurant.review_count,
            },
            personalization: {
                match_score: Math.round(restaurant.rating * 20),
                match_reasons: [
                    `${restaurant.rating} star rating`,
                    `${restaurant.review_count} reviews`,
                    restaurant.price ? `Price range: ${restaurant.price}` : 'Affordable',
                ],
                personalized_recommendations: [
                    `Highly rated ${restaurant.categories[0]?.title || 'restaurant'} with ${restaurant.rating} stars`,
                ],
                dietary_match: [],
                ambiance_match: restaurant.categories[0]?.title || 'Restaurant',
            },
        };

        router.push({
            pathname: '/restaurant/[id]',
            params: {
                id: restaurant.id,
                data: JSON.stringify(restaurantData),
            },
        });
    };

    const formatDistance = (distance?: number): string => {
        if (!distance) return '';
        const miles = distance / 1609.34;
        if (miles < 1) {
            return `${Math.round(miles * 5280)}ft away`;
        }
        return `${miles.toFixed(1)}mi away`;
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Header */}
                <MotiView
                    from={{ opacity: 0, translateY: -20 }}
                    animate={{ opacity: 1, translateY: 0 }}
                    transition={{ type: 'timing', duration: 700 }}
                    style={styles.header}
                >
                    <MotiText style={styles.exploreTitle}>Explore</MotiText>
                </MotiView>

                {/* New Restaurants Section */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <MotiText
                            style={styles.sectionTitle}
                            from={{ opacity: 0, translateX: -20 }}
                            animate={{ opacity: 1, translateX: 0 }}
                            transition={{ duration: 500, delay: 200 }}
                        >
                            Discover
                        </MotiText>
                        <TouchableOpacity>
                            <MotiText style={styles.seeAllText}>See All</MotiText>
                        </TouchableOpacity>
                    </View>

                    {loading ? (
                        <View style={styles.loadingContainer}>
                            <ActivityIndicator size="large" color="#FA6868" />
                        </View>
                    ) : newRestaurants.length === 0 ? (
                        <View style={styles.emptyContainer}>
                            <MotiText style={styles.emptyText}>No restaurants found</MotiText>
                        </View>
                    ) : (
                        <FlatList
                            data={newRestaurants}
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={styles.resortsList}
                            renderItem={({ item, index }) => (
                                <MotiView
                                    from={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ type: 'spring', delay: 300 + (index * 150) }}
                                >
                                    <TouchableOpacity
                                        style={styles.resortCard}
                                        activeOpacity={0.9}
                                        onPress={() => handleRestaurantPress(item)}
                                    >
                                        <Image 
                                            source={{ uri: item.image_url || 'https://via.placeholder.com/400'} } 
                                            style={styles.resortImage}
                                            defaultSource={require('@/assets/images/icon.png')}
                                        />
                                        
                                        {/* Gradient Overlay */}
            <LinearGradient
                                            colors={['transparent', 'rgba(0,0,0,0.1)', 'rgba(0,0,0,0.4)']}
                                            style={styles.resortGradient}
            />

                                        {/* Rating Badge */}
                                        <View style={styles.ratingBadge}>
                                            <Icon name="Star" size={14} color="#FFD700" fill="#FFD700" />
                                            <MotiText style={styles.ratingText}>{item.rating}</MotiText>
                                        </View>

                                        {/* Bookmark Icon */}
                                        <TouchableOpacity
                                            style={styles.bookmarkButton}
                                            onPress={() => handleToggleFavorite(item)}
                                            activeOpacity={0.7}
                                        >
                                            <Icon
                                                name="Heart"
                                                size={20}
                                                color={isFavorite(item.id) ? "#FF3B30" : "white"}
                                                fill={isFavorite(item.id) ? "#FF3B30" : "transparent"}
                                            />
                                        </TouchableOpacity>

                                        {/* Restaurant Info */}
                                        <View style={styles.resortInfo}>
                                            <MotiText style={styles.resortName} numberOfLines={2}>{item.name}</MotiText>
                                            <View style={styles.resortLocationRow}>
                                                <Icon name="MapPin" size={12} color="rgba(255,255,255,0.8)" />
                                                <MotiText style={styles.resortLocation} numberOfLines={1}>
                                                    {item.location.city}, {item.location.state}
                                                </MotiText>
                                            </View>
                                        </View>
                                    </TouchableOpacity>
                                </MotiView>
                            )}
                            keyExtractor={item => item.id}
                        />
                    )}
                </View>

                {/* Restaurants Near You Section */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <MotiText
                            style={styles.sectionTitle}
                            from={{ opacity: 0, translateX: -20 }}
                            animate={{ opacity: 1, translateX: 0 }}
                            transition={{ duration: 500, delay: 500 }}
                        >
                            Restaurants near you
                        </MotiText>
                        <TouchableOpacity>
                            <MotiText style={styles.seeAllText}>See All</MotiText>
                        </TouchableOpacity>
                    </View>

                    {loading ? (
                        <View style={styles.loadingContainer}>
                            <ActivityIndicator size="large" color="#FA6868" />
                        </View>
                    ) : nearbyRestaurants.length === 0 ? (
                        <View style={styles.emptyContainer}>
                            <MotiText style={styles.emptyText}>No restaurants found nearby</MotiText>
                        </View>
                    ) : (
                        <View style={styles.placesList}>
                            {nearbyRestaurants.map((restaurant, index) => (
                                <MotiView
                                    key={restaurant.id}
                                    from={{ opacity: 0, translateX: -30 }}
                                    animate={{ opacity: 1, translateX: 0 }}
                                    transition={{ type: 'spring', delay: 600 + (index * 100) }}
                                >
                                    <TouchableOpacity
                                        style={styles.placeCard}
                                        activeOpacity={0.7}
                                        onPress={() => handleRestaurantPress(restaurant)}
                                    >
                                        <Image 
                                            source={{ uri: restaurant.image_url || 'https://via.placeholder.com/400' }} 
                                            style={styles.placeImage}
                                            defaultSource={require('@/assets/images/icon.png')}
                                        />
                                        
                                        <View style={styles.placeInfo}>
                                            <MotiText style={styles.placeName} numberOfLines={1}>{restaurant.name}</MotiText>
                                            <View style={styles.placeLocationRow}>
                                                <Icon name="MapPin" size={12} color="#8E8E93" />
                                                <MotiText style={styles.placeLocation} numberOfLines={1}>
                                                    {restaurant.location.city}, {restaurant.location.state}
                                                </MotiText>
                                            </View>
                                            <View style={styles.placeDetailsRow}>
                                                <View style={styles.placeRating}>
                                                    <Icon name="Star" size={12} color="#FFD700" fill="#FFD700" />
                                                    <MotiText style={styles.placeRatingText}>{restaurant.rating}</MotiText>
                                                    <MotiText style={styles.placeReviews}>
                                                        ({restaurant.review_count.toLocaleString()} Reviews)
                                                    </MotiText>
                                                </View>
                                                {restaurant.distance && (
                                                    <MotiText style={styles.placeDistance}>
                                                        {formatDistance(restaurant.distance)}
                                                    </MotiText>
                                                )}
            </View>
        </View>
                                    </TouchableOpacity>
                                </MotiView>
                            ))}
                        </View>
                    )}
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
    scrollContent: {
        paddingBottom: 120,
    },
    header: {
        paddingHorizontal: 25,
        marginTop: 10,
        marginBottom: 30,
    },
    exploreTitle: {
        fontSize: 36,
        fontWeight: '800',
        color: '#1A1A1A',
        letterSpacing: -1,
    },
    section: {
        marginBottom: 30,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 25,
        marginBottom: 18,
    },
    sectionTitle: {
        fontSize: 22,
        fontWeight: '700',
        color: '#1A1A1A',
        letterSpacing: -0.5,
    },
    seeAllText: {
        fontSize: 15,
        fontWeight: '600',
        color: '#FA6868',
    },
    resortsList: {
        paddingHorizontal: 25,
        gap: 18,
    },
    resortCard: {
        width: width * 0.6,
        height: 240,
        borderRadius: 25,
        overflow: 'hidden',
        backgroundColor: '#FFF',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.12,
        shadowRadius: 16,
        elevation: 8,
    },
    resortImage: {
        width: '100%',
        height: '100%',
        position: 'absolute',
    },
    resortGradient: {
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        height: '50%',
    },
    ratingBadge: {
        position: 'absolute',
        top: 14,
        left: 14,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.95)',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 12,
        gap: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    ratingText: {
        fontSize: 14,
        fontWeight: '700',
        color: '#1A1A1A',
    },
    bookmarkButton: {
        position: 'absolute',
        top: 14,
        right: 14,
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: 'rgba(0,0,0,0.3)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
    },
    resortInfo: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: 16,
    },
    resortName: {
        fontSize: 18,
        fontWeight: '700',
        color: '#FFF',
        marginBottom: 6,
        letterSpacing: -0.3,
    },
    resortLocationRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    resortLocation: {
        fontSize: 13,
        fontWeight: '500',
        color: 'rgba(255,255,255,0.85)',
    },
    placesList: {
        paddingHorizontal: 25,
        gap: 16,
    },
    placeCard: {
        flexDirection: 'row',
        backgroundColor: '#FFF',
        borderRadius: 20,
        padding: 12,
        gap: 14,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
        elevation: 4,
    },
    placeImage: {
        width: 85,
        height: 85,
        borderRadius: 16,
    },
    placeInfo: {
        flex: 1,
        justifyContent: 'center',
        gap: 6,
    },
    placeName: {
        fontSize: 17,
        fontWeight: '700',
        color: '#1A1A1A',
        letterSpacing: -0.3,
    },
    placeLocationRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    placeLocation: {
        fontSize: 13,
        fontWeight: '500',
        color: '#8E8E93',
    },
    placeDetailsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: 4,
    },
    placeRating: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    placeRatingText: {
        fontSize: 14,
        fontWeight: '700',
        color: '#1A1A1A',
    },
    placeReviews: {
        fontSize: 12,
        fontWeight: '500',
        color: '#8E8E93',
    },
    placeDistance: {
        fontSize: 13,
        fontWeight: '600',
        color: '#8E8E93',
    },
    loadingContainer: {
        paddingVertical: 60,
        alignItems: 'center',
        justifyContent: 'center',
    },
    emptyContainer: {
        paddingVertical: 60,
        alignItems: 'center',
        justifyContent: 'center',
    },
    emptyText: {
        fontSize: 15,
        fontWeight: '600',
        color: '#8E8E93',
    },
});
