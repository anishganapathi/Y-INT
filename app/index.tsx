import React, { useState, useEffect } from 'react';
import GlassNavBar from '@/components/GlassNavBar';
import SplashScreen from '@/components/SplashScreen';
import { StyleSheet, View } from 'react-native';

export default function App() {
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    // Show splash screen for 3000ms
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  if (showSplash) {
    return <SplashScreen />;
  }

  return (
    <View style={styles.container}>
      <GlassNavBar />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
});
