import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, FlatList, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft, Search as SearchIcon, X, Clock, Star, ArrowRight } from 'lucide-react-native';
import { Theme } from '../theme';
import { database } from '../db';
import { Q } from '@nozbe/watermelondb';

export const SearchScreen = ({ navigation }: any) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [recentSearches, setRecentSearches] = useState(['Deep Cleaning', 'AC Repair', 'Painting']);

  useEffect(() => {
    if (query.length > 2) {
      searchServices(query);
    } else {
      setResults([]);
    }
  }, [query]);

  const searchServices = async (text: string) => {
    setLoading(true);
    try {
      const services = await database.collections.get('services').query(
        Q.where('name_en', Q.like(`%${Q.sanitizeLikeString(text)}%`))
      ).fetch();
      setResults(services);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const renderResult = ({ item }: any) => (
    <TouchableOpacity 
      onPress={() => navigation.navigate('ServiceDetail', { serviceId: item.id })}
      style={{ flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' }}
    >
      <Image 
        source={{ uri: item.imageUrl || 'https://via.placeholder.com/100' }} 
        style={{ width: 60, height: 60, borderRadius: 12, backgroundColor: '#F1F5F9' }} 
      />
      <View style={{ flex: 1, marginLeft: 16 }}>
        <Text style={{ fontSize: 16, fontWeight: '700', color: Theme.textPrimary }}>{item.nameEn}</Text>
        <Text style={{ fontSize: 14, color: Theme.primary, fontWeight: '800', marginTop: 4 }}>₹{item.basePrice}</Text>
      </View>
      <ArrowRight size={18} color={Theme.textSecondary} />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: 'white' }}>
      {/* Header with Search Input */}
      <View style={{ flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' }}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ padding: 8 }}>
          <ChevronLeft size={24} color={Theme.textPrimary} />
        </TouchableOpacity>
        <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#F1F5F9', borderRadius: 14, paddingHorizontal: 12, marginLeft: 8 }}>
          <SearchIcon size={18} color={Theme.textSecondary} />
          <TextInput
            autoFocus
            style={{ flex: 1, height: 44, marginLeft: 10, fontSize: 16, color: Theme.textPrimary, fontWeight: '600' }}
            placeholder="Search for services..."
            value={query}
            onChangeText={setQuery}
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => setQuery('')}>
              <X size={18} color={Theme.textSecondary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Content */}
      {loading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={Theme.primary} />
        </View>
      ) : query.length > 0 ? (
        <FlatList
          data={results}
          keyExtractor={(item) => item.id}
          renderItem={renderResult}
          ListEmptyComponent={
            <View style={{ padding: 40, alignItems: 'center' }}>
              <Text style={{ color: Theme.textSecondary, textAlign: 'center' }}>No services found for "{query}"</Text>
            </View>
          }
        />
      ) : (
        <View style={{ padding: 24 }}>
          <Text style={{ fontSize: 18, fontWeight: '800', color: Theme.textPrimary, marginBottom: 16 }}>Recent Searches</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
            {recentSearches.map((item, index) => (
              <TouchableOpacity 
                key={index} 
                onPress={() => setQuery(item)}
                style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#F1F5F9', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, marginRight: 12, marginBottom: 12 }}
              >
                <Clock size={14} color={Theme.textSecondary} style={{ marginRight: 6 }} />
                <Text style={{ color: Theme.textPrimary, fontWeight: '600' }}>{item}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}
    </SafeAreaView>
  );
};
