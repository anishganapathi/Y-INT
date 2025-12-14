import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Image, TextInput, Dimensions, FlatList, ActivityIndicator, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Icon from '@/components/LucideIcons';
import { MotiView, MotiText, MotiImage } from 'moti';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import * as Location from 'expo-location';
import { YelpService, YelpBusiness } from '@/services/yelpService';
import { useFavorites } from '@/context/FavoritesContext';

const { width } = Dimensions.get('window');

const CATEGORIES = ['Restaurants', 'Saved', 'Itenaries', 'Plumbers', 'Cleaning'];

const yelpService = new YelpService();

export default function HomePage() {
    const router = useRouter();
    const { favorites, addFavorite, removeFavorite, isFavorite, loadFavorites } = useFavorites();
    const [activeCategory, setActiveCategory] = useState('Restaurants');
    const [restaurants, setRestaurants] = useState<YelpBusiness[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
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
                console.log('Permission to access location was denied');
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

            // Fetch restaurants from Yelp
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
            const results = await yelpService.searchRestaurants(lat, lng, 'restaurants', 10);
            setRestaurants(results);
        } catch (error) {
            console.error('Error fetching restaurants:', error);
        } finally {
            setLoading(false);
        }
    };

    const onRefresh = async () => {
        if (!userLocation) return;
        
        setRefreshing(true);
        try {
            const results = await yelpService.searchRestaurants(
                userLocation.latitude, 
                userLocation.longitude, 
                'restaurants', 
                10
            );
            setRestaurants(results);
        } catch (error) {
            console.error('Error refreshing restaurants:', error);
        } finally {
            setRefreshing(false);
        }
    };

    const handleSeeMore = (restaurant: YelpBusiness) => {
        // Prepare restaurant data in the format expected by the detail page
        const restaurantData = {
            google_match: {
                name: restaurant.name,
                address: `${restaurant.location.address1}, ${restaurant.location.city}, ${restaurant.location.state}`,
                rating: restaurant.rating,
                images: [restaurant.image_url],
                phone: restaurant.phone,
                website: '',
                opening_hours: null,
                hours: null,
                location: {
                    lat: restaurant.coordinates.latitude,
                    lng: restaurant.coordinates.longitude,
                },
            },
            yelp_ai: {
                summary: `${restaurant.name} is a highly-rated ${restaurant.categories.map(cat => cat.title).join(', ')} in ${restaurant.location.city}.`,
                review_highlights: `Customers love this place! With ${restaurant.review_count} reviews and a ${restaurant.rating} star rating, it's a local favorite.`,
                popular_dishes: [],
                menu_items: [],
                dietary_labels: [],
                photos: [restaurant.image_url],
                categories: restaurant.categories.map(cat => cat.title),
                yelp_rating: restaurant.rating,
                review_count: restaurant.review_count,
            },
            personalization: {
                match_score: Math.round(restaurant.rating * 20), // Convert 5-star rating to 100-point score
                match_reasons: [
                    `${restaurant.rating} star rating`,
                    `${restaurant.review_count} reviews`,
                    restaurant.price ? `Price range: ${restaurant.price}` : 'Affordable',
                ],
                personalized_recommendations: [
                    `Highly rated ${restaurant.categories[0]?.title || 'restaurant'} with ${restaurant.rating} stars`,
                    `Perfect match based on ${restaurant.review_count} customer reviews`,
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

    const handleToggleFavorite = (restaurant: YelpBusiness) => {
        if (isFavorite(restaurant.id)) {
            removeFavorite(restaurant.id);
        } else {
            addFavorite(restaurant, restaurant.id);
        }
    };

    // Get saved restaurants for "Saved" tab
    const savedRestaurants = favorites
        .filter(fav => fav.name || fav.google_match?.name)
        .map(fav => {
            if (fav.name) {
                // Already in YelpBusiness format
                return {
                    id: fav.restaurantId,
                    name: fav.name,
                    image_url: fav.image_url || '',
                    rating: fav.rating || 0,
                    review_count: fav.review_count || 0,
                    location: fav.location || { address1: '', city: '', state: '', country: '' },
                    coordinates: fav.coordinates || { latitude: 0, longitude: 0 },
                    categories: fav.categories || [],
                    phone: fav.phone || '',
                    price: fav.price,
                } as YelpBusiness;
            } else {
                // Convert from RecognitionOutput format
                return {
                    id: fav.restaurantId,
                    name: fav.google_match?.name || '',
                    image_url: fav.google_match?.images?.[0] || '',
                    rating: fav.google_match?.rating || 0,
                    review_count: fav.yelp_ai?.review_count || 0,
                    location: {
                        address1: fav.google_match?.address?.split(',')[0] || '',
                        city: fav.google_match?.address?.split(',')[1]?.trim() || '',
                        state: fav.google_match?.address?.split(',')[2]?.trim() || '',
                        country: 'US',
                    },
                    coordinates: fav.google_match?.location ? {
                        latitude: fav.google_match.location.lat,
                        longitude: fav.google_match.location.lng,
                    } : { latitude: 0, longitude: 0 },
                    categories: fav.yelp_ai?.categories?.map(c => ({ alias: c.toLowerCase(), title: c })) || [],
                    phone: fav.google_match?.phone || '',
                } as YelpBusiness;
            }
        });

    const displayRestaurants = activeCategory === 'Saved' ? savedRestaurants : restaurants;

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        tintColor="#FF8A80"
                        colors={['#FF8A80']}
                    />
                }
            >
                {/* Header */}
                <MotiView
                    from={{ opacity: 0, translateY: -20 }}
                    animate={{ opacity: 1, translateY: 0 }}
                    transition={{ type: 'timing', duration: 700 }}
                    style={styles.header}
                >
                    <View>
                        <MotiText style={styles.greetingTitle}>Hello, Anish</MotiText>
                        <MotiText style={styles.greetingSubtitle}>Welcome to YelpINT</MotiText>
                    </View>
                    <TouchableOpacity
                        onPress={() => router.push('/camera')}
                        activeOpacity={0.7}
                    >
                        <MotiView
                            from={{ scale: 0, rotate: '-90deg' }}
                            animate={{ scale: 1, rotate: '0deg' }}
                            transition={{ type: 'spring', delay: 300 }}
                            style={styles.cameraButton}
                        >
                            <LinearGradient
                                colors={['#FF3B30', '#FF6B6B']}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                                style={styles.cameraButtonInner}
                            >
                                <Icon name="Camera" size={24} color="#FFF" />
                            </LinearGradient>
                        </MotiView>
                    </TouchableOpacity>
                </MotiView>

                {/* Search Bar */}
                <MotiView
                    style={styles.searchContainer}
                    from={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ type: 'timing', duration: 500, delay: 200 }}
                >
                    <View style={styles.searchBar}>
                        <Icon name="Search" size={24} color="#1A1A1A" />
                        <TextInput
                            placeholder="Search"
                            placeholderTextColor="#999"
                            style={styles.searchInput}
                        />
                    </View>
                    <TouchableOpacity style={styles.filterButton}>
                        <Icon name="SlidersHorizontal" size={20} color="white" />
                    </TouchableOpacity>
                </MotiView>

                {/* Categories */}
                <View style={styles.categoriesContainer}>
                    <MotiText
                        style={styles.sectionTitle}
                        from={{ opacity: 0, translateX: -20 }}
                        animate={{ opacity: 1, translateX: 0 }}
                        transition={{ duration: 500, delay: 300 }}
                    >
                        Select your next Service
                    </MotiText>
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.categoriesList}
                    >
                        {CATEGORIES.map((cat, index) => {
                            const isActive = activeCategory === cat;
                            return (
                                <MotiView
                                    key={cat}
                                    from={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ type: 'spring', delay: 400 + (index * 100) }}
                                >
                                    <TouchableOpacity
                                        style={[styles.categoryPill, isActive && styles.categoryPillActive]}
                                        onPress={() => setActiveCategory(cat)}
                                    >
                                        <MotiText style={[styles.categoryText, isActive && styles.categoryTextActive]}>
                                            {cat}
                                        </MotiText>
                                    </TouchableOpacity>
                                </MotiView>
                            );
                        })}
                    </ScrollView>
                </View>

                {/* Restaurant Cards */}
                <View style={styles.cardsContainer}>
                    {loading ? (
                        <View style={styles.loadingContainer}>
                            <ActivityIndicator size="large" color="#FF8A80" />
                            <MotiText style={styles.loadingText}>Finding amazing restaurants...</MotiText>
                        </View>
                    ) : displayRestaurants.length === 0 ? (
                        <View style={styles.emptyContainer}>
                            <Icon name={activeCategory === 'Saved' ? "Heart" : "UtensilsCrossed"} size={48} color="#8E8E93" />
                            <MotiText style={styles.emptyText}>
                                {activeCategory === 'Saved' ? 'No saved restaurants yet' : 'No restaurants found nearby'}
                            </MotiText>
                        </View>
                    ) : (
                    <FlatList
                            data={displayRestaurants}
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        pagingEnabled
                        snapToInterval={width * 0.75 + 20}
                        decelerationRate="fast"
                        contentContainerStyle={{ paddingHorizontal: 25, gap: 20, paddingBottom: 100 }}
                        renderItem={({ item, index }) => (
                            <MotiView
                                style={styles.card}
                                from={{ opacity: 0, translateY: 50 }}
                                animate={{ opacity: 1, translateY: 0 }}
                                transition={{ type: 'spring', delay: 600 + (index * 200) }}
                            >
                                    <Image 
                                        source={{ uri: item.image_url }} 
                                        style={styles.cardImage}
                                        defaultSource={require('@/assets/images/icon.png')}
                                    />

                                {/* Overlay Gradient */}
                                <LinearGradient
                                    colors={['transparent', 'rgba(0,0,0,0.2)', 'rgba(0,0,0,0.8)']}
                                    style={styles.cardGradient}
                                />

                                {/* Top Right Heart */}
                                <TouchableOpacity 
                                    style={styles.favoriteButton}
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

                                {/* Bottom Content */}
                                <View style={styles.cardContent}>
                                        <MotiText style={styles.cardCountry}>
                                            {item.categories[0]?.title || 'Restaurant'}
                                        </MotiText>
                                        <MotiText style={styles.cardCity} numberOfLines={2}>
                                            {item.name}
                                        </MotiText>

                                    <View style={styles.reviewContainer}>
                                        <View style={styles.ratingBadge}>
                                            <Icon name="Star" size={12} color="#FFD700" fill="#FFD700" />
                                            <MotiText style={styles.ratingText}>{item.rating}</MotiText>
                                        </View>
                                            <MotiText style={styles.reviewCount}>
                                                {item.review_count} reviews
                                            </MotiText>
                                    </View>

                                        <TouchableOpacity 
                                            style={styles.seeMoreButton} 
                                            activeOpacity={0.8}
                                            onPress={() => handleSeeMore(item)}
                                        >
                                            <BlurView intensity={80} tint="dark" style={styles.seeMoreBlur}>
                                            <MotiText style={styles.seeMoreText}>See more</MotiText>
                                            <View style={styles.arrowCircle}>
                                                    <Icon name="ArrowRight" size={18} color="#1A1A1A" />
                                            </View>
                                        </BlurView>
                                    </TouchableOpacity>
                                </View>
                            </MotiView>
                        )}
                        keyExtractor={item => item.id}
                    />
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
        paddingBottom: 120, // Space for nav bar
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 25,
        marginTop: 10,
        marginBottom: 25,
    },
    greetingTitle: {
        fontSize: 26,
        fontWeight: '800',
        color: '#1A1A1A',
        marginBottom: 4,
        letterSpacing: -0.5,
    },
    greetingSubtitle: {
        fontSize: 15,
        color: '#8E8E93',
        fontWeight: '500',
    },
    cameraButton: {
        width: 52,
        height: 52,
        borderRadius: 26,
        shadowColor: '#FF3B30',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
    },
    cameraButtonInner: {
        width: '100%',
        height: '100%',
        borderRadius: 26,
        justifyContent: 'center',
        alignItems: 'center',
    },
    searchContainer: {
        flexDirection: 'row',
        paddingHorizontal: 25,
        gap: 12,
        marginBottom: 30,
    },
    searchBar: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFF',
        borderRadius: 30,
        paddingHorizontal: 20,
        height: 56,
        borderWidth: 1,
        borderColor: '#EFEFEF',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 2,
    },
    searchInput: {
        flex: 1,
        marginLeft: 10,
        fontSize: 16,
        color: '#1A1A1A',
    },
    filterButton: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: '#1A1A1A',
        justifyContent: 'center',
        alignItems: 'center',
    },
    categoriesContainer: {
        marginBottom: 20,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#1A1A1A',
        marginLeft: 25,
        marginBottom: 15,
    },
    categoriesList: {
        paddingHorizontal: 25,
        gap: 12,
    },
    categoryPill: {
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 25,
        backgroundColor: '#FFF',
        borderWidth: 1,
        borderColor: '#F0F0F0',
    },
    categoryPillActive: {
        backgroundColor: '#1A1A1A',
        borderColor: '#1A1A1A',
    },
    categoryText: {
        fontSize: 15,
        fontWeight: '600',
        color: '#8E8E93',
    },
    categoryTextActive: {
        color: '#FFF',
    },
    cardsContainer: {
        marginTop: 10,
    },
    card: {
        width: width * 0.75,
        height: 420,
        borderRadius: 35,
        overflow: 'hidden',
        backgroundColor: '#fff',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.15,
        shadowRadius: 20,
        elevation: 8,
    },
    cardImage: {
        width: '100%',
        height: '100%',
        position: 'absolute',
    },
    cardGradient: {
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        height: '60%',
    },
    favoriteButton: {
        position: 'absolute',
        top: 20,
        right: 20,
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.3)',
    },
    cardContent: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: 24,
    },
    cardCountry: {
        color: 'rgba(255,255,255,0.9)',
        fontSize: 12,
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: 4,
    },
    cardCity: {
        color: '#FFF',
        fontSize: 28,
        fontWeight: '800',
        marginBottom: 12,
        letterSpacing: -0.5,
    },
    reviewContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 24,
        gap: 10,
    },
    ratingBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.2)',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
        gap: 4,
    },
    ratingText: {
        color: '#FFF',
        fontWeight: '700',
        fontSize: 13,
    },
    reviewCount: {
        color: 'rgba(255,255,255,0.7)',
        fontSize: 13,
        fontWeight: '500',
    },
    seeMoreButton: {
        borderRadius: 30,
        overflow: 'hidden',
        alignSelf: 'flex-start',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
    },
    seeMoreBlur: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 8,
        paddingLeft: 20,
        paddingRight: 8,
        backgroundColor: 'rgba(255,255,255,0.15)',
        gap: 12,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
    },
    seeMoreText: {
        color: '#FFF',
        fontWeight: '700',
        fontSize: 15,
        letterSpacing: 0.3,
    },
    arrowCircle: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#FFF',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
        elevation: 3,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 100,
        gap: 16,
    },
    loadingText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#8E8E93',
        marginTop: 12,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 100,
        gap: 16,
    },
    emptyText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#8E8E93',
        marginTop: 12,
    },
});
