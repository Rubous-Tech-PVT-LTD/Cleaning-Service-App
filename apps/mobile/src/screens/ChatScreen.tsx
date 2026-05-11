import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { ChevronLeft, Send } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import withObservables from '@nozbe/with-observables';
import { Q } from '@nozbe/watermelondb';
import { map, switchMap } from 'rxjs/operators';
import { of } from 'rxjs';
import { database } from '../db';
import { Theme } from '../theme';

const ChatScreenBase = ({ route, navigation, messages, chat }: any) => {
  const { t } = useTranslation();
  const { bookingId, serviceName, providerId } = route.params;
  const [text, setText] = useState('');
  const [myId, setMyId] = useState<string>('');

  useEffect(() => {
    const loadUser = async () => {
      const userId = await AsyncStorage.getItem('user_id');
      if (userId) setMyId(userId);
    };
    loadUser();
  }, []);

  const handleSend = async () => {
    if (!text.trim() || !myId || !chat) return;

    const messageContent = text;
    setText('');

    await database.write(async () => {
      await database.get('messages').create((m: any) => {
        m.chatId = chat.id;
        m.senderId = myId;
        m.content = messageContent;
        m.createdAt = Date.now();
      });
    });
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: 'white' }}>
      <View style={{ padding: 24, borderBottomWidth: 1, borderBottomColor: Theme.border, flexDirection: 'row', alignItems: 'center' }}>
        <TouchableOpacity onPress={() => navigation.goBack()}><ChevronLeft size={28} color={Theme.textPrimary} /></TouchableOpacity>
        <Text style={{ fontSize: 20, fontWeight: '900', color: Theme.textPrimary, marginLeft: 16 }}>{serviceName}</Text>
      </View>
      <ScrollView style={{ flex: 1, padding: 20 }}>
        {messages.map((m: any, i: number) => (
          <View key={m.id || i} style={{
            alignSelf: m.senderId === myId ? 'flex-end' : 'flex-start',
            backgroundColor: m.senderId === myId ? Theme.primary : Theme.background,
            padding: 16, borderRadius: 24, borderBottomRightRadius: m.senderId === myId ? 4 : 24,
            borderBottomLeftRadius: m.senderId === myId ? 24 : 4,
            marginBottom: 12, maxWidth: '80%'
          }}>
            <Text style={{ color: m.senderId === myId ? 'white' : Theme.textPrimary, fontWeight: '500' }}>{m.content}</Text>
            <Text style={{ fontSize: 10, color: m.senderId === myId ? 'rgba(255,255,255,0.6)' : Theme.textSecondary, marginTop: 4 }}>
              {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </Text>
          </View>
        ))}
      </ScrollView>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ padding: 20, borderTopWidth: 1, borderTopColor: Theme.border, flexDirection: 'row', alignItems: 'center' }}>
        <TextInput
          style={{ flex: 1, backgroundColor: Theme.background, borderRadius: 24, paddingHorizontal: 20, paddingVertical: 14, fontSize: 16 }}
          placeholder={t('common.type_message')}
          value={text}
          onChangeText={setText}
        />
        <TouchableOpacity onPress={handleSend} style={{ marginLeft: 16, backgroundColor: Theme.primary, width: 52, height: 52, borderRadius: 26, justifyContent: 'center', alignItems: 'center' }}>
          <Send size={24} color="white" />
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export const ChatScreen = withObservables(['route'], ({ route }: any) => {
  const chatQuery = database.collections.get('chats').query(Q.where('booking_id', route.params.bookingId)).observe();

  return {
    chat: chatQuery.pipe(map(chats => chats[0])),
    messages: chatQuery.pipe(
      switchMap(chats => {
        if (chats.length > 0) {
          return database.collections.get('messages').query(Q.where('chat_id', chats[0].id)).observe();
        }
        return of([]);
      })
    )
  };
})(ChatScreenBase);
