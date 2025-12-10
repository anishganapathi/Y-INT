import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MotiView } from 'moti';
import Icon from '@/components/LucideIcons';

export default function ProfilePage() {
  const router = useRouter();

  const menuItems = [
    {
      id: 'username',
      icon: 'User',
      iconColor: '#A78BFA',
      title: 'Username',
      subtitle: '@anishganapathi',
      onPress: () => console.log('Username'),
    },
    {
      id: 'notifications',
      icon: 'Bell',
      iconColor: '#60D5FA',
      title: 'Notifications',
      subtitle: 'Mute, Push, Email',
      onPress: () => console.log('Notifications'),
    },
    {
      id: 'Saved',
      icon: 'Save',
      iconColor: '#FA6868',
      title: 'Saved',
      subtitle: 'Your saved places',
      onPress: () => console.log('Saved'),
    },
    {
        id: 'settings',
        icon: 'Settings',
        iconColor: '#86EFAC',
        title: 'Settings',
        subtitle: 'Security, Privacy',
        onPress: () => console.log('Settings'),
      },
  ];

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <MotiView
        from={{ opacity: 0, translateY: -20 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: 'timing', duration: 700 }}
        style={styles.header}
      >
        <TouchableOpacity style={styles.iconButton} activeOpacity={0.7}>
          <Icon name="Settings" size={22} color="#1A1A1A" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.iconButton} activeOpacity={0.7}>
          <Icon name="Share2" size={22} color="#1A1A1A" />
        </TouchableOpacity>
      </MotiView>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Avatar */}
        <MotiView
          from={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', delay: 100 }}
          style={styles.avatarContainer}
        >
          <View style={styles.avatarWrapper}>
            <Image
              source={require('@/assets/images/avatar.png')}
              style={styles.avatar}
            />
          </View>
        </MotiView>

        {/* Name & Email */}
        <MotiView
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'spring', delay: 200 }}
          style={styles.infoContainer}
        >
          <Text style={styles.name}>Anish Ganapathi</Text>
          <Text style={styles.email}>anishgnapathi@gmail.com</Text>
        </MotiView>

        {/* Menu Items */}
        <View style={styles.menuContainer}>
          {menuItems.map((item, index) => (
            <MotiView
              key={item.id}
              from={{ opacity: 0, translateX: -20 }}
              animate={{ opacity: 1, translateX: 0 }}
              transition={{ type: 'spring', delay: 500 + index * 100 }}
            >
              <TouchableOpacity
                style={styles.menuItem}
                onPress={item.onPress}
                activeOpacity={0.7}
              >
                <View style={styles.menuLeft}>
                  <View style={[styles.menuIconContainer, { backgroundColor: `${item.iconColor}20` }]}>
                    <Icon name={item.icon} size={22} color={item.iconColor} />
                  </View>
                  <View style={styles.menuTextContainer}>
                    <Text style={styles.menuTitle}>{item.title}</Text>
                    <Text style={styles.menuSubtitle}>{item.subtitle}</Text>
                  </View>
            </View>
                <Icon name="ChevronRight" size={24} color="#C7C7CC" />
              </TouchableOpacity>
            </MotiView>
          ))}
        </View>

        {/* Bottom Spacing */}
        <View style={{ height: 40 }} />
      </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    backgroundColor: '#F5F5F7',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    marginBottom: 10,
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 40,
  },
  avatarContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  avatarWrapper: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: '#FFF',
    padding: 8,
    shadowColor: '#FCF8F8',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 24,
    elevation: 10,
  },
  avatar: {
    width: '100%',
    height: '100%',
    borderRadius: 62,
  },
  infoContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  name: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1A1A1A',
    marginBottom: 6,
    letterSpacing: -0.5,
  },
  email: {
    fontSize: 15,
    fontWeight: '500',
    color: '#8E8E93',
  },
  menuContainer: {
    gap: 14,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFF',
    borderRadius: 24,
    padding: 22,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 4,
  },
  menuLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  menuIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
        justifyContent: 'center',
        alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
    },
  menuTextContainer: {
    gap: 4,
    },
  menuTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1A1A1A',
    },
  menuSubtitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#8E8E93',
  },
});
