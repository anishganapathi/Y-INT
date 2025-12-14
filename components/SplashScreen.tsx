/**
 * Splash Screen Component
 * Shows app logo with loader on app launch
 */

import React from 'react';
import { View, Image, StyleSheet, ActivityIndicator } from 'react-native';
import { MotiView } from 'moti';

export default function SplashScreen() {
  return (
    <View style={styles.container}>
      <MotiView
        from={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: 'spring', damping: 15, stiffness: 100 }}
        style={styles.logoContainer}
      >
        <Image
          source={require('@/assets/images/AppLogo.png')}
          style={styles.logo}
          resizeMode="contain"
        />
      </MotiView>

      <MotiView
        from={{ opacity: 0, translateY: 20 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: 'timing', duration: 800, delay: 300 }}
        style={styles.loaderContainer}
      >
        <ActivityIndicator size="large" color="#FF3B30" />
      </MotiView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    marginBottom: 60,
  },
  logo: {
    width: 200,
    height: 200,
  },
  loaderContainer: {
    marginTop: 20,
  },
});
