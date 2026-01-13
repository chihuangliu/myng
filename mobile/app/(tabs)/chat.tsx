import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  StyleSheet,
  View,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Text,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

export default function ChatScreen() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'Hello! I am your celestial guide. Ask me anything about your stars, your daily vibe, or your birth chart.',
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  const sendMessage = async () => {
    if (!inputText.trim() || loading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputText.trim(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputText('');
    setLoading(true);

    try {
      // Get context from storage
      const values = await AsyncStorage.multiGet([
        'user_city',
        'user_birth_datetime',
        'user_coordinates',
      ]);
      const city = values[0][1];
      const birthDatetime = values[1][1];
      const coordinates = values[2][1];

      if (!birthDatetime) {
        throw new Error('Please set up your birth profile first.');
      }

      let finalCoordinates = coordinates;
      if (!finalCoordinates && city) {
          // Attempt to resolve if missing
          try {
              const geoResponse = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/v1/location/resolve?city=${encodeURIComponent(city)}`);
              if (geoResponse.ok) {
                  const geoData = await geoResponse.json();
                  finalCoordinates = geoData.coordinates;
                  await AsyncStorage.setItem('user_coordinates', finalCoordinates || '');
              }
          } catch (e) {
              console.error('Failed to lazy-resolve coordinates', e);
          }
      }

      if (!finalCoordinates) {
          throw new Error('Could not resolve your birth location coordinates. Please update your profile.');
      }

      // Prepare payload
      const history = messages
        .filter(m => m.id !== '1') // skip welcome message if desired, or keep it
        .map((m) => ({
          role: m.role,
          content: m.content,
        }));

      const payload = {
        message: userMessage.content,
        birth_datetime: birthDatetime,
        birth_coordinates: finalCoordinates,
        transit_datetime: new Date().toISOString(),
        history: history,
      };

      // Use XMLHttpRequest for streaming
      const xhr = new XMLHttpRequest();
      xhr.open('POST', `${process.env.EXPO_PUBLIC_API_URL}/api/v1/chat/stream`);
      xhr.setRequestHeader('Content-Type', 'application/json');

      const assistantMessageId = (Date.now() + 1).toString();
      setMessages((prev) => [
        ...prev,
        { id: assistantMessageId, role: 'assistant', content: '' },
      ]);

      let lastResponseTextLen = 0;

      xhr.onprogress = () => {
        const responseText = xhr.responseText;
        const newText = responseText.substring(lastResponseTextLen);
        lastResponseTextLen = responseText.length;

        if (newText) {
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === assistantMessageId ? { ...msg, content: msg.content + newText } : msg
            )
          );
        }
      };

      xhr.onload = () => {
        if (xhr.status !== 200) {
           // If error, append error message
           // Note: if partial streaming happened, we might append error to it or new message. 
           // For simplicity, let's just log it or append if empty.
           if (lastResponseTextLen === 0) {
             setMessages((prev) =>
                prev.map((msg) =>
                  msg.id === assistantMessageId ? { ...msg, content: `Error: Server returned ${xhr.status}` } : msg
                )
             );
           }
        }
        setLoading(false);
      };

      xhr.onerror = () => {
        setMessages((prev) =>
            prev.map((msg) =>
              msg.id === assistantMessageId ? { ...msg, content: msg.content + '\n[Connection Error]' } : msg
            )
        );
        setLoading(false);
      };

      xhr.send(JSON.stringify(payload));

    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        { id: Date.now().toString(), role: 'assistant', content: `Error: ${err.message}` },
      ]);
      setLoading(false);
    }
  };

  const clearChat = () => {
    setMessages([
      {
        id: '1',
        role: 'assistant',
        content: 'Hello! I am your celestial guide. Ask me anything about your stars, your daily vibe, or your birth chart.',
      },
    ]);
  };

  const renderMessage = ({ item }: { item: Message }) => (
    <View
      style={[
        styles.messageBubble,
        item.role === 'user' ? styles.userBubble : styles.assistantBubble,
      ]}
    >
      <ThemedText style={item.role === 'user' ? styles.userText : styles.assistantText}>
        {item.content}
      </ThemedText>
    </View>
  );

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <ThemedView style={styles.header}>
        <View style={{ width: 24 }} />
        <ThemedText type="subtitle" style={styles.headerTitle}>Celestial Chat</ThemedText>
        <TouchableOpacity onPress={clearChat}>
          <Ionicons name="create-outline" size={24} color="#000" />
        </TouchableOpacity>
      </ThemedView>

      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={renderMessage}
        contentContainerStyle={styles.messageList}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
      />

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={inputText}
          onChangeText={setInputText}
          placeholder="Ask the stars..."
          placeholderTextColor="#999"
          multiline
        />
        <TouchableOpacity
          style={[styles.sendButton, (!inputText.trim() || loading) && styles.disabledButton]}
          onPress={sendMessage}
          disabled={!inputText.trim() || loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Ionicons name="send" size={20} color="#fff" />
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    paddingTop: 60,
    paddingBottom: 16,
    paddingHorizontal: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    fontFamily: Platform.select({ ios: 'Georgia', android: 'serif', default: 'serif' }),
  },
  messageList: {
    padding: 16,
    paddingBottom: 32,
  },
  messageBubble: {
    padding: 12,
    borderRadius: 16,
    marginBottom: 12,
    maxWidth: '85%',
  },
  userBubble: {
    alignSelf: 'flex-end',
    backgroundColor: '#007AFF',
    borderBottomRightRadius: 4,
  },
  assistantBubble: {
    alignSelf: 'flex-start',
    backgroundColor: '#F2F2F7',
    borderBottomLeftRadius: 4,
  },
  userText: {
    color: '#fff',
    fontSize: 16,
  },
  assistantText: {
    color: '#000',
    fontSize: 16,
    lineHeight: 22,
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 12,
    paddingBottom: Platform.OS === 'ios' ? 30 : 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    alignItems: 'flex-end',
    backgroundColor: '#fff',
  },
  input: {
    flex: 1,
    backgroundColor: '#F2F2F7',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 8,
    marginRight: 8,
    fontSize: 16,
    maxHeight: 100,
    color: '#000',
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 2,
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
});
