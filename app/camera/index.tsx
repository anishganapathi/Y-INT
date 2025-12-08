/**
 * AR Camera Screen
 * Live camera view with AR restaurant recognition
 */

import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator, StatusBar, Platform } from 'react-native';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import * as Location from 'expo-location';
import { useRouter, Stack } from 'expo-router';
import { X, Camera, RefreshCw } from 'lucide-react-native';
import { BlurView } from 'expo-blur';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { CameraRecognitionEngine } from '@/services/cameraRecognitionEngine';

export default function ARCameraScreen(): React.JSX.Element {
  const router = useRouter();
  const cameraRef = useRef<any>(null);
  
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [locationPermission, setLocationPermission] = useState<Location.PermissionStatus | null>(null);
  const [facing, setFacing] = useState<CameraType>('back');
  const [isProcessing, setIsProcessing] = useState(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);

  const recognitionEngine = new CameraRecognitionEngine();

  // Request permissions on mount
  useEffect(() => {
    requestPermissions();
  }, []);

  const requestPermissions = async () => {
    // Request camera permission
    if (!cameraPermission?.granted) {
      await requestCameraPermission();
    }

    // Request location permission
    const { status } = await Location.requestForegroundPermissionsAsync();
    setLocationPermission(status);

    // Get current location
    if (status === 'granted') {
      const location = await Location.getCurrentPositionAsync({});
      setUserLocation({
        lat: location.coords.latitude,
        lng: location.coords.longitude,
      });
    }
  };

  const captureAndRecognize = async () => {
    if (!cameraRef.current || isProcessing) return;
    
    if (!userLocation) {
      Alert.alert('Location Required', 'Please enable location services to use AR recognition');
      return;
    }

    setIsProcessing(true);

    try {
      // Capture photo
      const photo = await cameraRef.current.takePictureAsync({
        base64: true,
        quality: 0.8,
      });

      if (!photo.base64) {
        throw new Error('Failed to capture image');
      }

      // Process through recognition engine
      const result = await recognitionEngine.processFrame({
        frame_id: `frame_${Date.now()}`,
        camera_image_base64: photo.base64,
        gps: userLocation,
        supabase_user: {
          user_id: 'demo_user', // Replace with actual user ID from auth
          favorites: [],
          dietary_preferences: ['vegetarian'],
          past_visits: [],
          liked_cuisines: ['Italian', 'Japanese'],
        },
      });

      // Redirect to restaurant detail page with smooth transition
      if (result && result.google_match && result.google_match.name) {
        const restaurantId = result.google_match.place_id || Date.now().toString();
        router.push({
          pathname: '/restaurant/[id]',
          params: {
            id: restaurantId,
            data: JSON.stringify(result),
          },
        });
      } else {
        Alert.alert('No Results', 'Could not identify restaurant. Please try again.');
      }
    } catch (error) {
      console.error('Recognition error:', error);
      Alert.alert('Error', 'Failed to recognize restaurant. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };


  const toggleCameraFacing = () => {
    setFacing(current => (current === 'back' ? 'front' : 'back'));
  };

  // Permission checks
  if (!cameraPermission) {
    return <View style={styles.container}><Text>Loading...</Text></View>;
  }

  if (!cameraPermission.granted) {
    return (
      <View style={styles.container}>
        <View style={styles.permissionContainer}>
          <Text style={styles.permissionText}>Camera access is required for AR recognition</Text>
          <TouchableOpacity style={styles.permissionButton} onPress={requestCameraPermission}>
            <Text style={styles.permissionButtonText}>Grant Permission</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.container}>
        <StatusBar barStyle="light-content" hidden />
        
        {/* Camera View */}
      <CameraView 
        ref={cameraRef}
        style={styles.camera} 
        facing={facing}
      >
        {/* Floating Close Button */}
        <Animated.View entering={FadeIn.duration(300)} exiting={FadeOut.duration(200)} style={styles.floatingCloseButton}>
          <BlurView intensity={60} tint="dark" style={styles.closeButtonBlur}>
            <TouchableOpacity 
              style={styles.closeButton} 
              onPress={() => router.back()}
              activeOpacity={0.7}
            >
              <X size={26} color="#fff" strokeWidth={2.5} />
            </TouchableOpacity>
          </BlurView>
        </Animated.View>

        {/* AR Viewfinder */}
        <View style={styles.viewfinder}>
          <View style={styles.cornerTopLeft} />
          <View style={styles.cornerTopRight} />
          <View style={styles.cornerBottomLeft} />
          <View style={styles.cornerBottomRight} />
        </View>


        {/* Bottom Controls */}
        <View style={styles.bottomControls}>
          <BlurView intensity={50} tint="dark" style={styles.controlsBlur}>
            {isProcessing ? (
              <ActivityIndicator size="large" color="#fff" />
            ) : (
              <TouchableOpacity 
                style={styles.captureButton}
                onPress={captureAndRecognize}
                activeOpacity={0.8}
              >
                <View style={styles.captureButtonInner}>
                  <Camera size={32} color="#FF3B30" strokeWidth={2.5} />
                </View>
              </TouchableOpacity>
            )}
          </BlurView>
        </View>

        {/* Instructions */}
        {!isProcessing && (
          <Animated.View 
            entering={FadeIn.delay(500).duration(400)}
            exiting={FadeOut.duration(200)}
            style={styles.instructionsContainer}
          >
            <BlurView intensity={80} tint="light" style={styles.instructionsBlur}>
              <Text style={styles.instructionsText}>
                👆 Point camera at restaurant sign and tap to scan
              </Text>
            </BlurView>
          </Animated.View>
        )}
      </CameraView>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  camera: {
    flex: 1,
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  permissionText: {
    fontSize: 16,
    color: '#fff',
    textAlign: 'center',
    marginBottom: 24,
  },
  permissionButton: {
    backgroundColor: '#FF3B30',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 12,
  },
  permissionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  floatingCloseButton: {
    position: 'absolute',
    top: 60,
    left: 20,
    zIndex: 100,
  },
  closeButtonBlur: {
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  closeButton: {
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  viewfinder: {
    position: 'absolute',
    top: '30%',
    left: '10%',
    right: '10%',
    height: 200,
  },
  cornerTopLeft: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 40,
    height: 40,
    borderTopWidth: 3,
    borderLeftWidth: 3,
    borderColor: '#FF3B30',
  },
  cornerTopRight: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 40,
    height: 40,
    borderTopWidth: 3,
    borderRightWidth: 3,
    borderColor: '#FF3B30',
  },
  cornerBottomLeft: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    width: 40,
    height: 40,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
    borderColor: '#FF3B30',
  },
  cornerBottomRight: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 40,
    height: 40,
    borderBottomWidth: 3,
    borderRightWidth: 3,
    borderColor: '#FF3B30',
  },
  bottomControls: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  controlsBlur: {
    borderRadius: 80,
    overflow: 'hidden',
    padding: 8,
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureButtonInner: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  instructionsContainer: {
    position: 'absolute',
    top: '50%',
    left: 32,
    right: 32,
    marginTop: 120,
  },
  instructionsBlur: {
    borderRadius: 16,
    overflow: 'hidden',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  instructionsText: {
    fontSize: 14,
    color: '#000',
    textAlign: 'center',
    fontWeight: '500',
  },
});

