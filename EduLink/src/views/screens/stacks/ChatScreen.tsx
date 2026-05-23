import React, {useState, useEffect, useRef} from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput,
  FlatList, Image, SafeAreaView, KeyboardAvoidingView,
  Platform, ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import {useNavigation, useRoute, RouteProp} from '@react-navigation/native';
import {RootStackParamList} from '../../../models/types';
import {api} from '../../../services/api';
import {connectSocket, getSocket, disconnectSocket} from '../../../services/socket';

interface Message {
  id: string;
  text: string;
  time: string;
  sender: string;
}

const ChatScreen = () => {
  const navigation = useNavigation();
  const route = useRoute<RouteProp<RootStackParamList, 'ChatScreen'>>();
  const {userId: routeUserId, name: recipientName, chatId} = route.params;
  const [receiverId, setReceiverId] = useState(routeUserId);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const flatListRef = useRef<FlatList>(null);
  const chatIdRef = useRef(chatId);
  const shouldConnectRef = useRef(false);

  // Load initial messages and derive receiverId if missing
  useEffect(() => {
    api.getChatMessages(chatId).then(data => {
      setMessages(data);
      setLoading(false);
      shouldConnectRef.current = true;

      // If userId is empty, derive it from the messages
      if (!receiverId && data.length > 0) {
        const firstOther = data.find((m: any) => m.sender !== 'You');
        if (firstOther) {
          // We need userId — fetch conversation list
          api.getMessages().then((convs: any[]) => {
            const conv = convs.find((c: any) => c.chatId === chatId);
            if (conv) setReceiverId(conv.id); // conv.id is the other user's id
          }).catch(() => {});
        }
      }
    }).catch(err => {
      console.error('Failed to load messages:', err);
      setLoading(false);
    });
  }, [chatId]);

  // Connect to socket and listen for new messages
  useEffect(() => {
    let cleanup: (() => void) | null = null;

    const setup = async () => {
      try {
        const socket = await connectSocket();
        
        const handler = (msg: any) => {
          if (msg.chatId === chatIdRef.current) {
            setMessages(prev => {
              if (prev.find(m => m.id === msg.id)) return prev;
              return [...prev, {
                id: msg.id,
                text: msg.text,
                time: msg.time,
                sender: 'other',
              }];
            });
            setTimeout(() => flatListRef.current?.scrollToEnd({animated: true}), 100);
          }
        };

        socket.on('new_message', handler);
        cleanup = () => { socket.off('new_message', handler); };
      } catch (err) {
        console.log('[WS] Setup failed:', err);
      }
    };

    setup();
    return () => {
      if (cleanup) cleanup();
    };
  }, []);

  // Disconnect on unmount
  useEffect(() => {
    return () => { disconnectSocket(); };
  }, []);

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;
    const text = newMessage.trim();
    setNewMessage('');
    try {
      const msg = await api.sendMessage(receiverId, text);
      setMessages(prev => [...prev, msg]);
      setTimeout(() => flatListRef.current?.scrollToEnd({animated: true}), 100);
    } catch (err: any) {
      console.error('Failed to send:', err.message);
    }
  };

  const renderMessage = ({item}: {item: Message}) => {
    const isCurrentUser = item.sender === 'You';
    return (
      <View style={[styles.messageContainer, isCurrentUser ? styles.currentUserMessage : styles.otherUserMessage]}>
        {!isCurrentUser ? (
          <Image source={require('../../../../assets/profilepic.png')} style={styles.avatar} />
        ) : null}
        <View style={[styles.messageBubble, isCurrentUser ? styles.currentUserBubble : styles.otherUserBubble]}>
          {!isCurrentUser && <Text style={styles.senderName}>{recipientName}</Text>}
          <Text style={[styles.messageText, isCurrentUser ? styles.currentUserText : styles.otherUserText]}>
            {item.text}
          </Text>
          <Text style={[styles.messageTime, isCurrentUser ? styles.currentUserTime : styles.otherUserTime]}>
            {item.time}
          </Text>
        </View>
        {isCurrentUser ? (
          <Image source={require('../../../../assets/profilepic.png')} style={[styles.avatar, styles.currentUserAvatar]} />
        ) : null}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Icon name="chevron-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Image source={require('../../../../assets/profilepic.png')} style={styles.profileImage} />
        <View style={styles.headerInfo}>
          <Text style={styles.headerName}>{recipientName}</Text>
          <Text style={styles.headerStatus}>Online</Text>
        </View>
      </View>

      <View style={styles.content}>
        <View style={styles.dateHeader}><Text style={styles.dateText}>TODAY</Text></View>

        {loading ? (
          <ActivityIndicator size="large" color="#10A8DA" style={{flex: 1}} />
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            renderItem={renderMessage}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.messagesList}
            showsVerticalScrollIndicator={false}
            onContentSizeChange={() => flatListRef.current?.scrollToEnd({animated: false})}
          />
        )}

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
          style={styles.inputContainer}>
          <TextInput
            style={[styles.input, {flex: 1}]}
            placeholder="Type a message here..."
            placeholderTextColor="#999"
            value={newMessage}
            onChangeText={setNewMessage}
            multiline
          />
          <TouchableOpacity style={styles.sendButton} onPress={handleSendMessage}>
            <Icon name="send" size={24} color="#fff" />
          </TouchableOpacity>
        </KeyboardAvoidingView>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#10A8DA'},
  header: {flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, paddingTop: 50},
  backButton: {marginRight: 16},
  profileImage: {width: 40, height: 40, borderRadius: 20},
  headerInfo: {flex: 1, marginLeft: 12},
  headerName: {color: '#fff', fontSize: 16, fontWeight: '600'},
  headerStatus: {color: '#fff', fontSize: 12, opacity: 0.8},
  content: {flex: 1, backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingTop: 16},
  dateHeader: {alignItems: 'center', marginBottom: 16},
  dateText: {color: '#666', fontSize: 14, fontWeight: '500'},
  messagesList: {paddingHorizontal: 16, paddingBottom: 16},
  messageContainer: {flexDirection: 'row', alignItems: 'flex-end', marginVertical: 10},
  currentUserMessage: {justifyContent: 'flex-end'},
  otherUserMessage: {justifyContent: 'flex-start'},
  avatar: {width: 32, height: 32, borderRadius: 16, marginHorizontal: 8},
  currentUserAvatar: {marginLeft: 8, marginRight: 0},
  messageBubble: {borderRadius: 20, padding: 12, maxWidth: '75%'},
  currentUserBubble: {backgroundColor: '#10A8DA'},
  otherUserBubble: {backgroundColor: '#F0F0F0'},
  senderName: {fontSize: 12, color: '#666', marginBottom: 4},
  messageText: {fontSize: 14, marginBottom: 4},
  currentUserText: {color: '#fff'},
  otherUserText: {color: '#000'},
  messageTime: {fontSize: 12, alignSelf: 'flex-end'},
  currentUserTime: {color: 'rgba(255,255,255,0.7)'},
  otherUserTime: {color: '#666'},
  inputContainer: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16,
    paddingVertical: 8, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#eee',
  },
  input: {backgroundColor: '#f8f8f8', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 8, marginRight: 8, fontSize: 16},
  sendButton: {width: 40, height: 40, borderRadius: 20, backgroundColor: '#10A8DA', justifyContent: 'center', alignItems: 'center'},
});

export default ChatScreen;
