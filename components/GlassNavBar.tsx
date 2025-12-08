import { BlurView } from "expo-blur";
import React, { useState, useEffect } from "react";
import { Platform, StyleSheet, TouchableOpacity, View, Dimensions, Text } from "react-native";
import Animated, {
    FadeInRight,
    FadeOutLeft,
    useAnimatedStyle,
    useSharedValue,
    withSpring,
} from "react-native-reanimated";
import { Home, Compass, Heart, User, Camera } from 'lucide-react-native';

// Imported newly created screens
import ExplorePage from '@/app/explore/index';
import FavoritePage from '@/app/favorite/index';
import HomePage from '@/app/home/index';
import ProfilePage from '@/app/profile/index';

interface NavItem {
    label: string;
    screen: React.ComponentType<any>;
}

const NAV_ITEMS: NavItem[] = [
    { label: "Home", screen: HomePage },
    { label: "Explore", screen: ExplorePage },
    { label: "Favorite", screen: FavoritePage },
    { label: "Profile", screen: ProfilePage },
];

const ICON_MAPPING: Record<string, React.ElementType> = {
    Home: Home,
    Explore: Compass,
    Favorite: Heart,
    Profile: User,
};

const { width } = Dimensions.get('window');
const TAB_BAR_WIDTH = width * 0.9;
const TAB_WIDTH = (TAB_BAR_WIDTH - 20) / NAV_ITEMS.length; // Adjusted for padding
const INDICATOR_SIZE = 60; // Size of the circular spotlight

export default function GlassNavBar(): React.JSX.Element {
    const [activeTab, setActiveTab] = useState(0);
    const indicatorPosition = useSharedValue(0);

    useEffect(() => {
        indicatorPosition.value = withSpring(activeTab * TAB_WIDTH, {
            damping: 15,
            stiffness: 150,
            mass: 0.5,
        });
    }, [activeTab]);

    const animatedIndicatorStyle = useAnimatedStyle(() => {
        return {
            transform: [{ translateX: indicatorPosition.value }],
        };
    });

    return (
        <View style={{ flex: 1, backgroundColor: '#000' }}>
            {/* Active screen with shared axis transition */}
            <View style={styles.screenContainer}>
                <Animated.View
                    key={activeTab}
                    entering={FadeInRight.duration(300)}
                    exiting={FadeOutLeft.duration(300)}
                    style={{ flex: 1 }}
                >
                    {(() => {
                        const ActiveScreen = NAV_ITEMS[activeTab].screen;
                        return <ActiveScreen />;
                    })()}
                </Animated.View>
            </View>

            {/* Glass Navigation Bar */}
            <View style={styles.navContainer}>
                <View style={styles.pillWrapper}>
                    <BlurView intensity={80} tint="light" style={styles.glassPill}>
                        <View style={styles.pillContent}>

                            {/* Sliding Indicator */}
                            <Animated.View style={[styles.activeIndicator, animatedIndicatorStyle]} />

                            {NAV_ITEMS.map((item, index) => {
                                const isActive = activeTab === index;
                                const IconComponent = ICON_MAPPING[item.label];

                                return (
                                    <TouchableOpacity
                                        key={item.label}
                                        style={styles.navItem}
                                        onPress={() => setActiveTab(index)}
                                        activeOpacity={0.8}
                                    >
                                        <View style={[styles.itemContent, isActive && styles.activeItemContent]}>
                                            <IconComponent
                                                size={24}
                                                color={isActive ? "#FF3B30" : "#000000"}
                                                strokeWidth={isActive ? 1.9 : 1.5}
                                            />
                                            <Text style={[styles.navText, isActive && styles.activeNavText]}>
                                                {item.label}
                                            </Text>
                                        </View>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    </BlurView>
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    screenContainer: {
        flex: 1,
        backgroundColor: '#000',
    },
    navContainer: {
        position: "absolute",
        bottom: Platform.OS === "ios" ? 35 : 25,
        alignSelf: 'center',
        width: TAB_BAR_WIDTH,
        maxWidth: 400,
        shadowColor: "#4c4c4cff",
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
        elevation: 15,
        borderRadius: 120, // Matched to glass pill
    },
    pillWrapper: {
        borderRadius: 120, // Matched to glass pill
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.3)', // Increased opacity to look white instead of gray
    },
    glassPill: {
        borderRadius: 120,
        height: 70,
    },
    pillContent: {
        flexDirection: 'row',
        alignItems: 'center',
        height: '100%',
        paddingHorizontal: 10,
    },
    activeIndicator: {
        position: 'absolute',
        top: 5, // (70 - 50) / 2
        left: 10, // Initial offset due to padding
        width: TAB_WIDTH,
        height: 60,
        borderRadius: 75,
        backgroundColor: 'rgba(255, 255, 255, 0.5)',
        zIndex: 0,
    },
    navItem: {
        width: TAB_WIDTH,
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1,
    },
    itemContent: {
        alignItems: 'center',
        gap: 4,
    },
    activeItemContent: {
        transform: [{ scale: 1.05 }],
    },
    navText: {
        fontSize: 10,
        fontWeight: '500',
        color: '#000000',
        // System font is default in RN Text
    },
    activeNavText: {
        color: '#FF3B30',
        fontWeight: '600', // Semi-bold for active
    },
});

