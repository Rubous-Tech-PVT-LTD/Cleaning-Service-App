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
import { syncDatabase } from '../db/sync';
import { io, Socket } from 'socket.io-client';
import { SOCKET_URL } from '../api';

const ChatScreenBase = ({ route, navigation, messages, chat }: any) => {
  const { t } = useTranslation();
  const { bookingId, serviceName, providerId, clientId } = route.params;
  const [text, setText] = useState('');
  const [myId, setMyId] = useState<string>('');
  const [isSending, setIsSending] = useState(false);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [localChatId, setLocalChatId] = useState<string>('');
  const [serverChatId, setServerChatId] = useState<string>('');
  const scrollViewRef = React.useRef<ScrollView>(null);



  useEffect(() => {
    const ensureChat = async () => {
      const userId = await AsyncStorage.getItem('user_id');
      if (userId) setMyId(userId);

      // Attempt to sync first to pull authoritative server chat
      try {
        await syncDatabase();
      } catch (err) {
        console.log('[Chat] Initial sync attempt during mount:', err);
      }

      // DISABLED: Do not create fallback local chats
      // Chat should only come from server sync to ensure identity consistency
      if (bookingId) {
        try {
          const existingChats = await database.collections.get('chats').query(Q.where('booking_id', bookingId)).fetch();

          if (existingChats.length === 0) {
            // No chat found, waiting for server sync
          } else {
            const localChat = existingChats[0] as any;
            setLocalChatId(localChat.id);
            if (localChat.serverId) {
              setServerChatId(localChat.serverId);
            }
          }
        } catch (e) {
          console.log('[Chat] Error checking for chat:', e);
        }
      }
    };
    ensureChat();
  }, [bookingId]);

  useEffect(() => {
    const loadUser = async () => {
      const userId = await AsyncStorage.getItem('user_id');
      const token = await AsyncStorage.getItem('user_token');
      if (userId) setMyId(userId);

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
        newSocket.emit('register', { userId, role: 'CLIENT' });
      });

      newSocket.on('reconnect', (attemptNumber) => {
        newSocket.emit('register', { userId, role: 'CLIENT' });
        syncDatabase().catch(err => console.log('sync error:', err));
      });

      newSocket.on('newMessage', async (data: any) => {
        try {
          // Find the local chat that has this serverId
          const localChats = await database.collections.get('chats').query(Q.where('server_id', data.chatId)).fetch();
          if (localChats.length === 0) {
            return;
          }

          const localChat = localChats[0] as any;

          // Check if message already exists by serverId or offlineId
          let existingMessage = null;

          // First check by serverId (for messages that were already synced)
          if (data.id) {
            const existingByServerId = await database.collections.get('messages').query(
              Q.where('server_id', data.id),
              Q.where('chat_id', localChat.id)
            ).fetch();
            if (existingByServerId.length > 0) {
              existingMessage = existingByServerId[0];
            }
          }

          // If not found by serverId, check by offlineId (for optimistic local messages)
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
            return; // Message already exists, skip
          }

          // Create new message if not found
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
          // If write fails (e.g., duplicate), ignore - message already exists
        }
      });

      newSocket.on('sync_ping', (data: any) => {
        if (data?.senderId && data.senderId === userId) return;
        syncDatabase().catch(err => console.log('sync error:', err));
      });

      return () => {
        newSocket.disconnect();
      };
    };
    loadUser();
  }, []); // Only create socket once on mount

  // Join chat room when serverChatId becomes available
  useEffect(() => {
    if (socket && socket.connected && serverChatId) {
      socket.emit('joinChat', { chatId: serverChatId, bookingId });
    }
  }, [socket?.connected, serverChatId, bookingId]);

  // Deduplicate messages by server_id/offline_id to prevent duplicate rendering
  const uniqueMessages = React.useMemo(() => {
    const seen = new Map<string, any>(); // Use Map to track original message objects
    return (messages || []).filter((m: any) => {
      // Use server_id for deduplication (most reliable)
      if (m.serverId) {
        const key = `server_${m.serverId}`;
        if (seen.has(key)) {
          return false; // Skip duplicate
        }
        seen.set(key, m);
        return true;
      }

      // Use offline_id as fallback
      if (m.offlineId) {
        const key = `offline_${m.offlineId}`;
        if (seen.has(key)) {
          return false; // Skip duplicate
        }
        seen.set(key, m);
        return true;
      }

      // Use local id as last resort
      if (m.id) {
        const key = `local_${m.id}`;
        if (seen.has(key)) {
          return false; // Skip duplicate
        }
        seen.set(key, m);
        return true;
      }

      // If no IDs available, use content+sender+time as fallback
      const key = `${m.senderId}-${m.content}-${m.createdAt}`;
      if (seen.has(key)) {
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
      // Must have serverChatId to send
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
          console.log('Error locating chat object', e);
          return;
        }
      }

      if (!targetChat) {
        return;
      }

      // Generate a unique offlineId for this message
      const offlineId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // Add sender's own message to local DB immediately for instant UI feedback
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
      console.log('Failed to send message', e);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: 'white' }}>
      <View style={{ padding: 24, borderBottomWidth: 1, borderBottomColor: Theme.border, flexDirection: 'row', alignItems: 'center' }}>
        <TouchableOpacity onPress={() => navigation.goBack()}><ChevronLeft size={28} color={Theme.textPrimary} /></TouchableOpacity>
        <Text style={{ fontSize: 20, fontWeight: '900', color: Theme.textPrimary, marginLeft: 16 }}>{serviceName}</Text>
      </View>
      <ScrollView
        ref={scrollViewRef}
        style={{ flex: 1, padding: 20 }}
        onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
      >
        {uniqueMessages.map((m: any, i: number) => (
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
        <TouchableOpacity onPress={handleSend} disabled={isSending} style={[{ marginLeft: 16, backgroundColor: Theme.primary, width: 52, height: 52, borderRadius: 26, justifyContent: 'center', alignItems: 'center' }, isSending && { opacity: 0.6 }]}>
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