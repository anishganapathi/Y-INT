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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Icon from '@/components/LucideIcons';
import { MotiView } from 'moti';
import DateTimePicker from '@react-native-community/datetimepicker';

const DIETARY_OPTIONS = [
  { id: 'vegan', label: 'Vegan' },
  { id: 'vegetarian', label: 'Vegetarian' },
  { id: 'gluten_free', label: 'Gluten-Free' },
  { id: 'dairy_free', label: 'Dairy-Free' },
  { id: 'halal', label: 'Halal' },
  { id: 'kosher', label: 'Kosher' },
];

const CUISINE_OPTIONS = [
  { id: 'italian', label: 'Italian' },
  { id: 'japanese', label: 'Japanese' },
  { id: 'mexican', label: 'Mexican' },
  { id: 'indian', label: 'Indian' },
  { id: 'chinese', label: 'Chinese' },
  { id: 'american', label: 'American' },
  { id: 'thai', label: 'Thai' },
  { id: 'mediterranean', label: 'Mediterranean' },
];

const MEAL_TYPES = [
  { id: 'breakfast', label: 'Breakfast' },
  { id: 'lunch', label: 'Lunch' },
  { id: 'dinner', label: 'Dinner' },
  { id: 'snacks', label: 'Snacks' },
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
          from={{ opacity: 0, translateY: -10 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 600 }}
        >
          <Text style={styles.headerTitle}>Plan Your Trip</Text>
          <Text style={styles.headerSubtitle}>Create a personalized food itinerary</Text>
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
          style={styles.card}
        >
          <View style={styles.cardHeader}>
            <View style={styles.iconCircle}>
              <Icon name="MapPin" size={18} color="#FF8A80" />
            </View>
            <Text style={styles.cardTitle}>Destination</Text>
          </View>
          <TextInput
            style={styles.input}
            placeholder="Enter city or location"
            placeholderTextColor="#B8B8B8"
            value={destination}
            onChangeText={setDestination}
          />
        </MotiView>

        {/* Trip Dates */}
        <MotiView
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'spring', delay: 150 }}
          style={styles.card}
        >
          <View style={styles.cardHeader}>
            <View style={styles.iconCircle}>
              <Icon name="Calendar" size={18} color="#9C88FF" />
            </View>
            <Text style={styles.cardTitle}>Select Dates</Text>
          </View>
          <View style={styles.dateRow}>
            <TouchableOpacity
              style={styles.dateBox}
              onPress={() => setShowStartPicker(true)}
            >
              <Text style={styles.dateBoxLabel}>Start</Text>
              <Text style={styles.dateBoxValue}>
                {startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </Text>
            </TouchableOpacity>

            <Icon name="ArrowRight" size={16} color="#D1D1D6" />

            <TouchableOpacity
              style={styles.dateBox}
              onPress={() => setShowEndPicker(true)}
            >
              <Text style={styles.dateBoxLabel}>End</Text>
              <Text style={styles.dateBoxValue}>
                {endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.daysIndicator}>{calculateDays()} days selected</Text>

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

        {/* Budget */}
        <MotiView
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'spring', delay: 200 }}
          style={styles.card}
        >
          <View style={styles.cardHeader}>
            <View style={styles.iconCircle}>
              <Icon name="DollarSign" size={18} color="#4FC3F7" />
            </View>
            <View style={{ flex: 1, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={styles.cardTitle}>Budget</Text>
              <Text style={styles.budgetValue}>${budget}</Text>
            </View>
          </View>
          <View style={styles.budgetOptions}>
            {[250, 500, 1000, 2000].map((amount) => (
              <TouchableOpacity
                key={amount}
                style={[styles.budgetChip, budget === amount && styles.budgetChipSelected]}
                onPress={() => setBudget(amount)}
              >
                <Text style={[styles.budgetChipText, budget === amount && styles.budgetChipTextSelected]}>
                  ${amount}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </MotiView>

        {/* Party Size */}
        <MotiView
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'spring', delay: 250 }}
          style={styles.card}
        >
          <View style={styles.cardHeader}>
            <View style={styles.iconCircle}>
              <Icon name="Users" size={18} color="#81C784" />
            </View>
            <Text style={styles.cardTitle}>Party Size</Text>
          </View>
          <View style={styles.counterRow}>
            <TouchableOpacity
              style={styles.counterButton}
              onPress={() => setPartySize(Math.max(1, partySize - 1))}
            >
              <Icon name="Minus" size={18} color="#FF8A80" />
            </TouchableOpacity>
            <Text style={styles.counterValue}>{partySize}</Text>
            <TouchableOpacity
              style={styles.counterButton}
              onPress={() => setPartySize(partySize + 1)}
            >
              <Icon name="Plus" size={18} color="#FF8A80" />
            </TouchableOpacity>
          </View>
        </MotiView>

        {/* Meal Types */}
        <MotiView
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'spring', delay: 300 }}
          style={styles.card}
        >
          <View style={styles.cardHeader}>
            <View style={styles.iconCircle}>
              <Icon name="Coffee" size={18} color="#FFB74D" />
            </View>
            <Text style={styles.cardTitle}>Meal Types</Text>
          </View>
          <View style={styles.chipRow}>
            {MEAL_TYPES.map((meal) => (
              <TouchableOpacity
                key={meal.id}
                style={[
                  styles.chip,
                  selectedMeals.includes(meal.id) && styles.chipSelected,
                ]}
                onPress={() => toggleSelection(meal.id, selectedMeals, setSelectedMeals)}
              >
                <Text style={[
                  styles.chipText,
                  selectedMeals.includes(meal.id) && styles.chipTextSelected,
                ]}>
                  {meal.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </MotiView>

        {/* Cuisine Preferences */}
        <MotiView
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'spring', delay: 350 }}
          style={styles.card}
        >
          <View style={styles.cardHeader}>
            <View style={styles.iconCircle}>
              <Icon name="UtensilsCrossed" size={18} color="#E57373" />
            </View>
            <Text style={styles.cardTitle}>Cuisine Preferences</Text>
          </View>
          <View style={styles.chipRow}>
            {CUISINE_OPTIONS.map((cuisine) => (
              <TouchableOpacity
                key={cuisine.id}
                style={[
                  styles.chip,
                  selectedCuisines.includes(cuisine.id) && styles.chipSelected,
                ]}
                onPress={() => toggleSelection(cuisine.id, selectedCuisines, setSelectedCuisines)}
              >
                <Text style={[
                  styles.chipText,
                  selectedCuisines.includes(cuisine.id) && styles.chipTextSelected,
                ]}>
                  {cuisine.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </MotiView>

        {/* Dietary Restrictions */}
        <MotiView
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'spring', delay: 400 }}
          style={styles.card}
        >
          <View style={styles.cardHeader}>
            <View style={styles.iconCircle}>
              <Icon name="Leaf" size={18} color="#AED581" />
            </View>
            <Text style={styles.cardTitle}>Dietary Restrictions</Text>
          </View>
          <View style={styles.chipRow}>
            {DIETARY_OPTIONS.map((diet) => (
              <TouchableOpacity
                key={diet.id}
                style={[
                  styles.chip,
                  selectedDietary.includes(diet.id) && styles.chipSelected,
                ]}
                onPress={() => toggleSelection(diet.id, selectedDietary, setSelectedDietary)}
              >
                <Text style={[
                  styles.chipText,
                  selectedDietary.includes(diet.id) && styles.chipTextSelected,
                ]}>
                  {diet.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </MotiView>

        {/* Generate Button */}
        <MotiView
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'spring', delay: 450 }}
          style={{ marginTop: 8 }}
        >
          <TouchableOpacity
            style={[styles.generateButton, !isFormValid && styles.generateButtonDisabled]}
            onPress={handleGenerate}
            disabled={!isFormValid}
            activeOpacity={0.8}
          >
            <Text style={styles.generateButtonText}>Generate Itinerary</Text>
            <Icon name="Sparkles" size={20} color="#FFF" />
          </TouchableOpacity>
        </MotiView>

        {/* Bottom Spacing */}
        <View style={{ height: 120 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 20,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 4,
    letterSpacing: -0.5,
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
    padding: 16,
  },
  card: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#F5F5F7',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F9FAFB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  input: {
    fontSize: 16,
    color: '#1A1A1A',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E8E8E8',
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  dateBox: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E8E8E8',
  },
  dateBoxLabel: {
    fontSize: 12,
    color: '#8E8E93',
    fontWeight: '500',
    marginBottom: 4,
  },
  dateBoxValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  daysIndicator: {
    fontSize: 13,
    color: '#9C88FF',
    fontWeight: '500',
    marginTop: 12,
    textAlign: 'center',
  },
  budgetValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#4FC3F7',
  },
  budgetOptions: {
    flexDirection: 'row',
    gap: 10,
  },
  budgetChip: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E8E8E8',
    alignItems: 'center',
  },
  budgetChipSelected: {
    backgroundColor: '#E3F2FD',
    borderColor: '#4FC3F7',
  },
  budgetChipText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8E8E93',
  },
  budgetChipTextSelected: {
    color: '#4FC3F7',
  },
  counterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 24,
  },
  counterButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F9FAFB',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E8E8E8',
  },
  counterValue: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1A1A1A',
    minWidth: 60,
    textAlign: 'center',
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E8E8E8',
  },
  chipSelected: {
    backgroundColor: '#FFE8E8',
    borderColor: '#FF8A80',
  },
  chipText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#8E8E93',
  },
  chipTextSelected: {
    color: '#FF8A80',
    fontWeight: '600',
  },
  generateButton: {
    flexDirection: 'row',
    backgroundColor: '#FA6868',
    borderRadius: 16,
    paddingVertical: 18,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    shadowColor: '#FF8A80',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  generateButtonDisabled: {
    backgroundColor: '#E0E0E0',
    shadowOpacity: 0,
  },
  generateButtonText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFF',
  },
});
