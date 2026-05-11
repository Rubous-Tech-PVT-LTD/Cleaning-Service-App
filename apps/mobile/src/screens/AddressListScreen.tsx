import React from 'react';
import { View, Text, TouchableOpacity, FlatList, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft, Plus, MapPin, Trash2, Home, Briefcase, Map } from 'lucide-react-native';
import withObservables from '@nozbe/with-observables';
import { database } from '../db';
import { Theme } from '../theme';
import AsyncStorage from '@react-native-async-storage/async-storage';

const AddressItem = ({ address, onSelect, onDelete }: any) => {
  const getIcon = (label: string) => {
    switch (label.toLowerCase()) {
      case 'home': return <Home size={20} color={Theme.primary} />;
      case 'work': return <Briefcase size={20} color="#3B82F6" />;
      default: return <Map size={20} color="#10B981" />;
    }
  };

  return (
    <View style={{ backgroundColor: 'white', padding: 20, borderRadius: 24, marginBottom: 16, flexDirection: 'row', alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, elevation: 2 }}>
      <View style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: '#F8FAFC', justifyContent: 'center', alignItems: 'center', marginRight: 16 }}>
        {getIcon(address.label)}
      </View>
      <View style={{ flex: 1 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Text style={{ fontSize: 16, fontWeight: '800', color: Theme.textPrimary }}>{address.label}</Text>
          {address.isDefault && (
            <View style={{ backgroundColor: '#F0FDF4', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, marginLeft: 8 }}>
              <Text style={{ fontSize: 10, color: '#166534', fontWeight: '800' }}>DEFAULT</Text>
            </View>
          )}
        </View>
        <Text style={{ fontSize: 14, color: Theme.textSecondary, marginTop: 4 }} numberOfLines={2}>
          {address.addressLine1}, {address.addressLine2 ? address.addressLine2 + ', ' : ''}{address.city}
        </Text>
      </View>
      <TouchableOpacity onPress={() => onDelete(address.id)} style={{ padding: 8 }}>
        <Trash2 size={18} color="#EF4444" />
      </TouchableOpacity>
    </View>
  );
};

const AddressListScreenBase = ({ navigation, addresses }: any) => {
  const handleDelete = async (id: string) => {
    Alert.alert('Delete Address', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
          await database.write(async () => {
            const address = await database.get('addresses').find(id);
            await address.markAsDeleted();
          });
        }
      }
    ]);
  };

  const handleAddNew = () => {
    // For now, let's just mock adding a new address for simplicity
    // In a real app, this would open a form or map
    Alert.alert('Add New Address', 'This would open a Map/Form picker.');
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F8FAFC' }}>
      <View style={{ padding: 24, flexDirection: 'row', alignItems: 'center', backgroundColor: 'white' }}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <ChevronLeft size={28} color={Theme.textPrimary} />
        </TouchableOpacity>
        <Text style={{ fontSize: 22, fontWeight: '900', color: Theme.textPrimary, marginLeft: 16 }}>Saved Addresses</Text>
      </View>

      <FlatList
        data={addresses}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 24 }}
        renderItem={({ item }) => (
          <AddressItem 
            address={item} 
            onDelete={handleDelete}
          />
        )}
        ListEmptyComponent={
          <View style={{ padding: 40, alignItems: 'center' }}>
            <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: '#E2E8F0', justifyContent: 'center', alignItems: 'center', marginBottom: 20 }}>
              <MapPin size={40} color={Theme.textSecondary} />
            </View>
            <Text style={{ fontSize: 18, fontWeight: '800', color: Theme.textPrimary }}>No addresses saved</Text>
            <Text style={{ color: Theme.textSecondary, textAlign: 'center', marginTop: 8 }}>Add your home or office address for faster bookings.</Text>
          </View>
        }
      />

      <View style={{ padding: 24, paddingBottom: 40 }}>
        <TouchableOpacity 
          onPress={handleAddNew}
          style={{ 
            backgroundColor: Theme.primary, 
            flexDirection: 'row', 
            justifyContent: 'center', 
            alignItems: 'center', 
            paddingVertical: 18, 
            borderRadius: 20,
            shadowColor: Theme.primary,
            shadowOpacity: 0.3,
            elevation: 8
          }}
        >
          <Plus size={20} color="white" style={{ marginRight: 8 }} />
          <Text style={{ color: 'white', fontWeight: '900', fontSize: 16 }}>ADD NEW ADDRESS</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export const AddressListScreen = withObservables([], () => ({
  addresses: database.collections.get('addresses').query().observe(),
}))(AddressListScreenBase);
