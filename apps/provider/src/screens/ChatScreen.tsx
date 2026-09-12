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
  const [isSending, setIsSending] = useState(false);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [serverChatId, setServerChatId] = useState<string>('');
  const scrollViewRef = React.useRef<ScrollView>(null);
  useEffect(() => {
    const ensureChat = async () => {
      const providerId = await AsyncStorage.getItem('provider_id');
      if (providerId) setMyId(providerId);
      try {
        await syncDatabase();
      } catch (err) {
      }
      if (bookingId) {
        try {
          const existingChats = await database.collections.get('chats').query(Q.where('booking_id', bookingId)).fetch();
          if (existingChats.length > 0) {
            const localChat = existingChats[0] as any;
            if (localChat.serverId) {
              setServerChatId(localChat.serverId);
            }
          }
        } catch (e) {
        }
      }
    };
    ensureChat();
  }, [bookingId]);
  useEffect(() => {
    const loadUser = async () => {
      const providerId = await AsyncStorage.getItem('provider_id');
      const token = await AsyncStorage.getItem('provider_token');
      if (providerId) setMyId(providerId);
      const newSocket = io(SOCKET_URL, {
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionAttempts: 5,
        auth: {
          token: token ? `Bearer ${token}` : undefined,
        },
      });
      setSocket(newSocket);
      newSocket.on('connect', () => {
        newSocket.emit('register', { userId: providerId, role: 'PROVIDER' });
      });
      newSocket.on('reconnect', (attemptNumber) => {
        newSocket.emit('register', { userId: providerId, role: 'PROVIDER' });
        syncDatabase().catch(err => {
        });
      });
      newSocket.on('newMessage', async (data: any) => {
        try {
          const localChats = await database.collections.get('chats').query(Q.where('server_id', data.chatId)).fetch();
          if (localChats.length === 0) {
            return;
          }
          const localChat = localChats[0] as any;
          let existingMessage = null;
          if (data.id) {
            const existingByServerId = await database.collections.get('messages').query(
              Q.where('server_id', data.id),
              Q.where('chat_id', localChat.id)
            ).fetch();
            if (existingByServerId.length > 0) {
              existingMessage = existingByServerId[0];
            }
          }
          if (!existingMessage && data.offlineId) {
            const existingByOfflineId = await database.collections.get('messages').query(
              Q.where('offline_id', data.offlineId),
              Q.where('chat_id', localChat.id)
            ).fetch();
            if (existingByOfflineId.length > 0) {
              existingMessage = existingByOfflineId[0];
            }
          }
          if (existingMessage) {
            return;
          }
          await database.write(async () => {
            await database.get('messages').create((m: any) => {
              m.chatId = localChat.id;
              m.serverId = data.id;
              m.offlineId = data.offlineId;
              m.senderId = data.senderId;
              m.content = data.content;
              m.createdAt = new Date(data.createdAt).getTime();
            });
          });
        } catch (e) {
        }
      });
      newSocket.on('sync_ping', (data: any) => {
        if (data?.senderId && data.senderId === providerId) return;
        syncDatabase().catch(err => {
        });
      });
      return () => {
        newSocket.disconnect();
      };
    };
    loadUser();
  }, []);
  useEffect(() => {
    if (socket && socket.connected && serverChatId) {
      socket.emit('joinChat', { chatId: serverChatId, bookingId });
    }
  }, [socket?.connected, serverChatId, bookingId]);
  const uniqueMessages = React.useMemo(() => {
    const seen = new Map<string, any>();
    return (messages || []).filter((m: any) => {
      if (m.serverId) {
        const key = `server_${m.serverId}`;
        if (seen.has(key)) {
          return false;
        }
        seen.set(key, m);
        return true;
      }
      if (m.offlineId) {
        const key = `offline_${m.offlineId}`;
        if (seen.has(key)) {
          return false;
        }
        seen.set(key, m);
        return true;
      }
      if (m.id) {
        const key = `local_${m.id}`;
        if (seen.has(key)) {
          return false;
        }
        seen.set(key, m);
        return true;
      }
      const key = `${m.senderId}-${m.content}-${m.createdAt}`;
      if (seen.has(key)) {
        return false;
      }
      seen.set(key, m);
      return true;
    });
  }, [messages]);
  useEffect(() => {
    if (uniqueMessages.length > 0) {
      setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [uniqueMessages.length]);
  const handleSend = async () => {
    if (!text.trim() || !myId || isSending) return;
    setIsSending(true);
    const messageContent = text.trim();
    setText('');
    try {
      if (!serverChatId) {
        return;
      }
      let targetChat = chat;
      if (!targetChat && bookingId) {
        try {
          const existing = await database.collections.get('chats').query(Q.where('booking_id', bookingId)).fetch();
          if (existing.length > 0) {
            targetChat = existing[0];
          } else {
            return;
          }
        } catch (e) {
          return;
        }
      }
      if (!targetChat) {
        return;
      }
      const offlineId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      await database.write(async () => {
        await database.get('messages').create((m: any) => {
          m.chatId = targetChat.id;
          m.senderId = myId;
          m.content = messageContent;
          m.offlineId = offlineId;
          m.createdAt = Date.now();
        });
      });
      if (socket) {
        socket.emit('sendMessage', { chatId: serverChatId, content: messageContent, offlineId });
      }
    } catch (e) {
    } finally {
      setIsSending(false);
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
      <ScrollView
        ref={scrollViewRef}
        style={{ flex: 1, padding: 20 }}
        onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
      >
        {uniqueMessages.map((m: any, i: number) => (
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
        {uniqueMessages.length === 0 && (
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
        <TouchableOpacity onPress={handleSend} disabled={isSending} style={[styles.sendButton, isSending && { opacity: 0.6 }]}>
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
          return database.collections.get('messages').query(
            Q.where('chat_id', chats[0].id),
            Q.sortBy('created_at', Q.asc)
          ).observe();
        }
        return of([]);
      })
    )
  };
})(ChatScreenBase);
