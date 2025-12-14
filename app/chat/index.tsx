import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  Image,
  ScrollView,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Icon from '@/components/LucideIcons';
import { MotiView, MotiText } from 'moti';
import { LinearGradient } from 'expo-linear-gradient';
import { CostEstimatorService, CostComparison, ComparisonError } from '@/services/costEstimatorService';
import * as Location from 'expo-location';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  timestamp: Date;
  comparisonData?: CostComparison;
}

const costEstimatorService = new CostEstimatorService();
const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function ChatPage() {
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: 'Hello! I\'m YelpAI, your dining assistant. Ask me about restaurants, dietary preferences, popular dishes, or anything food-related!',
      sender: 'ai',
      timestamp: new Date(),
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    // Auto-scroll to bottom when new messages arrive
    if (messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages]);

  const handleSend = async () => {
    if (inputText.trim() === '') return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputText.trim(),
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    const userInput = inputText.trim();
    setInputText('');
    setIsTyping(true);

    // Check if this is a cost estimator request
    const costEstimateMatch = parseCostEstimateRequest(userInput);
    
    if (costEstimateMatch) {
      // Handle cost estimator
      try {
        let location: { lat: number; lng: number } | undefined;
        try {
          const { status } = await Location.requestForegroundPermissionsAsync();
          if (status === 'granted') {
            const userLocation = await Location.getCurrentPositionAsync({});
            location = {
              lat: userLocation.coords.latitude,
              lng: userLocation.coords.longitude,
            };
          }
        } catch (error) {
          console.log('Location permission denied or error');
        }

        const comparison = await costEstimatorService.compareOptions(
          costEstimateMatch.option1,
          costEstimateMatch.option2,
          costEstimateMatch.budget,
          location
        );

        if (!comparison) {
          const aiMessage: Message = {
            id: (Date.now() + 1).toString(),
            text: 'Sorry, I encountered an error while comparing. Please try again with a different format or check the restaurant names.',
            sender: 'ai',
            timestamp: new Date(),
          };
          setMessages((prev) => [...prev, aiMessage]);
        } else if ('success' in comparison && !comparison.success) {
          // Handle error response
          const errorMsg = comparison.missingRestaurants.length > 0
            ? `I couldn't find the following: ${comparison.missingRestaurants.join(' and ')}.\n\nPlease try:\n• Check spelling of restaurant names\n• Try using just the restaurant name (e.g., "Chipotle" instead of "Chipotle in Hoboken")\n• Remove location names if included\n\nExample: "Compare Karma Kafe biryani $18 vs Chipotle burrito $18"`
            : comparison.error;
          
          const aiMessage: Message = {
            id: (Date.now() + 1).toString(),
            text: errorMsg,
            sender: 'ai',
            timestamp: new Date(),
          };
          setMessages((prev) => [...prev, aiMessage]);
        } else {
          // Success - show comparison
          const aiMessage: Message = {
            id: (Date.now() + 1).toString(),
            text: generateComparisonResponse(comparison as CostComparison),
            sender: 'ai',
            timestamp: new Date(),
            comparisonData: comparison as CostComparison,
          };
          setMessages((prev) => [...prev, aiMessage]);
        }
      } catch (error) {
        console.error('Cost estimator error:', error);
        const aiMessage: Message = {
          id: (Date.now() + 1).toString(),
          text: 'Sorry, I encountered an error while comparing restaurants. Please try again!',
          sender: 'ai',
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, aiMessage]);
      }
      setIsTyping(false);
    } else {
      // Regular AI response
    setTimeout(() => {
        const aiResponse = generateAIResponse(userInput);
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: aiResponse,
        sender: 'ai',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiMessage]);
      setIsTyping(false);
    }, 1500);
    }
  };

  /**
   * Parse cost estimate request from user input
   * Supports formats like:
   * - "compare restaurant1 vs restaurant2 for $25"
   * - "which is better restaurant1 or restaurant2 for 25 dollars"
   * - "cost estimator: option1 vs option2 budget 25"
   * - "compare Karma Kafe biryani $18 vs Chipotle $18"
   * - "biriyani at Karma Kafe $18 vs burrito at Chipotle $18"
   */
  const parseCostEstimateRequest = (input: string): { 
    option1: string | { restaurant: string; dish?: string; cost?: number }; 
    option2: string | { restaurant: string; dish?: string; cost?: number }; 
    budget: number 
  } | null => {
    const lowerInput = input.toLowerCase();
    
    // Check for cost estimator keywords
    const hasCostKeywords = 
      lowerInput.includes('compare') || 
      lowerInput.includes('cost') || 
      lowerInput.includes('estimator') ||
      lowerInput.includes('which is better') ||
      lowerInput.includes('vs') ||
      lowerInput.includes('versus');

    if (!hasCostKeywords) {
      return null;
    }

    // Extract budget - find all dollar amounts
    const budgetMatches = input.match(/\$(\d+)/g);
    let budget = 25; // Default
    if (budgetMatches && budgetMatches.length > 0) {
      // Use the last mentioned budget or the highest amount
      const amounts = budgetMatches.map(m => parseFloat(m.replace('$', '')));
      budget = Math.max(...amounts);
    } else {
      const budgetMatch = input.match(/\$?(\d+)/);
      if (budgetMatch) {
        budget = parseFloat(budgetMatch[1]);
      }
    }

    // Extract two options - improved patterns
    const vsPatterns = [
      /compare\s+(.+?)\s+(?:vs|versus|or)\s+(.+?)(?:\s+for|\s+with|\s+budget|$)/i,
      /(.+?)\s+(?:vs|versus|or)\s+(.+?)(?:\s+for|\s+with|\s+budget)/i,
      /which is better\s+(.+?)\s+or\s+(.+?)(?:\s+for|\s+with|$)/i,
      /cost estimator[:\s]+(.+?)\s+vs\s+(.+?)(?:\s+budget|$)/i,
    ];

    let option1Str = '';
    let option2Str = '';

    for (const pattern of vsPatterns) {
      const match = input.match(pattern);
      if (match) {
        option1Str = match[1].trim();
        option2Str = match[2].trim();
        break;
      }
    }

    // Fallback: try to split by common separators
    if (!option1Str || !option2Str) {
      const separators = [' vs ', ' versus ', ' or '];
      for (const sep of separators) {
        if (lowerInput.includes(sep)) {
          const parts = input.split(sep);
          if (parts.length >= 2) {
            option1Str = parts[0].replace(/compare|cost estimator/gi, '').trim();
            option2Str = parts[1].replace(/for|with|budget/gi, '').trim();
            break;
          }
        }
      }
    }

    if (!option1Str || !option2Str) {
      return null;
    }

    // Parse each option to extract restaurant, dish, and cost
    const parseOption = (optStr: string): string | { restaurant: string; dish?: string; cost?: number } => {
      // Extract cost from option string
      const costMatch = optStr.match(/\$(\d+)/);
      const cost = costMatch ? parseFloat(costMatch[1]) : undefined;
      const cleaned = optStr.replace(/\$\d+/g, '').trim();

      // Use the service's parse method logic
      // Pattern 1: "dish at restaurant" or "dish from restaurant"
      const atPattern = /(.+?)\s+(?:at|from|in)\s+(.+)/i;
      const atMatch = cleaned.match(atPattern);
      if (atMatch) {
        return {
          restaurant: atMatch[2].trim(),
          dish: atMatch[1].trim(),
          cost: cost || budget,
        };
      }

      // Pattern 2: "restaurant, dish" or "restaurant - dish"
      const commaPattern = /(.+?)[,\-–]\s*(.+)/i;
      const commaMatch = cleaned.match(commaPattern);
      if (commaMatch) {
        return {
          restaurant: commaMatch[1].trim(),
          dish: commaMatch[2].trim(),
          cost: cost || budget,
        };
      }

      // Pattern 3: "restaurant dish" (common dish names)
      const commonDishes = ['biryani', 'biriyani', 'burrito', 'pizza', 'burger', 'taco', 'tacos', 'bowl', 'salad', 'curry', 'pasta', 'noodles', 'quesadilla'];
      for (const dish of commonDishes) {
        const dishPattern = new RegExp(`(.+?)\\s+${dish}\\s*`, 'i');
        const dishMatch = cleaned.match(dishPattern);
        if (dishMatch) {
          return {
            restaurant: dishMatch[1].trim(),
            dish: dish,
            cost: cost || budget,
          };
        }
      }

      // No dish found
      return {
        restaurant: cleaned,
        cost: cost || budget,
      };
    };

    return {
      option1: parseOption(option1Str),
      option2: parseOption(option2Str),
      budget,
    };
  };

  const generateComparisonResponse = (comparison: CostComparison): string => {
    return 'Cost Comparison Results\n\nSee the detailed comparison table below!';
  };

  const generateAIResponse = (userQuestion: string): string => {
    const lowerQuestion = userQuestion.toLowerCase();

    if (lowerQuestion.includes('cost') || lowerQuestion.includes('estimator') || lowerQuestion.includes('compare') || lowerQuestion.includes('budget')) {
      return 'Cost Estimator\n\nI can help you compare two restaurants or specific dishes based on calories, quantity, and value!\n\nTry these formats:\n"Compare Restaurant1 vs Restaurant2 for $25"\n\n"Compare Karma Kafe biryani $18 vs Chipotle $18"\n\n"Biriyani at Karma Kafe $18 vs burrito at Chipotle $18"\n\nI\'ll analyze both options and show you which gives better value based on:\n• Calories per dollar\n• Portion sizes\n• Overall value score\n\nWhat would you like to compare?';
    } else if (lowerQuestion.includes('restaurant') || lowerQuestion.includes('food')) {
      return 'I can help you discover amazing restaurants! Try scanning a restaurant with the camera button, and I\'ll provide:\n\n• Detailed menu information\n• Popular dishes & reviews\n• Dietary labels (Vegan, Gluten-Free, etc.)\n• Personalized recommendations\n• **Cost comparisons** (try: "compare X vs Y for $25")\n\nWhat type of cuisine are you interested in?';
    } else if (lowerQuestion.includes('vegan') || lowerQuestion.includes('dietary')) {
      return 'Great question about dietary preferences! I can:\n\n• Filter restaurants by dietary needs\n• Identify vegan, vegetarian, gluten-free options\n• Highlight allergen information\n• Suggest dishes that match your diet\n\nWould you like me to find restaurants with specific dietary options nearby?';
    } else if (lowerQuestion.includes('popular') || lowerQuestion.includes('dish')) {
      return 'I analyze thousands of reviews to identify:\n\n• Most popular dishes at each restaurant\n• Customer favorites & hidden gems\n• Trending menu items\n• Signature dishes worth trying\n\nScan a restaurant to see its top dishes instantly!';
    } else if (lowerQuestion.includes('hello') || lowerQuestion.includes('hi')) {
      return 'Hello! I\'m here to help you discover the best dining experiences. You can:\n\n• Scan restaurants with AR camera\n• Get AI-powered recommendations\n• Save your favorites\n• Compare restaurant costs & value\n• Explore menus & reviews\n\nTry the cost estimator: "Compare Restaurant A vs Restaurant B for $25"\n\nHow can I assist you today?';
    } else {
      return 'That\'s an interesting question! Here\'s what I can help you with:\n\n• Restaurant recommendations & details\n• Menu items & popular dishes\n• Dietary preferences & filters\n• **Cost comparisons** (try: "compare X vs Y for $25")\n• Reviews & ratings analysis\n• Personalized suggestions\n\nFeel free to ask me anything food-related, or use the camera to scan a restaurant!';
    }
  };

  const renderComparisonTable = (comparison: CostComparison) => {
    const { option1, option2, winner, comparison: comp, budget } = comparison;
    
    return (
      <View style={styles.comparisonContainer}>
        <View style={styles.comparisonHeader}>
          <View style={styles.titleRow}>
            <Icon name="DollarSign" size={18} color="#1A1A1A" />
            <Text style={styles.comparisonTitle}>Cost Comparison for ${budget}</Text>
          </View>
        </View>

        {/* Comparison Table - Scrollable */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tableScrollView}>
          <View style={styles.tableContainer}>
            {/* Header Row */}
            <View style={styles.tableRow}>
              <View style={[styles.tableCell, styles.tableHeader, styles.metricColumn]}>
                <Text style={styles.tableHeaderText}>Metric</Text>
              </View>
              <View style={[styles.tableCell, styles.tableHeader, styles.restaurantColumn]}>
                <View style={styles.restaurantHeader}>
                  {option1.dishName && (
                    <Text 
                      style={[styles.dishNameText, winner === 'option1' && styles.winnerText]}
                      numberOfLines={1}
                    >
                      {option1.dishName}
                    </Text>
                  )}
                  <Text 
                    style={[styles.tableHeaderText, winner === 'option1' && styles.winnerText]}
                    numberOfLines={2}
                  >
                    {option1.restaurantName}
                  </Text>
                  {winner === 'option1' && (
                    <View style={styles.winnerIcon}>
                      <Icon name="Award" size={14} color="#FF8A80" />
                    </View>
                  )}
                </View>
              </View>
              <View style={[styles.tableCell, styles.tableHeader, styles.restaurantColumn]}>
                <View style={styles.restaurantHeader}>
                  {option2.dishName && (
                    <Text 
                      style={[styles.dishNameText, winner === 'option2' && styles.winnerText]}
                      numberOfLines={1}
                    >
                      {option2.dishName}
                    </Text>
                  )}
                  <Text 
                    style={[styles.tableHeaderText, winner === 'option2' && styles.winnerText]}
                    numberOfLines={2}
                  >
                    {option2.restaurantName}
                  </Text>
                  {winner === 'option2' && (
                    <View style={styles.winnerIcon}>
                      <Icon name="Award" size={14} color="#FF8A80" />
                    </View>
                  )}
                </View>
              </View>
            </View>

            {/* Cost Row */}
            <View style={styles.tableRow}>
              <View style={[styles.tableCell, styles.tableLabel, styles.metricColumn]}>
                <View style={styles.labelWithIcon}>
                  <Icon name="DollarSign" size={14} color="#8E8E93" />
                  <Text style={styles.tableLabelText}>Cost</Text>
                </View>
              </View>
              <View style={[styles.tableCell, styles.tableValue, styles.restaurantColumn]}>
                <Text style={styles.tableValueText}>${option1.estimatedCost.toFixed(2)}</Text>
                <Text style={styles.tableSubtext}>{option1.priceLevel}</Text>
              </View>
              <View style={[styles.tableCell, styles.tableValue, styles.restaurantColumn]}>
                <Text style={styles.tableValueText}>${option2.estimatedCost.toFixed(2)}</Text>
                <Text style={styles.tableSubtext}>{option2.priceLevel}</Text>
              </View>
            </View>

            {/* Calories Row */}
            <View style={[styles.tableRow, comp.betterCalories === 'option1' && styles.highlightRow]}>
              <View style={[styles.tableCell, styles.tableLabel, styles.metricColumn]}>
                <View style={styles.labelWithIcon}>
                  <Icon name="Flame" size={14} color="#8E8E93" />
                  <Text style={styles.tableLabelText}>Calories</Text>
                </View>
              </View>
              <View style={[styles.tableCell, styles.tableValue, styles.restaurantColumn, comp.betterCalories === 'option1' && styles.betterCell]}>
                <Text style={styles.tableValueText}>{option1.estimatedCalories}</Text>
                {comp.betterCalories === 'option1' && (
                  <View style={styles.bestBadge}>
                    <Icon name="Check" size={10} color="#34C759" />
                    <Text style={styles.betterBadgeText}>Best</Text>
                  </View>
                )}
              </View>
              <View style={[styles.tableCell, styles.tableValue, styles.restaurantColumn, comp.betterCalories === 'option2' && styles.betterCell]}>
                <Text style={styles.tableValueText}>{option2.estimatedCalories}</Text>
                {comp.betterCalories === 'option2' && (
                  <View style={styles.bestBadge}>
                    <Icon name="Check" size={10} color="#34C759" />
                    <Text style={styles.betterBadgeText}>Best</Text>
                  </View>
                )}
              </View>
            </View>

            {/* Quantity Row */}
            <View style={[styles.tableRow, comp.betterQuantity === 'option1' && styles.highlightRow]}>
              <View style={[styles.tableCell, styles.tableLabel, styles.metricColumn]}>
                <View style={styles.labelWithIcon}>
                  <Icon name="Package" size={14} color="#8E8E93" />
                  <Text style={styles.tableLabelText}>Quantity</Text>
                </View>
              </View>
              <View style={[styles.tableCell, styles.tableValue, styles.restaurantColumn, comp.betterQuantity === 'option1' && styles.betterCell]}>
                <Text style={styles.tableValueText} numberOfLines={2}>{option1.estimatedQuantity}</Text>
                {comp.betterQuantity === 'option1' && (
                  <View style={styles.bestBadge}>
                    <Icon name="Check" size={10} color="#34C759" />
                    <Text style={styles.betterBadgeText}>Best</Text>
                  </View>
                )}
              </View>
              <View style={[styles.tableCell, styles.tableValue, styles.restaurantColumn, comp.betterQuantity === 'option2' && styles.betterCell]}>
                <Text style={styles.tableValueText} numberOfLines={2}>{option2.estimatedQuantity}</Text>
                {comp.betterQuantity === 'option2' && (
                  <View style={styles.bestBadge}>
                    <Icon name="Check" size={10} color="#34C759" />
                    <Text style={styles.betterBadgeText}>Best</Text>
                  </View>
                )}
              </View>
            </View>

            {/* Value Score Row */}
            <View style={[styles.tableRow, styles.valueRow]}>
              <View style={[styles.tableCell, styles.tableLabel, styles.metricColumn]}>
                <View style={styles.labelWithIcon}>
                  <Icon name="Star" size={14} color="#8E8E93" />
                  <Text style={styles.tableLabelText}>Value Score</Text>
                </View>
              </View>
              <View style={[styles.tableCell, styles.tableValue, styles.restaurantColumn, winner === 'option1' && styles.betterCell]}>
                <Text style={[styles.tableValueText, styles.valueScore]}>{option1.valueScore}/100</Text>
                {winner === 'option1' && (
                  <View style={styles.winnerBadge}>
                    <Text style={styles.winnerBadgeText}>Winner!</Text>
                  </View>
                )}
              </View>
              <View style={[styles.tableCell, styles.tableValue, styles.restaurantColumn, winner === 'option2' && styles.betterCell]}>
                <Text style={[styles.tableValueText, styles.valueScore]}>{option2.valueScore}/100</Text>
                {winner === 'option2' && (
                  <View style={styles.winnerBadge}>
                    <Text style={styles.winnerBadgeText}>Winner!</Text>
                  </View>
                )}
              </View>
            </View>
          </View>
        </ScrollView>

        {/* Personalized Explanation */}
        <View style={styles.explanationContainer}>
          <View style={styles.explanationHeader}>
            <Icon name="Lightbulb" size={16} color="#8B5CF6" />
            <Text style={styles.explanationTitle}>Recommendation</Text>
          </View>
          <Text style={styles.explanationText}>{comp.personalizedReason.replace(/🏆|💡/g, '').trim()}</Text>
        </View>
      </View>
    );
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isAI = item.sender === 'ai';

    return (
      <MotiView
        from={{ opacity: 0, translateY: 20 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: 'timing', duration: 400 }}
        style={[
          styles.messageContainer,
          isAI ? styles.aiMessageContainer : styles.userMessageContainer,
        ]}
      >
        {isAI && (
          <View style={[styles.aiAvatar, styles.aiAvatarWhite]}>
            <Image
              source={require('@/assets/images/chat.png')}
              style={styles.messageAvatarLogo}
              resizeMode="contain"
            />
          </View>
        )}

        <View
          style={[
            styles.messageBubble,
            isAI ? styles.aiMessageBubble : styles.userMessageBubble,
          ]}
        >
          {isAI && (
            <View style={styles.aiHeader}>
              <Icon name="Sparkles" size={14} color="#8B5CF6" />
              <Text style={styles.aiLabel}>YelpAI</Text>
            </View>
          )}
          <Text
            style={[
              styles.messageText,
              isAI ? styles.aiMessageText : styles.userMessageText,
            ]}
          >
            {item.text}
          </Text>
          
          {/* Render comparison table if available */}
          {item.comparisonData && (
            <View style={styles.comparisonWrapper}>
              {renderComparisonTable(item.comparisonData)}
            </View>
          )}
        </View>
      </MotiView>
    );
  };

  const renderTypingIndicator = () => {
    if (!isTyping) return null;

    return (
      <MotiView
        from={{ opacity: 0, translateY: 10 }}
        animate={{ opacity: 1, translateY: 0 }}
        style={styles.messageContainer}
      >
        <View style={[styles.aiAvatar, styles.aiAvatarWhite]}>
          <Image
            source={require('@/assets/images/chat.png')}
            style={styles.messageAvatarLogo}
            resizeMode="contain"
          />
        </View>
        <View style={[styles.messageBubble, styles.aiMessageBubble]}>
          <View style={styles.typingIndicator}>
            <MotiView
              from={{ opacity: 0.3 }}
              animate={{ opacity: 1 }}
              transition={{ loop: true, duration: 600, delay: 0 }}
              style={styles.typingDot}
            />
            <MotiView
              from={{ opacity: 0.3 }}
              animate={{ opacity: 1 }}
              transition={{ loop: true, duration: 600, delay: 200 }}
              style={styles.typingDot}
            />
            <MotiView
              from={{ opacity: 0.3 }}
              animate={{ opacity: 1 }}
              transition={{ loop: true, duration: 600, delay: 400 }}
              style={styles.typingDot}
            />
          </View>
        </View>
      </MotiView>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Icon name="ArrowLeft" size={24} color="#1A1A1A" />
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <View style={styles.headerAvatar}>
            <Image
              source={require('@/assets/images/chat.png')}
              style={styles.headerLogo}
              resizeMode="contain"
            />
          </View>
          <View>
            <Text style={styles.headerTitle}>YelpAI</Text>
            <Text style={styles.headerSubtitle}>Always here to help</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.menuButton}>
          <Icon name="MoreVertical" size={24} color="#1A1A1A" />
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
      {/* Messages List */}
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.messagesList}
        showsVerticalScrollIndicator={false}
        ListFooterComponent={renderTypingIndicator}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
          keyboardShouldPersistTaps="handled"
      />

      {/* Input Area */}
        <View style={styles.inputContainer}>
          <View style={styles.inputWrapper}>
            <TouchableOpacity style={styles.attachButton}>
              <Icon name="Plus" size={24} color="#8E8E93" />
            </TouchableOpacity>

            <TextInput
              style={styles.input}
              placeholder="Chat here..."
              placeholderTextColor="#999"
              value={inputText}
              onChangeText={setInputText}
              multiline
              maxLength={500}
            />

            {inputText.trim() === '' ? (
              <TouchableOpacity style={styles.voiceButton}>
                <Icon name="Mic" size={24} color="#8E8E93" />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={styles.sendButton}
                onPress={handleSend}
              >
                <LinearGradient
                  colors={['#8B5CF6', '#EC4899']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.sendGradient}
                >
                  <Icon name="Send" size={20} color="#FFF" />
                </LinearGradient>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FB',
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F8F9FB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCenter: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 15,
  },
  headerAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    borderWidth: 1.5,
    borderColor: '#E5E5EA',
  },
  headerLogo: {
    width: 28,
    height: 28,
  },
  avatarGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#8E8E93',
    fontWeight: '500',
  },
  menuButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F8F9FB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  messagesList: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    paddingBottom: 20,
  },
  messageContainer: {
    flexDirection: 'row',
    marginBottom: 20,
    alignItems: 'flex-start',
  },
  aiMessageContainer: {
    justifyContent: 'flex-start',
  },
  userMessageContainer: {
    justifyContent: 'flex-end',
    alignSelf: 'flex-end',
  },
  aiAvatar: {
    marginRight: 12,
    marginTop: 4,
  },
  aiAvatarWhite: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#E5E5EA',
  },
  messageAvatarLogo: {
    width: 24,
    height: 24,
  },
  messageBubble: {
    maxWidth: '75%',
    borderRadius: 20,
    padding: 16,
  },
  aiMessageBubble: {
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#F0F0F0',
    borderTopLeftRadius: 4,
  },
  userMessageBubble: {
    backgroundColor: '#1A1A1A',
    borderTopRightRadius: 4,
  },
  aiHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 6,
  },
  aiLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#8B5CF6',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '500',
  },
  aiMessageText: {
    color: '#1A1A1A',
  },
  userMessageText: {
    color: '#FFF',
  },
  typingIndicator: {
    flexDirection: 'row',
    gap: 6,
    paddingVertical: 4,
  },
  typingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#8B5CF6',
  },
  inputContainer: {
    backgroundColor: '#FFF',
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    paddingHorizontal: 20,
    paddingTop: 15,
    paddingBottom: Platform.OS === 'ios' ? 15 : 15,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: '#F8F9FB',
    borderRadius: 25,
    paddingHorizontal: 8,
    paddingVertical: 8,
    gap: 8,
  },
  attachButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#1A1A1A',
    maxHeight: 100,
    paddingVertical: 10,
    paddingHorizontal: 5,
  },
  voiceButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: 'hidden',
  },
  sendGradient: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  comparisonWrapper: {
    marginTop: 16,
  },
  comparisonContainer: {
    backgroundColor: '#F8F9FB',
    borderRadius: 16,
    padding: 16,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  comparisonHeader: {
    marginBottom: 16,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  comparisonTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  tableScrollView: {
    marginHorizontal: -16,
    paddingHorizontal: 16,
  },
  tableContainer: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E5E5EA',
    minWidth: SCREEN_WIDTH * 0.9, // Use screen width for better responsiveness
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    minHeight: 70, // Increased for better spacing
  },
  highlightRow: {
    backgroundColor: '#FFF9E6',
  },
  tableCell: {
    padding: 14,
    justifyContent: 'center',
  },
  metricColumn: {
    width: 130,
    minWidth: 130,
    maxWidth: 130,
  },
  restaurantColumn: {
    width: Math.max(180, (SCREEN_WIDTH - 130) / 2), // Responsive based on screen width
    minWidth: 180,
    flex: 1,
  },
  tableHeader: {
    backgroundColor: '#F8F9FB',
    borderBottomWidth: 2,
    borderBottomColor: '#E5E5EA',
  },
  restaurantHeader: {
    alignItems: 'center',
    gap: 4,
  },
  tableHeaderText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1A1A1A',
    textAlign: 'center',
  },
  dishNameText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#8B5CF6',
    textAlign: 'center',
    textTransform: 'capitalize',
    marginBottom: 2,
  },
  winnerText: {
    color: '#FF8A80',
  },
  winnerIcon: {
    marginTop: 2,
  },
  tableLabel: {
    backgroundColor: '#FAFAFA',
  },
  labelWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  tableLabelText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#8E8E93',
  },
  tableValue: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  tableValueText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1A1A1A',
    textAlign: 'center',
  },
  tableSubtext: {
    fontSize: 11,
    color: '#8E8E93',
    marginTop: 2,
  },
  betterCell: {
    backgroundColor: '#E8F5E9',
  },
  bestBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    backgroundColor: '#C8E6C9',
    borderRadius: 8,
  },
  betterBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#34C759',
  },
  winnerBadge: {
    marginTop: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    backgroundColor: '#FF8A80',
    borderRadius: 8,
  },
  winnerBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFF',
  },
  valueRow: {
    backgroundColor: '#F0F7FF',
    borderBottomWidth: 0,
  },
  valueScore: {
    fontSize: 16,
    color: '#007AFF',
  },
  explanationContainer: {
    marginTop: 16,
    padding: 14,
    backgroundColor: '#FFF',
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#8B5CF6',
  },
  explanationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  explanationTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  explanationText: {
    fontSize: 14,
    lineHeight: 20,
    color: '#1A1A1A',
  },
});

