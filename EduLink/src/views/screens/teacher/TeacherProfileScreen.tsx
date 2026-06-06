import React, {useState, useCallback} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Platform,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import {useNavigation, useFocusEffect} from '@react-navigation/native';
import {CompositeNavigationProp} from '@react-navigation/native';
import {StackNavigationProp} from '@react-navigation/stack';
import {BottomTabNavigationProp} from '@react-navigation/bottom-tabs';
import {RootStackParamList, TeacherTabParamList} from '../../../models/types';
import Background from '../components/Background';
import {storage} from '../../../services/storage';
import {API_HOST} from '../../../services/api';

type ProfileScreenNavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<TeacherTabParamList, 'Profile'>,
  StackNavigationProp<RootStackParamList>
>;

interface ProfileOption {
  id: string;
  title: string;
  icon: string;
  onPress: () => void;
}

const TeacherProfileScreen = () => {
  const navigation = useNavigation<ProfileScreenNavigationProp>();
  const [userName, setUserName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      storage.getUser().then(u => {
        if (u) {
          setUserName(`${u.firstName} ${u.lastName}`);
          setAvatarUrl(u.avatarUrl || null);
        }
      });
    }, [])
  );

  const profileOptions: ProfileOption[] = [
    { 
      id: 'account', 
      title: 'Account', 
      icon: 'person-outline',
      onPress: () => navigation.navigate('TeacherAccountScreen')
    },
    { 
      id: 'earnings', 
      title: 'Earnings', 
      icon: 'cash-outline',
      onPress: () => navigation.navigate('TeacherEarningsScreen')
    },
    { 
      id: 'Classes-history', 
      title: 'Classes History', 
      icon: 'play-outline',
      onPress: () => console.log('Classes History pressed')
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
                source={avatarUrl ? { uri: `${API_HOST}${avatarUrl}` } : require('../../../../assets/profilepic.png')}
                style={styles.profileImage}
              />
              <TouchableOpacity style={styles.editButton} onPress={() => navigation.navigate('TeacherAccountScreen')}>
                <Icon name="pencil" size={16} color="#fff" />
              </TouchableOpacity>
            </View>
            <Text style={styles.profileName}>{userName || 'Teacher'}</Text>
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

export default TeacherProfileScreen;
