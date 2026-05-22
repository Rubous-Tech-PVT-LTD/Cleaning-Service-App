import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TextInput, FlatList, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft, Search as SearchIcon, X, Clock, ArrowRight, TrendingUp } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTranslation } from 'react-i18next';
import { Theme } from '../theme';
import { database } from '../db';
import { Q } from '@nozbe/watermelondb';

const RECENT_SEARCHES_KEY = 'recent_searches';
const MAX_RECENT = 7;

export const SearchScreen = ({ navigation }: any) => {
  const { t } = useTranslation();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [activeFilter, setActiveFilter] = useState('all'); // all, top_rated, lowest_price

  // ── Load persisted recent searches on mount ──────────────────────────────
  useEffect(() => {
    AsyncStorage.getItem(RECENT_SEARCHES_KEY).then((stored) => {
      if (stored) setRecentSearches(JSON.parse(stored));
    });
  }, []);

  // ── Search whenever query changes ─────────────────────────────────────────
  useEffect(() => {
    if (query.length > 2) {
      searchServices(query);
    } else {
      setResults([]);
    }
  }, [query]);

  // ── Persist a new search term ──────────────────────────────────────────────
  const addRecentSearch = useCallback(async (term: string) => {
    const trimmed = term.trim();
    if (!trimmed) return;
    const updated = [trimmed, ...recentSearches.filter((s) => s !== trimmed)].slice(0, MAX_RECENT);
    setRecentSearches(updated);
    await AsyncStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
  }, [recentSearches]);

  // ── Remove a single recent search ──────────────────────────────────────────
  const removeRecentSearch = async (term: string) => {
    const updated = recentSearches.filter((s) => s !== term);
    setRecentSearches(updated);
    await AsyncStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
  };

  // ── Clear all recent searches ──────────────────────────────────────────────
  const clearAllRecent = async () => {
    setRecentSearches([]);
    await AsyncStorage.removeItem(RECENT_SEARCHES_KEY);
  };

  const searchServices = async (text: string, filterType = 'all') => {
    setLoading(true);
    try {
      let queryRef = database.collections.get('services').query(
        Q.where('name_en', Q.like(`%${Q.sanitizeLikeString(text)}%`))
      );

      let services = await queryRef.fetch();

      // Client-side sorting/filtering for "Premium" feel
      if (filterType === 'top_rated') {
        services = services.sort(() => Math.random() - 0.5); // Mock rating sort
      } else if (filterType === 'lowest_price') {
        services = services.sort((a, b) => Number(a.basePrice) - Number(b.basePrice));
      }

      setResults(services);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectResult = (item: any) => {
    addRecentSearch(item.nameEn || query);
    navigation.navigate('ServiceDetail', { serviceId: item.id });
  };

  const handleSelectRecent = (term: string) => {
    setQuery(term);
    searchServices(term);
  };

  const renderResult = ({ item }: any) => (
    <TouchableOpacity
      onPress={() => handleSelectResult(item)}
      activeOpacity={0.7}
      style={{ 
        flexDirection: 'row', 
        alignItems: 'center', 
        padding: 16, 
        backgroundColor: 'white', 
        marginHorizontal: 16, 
        marginVertical: 8, 
        borderRadius: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 3
      }}
    >
      <Image
        source={{ uri: item.imageUrl || 'https://via.placeholder.com/100' }}
        style={{ width: 70, height: 70, borderRadius: 16, backgroundColor: Theme.background }}
      />
      <View style={{ flex: 1, marginLeft: 16 }}>
        <Text style={{ fontSize: 16, fontWeight: '800', color: Theme.textPrimary }}>{item.nameEn}</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
          <TrendingUp size={12} color={Theme.success} style={{ marginRight: 4 }} />
          <Text style={{ fontSize: 12, color: Theme.textSecondary, fontWeight: '600' }}>Popular Choice</Text>
        </View>
        <Text style={{ fontSize: 18, color: Theme.primary, fontWeight: '900', marginTop: 6 }}>₹{Number(item.basePrice).toFixed(0)}</Text>
      </View>
      <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: Theme.muted, justifyContent: 'center', alignItems: 'center' }}>
        <ArrowRight size={18} color={Theme.primary} />
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Theme.background }}>
      {/* Header with Search Input */}
      <View style={{ backgroundColor: 'white', paddingBottom: 8 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', padding: 16 }}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: Theme.muted, justifyContent: 'center', alignItems: 'center' }}>
            <ChevronLeft size={24} color={Theme.textPrimary} />
          </TouchableOpacity>
          <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: Theme.muted, borderRadius: 16, paddingHorizontal: 16, marginLeft: 12 }}>
            <SearchIcon size={18} color={Theme.textSecondary} />
            <TextInput
              autoFocus
              style={{ flex: 1, height: 50, marginLeft: 10, fontSize: 16, color: Theme.textPrimary, fontWeight: '600' }}
              placeholder={t('search.placeholder')}
              value={query}
              onChangeText={setQuery}
              onSubmitEditing={() => query.trim() && addRecentSearch(query)}
              returnKeyType="search"
            />
            {query.length > 0 && (
              <TouchableOpacity onPress={() => setQuery('')}>
                <X size={20} color={Theme.textSecondary} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Filter Pills */}
        {query.length > 0 && (
          <View style={{ paddingHorizontal: 16, paddingBottom: 12 }}>
            <FlatList
              horizontal
              showsHorizontalScrollIndicator={false}
              data={[
                { id: 'all', label: t('common.all') },
                { id: 'top_rated', label: t('search.top_rated') },
                { id: 'lowest_price', label: t('search.low_price') },
              ]}
              renderItem={({ item }) => (
                <TouchableOpacity
                  onPress={() => {
                    setActiveFilter(item.id);
                    searchServices(query, item.id);
                  }}
                  style={{
                    paddingHorizontal: 16,
                    paddingVertical: 8,
                    borderRadius: 20,
                    backgroundColor: activeFilter === item.id ? Theme.primary : Theme.muted,
                    marginRight: 8,
                    borderWidth: 1,
                    borderColor: activeFilter === item.id ? Theme.primary : Theme.border
                  }}
                >
                  <Text style={{ fontSize: 12, fontWeight: '800', color: activeFilter === item.id ? 'white' : Theme.textSecondary }}>
                    {item.label}
                  </Text>
                </TouchableOpacity>
              )}
              keyExtractor={item => item.id}
            />
          </View>
        )}
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
              <SearchIcon size={48} color={Theme.border} style={{ marginBottom: 16 }} />
              <Text style={{ color: Theme.textSecondary, textAlign: 'center', fontWeight: '600' }}>
                {t('search.no_results')} "{query}"
              </Text>
            </View>
          }
        />
      ) : (
        <View style={{ padding: 24 }}>
          {/* Recent Searches */}
          {recentSearches.length > 0 && (
            <>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <Text style={{ fontSize: 18, fontWeight: '800', color: Theme.textPrimary }}>{t('search.recent')}</Text>
                <TouchableOpacity onPress={clearAllRecent}>
                  <Text style={{ color: '#EF4444', fontWeight: '700', fontSize: 13 }}>{t('search.clear_all')}</Text>
                </TouchableOpacity>
              </View>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 32 }}>
                {recentSearches.map((item) => (
                  <View
                    key={item}
                    style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#F1F5F9', paddingLeft: 14, paddingRight: 4, paddingVertical: 8, borderRadius: 20, marginRight: 10, marginBottom: 10 }}
                  >
                    <Clock size={13} color={Theme.textSecondary} style={{ marginRight: 6 }} />
                    <TouchableOpacity onPress={() => handleSelectRecent(item)}>
                      <Text style={{ color: Theme.textPrimary, fontWeight: '600', marginRight: 8 }}>{item}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => removeRecentSearch(item)} style={{ padding: 4 }}>
                      <X size={12} color={Theme.textSecondary} />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            </>
          )}

          {/* Trending Searches */}
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
            <TrendingUp size={18} color={Theme.primary} style={{ marginRight: 8 }} />
            <Text style={{ fontSize: 18, fontWeight: '800', color: Theme.textPrimary }}>{t('search.trending')}</Text>
          </View>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
            {['Deep Cleaning', 'AC Repair', 'Plumbing', 'Painting', 'Electrician', 'Pest Control'].map((item) => (
              <TouchableOpacity
                key={item}
                onPress={() => handleSelectRecent(item)}
                style={{ backgroundColor: '#F4EDFF', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, marginRight: 10, marginBottom: 10, borderWidth: 1, borderColor: '#E9D5FF' }}
              >
                <Text style={{ color: Theme.primary, fontWeight: '700', fontSize: 13 }}>{item}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}
    </SafeAreaView>
  );
};
