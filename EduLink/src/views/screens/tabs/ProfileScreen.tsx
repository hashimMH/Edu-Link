import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import {useNavigation} from '@react-navigation/native';
import {CompositeNavigationProp} from '@react-navigation/native';
import {StackNavigationProp} from '@react-navigation/stack';
import {BottomTabNavigationProp} from '@react-navigation/bottom-tabs';
import {RootStackParamList, TabParamList} from '../../../models/types';
import Background from '../components/Background';
import {storage} from '../../../services/storage';

type ProfileScreenNavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<TabParamList, 'Profile'>,
  StackNavigationProp<RootStackParamList>
>;

interface ProfileOption {
  id: string;
  title: string;
  icon: string;
  onPress: () => void;
}

const ProfileScreen = () => {
  const navigation = useNavigation<ProfileScreenNavigationProp>();
  const [userName, setUserName] = useState('');

  useEffect(() => {
    storage.getUser().then(u => {
      if (u) setUserName(`${u.firstName} ${u.lastName}`);
    });
  }, []);

  const profileOptions: ProfileOption[] = [
    { 
      id: 'account', 
      title: 'Account', 
      icon: 'person-outline',
      onPress: () => navigation.navigate('AccountScreen')
    },
    { 
      id: 'messages', 
      title: 'Messages', 
      icon: 'chatbubble-outline',
      onPress: () => navigation.navigate('MessagesScreen')
    },
    { 
      id: 'subscribe', 
      title: 'Subscribe', 
      icon: 'card-outline',
      onPress: () => console.log('Subscribe pressed')
    },
    { 
      id: 'my-schedule', 
      title: 'My schedule', 
      icon: 'time-outline',
      onPress: () => navigation.navigate('MyScheduleScreen')
    },
    { 
      id: 'extra-minutes', 
      title: 'Extra Minutes', 
      icon: 'time-outline',
      onPress: () => console.log('Extra Minutes pressed')
    },
    { 
      id: 'lesson-history', 
      title: 'Lesson History', 
      icon: 'play-outline',
      onPress: () => navigation.navigate('LessonHistoryScreen')
    },
    { 
      id: 'saved-tutors', 
      title: 'Saved Tutors', 
      icon: 'bookmark-outline',
      onPress: () => console.log('Saved Tutors pressed')
    },
    { 
      id: 'referral', 
      title: 'Referral code', 
      icon: 'gift-outline',
      onPress: () => console.log('Referral pressed')
    },
    { 
      id: 'help', 
      title: 'Help Center', 
      icon: 'help-circle-outline',
      onPress: () => console.log('Help pressed')
    },
    { 
      id: 'invites', 
      title: 'Invites Friends', 
      icon: 'people-outline',
      onPress: () => console.log('Invites pressed')
    },
    { 
      id: 'logout', 
      title: 'Log out', 
      icon: 'log-out-outline',
      onPress: async () => {
        await storage.clear();
        navigation.reset({index: 0, routes: [{name: 'LoginScreen'}]});
      }
    },
  ];

  return (
    <Background>
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <View style={styles.profileSection}>
            <View style={styles.profileImageContainer}>
              <Image
                source={require('../../../../assets/profilepic.png')}
                style={styles.profileImage}
              />
              <TouchableOpacity style={styles.editButton}>
                <Icon name="pencil" size={16} color="#fff" />
              </TouchableOpacity>
            </View>
            <Text style={styles.profileName}>{userName || 'User'}</Text>
          </View>
        </View>

        <View style={styles.optionsContainer}>
          {profileOptions.map((option) => (
            <TouchableOpacity
              key={option.id}
              style={[styles.optionItem, option.id === 'account' && {borderTopWidth: 0}]}
              onPress={option.onPress}
            >
              <View style={styles.optionLeft}>
                <Icon name={option.icon} size={24} color="#0E92BE" />
                <Text style={styles.optionText}>{option.title}</Text>
              </View>
              <Icon name="chevron-forward" size={24} color="#0E92BE" />
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </Background>
  );
};

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  header: {
    backgroundColor: '#fff',
    paddingVertical: 24,
    paddingHorizontal: 16,
  },
  profileSection: {
    alignItems: 'center',
  },
  profileImageContainer: {
    position: 'relative',
    marginBottom: 12,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#E5E7EB',
  },
  editButton: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    backgroundColor: '#52B6DF',
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  profileName: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
  },
  optionsContainer: {
    backgroundColor: '#fff',
    padding: 20,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderTopWidth: 0.5,
    borderTopColor: '#D9D9D9',
  },
  optionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  optionText: {
    fontSize: 16,
    color: '#1F2937',
    marginLeft: 12,
  },
});

export default ProfileScreen;
