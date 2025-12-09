-- ============================================
-- SUPABASE SCHEMA FOR FOOD ITINERARY PLANNER
-- ============================================
-- Run this in Supabase SQL Editor to create all tables
-- Dashboard → SQL Editor → New Query → Paste → Run

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 1. TRIP ITINERARIES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.trip_itineraries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Trip Details
  destination TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  total_days INTEGER NOT NULL,
  
  -- Budget
  total_budget DECIMAL(10,2) NOT NULL,
  spent_amount DECIMAL(10,2) DEFAULT 0,
  
  -- Party Info
  party_size INTEGER DEFAULT 2,
  
  -- Preferences
  dietary_restrictions TEXT[] DEFAULT '{}',
  cuisine_preferences TEXT[] DEFAULT '{}',
  meal_types TEXT[] DEFAULT '{"breakfast","lunch","dinner"}',
  
  -- Status
  status TEXT DEFAULT 'draft', -- draft, confirmed, active, completed, cancelled
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Indexes
  CONSTRAINT valid_status CHECK (status IN ('draft', 'confirmed', 'active', 'completed', 'cancelled'))
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_trip_user_id ON public.trip_itineraries(user_id);
CREATE INDEX IF NOT EXISTS idx_trip_status ON public.trip_itineraries(status);
CREATE INDEX IF NOT EXISTS idx_trip_start_date ON public.trip_itineraries(start_date);

-- ============================================
-- 2. ITINERARY DAYS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.itinerary_days (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trip_id UUID REFERENCES public.trip_itineraries(id) ON DELETE CASCADE NOT NULL,
  
  -- Day Details
  day_number INTEGER NOT NULL,
  date DATE NOT NULL,
  theme TEXT,
  total_budget DECIMAL(10,2) NOT NULL,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  UNIQUE(trip_id, day_number)
);

-- Create index
CREATE INDEX IF NOT EXISTS idx_day_trip_id ON public.itinerary_days(trip_id);

-- ============================================
-- 3. ITINERARY MEALS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.itinerary_meals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  day_id UUID REFERENCES public.itinerary_days(id) ON DELETE CASCADE NOT NULL,
  trip_id UUID REFERENCES public.trip_itineraries(id) ON DELETE CASCADE NOT NULL,
  
  -- Meal Details
  meal_type TEXT NOT NULL, -- breakfast, lunch, dinner, snack
  scheduled_time TIME NOT NULL,
  
  -- Restaurant Info (from Yelp)
  restaurant_id TEXT NOT NULL, -- Yelp business ID
  restaurant_name TEXT NOT NULL,
  restaurant_address TEXT,
  restaurant_rating DECIMAL(2,1),
  restaurant_price_level TEXT,
  restaurant_phone TEXT,
  restaurant_yelp_url TEXT,
  restaurant_photos TEXT[] DEFAULT '{}',
  
  -- Dishes
  recommended_dishes JSONB DEFAULT '[]', -- [{"name": "...", "price": 25, "why": "..."}]
  
  -- Cost
  estimated_cost DECIMAL(10,2) NOT NULL,
  actual_cost DECIMAL(10,2),
  
  -- Reservation
  reservation_needed BOOLEAN DEFAULT false,
  reservation_status TEXT DEFAULT 'none', -- none, pending, confirmed, cancelled
  reservation_id TEXT,
  reservation_time TIMESTAMP WITH TIME ZONE,
  reservation_confirmation_code TEXT,
  
  -- Visit Tracking
  visited BOOLEAN DEFAULT false,
  visit_date TIMESTAMP WITH TIME ZONE,
  rating INTEGER, -- User rating 1-5
  review_notes TEXT,
  visit_photos TEXT[] DEFAULT '{}',
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_meal_type CHECK (meal_type IN ('breakfast', 'lunch', 'dinner', 'snack')),
  CONSTRAINT valid_reservation_status CHECK (reservation_status IN ('none', 'pending', 'confirmed', 'cancelled')),
  CONSTRAINT valid_rating CHECK (rating >= 1 AND rating <= 5)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_meal_day_id ON public.itinerary_meals(day_id);
