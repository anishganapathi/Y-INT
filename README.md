# Yint | Yelp Intelligence for Travel & Dining

![Yint Banner Image](https://i.postimg.cc/zXg23bc8/Thumbnail.png)

[![Expo](https://img.shields.io/badge/Expo-000000?style=for-the-badge&logo=expo&logoColor=white)](https://expo.dev/)
[![React Native](https://img.shields.io/badge/React%20Native-61DAFB?style=for-the-badge&logo=react&logoColor=000)](https://reactnative.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com/)
[![Yelp Fusion](https://img.shields.io/badge/Yelp%20Fusion-FF1A1A?style=for-the-badge&logo=yelp&logoColor=white)](https://docs.developer.yelp.com/)

> An AI-powered dining assistant that identifies restaurants through your camera, layers in Yelp intelligence, plans budget-aware itineraries, and compares meal value right on your phone.

---

## Executive Summary

Yint is an AI-driven food and travel companion that helps users make smarter dining decisions instantly. By scanning restaurants, generating AI-powered reviews, and planning personalized food itineraries, Yint removes the guesswork from discovering where and what to eat. Using Yelp AI, it also estimates meal costs and compares calorie impact based on user preferences, budget, and health goals turning food exploration into a data-driven, personalized experience.

---

## Highlights

- **AR Restaurant Recognition**: OCR + Yelp intelligence in one tap.
- **AI-style Insights**: Summaries, popular dishes, dietary labels, and review highlights.
- **Smart Food Itineraries**: Budget/diet/cuisine-aware plans saved to Supabase.
- **Cost Estimator Chat**: Compare two restaurants or dishes on calories, quantity, and value.
- **Favorites & Saved Trips**: Persisted across sessions; offline-friendly fallbacks.

---

---

## Screenshots
---

![Main Cover](https://i.postimg.cc/kGx8PmTJ/1Main-Cover.png)

![Home Page](https://i.postimg.cc/WzMrcv53/2Home-Page.png)

![Explore Page](https://i.postimg.cc/Znr3zSw-0/3Explore-Page.png)

![Camera Page](https://i.postimg.cc/QCp5Z3fd/4Camera-Page.png)

![Yelp AI](https://i.postimg.cc/kGx8PmTG/5Yelp-AI.png)

![Itinerary Page 1](https://i.postimg.cc/ZY36d846/6Itinerary-Page-1.png)

![Itinerary Page 2](https://i.postimg.cc/jqNy7HtH/7Itinerary-Page-2.png)


---

## How It’s Built

1. **Frontend**: Expo + React Native + Expo Router, Moti/Reanimated for motion, Blur/LinearGradient for glassy UI, Lucide icons.
2. **AR & Vision Pipeline**: `CameraRecognitionEngine` orchestrates Google Vision OCR → Yelp Fusion enrichment → personalization via Supabase preferences.
3. **Restaurant Intelligence**: `YelpService` and `YelpItineraryService` fetch details, reviews, dishes, dietary labels, and nearby search results.
4. **Smart Itineraries (no external AI calls)**: `SmartItineraryEngine` optimizes meals per day against budget, party size, and meal types; `supabaseItineraryService` persists trips.
5. **Cost Estimator**: `CostEstimatorService` compares two options (restaurants or dishes) on estimated cost, calories, quantity, and value score.
6. **Data Layer**: Supabase (schema in `supabase/schema.sql`) for itineraries, saved trips, and personalization.

---

## Architecture

![Architecture Diagram](https://i.postimg.cc/dtt58yy3/Architecture.png)

The application is built on a client-server architecture with the Expo app serving as the client layer, providing AR camera functionality, chat interface, and integration with Yelp Fusion API for business information and reviews. The core logic is handled by service modules located in the `services/` directory, which include the recognition pipeline for restaurant identification, an itinerary optimizer for generating travel plans, and a cost estimator for comparing dining options. Data persistence is managed through Supabase for storing trips and favorites, while AsyncStorage provides local caching capabilities for offline-friendly functionality.

---

## What Makes YelpAI Different

Yint distinguishes itself through vision-first discovery, allowing users to identify restaurants simply by looking at them through their camera. The platform leverages Yelp intelligence without relying on heavy LLM calls, making it fast, deterministic, and cost-aware. Its trip planning capabilities intelligently respect budget constraints, dietary needs, cuisine variety, and party size to create personalized dining experiences. The cost-comparison chat feature transforms free-form text queries into structured value analysis, helping users make informed decisions. The mobile experience is enhanced with delightful UI elements including haptics, glassmorphism design, and micro-animations that create an engaging and intuitive user interface.

---

## Setup & Installation

```bash
git clone https://github.com/anishganapathi/Y-INT.git   # or your own fork
cd Y-INT
npm install
```

Create a `.env` in the project root (Expo reads `EXPO_PUBLIC_*` at runtime):

```env
EXPO_PUBLIC_GOOGLE_VISION_API_KEY=your_google_vision_key
EXPO_PUBLIC_YELP_API_KEY=your_yelp_fusion_key
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

> Note: `config/env.ts` contains placeholder keys for local development. Replace them with your own credentials before shipping.

### Supabase

1. Create a Supabase project.
2. Run the SQL in `supabase/schema.sql` to create tables/policies.
3. Set the URL and anon key in `.env` as above.

### Run the app

```bash
npx expo start
```

Open on iOS Simulator, Android Emulator, or a development build. The app uses Expo Router with file-based navigation under `app/`.

---

## Core Flows (Code Pointers)

- AR recognition: `services/cameraRecognitionEngine.ts`
- Yelp enrichment: `services/yelpService.ts`
- Itinerary planning: `services/aiItineraryEngine.ts`, `services/yelpItineraryService.ts`, `services/supabaseItineraryService.ts`
- Cost comparison chat: `app/chat/index.tsx`, `services/costEstimatorService.ts`
- Itinerary UI: `app/itinerary/*`
- Explore & home feeds: `app/home/index.tsx`, `app/explore/index.tsx`

---

## Challenges & Learnings

Building Yint presented several technical challenges that required innovative solutions. Matching OCR text to real places proved difficult when dealing with noisy storefront images, where lighting conditions, angles, and partial text visibility could lead to incorrect restaurant identification. The deterministic itinerary generation system required careful balancing of multiple constraints including budget limitations, dietary preferences, and cuisine variety to create optimal meal plans without relying on expensive AI calls. Extracting meaningful insights like popular dishes and dietary labels from sparse Yelp review text demanded sophisticated text parsing and pattern recognition techniques. Perhaps most critically, maintaining smooth AR flows while orchestrating multiple external APIs on-device required careful optimization of network requests, caching strategies, and error handling to ensure a responsive user experience even under varying network conditions.

---

## Roadmap

The future development of Yint will focus on enhancing real-time functionality and user experience. Planned features include integration with live reservation systems and wait-time signals to help users make more informed dining decisions. Offline-friendly caching for frequent neighborhoods will improve performance in areas with poor connectivity, ensuring the app remains functional even without constant internet access. Push notifications will be implemented for itinerary reminders and table hold confirmations, keeping users informed about their planned dining experiences. The platform will also expand its health and dietary features with better dish-level nutrition estimates and comprehensive allergen flags, helping users make choices aligned with their health goals. Finally, deeper personalization through Supabase user profiles will enable more tailored recommendations based on dining history, preferences, and behavior patterns.

---

## License

MIT License.


## Developed with ❤️ by

| **Anish Ganapathi** |  |
|:----------------:|:-----------------:|
| ✉️ anishganapathi03@gmail.com <br> <br>🔗 [LinkedIn](https://www.linkedin.com/in/anish-ganapathi/) <br> <br>🐱 [GitHub](https://github.com/anishganapathi/) |  |