import React from 'react';
import { View, Text, TouchableOpacity, FlatList, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft, Plus, MapPin, Trash2, Home, Briefcase, Map } from 'lucide-react-native';
import withObservables from '@nozbe/with-observables';
import { useTranslation } from 'react-i18next';
import { database } from '../db';
import { Theme } from '../theme';
import AsyncStorage from '@react-native-async-storage/async-storage';

const AddressItem = ({ address, onSelect, onDelete, onSelectDefault }: any) => {
  const { t } = useTranslation();
  const getIcon = (label: string) => {
    switch (label.toLowerCase()) {
      case 'home': return <Home size={20} color={Theme.primary} />;
      case 'work': return <Briefcase size={20} color={Theme.info} />;
      default: return <Map size={20} color={Theme.success} />;
    }
  };

  return (
    <TouchableOpacity 
      activeOpacity={0.7}
      onPress={() => onSelect(address.id)}
      style={{ 
        backgroundColor: 'white', 
        padding: 20, 
        borderRadius: 24, 
        marginBottom: 16, 
        flexDirection: 'row', 
        alignItems: 'center', 
        shadowColor: '#000', 
        shadowOpacity: 0.05, 
        shadowRadius: 10, 
        elevation: 2,
        borderWidth: 2,
        borderColor: address.isDefault ? Theme.primary : 'transparent'
      }}
    >
      <View style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: address.isDefault ? '#F4EDFF' : '#F8FAFC', justifyContent: 'center', alignItems: 'center', marginRight: 16 }}>
        {getIcon(address.label)}
      </View>
      <View style={{ flex: 1 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Text style={{ fontSize: 16, fontWeight: '800', color: Theme.textPrimary }}>{address.label}</Text>
          {address.isDefault && (
            <View style={{ backgroundColor: Theme.infoLight, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, marginLeft: 8 }}>
              <Text style={{ fontSize: 10, color: Theme.info, fontWeight: '800' }}>{t('common.all').toUpperCase()}</Text>
            </View>
          )}
        </View>
        <Text style={{ fontSize: 14, color: Theme.textSecondary, marginTop: 4 }} numberOfLines={1}>
          {address.addressLine1}
        </Text>
        <Text style={{ fontSize: 12, color: Theme.textSecondary, marginTop: 2 }}>
          {address.city}, {address.state}
        </Text>
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        {!address.isDefault && (
          <TouchableOpacity onPress={() => onSelectDefault(address.id)} style={{ padding: 8, marginRight: 8 }}>
            <Text style={{ color: Theme.primary, fontSize: 12, fontWeight: '800' }}>{t('address.set_default').toUpperCase()}</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity onPress={() => onDelete(address.id)} style={{ padding: 8 }}>
          <Trash2 size={18} color={Theme.error} />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
};

const AddressListScreenBase = ({ navigation, addresses, onSelect }: any) => {
  const { t } = useTranslation();
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

  const handleSelectDefault = async (id: string) => {
    await database.write(async () => {
      const allAddresses = await database.get('addresses').query().fetch();
      const updates = allAddresses.map((addr: any) => 
        addr.prepareUpdate((record: any) => {
          record.isDefault = record.id === id;
        })
      );
      await database.batch(...updates);
    });
  };

  const handleAddNew = () => {
    navigation.navigate('AddressPicker');
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Theme.background }}>
      <View style={{ padding: 24, flexDirection: 'row', alignItems: 'center', backgroundColor: 'white' }}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <ChevronLeft size={28} color={Theme.textPrimary} />
        </TouchableOpacity>
        <Text style={{ fontSize: 22, fontWeight: '900', color: Theme.textPrimary, marginLeft: 16 }}>{t('address.title')}</Text>
      </View>

      <FlatList
        data={addresses}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 24 }}
        renderItem={({ item }) => (
          <AddressItem 
            address={item} 
            onDelete={handleDelete}
            onSelect={onSelect}
            onSelectDefault={handleSelectDefault}
          />
        )}
        ListEmptyComponent={
          <View style={{ padding: 40, alignItems: 'center' }}>
            <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: Theme.muted, justifyContent: 'center', alignItems: 'center', marginBottom: 20 }}>
              <MapPin size={40} color={Theme.textSecondary} />
            </View>
            <Text style={{ fontSize: 18, fontWeight: '800', color: Theme.textPrimary }}>{t('address.no_address')}</Text>
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
          <Text style={{ color: 'white', fontWeight: '900', fontSize: 16 }}>{t('address.add_new')}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export const AddressListScreen = withObservables([], () => ({
  addresses: database.collections.get('addresses').query().observe(),
}))(AddressListScreenBase);
