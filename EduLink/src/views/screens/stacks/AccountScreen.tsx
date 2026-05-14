import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  Platform,
  Alert,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import TextInputField from '../../Auth/components/TextInputField';
import { api } from '../../../services/api';

const AccountScreen = () => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUserData = async () => {
      try {
        const userData = await api.getProfile();
        setFormData({
          firstName: userData.firstName,
          lastName: userData.lastName,
          email: userData.email,
          password: '',
        });
      } catch (error: any) {
        Alert.alert('Error', error.message || 'Failed to load profile');
      } finally {
        setLoading(false);
      }
    };

    loadUserData();
  }, []);

  const handleSave = async () => {
    try {
      await api.updateProfile({
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        ...(formData.password ? { password: formData.password } : {}),
      });
      Alert.alert('Success', 'Profile updated');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to save');
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={[styles.header, { paddingTop: Platform.OS === 'ios' ? insets.top > 0 ? insets.top : 10 : 0 }]}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Icon name="chevron-back" size={24} color="#1F2A37" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Account</Text>
          <View style={styles.placeholderRight} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['right', 'left', 'bottom']}>
      <View style={[styles.header, { paddingTop: Platform.OS === 'ios' ? insets.top > 0 ? insets.top : 10 : 0 }]}>
        <TouchableOpacity 
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Icon name="chevron-back" size={24} color="#1F2A37" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Account</Text>
        <View style={styles.placeholderRight} />
      </View>

      <ScrollView style={styles.scrollView}>
        <View style={styles.profileImageContainer}>
          <Image
            source={require('../../../../assets/profilepic.png')}
            style={styles.profileImage}
          />
          <TouchableOpacity style={styles.editImageButton}>
            <Icon name="pencil" size={17} color="#fff" />
          </TouchableOpacity>
        </View>

        <View style={styles.formContainer}>
          <TextInputField
            title="First Name"
            value={formData.firstName}
            onChangeText={(text) => setFormData({ ...formData, firstName: text })}
          />
          <TextInputField
            title="Last Name"
            value={formData.lastName}
            onChangeText={(text) => setFormData({ ...formData, lastName: text })}
          />
          <TextInputField
            title="Email *"
            value={formData.email}
            onChangeText={(text) => setFormData({ ...formData, email: text })}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <TextInputField
            title="Password"
            value={formData.password}
            onChangeText={(text) => setFormData({ ...formData, password: text })}
            isPassword
            placeholder="Enter new password"
          />

          <View style={styles.interestsSection}>
            <Text style={styles.label}>Your interests and goals</Text>
            <TouchableOpacity style={styles.changeButton}>
              <Text style={styles.changeButtonText}>Change</Text>
              <Icon name="arrow-forward" size={20} color="#10A7DA" />
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      <View style={[styles.saveButtonContainer, { paddingBottom: Platform.OS === 'ios' ? insets.bottom > 0 ? insets.bottom : 16 : 16 }]}>
        <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
          <Text style={styles.saveButtonText}>Save</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F9FAFB',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    padding: 8,
    borderRadius: 8,
  },
  placeholderRight: {
    width: 40,
    height: 40,
  },
  headerTitle: {
    fontWeight: '600',
    fontSize: 18,
    color: '#1F2937',
  },
  profileImageContainer: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 30,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#00A3FF',
  },
  editImageButton: {
    position: 'absolute',
    right: '36%',
    bottom: 5,
    backgroundColor: '#10A7DA',
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  formContainer: {
    paddingHorizontal: 16,
  },
  label: {
    fontSize: 16,
    color: '#333',
  },
  interestsSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 30,
  },
  changeButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  changeButtonText: {
    color: '#10A7DA',
    fontSize: 16,
    marginRight: 4,
  },
  saveButtonContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
    backgroundColor: '#fff',
  },
  saveButton: {
    backgroundColor: '#10A7DA',
    height: 48,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default AccountScreen;
