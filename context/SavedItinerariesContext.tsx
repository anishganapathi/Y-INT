/**
 * Saved Itineraries Context
 * Global state management for saved itineraries
 */

import React, { createContext, useContext, useState, ReactNode } from 'react';
import { TripItinerary } from '@/types/itinerary';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface SavedItinerary extends TripItinerary {
  savedAt: string;
}

interface SavedItinerariesContextType {
  savedItineraries: SavedItinerary[];
  addSavedItinerary: (itinerary: TripItinerary) => Promise<void>;
  removeSavedItinerary: (itineraryId: string) => Promise<void>;
  isSaved: (itineraryId: string) => boolean;
  loadSavedItineraries: () => Promise<void>;
  getSavedItineraryById: (itineraryId: string) => Promise<SavedItinerary | null>;
}

const SavedItinerariesContext = createContext<SavedItinerariesContextType | undefined>(undefined);

const STORAGE_KEY = '@saved_itineraries';

export function SavedItinerariesProvider({ children }: { children: ReactNode }) {
  const [savedItineraries, setSavedItineraries] = useState<SavedItinerary[]>([]);

  // Load saved itineraries from storage
  const loadSavedItineraries = async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setSavedItineraries(parsed);
      }
    } catch (error) {
      console.error('Error loading saved itineraries:', error);
    }
  };

  const addSavedItinerary = async (itinerary: TripItinerary) => {
    try {
      const savedItinerary: SavedItinerary = {
        ...itinerary,
        savedAt: new Date().toISOString(),
      };

      const updated = [savedItinerary, ...savedItineraries.filter(item => item.id !== itinerary.id)];
      setSavedItineraries(updated);
      
      // Persist to storage
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      console.log('✅ Itinerary saved:', itinerary.destination);
    } catch (error) {
      console.error('Error saving itinerary:', error);
    }
  };

  const removeSavedItinerary = async (itineraryId: string) => {
    try {
      const updated = savedItineraries.filter(item => item.id !== itineraryId);
      setSavedItineraries(updated);
      
      // Update storage
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      console.log('🗑️ Itinerary removed from saved');
    } catch (error) {
      console.error('Error removing saved itinerary:', error);
    }
  };

  const isSaved = (itineraryId: string) => {
    return savedItineraries.some(item => item.id === itineraryId);
  };

  const getSavedItineraryById = async (itineraryId: string): Promise<SavedItinerary | null> => {
    // First check in-memory state
    const found = savedItineraries.find(item => item.id === itineraryId);
    if (found) {
      return found;
    }
    
    // If not found, check storage
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed: SavedItinerary[] = JSON.parse(stored);
        const storedItem = parsed.find(item => item.id === itineraryId);
        return storedItem || null;
      }
    } catch (error) {
      console.error('Error getting saved itinerary:', error);
    }
    
    return null;
  };

  return (
    <SavedItinerariesContext.Provider 
      value={{ 
        savedItineraries, 
        addSavedItinerary, 
        removeSavedItinerary, 
        isSaved,
        loadSavedItineraries,
        getSavedItineraryById,
      }}
    >
      {children}
    </SavedItinerariesContext.Provider>
  );
}

export function useSavedItineraries() {
  const context = useContext(SavedItinerariesContext);
  if (context === undefined) {
    throw new Error('useSavedItineraries must be used within a SavedItinerariesProvider');
  }
  return context;
}
