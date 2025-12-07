
import { BlurView } from "expo-blur";
import React, { useState, useEffect } from "react";
import { Platform, StyleSheet, TouchableOpacity, View, Dimensions } from "react-native";
import Animated, {
    FadeInRight,
    FadeOutLeft,
    useAnimatedStyle,
    useSharedValue,
    withSpring,
    withTiming,
} from "react-native-reanimated";
import Icon from "./LucideIcons";
import { ThemedText } from "./themed-text";

// Imported newly created screens
import ExplorePage from '@/app/explore/index';
import FavoritePage from '@/app/favorite/index';
import HomePage from '@/app/home/index';
import ProfilePage from '@/app/profile/index';

interface NavItem {
    icon: string;
    label: string;
    screen: React.ComponentType<any>;
}

const NAV_ITEMS: NavItem[] = [
    { icon: "House", label: "Home", screen: HomePage },
    { icon: "Compass", label: "Explore", screen: ExplorePage },
    { icon: "Heart", label: "Favorite", screen: FavoritePage },
    { icon: "User", label: "Profile", screen: ProfilePage },
];

const { width } = Dimensions.get('window');
const TAB_BAR_WIDTH = width * 0.9;
const TAB_WIDTH = (TAB_BAR_WIDTH - 20) / NAV_ITEMS.length; // Adjusted for padding

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
                    <BlurView intensity={80} tint="dark" style={styles.glassPill}>
                        <View style={styles.pillContent}>

                            {/* Sliding Indicator */}
                            <Animated.View style={[styles.activeIndicator, animatedIndicatorStyle]} />

                            {NAV_ITEMS.map((item, index) => {
                                const isActive = activeTab === index;
                                return (
                                    <TouchableOpacity
                                        key={item.label}
                                        style={styles.navItem}
                                        onPress={() => setActiveTab(index)}
                                        activeOpacity={0.8}
                                    >
                                        <View style={[styles.itemContent, isActive && styles.activeItemContent]}>
                                            <Icon
                                                name={item.icon}
                                                size={24}
                                                color={isActive ? "#FF3B30" : "#8E8E93"} // Apple Red active, Gray inactive
                                                strokeWidth={isActive ? 0 : 2}
                                                fill={isActive ? "#FF3B30" : "transparent"} // Solid fill when active
                                            />
                                            <ThemedText style={[styles.navText, isActive && styles.activeNavText]}>
                                                {item.label}
                                            </ThemedText>
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
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
        elevation: 15,
        borderRadius: 40,
    },
    pillWrapper: {
        borderRadius: 40,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.15)',
        backgroundColor: 'rgba(0,0,0,0.2)',
    },
    glassPill: {
        borderRadius: 40,
        height: 80,
    },
    pillContent: {
        flexDirection: 'row',
        alignItems: 'center',
        height: '100%',
        paddingHorizontal: 10, // Slight padding for the track
    },
    activeIndicator: { // The sliding spotlight
        position: 'absolute',
        top: 10, // Center vertically (80 - 60)/2
        left: 10, // Match paddingHorizontal
        width: TAB_WIDTH,
        height: 60,
        borderRadius: 30, // Squircle shape
        backgroundColor: 'rgba(255, 255, 255, 0.12)',
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
        gap: 6,
    },
    activeItemContent: {
        transform: [{ scale: 1.05 }],
    },
    navText: {
        fontSize: 11,
        fontWeight: '500',
        color: '#8E8E93',
    },
    activeNavText: {
        color: '#FF3B30',
        fontWeight: '700',
    },
});

