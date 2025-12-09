/**
 * Trip Planner Page
 * Plan your food trip with AI-powered itinerary
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Dimensions,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Icon from '@/components/LucideIcons';
import { MotiView } from 'moti';
import { LinearGradient } from 'expo-linear-gradient';
import DateTimePicker from '@react-native-community/datetimepicker';

const { width } = Dimensions.get('window');

const DIETARY_OPTIONS = [
  { id: 'vegan', label: 'Vegan', emoji: '🌱' },
  { id: 'vegetarian', label: 'Vegetarian', emoji: '🥗' },
  { id: 'gluten_free', label: 'Gluten-Free', emoji: '🌾' },
  { id: 'dairy_free', label: 'Dairy-Free', emoji: '🥛' },
  { id: 'halal', label: 'Halal', emoji: '🕌' },
  { id: 'kosher', label: 'Kosher', emoji: '✡️' },
];

const CUISINE_OPTIONS = [
  { id: 'italian', label: 'Italian', emoji: '🍝' },
  { id: 'japanese', label: 'Japanese', emoji: '🍣' },
  { id: 'mexican', label: 'Mexican', emoji: '🌮' },
  { id: 'indian', label: 'Indian', emoji: '🍛' },
  { id: 'chinese', label: 'Chinese', emoji: '🥡' },
  { id: 'american', label: 'American', emoji: '🍔' },
  { id: 'thai', label: 'Thai', emoji: '🍜' },
  { id: 'mediterranean', label: 'Mediterranean', emoji: '🥙' },
];

const MEAL_TYPES = [
  { id: 'breakfast', label: 'Breakfast', emoji: '🍳' },
  { id: 'lunch', label: 'Lunch', emoji: '🍱' },
  { id: 'dinner', label: 'Dinner', emoji: '🍽️' },
  { id: 'snacks', label: 'Snacks', emoji: '🍿' },
];

export default function TripPlannerPage() {
  const router = useRouter();
  
  // Form State
  const [destination, setDestination] = useState('');
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date(Date.now() + 5 * 24 * 60 * 60 * 1000));
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [budget, setBudget] = useState(500);
  const [partySize, setPartySize] = useState(2);
  const [selectedDietary, setSelectedDietary] = useState<string[]>([]);
  const [selectedCuisines, setSelectedCuisines] = useState<string[]>([]);
  const [selectedMeals, setSelectedMeals] = useState<string[]>(['breakfast', 'lunch', 'dinner']);

  const toggleSelection = (id: string, currentList: string[], setter: (list: string[]) => void) => {
    if (currentList.includes(id)) {
      setter(currentList.filter(item => item !== id));
    } else {
      setter([...currentList, id]);
    }
  };

  const calculateDays = () => {
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays || 1;
  };

  const handleGenerate = () => {
    // Navigate to generating screen
    router.push({
      pathname: '/itinerary/generating',
      params: {
        destination,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        budget: budget.toString(),
        partySize: partySize.toString(),
        dietary: JSON.stringify(selectedDietary),
        cuisines: JSON.stringify(selectedCuisines),
        meals: JSON.stringify(selectedMeals),
      },
    });
  };

  const isFormValid = destination.trim() !== '' && budget > 0 && selectedMeals.length > 0;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <MotiView
          from={{ opacity: 0, translateX: -20 }}
          animate={{ opacity: 1, translateX: 0 }}
          transition={{ type: 'timing', duration: 600 }}
        >
          <Text style={styles.headerTitle}>🗺️ Plan Food Trip</Text>
          <Text style={styles.headerSubtitle}>AI-powered itinerary for foodies</Text>
        </MotiView>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Destination Input */}
        <MotiView
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'spring', delay: 100 }}
          style={styles.section}
        >
          <Text style={styles.sectionLabel}>📍 Destination</Text>
          <View style={styles.inputContainer}>
            <Icon name="MapPin" size={20} color="#FF3B30" />
            <TextInput
              style={styles.input}
              placeholder="Where are you going? (e.g., New York)"
              placeholderTextColor="#999"
              value={destination}
              onChangeText={setDestination}
            />
          </View>
        </MotiView>

        {/* Trip Dates */}
        <MotiView
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'spring', delay: 200 }}
          style={styles.section}
        >
          <Text style={styles.sectionLabel}>📅 Trip Dates</Text>
          <View style={styles.dateRow}>
            <TouchableOpacity
              style={styles.dateButton}
              onPress={() => setShowStartPicker(true)}
            >
              <Text style={styles.dateLabel}>From</Text>
              <Text style={styles.dateValue}>
                {startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </Text>
            </TouchableOpacity>

            <Icon name="ArrowRight" size={20} color="#999" />

            <TouchableOpacity
              style={styles.dateButton}
              onPress={() => setShowEndPicker(true)}
            >
              <Text style={styles.dateLabel}>To</Text>
              <Text style={styles.dateValue}>
                {endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.daysCount}>{calculateDays()} days</Text>

          {showStartPicker && (
            <DateTimePicker
              value={startDate}
              mode="date"
              display="default"
              onChange={(event, date) => {
                setShowStartPicker(false);
                if (date) setStartDate(date);
              }}
              minimumDate={new Date()}
            />
          )}

          {showEndPicker && (
            <DateTimePicker
              value={endDate}
              mode="date"
              display="default"
              onChange={(event, date) => {
                setShowEndPicker(false);
                if (date) setEndDate(date);
              }}
              minimumDate={startDate}
            />
          )}
        </MotiView>

        {/* Budget Slider */}
        <MotiView
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'spring', delay: 300 }}
          style={styles.section}
        >
          <View style={styles.budgetHeader}>
            <Text style={styles.sectionLabel}>💰 Total Budget</Text>
            <Text style={styles.budgetValue}>${budget}</Text>
          </View>
          
          <View style={styles.budgetSliderContainer}>
            {[100, 250, 500, 1000, 2000].map((value) => (
              <TouchableOpacity
                key={value}
                style={[
                  styles.budgetOption,
                  budget === value && styles.budgetOptionActive,
                ]}
                onPress={() => setBudget(value)}
              >
                <Text
                  style={[
                    styles.budgetOptionText,
                    budget === value && styles.budgetOptionTextActive,
                  ]}
                >
                  ${value}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text style={styles.budgetHint}>
            ~${Math.round(budget / calculateDays())} per day
          </Text>
        </MotiView>

        {/* Party Size */}
        <MotiView
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'spring', delay: 400 }}
          style={styles.section}
        >
          <Text style={styles.sectionLabel}>👥 Party Size</Text>
          <View style={styles.counterContainer}>
            <TouchableOpacity
              style={styles.counterButton}
              onPress={() => setPartySize(Math.max(1, partySize - 1))}
            >
              <Icon name="Minus" size={20} color="#FFF" />
            </TouchableOpacity>
            <Text style={styles.counterValue}>{partySize} {partySize === 1 ? 'person' : 'people'}</Text>
            <TouchableOpacity
              style={styles.counterButton}
              onPress={() => setPartySize(Math.min(10, partySize + 1))}
            >
              <Icon name="Plus" size={20} color="#FFF" />
            </TouchableOpacity>
          </View>
        </MotiView>

        {/* Dietary Restrictions */}
        <MotiView
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'spring', delay: 500 }}
          style={styles.section}
        >
          <Text style={styles.sectionLabel}>🍽️ Dietary Restrictions</Text>
          <View style={styles.optionsGrid}>
            {DIETARY_OPTIONS.map((option) => (
              <TouchableOpacity
                key={option.id}
                style={[
                  styles.optionChip,
                  selectedDietary.includes(option.id) && styles.optionChipActive,
                ]}
                onPress={() => toggleSelection(option.id, selectedDietary, setSelectedDietary)}
              >
                <Text style={styles.optionEmoji}>{option.emoji}</Text>
                <Text
                  style={[
                    styles.optionText,
                    selectedDietary.includes(option.id) && styles.optionTextActive,
                  ]}
                >
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </MotiView>

        {/* Cuisine Preferences */}
        <MotiView
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'spring', delay: 600 }}
          style={styles.section}
        >
          <Text style={styles.sectionLabel}>🌮 Cuisine Preferences</Text>
          <View style={styles.optionsGrid}>
            {CUISINE_OPTIONS.map((option) => (
              <TouchableOpacity
                key={option.id}
                style={[
                  styles.optionChip,
                  selectedCuisines.includes(option.id) && styles.optionChipActive,
                ]}
                onPress={() => toggleSelection(option.id, selectedCuisines, setSelectedCuisines)}
              >
                <Text style={styles.optionEmoji}>{option.emoji}</Text>
                <Text
                  style={[
                    styles.optionText,
                    selectedCuisines.includes(option.id) && styles.optionTextActive,
                  ]}
                >
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </MotiView>

        {/* Meal Types */}
        <MotiView
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'spring', delay: 700 }}
          style={styles.section}
        >
          <Text style={styles.sectionLabel}>🍳 Meals to Include</Text>
          <View style={styles.mealTypesRow}>
            {MEAL_TYPES.map((meal) => (
              <TouchableOpacity
                key={meal.id}
                style={[
                  styles.mealTypeChip,
                  selectedMeals.includes(meal.id) && styles.mealTypeChipActive,
                ]}
                onPress={() => toggleSelection(meal.id, selectedMeals, setSelectedMeals)}
              >
                <Text style={styles.mealTypeEmoji}>{meal.emoji}</Text>
                <Text
                  style={[
                    styles.mealTypeText,
                    selectedMeals.includes(meal.id) && styles.mealTypeTextActive,
                  ]}
                >
                  {meal.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </MotiView>

        {/* Generate Button */}
        <MotiView
          from={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', delay: 800 }}
          style={styles.buttonContainer}
        >
          <TouchableOpacity
            style={[styles.generateButton, !isFormValid && styles.generateButtonDisabled]}
            onPress={handleGenerate}
            disabled={!isFormValid}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={isFormValid ? ['#FF3B30', '#FF6B6B'] : ['#CCC', '#999']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.generateGradient}
            >
              <Icon name="Sparkles" size={24} color="#FFF" />
              <Text style={styles.generateButtonText}>Generate Itinerary</Text>
            </LinearGradient>
          </TouchableOpacity>
        </MotiView>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FB',
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 20,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 15,
    color: '#8E8E93',
    fontWeight: '500',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 120,
  },
  section: {
    marginBottom: 28,
  },
  sectionLabel: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 12,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 56,
    borderWidth: 1.5,
    borderColor: '#F0F0F0',
    gap: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#1A1A1A',
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
  },
  dateButton: {
    flex: 1,
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1.5,
    borderColor: '#F0F0F0',
  },
  dateLabel: {
    fontSize: 13,
    color: '#8E8E93',
    fontWeight: '600',
    marginBottom: 4,
  },
  dateValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  daysCount: {
    fontSize: 14,
    color: '#FF3B30',
    fontWeight: '600',
    marginTop: 8,
    textAlign: 'center',
  },
  budgetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  budgetValue: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FF3B30',
  },
  budgetSliderContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  budgetOption: {
    flex: 1,
    backgroundColor: '#FFF',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#F0F0F0',
  },
  budgetOptionActive: {
    backgroundColor: '#FF3B30',
    borderColor: '#FF3B30',
  },
  budgetOptionText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#8E8E93',
  },
  budgetOptionTextActive: {
    color: '#FFF',
  },
  budgetHint: {
    fontSize: 13,
    color: '#8E8E93',
    textAlign: 'center',
    fontWeight: '500',
  },
  counterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 16,
    gap: 24,
    borderWidth: 1.5,
    borderColor: '#F0F0F0',
  },
  counterButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#1A1A1A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  counterValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A1A1A',
    minWidth: 100,
    textAlign: 'center',
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  optionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 16,
    gap: 8,
    borderWidth: 1.5,
    borderColor: '#F0F0F0',
  },
  optionChipActive: {
    backgroundColor: '#FF3B30',
    borderColor: '#FF3B30',
  },
  optionEmoji: {
    fontSize: 16,
  },
  optionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  optionTextActive: {
    color: '#FFF',
  },
  mealTypesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  mealTypeChip: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    gap: 8,
    borderWidth: 1.5,
    borderColor: '#F0F0F0',
  },
  mealTypeChipActive: {
    backgroundColor: '#FF3B30',
    borderColor: '#FF3B30',
  },
  mealTypeEmoji: {
    fontSize: 32,
  },
  mealTypeText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  mealTypeTextActive: {
    color: '#FFF',
  },
  buttonContainer: {
    marginTop: 12,
  },
  generateButton: {
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#FF3B30',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  generateButtonDisabled: {
    shadowOpacity: 0,
  },
  generateGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    gap: 12,
  },
  generateButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFF',
  },
});
