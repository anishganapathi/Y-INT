# 🗄️ Supabase Setup Guide

## 📋 What You Need to Run on Supabase

### **Quick Steps:**

1. **Go to Supabase Dashboard**
   - Visit: https://supabase.com/dashboard
   - Select your project

2. **Open SQL Editor**
   - Click "SQL Editor" in left sidebar
   - Click "New Query"

3. **Run the Schema**
   - Copy ALL content from `supabase/schema.sql`
   - Paste into the SQL Editor
   - Click "Run" button (or press Ctrl/Cmd + Enter)

4. **Verify Success**
   - Should see: "Success. No rows returned"
   - Check "Table Editor" to see new tables

---

## 🗂️ Tables Created:

### 1. **trip_itineraries**
Main table for storing food trip plans
```
- id (UUID)
- user_id (reference to auth.users)
- destination (New York, Paris, etc.)
- start_date, end_date, total_days
- total_budget, spent_amount
- party_size
- dietary_restrictions[], cuisine_preferences[]
- status (draft, confirmed, active, completed)
- timestamps
```

### 2. **itinerary_days**
Individual days within a trip
```
- id (UUID)
- trip_id (reference to trip_itineraries)
- day_number (1, 2, 3...)
- date
- theme ("Culinary Adventure", etc.)
- total_budget
```

### 3. **itinerary_meals**
Each meal in the itinerary
```
- id (UUID)
- day_id, trip_id
- meal_type (breakfast, lunch, dinner, snack)
- scheduled_time
- restaurant_id (Yelp ID), name, address, rating, etc.
- recommended_dishes (JSON array)
- estimated_cost, actual_cost
- reservation info (needed, status, confirmation)
- visit tracking (visited, rating, photos)
```

### 4. **budget_entries**
Track actual spending
```
- id (UUID)
- trip_id, meal_id
- amount
- category (food, transportation, entertainment)
- description, receipt_photo
- entry_date
```

### 5. **user_preferences**
Store user preferences for personalization
```
- id (UUID)
- user_id
- favorite_cuisines[]
- dietary_restrictions[]
- default_budget_per_day
- visited_restaurants[], favorite_restaurants[]
- notification settings
```

### 6. **shared_trips**
Share itineraries with friends
```
- id (UUID)
- trip_id
- shared_by, shared_with_email, shared_with_user_id
- can_edit, can_view permissions
- status (pending, accepted, declined)
```

---

## 🔐 Security Features:

### **Row Level Security (RLS) Enabled**
- ✅ Users can only see their own trips
- ✅ Users can only modify their own data
- ✅ Shared trips are visible to shared users
- ✅ All tables protected with policies

### **Automatic Timestamps**
- ✅ `created_at` set automatically
- ✅ `updated_at` updates on every change

### **Data Validation**
- ✅ Valid meal types (breakfast, lunch, dinner, snack)
- ✅ Valid statuses (draft, confirmed, active, completed)
- ✅ Valid ratings (1-5 stars)
- ✅ Valid budget amounts (positive decimals)

---

## 📊 Example Data Structure:

### After Creating an Itinerary:

```javascript
// trip_itineraries
{
  id: "uuid-123",
  user_id: "user-uuid",
  destination: "New York",
  start_date: "2024-01-15",
  end_date: "2024-01-20",
  total_days: 5,
  total_budget: 500.00,
  spent_amount: 0,
  party_size: 2,
  status: "draft"
}

// itinerary_days (5 records)
{
  id: "day-uuid-1",
  trip_id: "uuid-123",
  day_number: 1,
  date: "2024-01-15",
  theme: "Culinary Adventure",
  total_budget: 100.00
}

// itinerary_meals (15 records, 3 per day)
{
  id: "meal-uuid-1",
  day_id: "day-uuid-1",
  trip_id: "uuid-123",
  meal_type: "breakfast",
  scheduled_time: "09:00:00",
  restaurant_id: "carbone-ny",
  restaurant_name: "Carbone",
  restaurant_rating: 4.5,
  restaurant_price_level: "$$$",
  recommended_dishes: [
    {
      name: "Spicy Rigatoni",
      price: 32,
      why: "Popular choice based on reviews"
    }
  ],
  estimated_cost: 48.00,
  reservation_needed: true,
  reservation_status: "none",
  visited: false
}
```

