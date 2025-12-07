import { BlurView } from "expo-blur";
import React, { useState } from "react";
import { Platform, StyleSheet, TouchableOpacity, View, Dimensions } from "react-native";
import Animated, {
    FadeInRight,
    FadeOutLeft,
    withSpring,
    useAnimatedStyle,
    useSharedValue,
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
    { icon: "House", label: "Home", screen: HomePage }, // Changed to House
    { icon: "Compass", label: "Explore", screen: ExplorePage },
    { icon: "Heart", label: "Favorite", screen: FavoritePage },
    { icon: "User", label: "Profile", screen: ProfilePage },
];

const { width } = Dimensions.get('window');

export default function GlassNavBar(): React.JSX.Element {
    const [activeTab, setActiveTab] = useState(0);

    // Split items: First 3 in the pill, last one in the circle
    const mainItems = NAV_ITEMS.slice(0, 3);
    const actionItem = NAV_ITEMS[3];

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

                {/* Main Pill */}
                <View style={styles.pillWrapper}>
                    <BlurView intensity={40} tint="light" style={styles.glassPill}>
                        <View style={styles.pillContent}>
                            {mainItems.map((item, index) => {
                                const isActive = activeTab === index;
                                return (
                                    <TouchableOpacity
                                        key={item.label}
                                        style={styles.navItem}
                                        onPress={() => setActiveTab(index)}
                                        activeOpacity={0.7}
                                    >
                                        {isActive && (
                                            <Animated.View
                                                entering={FadeInRight.springify().damping(15)}
                                                style={styles.activeIndicator}
                                            />
                                        )}
                                        <View style={[styles.itemContent, isActive && styles.activeItemContent]}>
                                            <Icon
                                                name={item.icon}
                                                size={24}
                                                color={isActive ? "#D32F2F" : "#555"}
                                                strokeWidth={isActive ? 2.5 : 2}
                                                fill={isActive ? "#D32F2F" : "transparent"} // Added fill for active state
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

                {/* Right Circle (Profile/Action) */}
                <TouchableOpacity
                    style={styles.circleWrapper}
                    activeOpacity={0.8}
                    onPress={() => setActiveTab(3)}
                >
                    <BlurView intensity={40} tint="light" style={styles.glassCircle}>
                        <View style={[styles.circleContent, activeTab === 3 && styles.activeCircleContent]}>
                            {activeTab === 3 && <View style={styles.activeCircleIndicator} />}
                            <Icon
                                name={actionItem.icon}
                                size={26}
                                color={activeTab === 3 ? "#D32F2F" : "#555"}
                                strokeWidth={activeTab === 3 ? 2.5 : 2}
                                fill={activeTab === 3 ? "#D32F2F" : "transparent"}
                            />
                        </View>
                    </BlurView>
                </TouchableOpacity>

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
        bottom: Platform.OS === "ios" ? 40 : 25,
        left: 0,
        right: 0,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 15,
        gap: 15, // Increased gap slightly for separation
    },
    // Main Pill Styles
    pillWrapper: {
        borderRadius: 35,
        overflow: 'hidden',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.15,
        shadowRadius: 15,
        elevation: 10,
    },
    glassPill: {
        borderRadius: 35,
        backgroundColor: 'rgba(255, 240, 245, 0.45)', // Pinkish milky glass
        borderWidth: 1.5,
        borderColor: 'rgba(255, 255, 255, 0.5)',
    },
    pillContent: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 6, // Reduced vertically
        paddingHorizontal: 6, // Reduced horizontally
        height: 64, // Reduced height from 72
    },
    navItem: {
        height: '100%',
        paddingHorizontal: 16, // Reduced from 20
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 25,
        minWidth: 65, // Reduced from 80
    },
    itemContent: {
        alignItems: 'center',
        gap: 3,
        zIndex: 2,
    },
    activeItemContent: {
        transform: [{ scale: 1.05 }],
    },
    activeIndicator: {
        position: 'absolute',
        width: '120%',
        height: '100%',
        borderRadius: 25,
        backgroundColor: 'rgba(255, 80, 80, 0.15)', // Light red glow
        zIndex: 1,
    },
    navText: {
        fontSize: 10,
        fontWeight: '600',
        color: '#666',
    },
    activeNavText: {
        color: '#D32F2F',
        fontWeight: '700',
    },

    // Circle Styles
    circleWrapper: {
        borderRadius: 35, // Match pill slightly better
        overflow: 'hidden',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.15,
        shadowRadius: 15,
        elevation: 10,
        height: 64, // Match pill height
        width: 64, // Match pill height
    },
    glassCircle: {
        flex: 1,
        borderRadius: 35,
        backgroundColor: 'rgba(255, 240, 245, 0.45)',
        borderWidth: 1.5,
        borderColor: 'rgba(255, 255, 255, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    circleContent: {
        justifyContent: 'center',
        alignItems: 'center',
        width: '100%',
        height: '100%',
    },
    activeCircleContent: {
        // Active state for circle
    },
    activeCircleIndicator: {
        position: 'absolute',
        width: '100%',
        height: '100%',
        backgroundColor: 'rgba(255, 80, 80, 0.15)',
    }
});
