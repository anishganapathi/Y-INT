/**
 * Favorites Context
 * Global state management for favorite restaurants
 */

import React, { createContext, useContext, useState, ReactNode } from 'react';
import { RecognitionOutput } from '@/services/cameraRecognitionEngine';

interface FavoriteRestaurant extends RecognitionOutput {
  savedAt: string;
  restaurantId: string;
}

interface FavoritesContextType {
  favorites: FavoriteRestaurant[];
  addFavorite: (restaurant: RecognitionOutput, restaurantId: string) => void;
  removeFavorite: (restaurantId: string) => void;
  isFavorite: (restaurantId: string) => boolean;
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined);

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const [favorites, setFavorites] = useState<FavoriteRestaurant[]>([]);

  const addFavorite = (restaurant: RecognitionOutput, restaurantId: string) => {
    const newFavorite: FavoriteRestaurant = {
      ...restaurant,
      savedAt: new Date().toISOString(),
      restaurantId,
    };

    setFavorites(prev => {
      // Remove if already exists (to avoid duplicates)
      const filtered = prev.filter(fav => fav.restaurantId !== restaurantId);
      return [newFavorite, ...filtered];
    });

    console.log('❤️ Added to favorites:', restaurant.google_match.name);
  };

  const removeFavorite = (restaurantId: string) => {
    setFavorites(prev => prev.filter(fav => fav.restaurantId !== restaurantId));
    console.log('💔 Removed from favorites');
  };

  const isFavorite = (restaurantId: string) => {
    return favorites.some(fav => fav.restaurantId === restaurantId);
  };

  return (
    <FavoritesContext.Provider value={{ favorites, addFavorite, removeFavorite, isFavorite }}>
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites() {
  const context = useContext(FavoritesContext);
  if (context === undefined) {
    throw new Error('useFavorites must be used within a FavoritesProvider');
  }
  return context;
}

