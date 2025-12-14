/**
 * AR Camera Screen
 * Live camera view with AR restaurant recognition
 * Draggable camera preview with exposure controls
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Alert, 
  ActivityIndicator, 
  StatusBar, 
  Platform,
  Dimensions,
} from 'react-native';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import * as Location from 'expo-location';
import { useRouter, Stack } from 'expo-router';
import { X, Sun } from 'lucide-react-native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring,
  interpolate,
  Extrapolate,
  runOnJS,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import * as Haptics from 'expo-haptics';
import { CameraRecognitionEngine } from '@/services/cameraRecognitionEngine';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const MAX_DRAG_DISTANCE = 150;
const ELASTIC_RESISTANCE = 0.5;
const SNAP_THRESHOLD_UP = 90;
const SNAP_THRESHOLD_DOWN = 90;

export default function ARCameraScreen(): React.JSX.Element {
  const router = useRouter();
  const cameraRef = useRef<any>(null);
  
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [locationPermission, setLocationPermission] = useState<Location.PermissionStatus | null>(null);
  const [facing, setFacing] = useState<CameraType>('back');
  const [isProcessing, setIsProcessing] = useState(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  
  // Camera drag state
  const cameraOffset = useSharedValue(0);
  const isDragging = useSharedValue(false);
  const dragStartY = useSharedValue(0);
  const dragStartOffset = useSharedValue(0);
  const wasOpen = useSharedValue(false);
  
  // Exposure state
  const [currentExposure, setCurrentExposure] = useState(0);
  const [minExposure, setMinExposure] = useState(-4);
  const [maxExposure, setMaxExposure] = useState(4);
  
  // Focus indicator state
  const [showFocusIndicator, setShowFocusIndicator] = useState(false);
  const [focusX, setFocusX] = useState(0);
  const [focusY, setFocusY] = useState(0);
  const focusTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const recognitionEngine = new CameraRecognitionEngine();

  // Request permissions on mount
  useEffect(() => {
    requestPermissions();
  }, []);

  // Hide focus indicator after 2 seconds
  useEffect(() => {
    if (showFocusIndicator) {
      if (focusTimerRef.current) {
        clearTimeout(focusTimerRef.current);
      }
      focusTimerRef.current = setTimeout(() => {
        setShowFocusIndicator(false);
      }, 2000);
    }
    return () => {
      if (focusTimerRef.current) {
        clearTimeout(focusTimerRef.current);
      }
    };
  }, [showFocusIndicator]);

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
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

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
          user_id: 'demo_user',
          favorites: [],
          dietary_preferences: ['vegetarian'],
          past_visits: [],
          liked_cuisines: ['Italian', 'Japanese'],
        },
      });

      // Redirect to restaurant detail page
      if (result && result.google_match && result.google_match.name) {
        const restaurantId = (result.google_match as any)?.place_id || Date.now().toString();
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

  const handleTapFocus = (event: any) => {
    const { locationX, locationY } = event.nativeEvent;
    setFocusX(locationX);
    setFocusY(locationY);
    setShowFocusIndicator(true);
    
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    // Note: expo-camera doesn't directly support focus point setting
    // This is a visual indicator only
  };

  const handleExposureChange = (value: number) => {
    const clampedValue = Math.max(minExposure, Math.min(maxExposure, value));
    setCurrentExposure(clampedValue);
    // Note: expo-camera doesn't directly support exposure offset
    // This is a UI-only control for now
  };

  const sliderWidthRef = useRef(250);
  
  const onSliderLayout = (event: any) => {
    sliderWidthRef.current = event.nativeEvent.layout.width;
  };
  
  const onSliderPress = (event: any) => {
    const x = event.nativeEvent.locationX;
    const width = sliderWidthRef.current;
    const ratio = Math.max(0, Math.min(1, x / width));
    const newValue = minExposure + (ratio * (maxExposure - minExposure));
    handleExposureChange(newValue);
  };

  const snapCamera = (targetOffset: number, shouldVibrate: boolean) => {
    if (shouldVibrate) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    cameraOffset.value = withSpring(targetOffset, {
      damping: 15,
      stiffness: 150,
      mass: 0.5,
    });
    wasOpen.value = targetOffset > 0;
  };

  const panGesture = Gesture.Pan()
    .onStart((event) => {
      dragStartY.value = event.y;
      dragStartOffset.value = cameraOffset.value;
      isDragging.value = true;
    })
    .onUpdate((event) => {
      const drag = dragStartY.value - event.y;
      const rawOffset = dragStartOffset.value + drag;
      let newOffset;

      if (rawOffset >= 0) {
        if (rawOffset <= MAX_DRAG_DISTANCE) {
          newOffset = rawOffset;
        } else {
          const excess = rawOffset - MAX_DRAG_DISTANCE;
          newOffset = MAX_DRAG_DISTANCE + (excess * ELASTIC_RESISTANCE);
        }
      } else {
        newOffset = rawOffset * 0.3;
      }

      cameraOffset.value = Math.max(-40, Math.min(MAX_DRAG_DISTANCE + 120, newOffset));
    })
    .onEnd(() => {
      isDragging.value = false;
      const offset = cameraOffset.value;

      let willBeOpen: boolean;
      if (wasOpen.value) {
        willBeOpen = offset > SNAP_THRESHOLD_DOWN;
      } else {
        willBeOpen = offset >= SNAP_THRESHOLD_UP;
      }

      const shouldVibrate = willBeOpen !== wasOpen.value;
      const targetOffset = willBeOpen ? MAX_DRAG_DISTANCE : 0;
      
      runOnJS(snapCamera)(targetOffset, shouldVibrate);
    });

  // Animated styles
  const cameraAnimatedStyle = useAnimatedStyle(() => {
    const borderRadius = cameraOffset.value > 0 ? 40 : 0;
    return {
      transform: [{ translateY: -cameraOffset.value }],
      borderTopLeftRadius: borderRadius,
      borderTopRightRadius: borderRadius,
    };
  });

  const captureButtonAnimatedStyle = useAnimatedStyle(() => {
    const baseBottom = 25;
    const elasticOffset = cameraOffset.value * 0;
    return {
      bottom: baseBottom + elasticOffset,
    };
  });

  const exposureContainerAnimatedStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      cameraOffset.value,
      [0, MAX_DRAG_DISTANCE],
      [0, 1],
      Extrapolate.CLAMP
    );
    return {
      opacity,
    };
  });

  // Permission checks
  if (!cameraPermission) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="small" color="#fff" />
      </View>
    );
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
        
        {/* Exposure Controls (behind camera) */}
        <Animated.View style={[styles.exposureContainer, exposureContainerAnimatedStyle]}>
          <View style={styles.exposureContent}>
            <View style={styles.exposureSliderContainer}>
              <Sun size={20} color="rgba(255, 255, 255, 0.7)" />
              <TouchableOpacity 
                activeOpacity={1}
                onPress={onSliderPress}
                onLayout={onSliderLayout}
                style={styles.sliderWrapper}
              >
                <View style={styles.sliderTrack}>
                  <View 
                    style={[
                      styles.sliderActiveTrack,
                      { width: `${((currentExposure - minExposure) / (maxExposure - minExposure)) * 100}%` }
                    ]} 
                  />
                </View>
                <View 
                  style={[
                    styles.sliderThumb,
                    { left: `${((currentExposure - minExposure) / (maxExposure - minExposure)) * 100}%` }
                  ]} 
                />
              </TouchableOpacity>
              <Text style={styles.exposureValue}>{currentExposure.toFixed(1)}</Text>
            </View>
            <View style={styles.exposureScale}>
              <Text style={styles.scaleText}>{minExposure.toFixed(0)}</Text>
              <Text style={styles.scaleZero}>0</Text>
              <Text style={styles.scaleText}>{maxExposure.toFixed(0)}</Text>
            </View>
          </View>
        </Animated.View>

        {/* Draggable Camera Preview */}
        <GestureDetector gesture={panGesture}>
          <Animated.View style={[styles.cameraWrapper, cameraAnimatedStyle]}>
            <TouchableOpacity 
              activeOpacity={1} 
              onPress={handleTapFocus}
              style={styles.cameraTouchable}
            >
              <CameraView 
                ref={cameraRef}
                style={styles.camera} 
                facing={facing}
              >
                {/* Focus Indicator */}
                {showFocusIndicator && (
                  <View 
                    style={[
                      styles.focusIndicator,
                      {
                        left: focusX - 40,
                        top: focusY - 40,
                      },
                    ]}
                  />
                )}

                {/* Capture Button */}
                <Animated.View style={[styles.captureButtonContainer, captureButtonAnimatedStyle]}>
                  {isProcessing ? (
                    <ActivityIndicator size="large" color="#fff" />
                  ) : (
                    <TouchableOpacity
                      style={styles.captureButton}
                      onPress={captureAndRecognize}
                      activeOpacity={0.8}
                    >
                      <View style={styles.captureButtonOuter} />
                      <View style={styles.captureButtonInner} />
                    </TouchableOpacity>
                  )}
                </Animated.View>
              </CameraView>
            </TouchableOpacity>
          </Animated.View>
        </GestureDetector>

        {/* Close Button */}
        <View style={styles.closeButtonContainer}>
          <TouchableOpacity 
            style={styles.closeButton} 
            onPress={() => router.back()}
            activeOpacity={0.7}
          >
            <X size={24} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  exposureContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 200,
    justifyContent: 'flex-end',
    paddingBottom: 40,
  },
  exposureContent: {
    paddingHorizontal: 20,
  },
  exposureSliderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  sliderWrapper: {
    flex: 1,
    marginHorizontal: 20,
    height: 30,
    justifyContent: 'center',
    position: 'relative',
  },
  sliderTrack: {
    height: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.24)',
    borderRadius: 1.5,
    position: 'relative',
  },
  sliderActiveTrack: {
    height: 3,
    backgroundColor: '#F59E0B',
    borderRadius: 1.5,
    position: 'absolute',
    left: 0,
    top: 0,
  },
  sliderThumb: {
    position: 'absolute',
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#F59E0B',
    marginLeft: -8,
    marginTop: -6.5,
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
    elevation: 4,
  },
  exposureValue: {
    width: 40,
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'right',
  },
  exposureScale: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 40,
  },
  scaleText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.38)',
  },
  scaleZero: {
    fontSize: 14,
    fontWeight: 'bold',
    color: 'rgba(255, 255, 255, 0.7)',
  },
  cameraWrapper: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    overflow: 'hidden',
  },
  cameraTouchable: {
    flex: 1,
  },
  camera: {
    flex: 1,
  },
  focusIndicator: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderWidth: 2,
    borderColor: '#FFEB3B',
    borderRadius: 2,
  },
  captureButtonContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  captureButton: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  captureButtonOuter: {
    width: 74,
    height: 74,
    borderRadius: 37,
    backgroundColor: 'rgba(156, 156, 156, 0.4)',
    position: 'absolute',
  },
  captureButtonInner: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#fff',
  },
  closeButtonContainer: {
    position: 'absolute',
    top: 50,
    left: 20,
    zIndex: 1000,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
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
});
