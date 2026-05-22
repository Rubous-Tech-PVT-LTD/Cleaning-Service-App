import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import withObservables from '@nozbe/with-observables';
import { Q } from '@nozbe/watermelondb';
import { map, switchMap } from 'rxjs/operators';
import { of } from 'rxjs';
import { database } from '../db';
import { Theme } from '../theme';
import { syncDatabase } from '../db/sync';
import { io, Socket } from 'socket.io-client';
import { SOCKET_URL } from '../api';

const ChatScreenBase = ({ route, navigation, messages, chat }: any) => {
  const { bookingId, clientName } = route.params;
  const [text, setText] = useState('');
  const [myId, setMyId] = useState<string>('');
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    const loadUser = async () => {
      const providerId = await AsyncStorage.getItem('provider_id');
      if (providerId) setMyId(providerId);
      
      // Initialize socket for real-time ping
      const newSocket = io(SOCKET_URL);
      setSocket(newSocket);
      
      newSocket.on('connect', () => {
        newSocket.emit('register', { userId: providerId, role: 'PROVIDER' });
        // Join chat room
        if (chat) {
          newSocket.emit('joinChat', { chatId: chat.id });
        }
      });
      
      newSocket.on('sync_ping', () => {
        console.log('[Chat] Received sync_ping, syncing DB...');
        syncDatabase();
      });

      return () => {
        newSocket.disconnect();
      };
    };
    loadUser();
  }, [chat?.id]);

  const handleSend = async () => {
    if (!text.trim() || !myId || !chat) return;

    const messageContent = text;
    setText('');

    try {
      await database.write(async () => {
        await database.get('messages').create((m: any) => {
          m.chatId = chat.id;
          m.senderId = myId;
          m.content = messageContent;
          m.createdAt = Date.now();
        });
      });
      
      // Instantly sync to push the message
      await syncDatabase();
      
      // Tell the server to ping the other person
      if (socket) {
        socket.emit('send_sync_ping', { chatId: chat.id, senderId: myId });
      }
    } catch (e) {
      console.log('Failed to send message', e);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: 'white' }}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={{ fontSize: 24, color: Theme.textPrimary }}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{clientName || 'Chat'}</Text>
      </View>
      <ScrollView style={{ flex: 1, padding: 20 }}>
        {messages.map((m: any, i: number) => (
          <View key={m.id || i} style={[
            styles.messageBubble,
            {
              alignSelf: m.senderId === myId ? 'flex-end' : 'flex-start',
              backgroundColor: m.senderId === myId ? Theme.primary : Theme.background,
              borderBottomRightRadius: m.senderId === myId ? 4 : 24,
              borderBottomLeftRadius: m.senderId === myId ? 24 : 4,
            }
          ]}>
            <Text style={{ color: m.senderId === myId ? 'white' : Theme.textPrimary, fontWeight: '500' }}>{m.content}</Text>
            <Text style={{ fontSize: 10, color: m.senderId === myId ? 'rgba(255,255,255,0.6)' : Theme.textSecondary, marginTop: 4 }}>
              {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </Text>
          </View>
        ))}
        {messages.length === 0 && (
          <Text style={{ textAlign: 'center', color: Theme.textSecondary, marginTop: 40 }}>Start the conversation!</Text>
        )}
      </ScrollView>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Type a message..."
          value={text}
          onChangeText={setText}
        />
        <TouchableOpacity onPress={handleSend} style={styles.sendButton}>
          <Text style={{ color: 'white', fontWeight: 'bold' }}>➤</Text>
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  header: { padding: 24, borderBottomWidth: 1, borderBottomColor: Theme.border, flexDirection: 'row', alignItems: 'center' },
  backButton: { marginRight: 16 },
  headerTitle: { fontSize: 20, fontWeight: '900', color: Theme.textPrimary },
  messageBubble: { padding: 16, borderRadius: 24, marginBottom: 12, maxWidth: '80%' },
  inputContainer: { padding: 20, borderTopWidth: 1, borderTopColor: Theme.border, flexDirection: 'row', alignItems: 'center' },
  input: { flex: 1, backgroundColor: Theme.background, borderRadius: 24, paddingHorizontal: 20, paddingVertical: 14, fontSize: 16 },
  sendButton: { marginLeft: 16, backgroundColor: Theme.primary, width: 52, height: 52, borderRadius: 26, justifyContent: 'center', alignItems: 'center' },
});

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
