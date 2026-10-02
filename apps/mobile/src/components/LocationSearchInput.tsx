import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  TextInput,
  ScrollView,
  TouchableOpacity,
  Text,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { Search } from 'lucide-react-native';
import { Theme } from '../theme';
import {
  NominatimResult,
  extractCityFromNominatim,
  searchPlaces,
} from '../services/nominatim';

interface LocationSearchInputProps {
  placeholder?: string;
  onSelect: (result: {
    address: string;
    city: string;
    state?: string;
    lat: number;
    lng: number;
  }) => void;
}

export const LocationSearchInput = ({
  placeholder = 'Search locality, sector, area',
  onSelect,
}: LocationSearchInputProps) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<NominatimResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (query.trim().length < 3) {
      setResults([]);
      setLoading(false);
      setError('');
      return;
    }

    if (query.trim().length > 100) {
      setResults([]);
      setLoading(false);
      setError('Search query too long');
      return;
    }

    const dangerousChars = /[<>{}\\|"`]/;
    if (dangerousChars.test(query)) {
      setResults([]);
      setLoading(false);
      setError('Invalid characters in search');
      return;
    }

    setError('');
    setLoading(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const places = await searchPlaces(query);
        setResults(places);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 400);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  return (
    <View style={styles.container}>
      <View style={[styles.inputRow, error && styles.inputRowError]}>
        <Search size={18} color={error ? Theme.error : Theme.primary} />
        <TextInput
          value={query}
          onChangeText={(text) => {
            setQuery(text);
            setError('');
          }}
          placeholder={placeholder}
          placeholderTextColor={Theme.textSecondary}
          style={styles.input}
          autoCorrect={false}
        />
        {loading && <ActivityIndicator size="small" color={Theme.primary} />}
      </View>
      {error && <Text style={styles.errorText}>{error}</Text>}
      {results.length > 0 && (
        <ScrollView
          keyboardShouldPersistTaps="handled"
          style={styles.list}
        >
          {results.map((item) => (
            <TouchableOpacity
              key={String(item.place_id)}
              style={styles.resultItem}
              onPress={() => {
                onSelect({
                  address: item.display_name,
                  city: extractCityFromNominatim(item),
                  state: item.address?.state,
                  lat: parseFloat(item.lat),
                  lng: parseFloat(item.lon),
                });
                setQuery(item.display_name);
                setResults([]);
              }}
            >
              <Text style={styles.resultText} numberOfLines={2}>
                {item.display_name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    zIndex: 10,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 16,
    minHeight: 52,
    gap: 10,
  },
  inputRowError: {
    borderColor: Theme.error,
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: Theme.textPrimary,
    paddingVertical: 12,
  },
  errorText: {
    color: Theme.error,
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
  },
  list: {
    backgroundColor: 'white',
    borderRadius: 12,
    marginTop: 8,
    maxHeight: 220,
    elevation: 5,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  resultItem: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  resultText: {
    fontSize: 14,
    color: Theme.textPrimary,
    lineHeight: 20,
  },
});
