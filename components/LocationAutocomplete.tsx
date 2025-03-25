import { useState, useCallback, useRef, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, Pressable, ScrollView, Platform, ActivityIndicator } from 'react-native';
import { MapPin, X, Navigation } from 'lucide-react-native';
import * as Location from 'expo-location';
import debounce from 'lodash.debounce';

interface LocationAutocompleteProps {
  value: string;
  onLocationSelect: (location: string) => void;
  placeholder?: string;
  isDark?: boolean;
  disabled: boolean;
}

interface Suggestion {
  description: string;
  place_id: string;
}

export function LocationAutocomplete({
  value,
  onLocationSelect,
  placeholder = 'Enter location',
  isDark = false,
  disabled,
}: LocationAutocompleteProps) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [inputValue, setInputValue] = useState(value);
  const [error, setError] = useState<string | null>(null);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const inputRef = useRef<TextInput>(null);

  const fetchSuggestions = useCallback(
    debounce(async (text: string) => {
      if (!text.trim()) {
        setSuggestions([]);
        setError(null);
        return;
      }

      try {
        const response = await fetch(
          `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(
            text
          )}&types=address&key=${process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY}`
        );

        if (!response.ok) {
          throw new Error('Failed to fetch suggestions');
        }

        const data = await response.json();
        
        if (data.status !== 'OK') {
          setSuggestions([]);
          return;
        }

        const formattedSuggestions = data.predictions.map((prediction: any) => ({
          description: prediction.description,
          place_id: prediction.place_id,
        }));

        setSuggestions(formattedSuggestions);
        setError(null);
      } catch (error) {
        console.error('Error fetching location suggestions:', error);
        setSuggestions([]);
        setError('Failed to fetch location suggestions');
      }
    }, 300),
    []
  );

  const getCurrentLocation = async () => {
    setIsLoadingLocation(true);
    setError(null);

    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setError('Permission to access location was denied');
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = location.coords;

      // Reverse geocode the coordinates
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY}`
      );

      const data = await response.json();
      
      if (data.status === 'OK' && data.results.length > 0) {
        const address = data.results[0].formatted_address;
        setInputValue(address);
        onLocationSelect(address);
        setSuggestions([]);
        setShowSuggestions(false);
      } else {
        setError('Could not determine your location');
      }
    } catch (error) {
      console.error('Error getting current location:', error);
      setError('Failed to get current location');
    } finally {
      setIsLoadingLocation(false);
    }
  };

  useEffect(() => {
    setInputValue(value);
  }, [value]);

  const handleInputChange = (text: string) => {
    setInputValue(text);
    setShowSuggestions(true);
    fetchSuggestions(text);
  };

  const handleSuggestionSelect = (suggestion: Suggestion) => {
    setInputValue(suggestion.description);
    onLocationSelect(suggestion.description);
    setSuggestions([]);
    setShowSuggestions(false);
    inputRef.current?.blur();
  };

  const handleClear = () => {
    setInputValue('');
    onLocationSelect('');
    setSuggestions([]);
    setShowSuggestions(false);
    setError(null);
  };

  return (
    <View style={styles.container}>
      <View style={[styles.inputContainer, isDark && styles.inputContainerDark]}>
        <MapPin size={20} color={isDark ? '#94a3b8' : '#64748b'} />
        <TextInput
          ref={inputRef}
          style={[
            styles.input,
            isDark && styles.inputDark,
            isDark && styles.textLight,
            disabled && styles.inputDisabled,
          ]}
          value={inputValue}
          onChangeText={(text) => !disabled && handleInputChange(text)}
          placeholder={placeholder}
          placeholderTextColor={isDark ? '#94a3b8' : '#64748b'}
          onFocus={() => setShowSuggestions(true)}
          editable={!disabled}
        />
        {inputValue.length > 0 ? (
          <Pressable onPress={handleClear} style={styles.clearButton}>
            <X size={20} color={isDark ? '#94a3b8' : '#64748b'} />
          </Pressable>
        ) : (
          <Pressable 
            onPress={getCurrentLocation} 
            style={styles.locationButton}
            disabled={isLoadingLocation || disabled}>
            {isLoadingLocation ? (
              <ActivityIndicator size="small" color={isDark ? '#94a3b8' : '#64748b'} />
            ) : (
              <Navigation size={20} color={isDark ? '#94a3b8' : '#64748b'} />
            )}
          </Pressable>
        )}
      </View>

      {error && (
        <Text style={[styles.errorText, isDark && styles.errorTextDark]}>
          {error}
        </Text>
      )}

      {showSuggestions && suggestions.length > 0 && (
        <ScrollView
          style={[styles.suggestionsContainer, isDark && styles.suggestionsContainerDark]}
          keyboardShouldPersistTaps="handled"
          nestedScrollEnabled>
          {suggestions.map((suggestion) => (
            <Pressable
              key={suggestion.place_id}
              style={[styles.suggestionItem, isDark && styles.suggestionItemDark]}
              onPress={() => handleSuggestionSelect(suggestion)}>
              <MapPin size={16} color={isDark ? '#94a3b8' : '#64748b'} />
              <Text
                style={[styles.suggestionText, isDark && styles.textLight]}
                numberOfLines={2}>
                {suggestion.description}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    zIndex: 1,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  inputContainerDark: {
    backgroundColor: '#1e293b',
    borderColor: '#334155',
  },
  input: {
    flex: 1,
    marginLeft: 8,
    fontFamily: 'Inter_400Regular',
    fontSize: 16,
    color: '#0f172a',
  },
  inputDark: {
    color: '#f8fafc',
  },
  clearButton: {
    padding: 4,
  },
  locationButton: {
    padding: 4,
  },
  errorText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: '#ef4444',
    marginTop: 8,
    marginLeft: 4,
  },
  errorTextDark: {
    color: '#f87171',
  },
  suggestionsContainer: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    marginTop: 4,
    maxHeight: 200,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    ...Platform.select({
      web: {
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
      },
      default: {
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: {
          width: 0,
          height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
    }),
  },
  suggestionsContainerDark: {
    backgroundColor: '#1e293b',
    borderColor: '#334155',
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  suggestionItemDark: {
    borderBottomColor: '#334155',
  },
  suggestionText: {
    marginLeft: 8,
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: '#0f172a',
    flex: 1,
  },
  textLight: {
    color: '#f8fafc',
  },
  inputDisabled: {
    opacity: 0.7,
    backgroundColor: '#f1f5f9',
  },
});