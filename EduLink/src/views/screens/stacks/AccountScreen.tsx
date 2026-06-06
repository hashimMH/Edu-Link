import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Image, ScrollView,
  Platform, Alert, ActivityIndicator,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import { launchImageLibrary, launchCamera } from 'react-native-image-picker';
import TextInputField from '../../Auth/components/TextInputField';
import { api } from '../../../services/api';
import { storage } from '../../../services/storage';

const INTERESTS_LIST = [
  'Arabic', 'English', 'Mathematics', 'Science',
  'Programming', 'Business', 'Vocabulary', 'Reading',
  'Writing', 'Grammar', 'History', 'Art',
];

const COUNTRIES = [
  'au', 'uk', 'us', 'ca', 'ae', 'sa', 'eg', 'jo', 'kw', 'qa', 'om', 'bh',
];

const AccountScreen = () => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const [formData, setFormData] = useState({
    firstName: '', lastName: '', email: '', password: '',
    country: '', interests: [] as string[],
  });
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showInterests, setShowInterests] = useState(false);
  const [showCountries, setShowCountries] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const userData = await api.getProfile();
        setFormData({
          firstName: userData.firstName || '',
          lastName: userData.lastName || '',
          email: userData.email || '',
          password: '',
          country: userData.country || '',
          interests: userData.interests || [],
        });
        setAvatarUrl(userData.avatarUrl || null);
        // Update stored user
        await storage.setUser({ ...userData });
      } catch (err: any) {
        Alert.alert('Error', err.message || 'Failed to load profile');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.updateProfile({
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        country: formData.country || undefined,
        interests: formData.interests,
        ...(formData.password ? { password: formData.password } : {}),
      });
      // Update local storage
      const user = await storage.getUser();
      if (user) {
        storage.setUser({
          ...user,
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          country: formData.country,
        });
      }
      Alert.alert('Success', 'Profile updated');
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handlePickImage = () => {
    Alert.alert('Profile Picture', 'Choose an option', [
      { text: 'Camera', onPress: openCamera },
      { text: 'Gallery', onPress: openGallery },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const openCamera = async () => {
    try {
      const result = await launchCamera({ mediaType: 'photo', quality: 0.8, maxWidth: 800, maxHeight: 800 });
      if (result.assets?.[0]?.uri) uploadImage(result.assets[0].uri);
    } catch (err) {
      Alert.alert('Error', 'Could not open camera');
    }
  };

  const openGallery = async () => {
    try {
      const result = await launchImageLibrary({ mediaType: 'photo', quality: 0.8, maxWidth: 800, maxHeight: 800 });
      if (result.assets?.[0]?.uri) uploadImage(result.assets[0].uri);
    } catch (err) {
      Alert.alert('Error', 'Could not open gallery');
    }
  };

  const uploadImage = async (uri: string) => {
    try {
      const data = await api.uploadAvatar(uri);
      setAvatarUrl(data.avatarUrl);
      // Update stored user
      const user = await storage.getUser();
      if (user) storage.setUser({ ...user, avatarUrl: data.avatarUrl });
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Upload failed');
    }
  };

  const toggleInterest = (interest: string) => {
    setFormData(prev => ({
      ...prev,
      interests: prev.interests.includes(interest)
        ? prev.interests.filter(i => i !== interest)
        : [...prev.interests, interest],
    }));
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" color="#10A7DA" style={{ marginTop: 100 }} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['right', 'left', 'bottom']}>
      <View style={[styles.header, { paddingTop: Platform.OS === 'ios' ? insets.top > 0 ? insets.top : 10 : 0 }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Icon name="chevron-back" size={24} color="#1F2A37" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Account</Text>
        <View style={styles.placeholderRight} />
      </View>

      <ScrollView style={styles.scrollView}>
        {/* Profile Picture */}
        <TouchableOpacity style={styles.profileImageContainer} onPress={handlePickImage}>
          <Image
            source={avatarUrl ? { uri: `http://10.0.2.2:3003${avatarUrl}` } : require('../../../../assets/profilepic.png')}
            style={styles.profileImage}
          />
          <View style={styles.editImageButton}>
            <Icon name="camera" size={16} color="#fff" />
          </View>
        </TouchableOpacity>

        <View style={styles.formContainer}>
          <TextInputField
            title="First Name"
            value={formData.firstName}
            onChangeText={text => setFormData({ ...formData, firstName: text })}
          />
          <TextInputField
            title="Last Name"
            value={formData.lastName}
            onChangeText={text => setFormData({ ...formData, lastName: text })}
          />
          <TextInputField
            title="Email *"
            value={formData.email}
            onChangeText={text => setFormData({ ...formData, email: text })}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <TextInputField
            title="Password"
            value={formData.password}
            onChangeText={text => setFormData({ ...formData, password: text })}
            isPassword
            placeholder="New password (leave blank to keep)"
          />

          {/* Country */}
          <View style={styles.fieldSection}>
            <Text style={styles.fieldLabel}>Country</Text>
            <TouchableOpacity
              style={styles.pickerButton}
              onPress={() => setShowCountries(!showCountries)}
            >
              <Text style={styles.pickerText}>{formData.country ? formData.country.toUpperCase() : 'Select country'}</Text>
              <Icon name={showCountries ? 'chevron-up' : 'chevron-down'} size={20} color="#666" />
            </TouchableOpacity>
            {showCountries && (
              <View style={styles.optionsContainer}>
                {COUNTRIES.map(c => (
                  <TouchableOpacity
                    key={c}
                    style={[styles.optionChip, formData.country === c && styles.optionChipActive]}
                    onPress={() => { setFormData({ ...formData, country: c }); setShowCountries(false); }}
                  >
                    <Text style={[styles.optionChipText, formData.country === c && styles.optionChipTextActive]}>
                      {c.toUpperCase()}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          {/* Interests & Goals */}
          <View style={styles.fieldSection}>
            <Text style={styles.fieldLabel}>Interests & Goals</Text>
            <TouchableOpacity
              style={styles.pickerButton}
              onPress={() => setShowInterests(!showInterests)}
            >
              <Text style={styles.pickerText}>
                {formData.interests.length > 0
                  ? formData.interests.slice(0, 3).join(', ') + (formData.interests.length > 3 ? ` +${formData.interests.length - 3}` : '')
                  : 'Select interests'}
              </Text>
              <Icon name={showInterests ? 'chevron-up' : 'chevron-down'} size={20} color="#666" />
            </TouchableOpacity>
            {showInterests && (
              <View style={styles.optionsContainer}>
                {INTERESTS_LIST.map(interest => (
                  <TouchableOpacity
                    key={interest}
                    style={[styles.optionChip, formData.interests.includes(interest) && styles.optionChipActive]}
                    onPress={() => toggleInterest(interest)}
                  >
                    <Text style={[styles.optionChipText, formData.interests.includes(interest) && styles.optionChipTextActive]}>
                      {interest}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        </View>
      </ScrollView>

      <View style={[styles.saveButtonContainer, { paddingBottom: Platform.OS === 'ios' ? insets.bottom > 0 ? insets.bottom : 16 : 16 }]}>
        <TouchableOpacity style={styles.saveButton} onPress={handleSave} disabled={saving}>
          {saving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.saveButtonText}>Save Changes</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  scrollView: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: '#F9FAFB', paddingVertical: 16, paddingHorizontal: 16,
    borderBottomWidth: 1, borderBottomColor: '#E5E7EB',
  },
  backButton: { padding: 8, borderRadius: 8 },
  placeholderRight: { width: 40, height: 40 },
  headerTitle: { fontWeight: '600', fontSize: 18, color: '#1F2937' },
  profileImageContainer: { alignItems: 'center', marginTop: 20, marginBottom: 24 },
  profileImage: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#E5E7EB' },
  editImageButton: {
    position: 'absolute', bottom: 0, right: '36%',
    backgroundColor: '#10A7DA', width: 32, height: 32,
    borderRadius: 16, borderWidth: 2, borderColor: '#fff',
    justifyContent: 'center', alignItems: 'center',
  },
  formContainer: { paddingHorizontal: 16 },
  fieldSection: { marginTop: 16, marginBottom: 8 },
  fieldLabel: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 6 },
  pickerButton: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 12, backgroundColor: '#F9FAFB',
  },
  pickerText: { fontSize: 15, color: '#374151' },
  optionsContainer: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 8,
    marginTop: 10, paddingHorizontal: 4,
  },
  optionChip: {
    paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: 20, borderWidth: 1, borderColor: '#D1D5DB',
    backgroundColor: '#F9FAFB',
  },
  optionChipActive: {
    backgroundColor: '#10A7DA', borderColor: '#10A7DA',
  },
  optionChipText: { fontSize: 13, color: '#374151', fontWeight: '500' },
  optionChipTextActive: { color: '#fff' },
  saveButtonContainer: { paddingHorizontal: 16, paddingTop: 16, backgroundColor: '#fff' },
  saveButton: {
    backgroundColor: '#10A7DA', height: 48, borderRadius: 10,
    justifyContent: 'center', alignItems: 'center',
  },
  saveButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});

export default AccountScreen;
