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
  const { bookingId, clientName, clientId } = route.params;
  const [text, setText] = useState('');
  const [myId, setMyId] = useState<string>('');
  const [isSending, setIsSending] = useState(false);
  const [socket, setSocket] = useState<Socket | null>(null);
  const scrollViewRef = React.useRef<ScrollView>(null);

  useEffect(() => {
    const ensureChat = async () => {
      const providerId = await AsyncStorage.getItem('provider_id');
      if (providerId) setMyId(providerId);

      // Attempt to sync first to pull authoritative server chat
      try {
        await syncDatabase();
      } catch (err) {
        console.log('[Chat] Initial sync attempt during mount:', err);
      }

      if (bookingId) {
        try {
          const existingChats = await database.collections.get('chats').query(Q.where('booking_id', bookingId)).fetch();
          if (existingChats.length === 0 && providerId) {
            console.log('[Chat] Local/Server chat unavailable, creating local fallback for booking', bookingId);
            await database.write(async () => {
              await database.get('chats').create((c: any) => {
                c.bookingId = bookingId;
                c.clientId = clientId || 'client';
                c.providerId = providerId;
              });
            });
            await syncDatabase();
          }
        } catch (e) {
          console.log('[Chat] Error checking or auto-creating chat:', e);
        }
      }
    };
    ensureChat();
  }, [bookingId]);

  useEffect(() => {
    const loadUser = async () => {
      const providerId = await AsyncStorage.getItem('provider_id');
      if (providerId) setMyId(providerId);

      const newSocket = io(SOCKET_URL, {
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionAttempts: 5,
      });
      setSocket(newSocket);

      newSocket.on('connect', () => {
        console.log('[Chat] Socket connected');
        newSocket.emit('register', { userId: providerId, role: 'PROVIDER' });
        newSocket.emit('joinChat', { chatId: chat?.id, bookingId });
      });

      newSocket.on('disconnect', (reason) => {
        console.log('[Chat] Socket disconnected:', reason);
      });

      newSocket.on('reconnect', (attemptNumber) => {
        console.log('[Chat] Socket reconnected after', attemptNumber, 'attempts');
        newSocket.emit('register', { userId: providerId, role: 'PROVIDER' });
        newSocket.emit('joinChat', { chatId: chat?.id, bookingId });
        // Sync on reconnection to get any missed messages
        syncDatabase().catch(err => console.log('sync error:', err));
      });

      newSocket.on('reconnect_attempt', (attemptNumber) => {
        console.log('[Chat] Socket reconnection attempt:', attemptNumber);
      });

      newSocket.on('reconnect_failed', () => {
        console.log('[Chat] Socket reconnection failed');
      });

      newSocket.on('newMessage', (data: any) => {
        console.log('[Chat] Received newMessage via WebSocket:', data);
        // Trigger sync to get the latest message from server
        syncDatabase().catch(err => console.log('sync error:', err));
      });

      newSocket.on('sync_ping', (data: any) => {
        if (data?.senderId && data.senderId === providerId) return;
        console.log('[Chat] Received sync_ping, syncing DB...');
        syncDatabase().catch(err => console.log('sync error:', err));
      });

      newSocket.on('error', (data: any) => {
        console.log('[Chat] Socket error:', data?.message || 'Unknown error');
      });

      return () => {
        newSocket.disconnect();
      };
    };
    loadUser();
  }, [chat?.id, bookingId]);

  // Deduplicate messages by id/content+timestamp to prevent duplicate rendering
  const uniqueMessages = React.useMemo(() => {
    const seen = new Map<string, any>(); // Use Map to track original message objects
    return (messages || []).filter((m: any) => {
      // Use a combination of content and timestamp as the primary key for deduplication
      // This handles cases where the same message might have different IDs (local vs server)
      const key = `${m.senderId}-${m.content}-${m.createdAt}`;
      
      if (seen.has(key)) {
        // If we've seen this message before, prefer the one with a proper server ID
        const existing = seen.get(key);
        if (m.id && !existing.id) {
          seen.set(key, m); // Replace with server version
          return true;
        }
        return false; // Skip duplicate
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
      let targetChat = chat;
      if (!targetChat && bookingId) {
        try {
          const existing = await database.collections.get('chats').query(Q.where('booking_id', bookingId)).fetch();
          if (existing.length > 0) {
            targetChat = existing[0];
          } else {
            await database.write(async () => {
              targetChat = await database.get('chats').create((c: any) => {
                c.bookingId = bookingId;
                c.clientId = clientId || 'client';
                c.providerId = myId;
              });
            });
          }
        } catch (e) {
          console.log('Error locating chat object', e);
        }
      }

      if (!targetChat) return;

      await database.write(async () => {
        await database.get('messages').create((m: any) => {
          m.chatId = targetChat.id;
          m.senderId = myId;
          m.content = messageContent;
          m.createdAt = Date.now();
        });
      });

      await syncDatabase();

      if (socket) {
        socket.emit('send_sync_ping', { chatId: targetChat.id, bookingId, senderId: myId });
      }
    } catch (e) {
      console.log('Failed to send message', e);
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
