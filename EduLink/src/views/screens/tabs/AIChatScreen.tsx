import React, {useState, useRef, useCallback} from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  FlatList, KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import {SafeAreaView, useSafeAreaInsets} from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import {storage} from '../../../services/storage';
import {api, API_HOST} from '../../../services/api';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

const AIChatScreen = () => {
  const insets = useSafeAreaInsets();
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: "(Coming Soon) Hi! I'm your AI study assistant. How can I help you with your studies today?",
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  const sendMessage = useCallback(async () => {
    const text = input.trim();
    if (!text || loading) return;

    const userMsg: ChatMessage = { id: Date.now().toString(), role: 'user', content: text };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const authToken = await storage.getToken();
      const history = messages
        .filter(m => m.id !== 'welcome')
        .slice(-10)
        .map(m => ({ role: m.role, content: m.content }));

      const res = await fetch(`${API_HOST}/api/chatbot`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify({ message: text, history }),
      });
      const data = await res.json();

      const reply = data.data?.reply || 'Sorry, I could not process that.';
      const botMsg: ChatMessage = { id: (Date.now() + 1).toString(), role: 'assistant', content: reply };
      setMessages(prev => [...prev, botMsg]);
    } catch (err: any) {
      const errMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Sorry, something went wrong. Please try again.',
      };
      setMessages(prev => [...prev, errMsg]);
    } finally {
      setLoading(false);
      setTimeout(() => flatListRef.current?.scrollToEnd({animated: true}), 100);
    }
  }, [input, loading, messages]);

  const renderMessage = ({item}: {item: ChatMessage}) => {
    const isUser = item.role === 'user';
    return (
      <View style={[styles.msgRow, isUser ? styles.msgRowUser : styles.msgRowBot]}>
        {!isUser && (
          <View style={styles.botAvatar}>
            <Icon name="sparkles" size={16} color="#8B5CF6" />
          </View>
        )}
        <View style={[styles.msgBubble, isUser ? styles.userBubble : styles.botBubble]}>
          <Text style={[styles.msgText, isUser ? styles.userText : styles.botText]}>
            {item.content}
          </Text>
        </View>
        {isUser && (
          <View style={styles.userAvatar}>
            <Icon name="person" size={16} color="#10A7DA" />
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['right', 'left', 'bottom']}>
      <View style={[styles.header, {paddingTop: Platform.OS === 'ios' ? Math.max(insets.top, 16) : 16}]}>
        <View style={styles.headerLeft}>
          <View style={styles.headerAvatar}>
            <Icon name="sparkles" size={20} color="#fff" />
          </View>
          <View>
            <Text style={styles.headerTitle}>AI Study Bot</Text>
            <Text style={styles.headerSubtitle}>Always here to help</Text>
          </View>
        </View>
      </View>

      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.msgList}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({animated: false})}
      />

      {loading && (
        <View style={styles.typing}>
          <View style={styles.typingDot} />
          <View style={styles.typingDot} />
          <View style={styles.typingDot} />
        </View>
      )}

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <View style={styles.inputBar}>
          <TextInput
            style={styles.input}
            value={input}
            onChangeText={setInput}
            placeholder="Ask anything about your studies..."
            placeholderTextColor="#9CA3AF"
            multiline
            maxLength={500}
          />
          <TouchableOpacity
            style={[styles.sendBtn, (!input.trim() || loading) && styles.sendBtnDisabled]}
            onPress={sendMessage}
            disabled={!input.trim() || loading}
          >
            <Icon name="send" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#F9FAFB', paddingTop:40},
  header: {
    backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#E5E7EB',
    paddingHorizontal: 16, paddingVertical: 12,
  },
  headerLeft: {flexDirection: 'row', alignItems: 'center', gap: 12},
  headerAvatar: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: '#8B5CF6', justifyContent: 'center', alignItems: 'center',
  },
  headerTitle: {fontSize: 17, fontWeight: '700', color: '#1F2937'},
  headerSubtitle: {fontSize: 12, color: '#9CA3AF'},
  msgList: {padding: 16, paddingBottom: 8},
  msgRow: {flexDirection: 'row', marginBottom: 16, alignItems: 'flex-end'},
  msgRowUser: {justifyContent: 'flex-end'},
  msgRowBot: {justifyContent: 'flex-start'},
  botAvatar: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: '#EDE9FE', justifyContent: 'center', alignItems: 'center',
    marginRight: 8,
  },
  userAvatar: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: '#DBEAFE', justifyContent: 'center', alignItems: 'center',
    marginLeft: 8,
  },
  msgBubble: {maxWidth: '75%', borderRadius: 18, padding: 12},
  userBubble: {backgroundColor: '#10A7DA', borderBottomRightRadius: 4},
  botBubble: {backgroundColor: '#fff', borderBottomLeftRadius: 4, borderWidth: 1, borderColor: '#E5E7EB'},
  msgText: {fontSize: 15, lineHeight: 22},
  userText: {color: '#fff'},
  botText: {color: '#1F2937'},
  typing: {
    flexDirection: 'row', gap: 4, paddingHorizontal: 24, paddingBottom: 4,
  },
  typingDot: {
    width: 6, height: 6, borderRadius: 3, backgroundColor: '#D1D5DB',
  },
  inputBar: {
    flexDirection: 'row', alignItems: 'flex-end', gap: 8,
    padding: 12, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#E5E7EB',
  },
  input: {
    flex: 1, backgroundColor: '#F3F4F6', borderRadius: 20,
    paddingHorizontal: 16, paddingVertical: 10, fontSize: 15,
    maxHeight: 100,
  },
  sendBtn: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: '#10A7DA', justifyContent: 'center', alignItems: 'center',
  },
  sendBtnDisabled: {backgroundColor: '#D1D5DB'},
});

export default AIChatScreen;