CREATE INDEX IF NOT EXISTS idx_meal_trip_id ON public.itinerary_meals(trip_id);
CREATE INDEX IF NOT EXISTS idx_meal_restaurant_id ON public.itinerary_meals(restaurant_id);

-- ============================================
-- 4. BUDGET ENTRIES TABLE (for tracking actual spending)
-- ============================================
CREATE TABLE IF NOT EXISTS public.budget_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trip_id UUID REFERENCES public.trip_itineraries(id) ON DELETE CASCADE NOT NULL,
  meal_id UUID REFERENCES public.itinerary_meals(id) ON DELETE SET NULL,
  
  -- Entry Details
  amount DECIMAL(10,2) NOT NULL,
  category TEXT NOT NULL, -- food, transportation, entertainment, other
  description TEXT,
  entry_date DATE NOT NULL,
  
  -- Receipt
  receipt_photo TEXT,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_category CHECK (category IN ('food', 'transportation', 'entertainment', 'other'))
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_budget_trip_id ON public.budget_entries(trip_id);
CREATE INDEX IF NOT EXISTS idx_budget_meal_id ON public.budget_entries(meal_id);

-- ============================================
-- 5. USER PREFERENCES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.user_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  
  -- Preferences
  favorite_cuisines TEXT[] DEFAULT '{}',
  dietary_restrictions TEXT[] DEFAULT '{}',
  default_budget_per_day DECIMAL(10,2),
  default_party_size INTEGER DEFAULT 2,
  
  -- Past Visits (for personalization)
  visited_restaurants TEXT[] DEFAULT '{}', -- Array of Yelp IDs
  favorite_restaurants TEXT[] DEFAULT '{}', -- Array of Yelp IDs
  
  -- Notifications
  enable_reservation_reminders BOOLEAN DEFAULT true,
  enable_budget_alerts BOOLEAN DEFAULT true,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index
CREATE INDEX IF NOT EXISTS idx_preferences_user_id ON public.user_preferences(user_id);