---

## 🔧 Useful SQL Queries:

### Get All Trips for Current User:
```sql
SELECT * FROM trip_itineraries
WHERE user_id = auth.uid()
ORDER BY created_at DESC;
```

### Get Full Itinerary with Meals:
```sql
SELECT 
  t.*,
  d.day_number,
  d.theme,
  m.meal_type,
  m.restaurant_name,
  m.estimated_cost
FROM trip_itineraries t
JOIN itinerary_days d ON d.trip_id = t.id
JOIN itinerary_meals m ON m.day_id = d.id
WHERE t.id = 'your-trip-id'
ORDER BY d.day_number, m.scheduled_time;
```

### Calculate Total Spent:
```sql
SELECT 
  trip_id,
  SUM(actual_cost) as total_spent
FROM itinerary_meals
WHERE trip_id = 'your-trip-id'
GROUP BY trip_id;
```

### Get User's Favorite Restaurants:
```sql
SELECT favorite_restaurants
FROM user_preferences
WHERE user_id = auth.uid();
```

---

## 📱 Using in Your App:

### 1. **Install Supabase Client** (already done)
```bash
npm install @supabase/supabase-js
```

### 2. **Initialize Client** (in `config/env.ts`)
```typescript
import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  ENV.SUPABASE_URL,
  ENV.SUPABASE_ANON_KEY
);
```

### 3. **Save Itinerary to Supabase**
```typescript
// Instead of AsyncStorage
const { data, error } = await supabase
  .from('trip_itineraries')
  .insert({
    destination: 'New York',
    start_date: '2024-01-15',
    end_date: '2024-01-20',
    total_days: 5,
    total_budget: 500,
    party_size: 2
  })
  .select()
  .single();
```

### 4. **Load Itinerary**
```typescript
const { data, error } = await supabase
  .from('trip_itineraries')
  .select(`
    *,
    itinerary_days (
      *,
      itinerary_meals (*)
    )
  `)
  .eq('id', tripId)
  .single();
```

---

## ✅ Verification Steps:

After running the schema, check:

1. **Table Editor**
   - Should see 6 new tables
   - Click each to see column structure

2. **Authentication**
   - Enable Email/Password auth
   - Or enable Google/GitHub OAuth

3. **Policies**
   - Check "Policies" tab
   - Should see RLS policies for each table

4. **API**
   - Get your API keys from Settings → API
   - Update `config/env.ts` with:
     - `SUPABASE_URL`
     - `SUPABASE_ANON_KEY`

---

## 🎯 Next Steps:

### **Option 1: Keep Using AsyncStorage** (Current)
- ✅ Already working
- ✅ No setup needed
- ❌ Data lost if app deleted
- ❌ No sync across devices

### **Option 2: Migrate to Supabase** (Recommended)
- ✅ Data persists forever
- ✅ Sync across devices
- ✅ Share with friends
- ✅ Backup & recovery
- 🔧 Requires schema setup (above)

---

## 🚀 Quick Migration Plan:

If you want to switch to Supabase:

1. **Run schema** (from above)
2. **Update services** to use Supabase instead of AsyncStorage
3. **Add authentication** (sign up/sign in)
4. **Test saving/loading** itineraries
5. **Migrate existing data** (if needed)

---

## 📝 Important Notes:

- **Authentication Required**: Users must be signed in to save trips
- **RLS Enabled**: Security is automatic
- **Free Tier**: Supabase free tier is generous (500MB database, 2GB file storage)
- **Backup**: Database is automatically backed up
- **Real-time**: Can enable real-time subscriptions for live updates

---

## 🎉 That's It!

**Just run the `supabase/schema.sql` file in your Supabase SQL Editor and you're done!**

The database is now ready to store all your food trip itineraries! 🍕🗄️

---

**Need help with migration? Let me know!** 🚀

