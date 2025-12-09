import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Image, TextInput, Dimensions, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Icon from '@/components/LucideIcons';
import { MotiView, MotiText, MotiImage } from 'moti';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

const CATEGORIES = ['Restaurants', 'Repair', 'Movers', 'Plumbers', 'Cleaning'];

const DESTINATIONS = [
    {
        id: '1',
        name: 'Rio de Janeiro',
        country: 'Brazil',
        rating: 5.0,
        reviews: 143,
        image: 'https://images.unsplash.com/photo-1483729558449-99ef09a8c325?q=80&w=2670&auto=format&fit=crop',
    },
    {
        id: '2',
        name: 'Kyoto',
        country: 'Japan',
        rating: 4.9,
        reviews: 120,
        image: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?q=80&w=2670&auto=format&fit=crop',
    },
    {
        id: '3',
        name: 'Santorini',
        country: 'Greece',
        rating: 4.8,
        reviews: 98,
        image: 'https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?q=80&w=2670&auto=format&fit=crop',
    }
];

export default function HomePage() {
    const router = useRouter();
    const [activeCategory, setActiveCategory] = useState('Restaurants');

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
                    <View>
                        <MotiText style={styles.greetingTitle}>Hello, Anish</MotiText>
                        <MotiText style={styles.greetingSubtitle}>Welcome to YelpINT</MotiText>
                    </View>
                    <TouchableOpacity
                        onPress={() => router.push('/chat')}
                        activeOpacity={0.7}
                    >
                        <MotiView
                            from={{ scale: 0, rotate: '-90deg' }}
                            animate={{ scale: 1, rotate: '0deg' }}
                            transition={{ type: 'spring', delay: 300 }}
                            style={styles.chatButton}
                        >
                            <View style={styles.chatButtonInner}>
                                <Image
                                    source={require('@/assets/images/chat.png')}
                                    style={styles.chatLogo}
                                    resizeMode="contain"
                                />
                            </View>
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

                {/* Destination Cards */}
                <View style={styles.cardsContainer}>
                    <FlatList
                        data={DESTINATIONS}
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
                                <Image source={{ uri: item.image }} style={styles.cardImage} />

                                {/* Overlay Gradient */}
                                <LinearGradient
                                    colors={['transparent', 'rgba(0,0,0,0.2)', 'rgba(0,0,0,0.8)']}
                                    style={styles.cardGradient}
                                />

                                {/* Top Right Heart */}
                                <View style={styles.favoriteButton}>
                                    <Icon name="Heart" size={20} color="white" />
                                </View>

                                {/* Bottom Content */}
                                <View style={styles.cardContent}>
                                    <MotiText style={styles.cardCountry}>{item.country}</MotiText>
                                    <MotiText style={styles.cardCity}>{item.name}</MotiText>

                                    <View style={styles.reviewContainer}>
                                        <View style={styles.ratingBadge}>
                                            <Icon name="Star" size={12} color="#FFD700" fill="#FFD700" />
                                            <MotiText style={styles.ratingText}>{item.rating}</MotiText>
                                        </View>
                                        <MotiText style={styles.reviewCount}>{item.reviews} reviews</MotiText>
                                    </View>

                                    <TouchableOpacity style={styles.seeMoreButton}>
                                        <BlurView intensity={30} tint="dark" style={styles.seeMoreBlur}>
                                            <MotiText style={styles.seeMoreText}>See more</MotiText>
                                            <View style={styles.arrowCircle}>
                                                <Icon name="ChevronRight" size={16} color="#1A1A1A" />
                                            </View>
                                        </BlurView>
                                    </TouchableOpacity>
                                </View>
                            </MotiView>
                        )}
                        keyExtractor={item => item.id}
                    />
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
    chatButton: {
        width: 52,
        height: 52,
        borderRadius: 26,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.15,
        shadowRadius: 6,
        elevation: 4,
    },
    chatButtonInner: {
        width: '100%',
        height: '100%',
        borderRadius: 26,
        backgroundColor: '#FFF',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1.5,
        borderColor: '#E5E5EA',
    },
    chatLogo: {
        width: 32,
        height: 32,
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
        borderRadius: 25,
        overflow: 'hidden',
    },
    seeMoreBlur: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 6,
        paddingLeft: 24,
        backgroundColor: 'rgba(30,30,30,0.85)',
    },
    seeMoreText: {
        color: '#FFF',
        fontWeight: '600',
        fontSize: 16,
    },
    arrowCircle: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#FFF',
        justifyContent: 'center',
        alignItems: 'center',
    }
});