-- ============================================
-- 6. SHARED TRIPS TABLE (for sharing itineraries with friends)
-- ============================================
CREATE TABLE IF NOT EXISTS public.shared_trips (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trip_id UUID REFERENCES public.trip_itineraries(id) ON DELETE CASCADE NOT NULL,
  shared_by UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  shared_with_email TEXT NOT NULL,
  shared_with_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Permissions
  can_edit BOOLEAN DEFAULT false,
  can_view BOOLEAN DEFAULT true,
  
  -- Status
  status TEXT DEFAULT 'pending', -- pending, accepted, declined
  
  -- Timestamps
  shared_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  accepted_at TIMESTAMP WITH TIME ZONE,
  
  -- Constraints
  CONSTRAINT valid_share_status CHECK (status IN ('pending', 'accepted', 'declined'))
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_shared_trip_id ON public.shared_trips(trip_id);
CREATE INDEX IF NOT EXISTS idx_shared_with_email ON public.shared_trips(shared_with_email);

-- ============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================

-- Enable RLS on all tables
ALTER TABLE public.trip_itineraries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.itinerary_days ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.itinerary_meals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budget_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shared_trips ENABLE ROW LEVEL SECURITY;

-- Trip Itineraries Policies
CREATE POLICY "Users can view their own trips"
  ON public.trip_itineraries FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own trips"
  ON public.trip_itineraries FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own trips"
  ON public.trip_itineraries FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own trips"
  ON public.trip_itineraries FOR DELETE
  USING (auth.uid() = user_id);

-- Itinerary Days Policies
CREATE POLICY "Users can view days of their trips"
  ON public.itinerary_days FOR SELECT
  USING (trip_id IN (SELECT id FROM public.trip_itineraries WHERE user_id = auth.uid()));

CREATE POLICY "Users can create days for their trips"
  ON public.itinerary_days FOR INSERT
  WITH CHECK (trip_id IN (SELECT id FROM public.trip_itineraries WHERE user_id = auth.uid()));

CREATE POLICY "Users can update days of their trips"
  ON public.itinerary_days FOR UPDATE
  USING (trip_id IN (SELECT id FROM public.trip_itineraries WHERE user_id = auth.uid()));

CREATE POLICY "Users can delete days of their trips"
  ON public.itinerary_days FOR DELETE
  USING (trip_id IN (SELECT id FROM public.trip_itineraries WHERE user_id = auth.uid()));

-- Itinerary Meals Policies
CREATE POLICY "Users can view meals of their trips"
  ON public.itinerary_meals FOR SELECT
  USING (trip_id IN (SELECT id FROM public.trip_itineraries WHERE user_id = auth.uid()));

CREATE POLICY "Users can create meals for their trips"
  ON public.itinerary_meals FOR INSERT
  WITH CHECK (trip_id IN (SELECT id FROM public.trip_itineraries WHERE user_id = auth.uid()));

CREATE POLICY "Users can update meals of their trips"
  ON public.itinerary_meals FOR UPDATE
  USING (trip_id IN (SELECT id FROM public.trip_itineraries WHERE user_id = auth.uid()));

CREATE POLICY "Users can delete meals of their trips"
  ON public.itinerary_meals FOR DELETE
  USING (trip_id IN (SELECT id FROM public.trip_itineraries WHERE user_id = auth.uid()));

-- Budget Entries Policies
CREATE POLICY "Users can view budget entries of their trips"
  ON public.budget_entries FOR SELECT
  USING (trip_id IN (SELECT id FROM public.trip_itineraries WHERE user_id = auth.uid()));

CREATE POLICY "Users can create budget entries for their trips"
  ON public.budget_entries FOR INSERT
  WITH CHECK (trip_id IN (SELECT id FROM public.trip_itineraries WHERE user_id = auth.uid()));

CREATE POLICY "Users can update budget entries of their trips"
  ON public.budget_entries FOR UPDATE
  USING (trip_id IN (SELECT id FROM public.trip_itineraries WHERE user_id = auth.uid()));

CREATE POLICY "Users can delete budget entries of their trips"
  ON public.budget_entries FOR DELETE
  USING (trip_id IN (SELECT id FROM public.trip_itineraries WHERE user_id = auth.uid()));

-- User Preferences Policies
CREATE POLICY "Users can view their own preferences"
  ON public.user_preferences FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own preferences"
  ON public.user_preferences FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own preferences"
  ON public.user_preferences FOR UPDATE
  USING (auth.uid() = user_id);

-- Shared Trips Policies
CREATE POLICY "Users can view trips shared with them"
  ON public.shared_trips FOR SELECT
  USING (auth.uid() = shared_by OR auth.uid() = shared_with_user_id);

CREATE POLICY "Users can share their own trips"
  ON public.shared_trips FOR INSERT
  WITH CHECK (auth.uid() = shared_by);

CREATE POLICY "Users can update shares they created"
  ON public.shared_trips FOR UPDATE
  USING (auth.uid() = shared_by);

CREATE POLICY "Users can delete shares they created"
  ON public.shared_trips FOR DELETE
  USING (auth.uid() = shared_by);

-- ============================================
-- FUNCTIONS & TRIGGERS
-- ============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_trip_itineraries_updated_at
  BEFORE UPDATE ON public.trip_itineraries
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_itinerary_meals_updated_at
  BEFORE UPDATE ON public.itinerary_meals
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_preferences_updated_at
  BEFORE UPDATE ON public.user_preferences
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to calculate total spent for a trip
CREATE OR REPLACE FUNCTION calculate_trip_spent(trip_uuid UUID)
RETURNS DECIMAL AS $$
BEGIN
  RETURN (
    SELECT COALESCE(SUM(actual_cost), 0)
    FROM public.itinerary_meals
    WHERE trip_id = trip_uuid AND actual_cost IS NOT NULL
  );
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- SAMPLE DATA (OPTIONAL - for testing)
-- ============================================

-- Uncomment below to insert sample data

/*
-- Insert sample user preferences (replace with actual user_id after authentication)
INSERT INTO public.user_preferences (user_id, favorite_cuisines, dietary_restrictions)
VALUES (
  auth.uid(), -- Current authenticated user
  ARRAY['italian', 'japanese', 'mexican'],
  ARRAY['vegetarian']
);
*/

-- ============================================
-- SUCCESS!
-- ============================================
-- All tables created successfully!
-- You can now use these tables in your app with Supabase client.

