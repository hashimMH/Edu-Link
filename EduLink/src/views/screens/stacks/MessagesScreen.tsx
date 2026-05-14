import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  FlatList,
  Image,
  SafeAreaView,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import {useNavigation} from '@react-navigation/native';
import {StackNavigationProp} from '@react-navigation/stack';
import {RootStackParamList} from '../../../models/types';
import {api, Message} from '../../../services/api';

const MessagesScreen = () => {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const [messages, setMessages] = useState<Message[]>([]);

  useEffect(() => {
    const loadMessages = async () => {
      try {
        const messageData = await api.getMessages();
        setMessages(messageData);
      } catch (error) {
        console.error('Failed to load messages:', error);
      }
    };

    loadMessages();
  }, []);

  const renderMessage = ({item}: {item: Message}) => (
    <TouchableOpacity
      style={styles.messageItem}
      onPress={() =>
        navigation.navigate('ChatScreen', {
          userId: item.id,
          name: item.name,
          chatId: (item as any).chatId || item.id,
        })
      }>
      <View style={styles.avatarContainer}>
        <Image source={require('../../../../assets/profilepic.png')} style={styles.avatar} />
        <View style={styles.onlineIndicator} />
      </View>
      <View style={styles.messageContent}>
        <Text style={styles.name}>{item.name}</Text>
        <Text style={styles.messageText}>{item.message}</Text>
      </View>
      <Text style={styles.time}>{item.time}</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>Messages</Text>
        </View>
      </View>

      <View style={styles.searchContainer}>
        <Icon name="search-outline" size={20} color="#10A8DA" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search Messages"
          placeholderTextColor="#6B7280"
        />
      </View>
      <View style={styles.messagesContainer}>
        <FlatList
          data={messages}
          renderItem={renderMessage}
          keyExtractor={item => item.id}
          showsVerticalScrollIndicator={false}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#10A8DA',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 5,
    paddingVertical: 20,
    paddingTop: 50,
    position: 'relative',
  },
  backButton: {
    backgroundColor: '#fff',
    padding: 8,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    left: 16,
    zIndex: 1,
  },
  headerTitleContainer: {
    flex: 1,
    paddingRight: '5%',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#fff',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 40,
    fontSize: 16,
    color: '#1F2937',
  },
  messageItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 10,
    borderWidth: 0.5,
    borderRadius: 15,
    borderColor: '#797979',
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  onlineIndicator: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#10B981',
    borderWidth: 2,
    borderColor: '#fff',
  },
  messageContent: {
    flex: 1,
    marginLeft: 12,
  },
  name: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1F2937',
    marginBottom: 4,
  },
  messageText: {
    fontSize: 14,
    color: '#6B7280',
  },
  time: {
    fontSize: 12,
    color: '#6B7280',
    marginLeft: 8,
  },
  messagesContainer: {
    flex: 1.1,
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 16,
  },
});

export default MessagesScreen;
