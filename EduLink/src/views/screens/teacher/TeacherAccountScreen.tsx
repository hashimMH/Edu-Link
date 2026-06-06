import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Image, ScrollView,
  Alert, Platform, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import { launchImageLibrary, launchCamera } from 'react-native-image-picker';
import DocumentPicker, { DocumentPickerResponse } from 'react-native-document-picker';
import TextInputField from '../../Auth/components/TextInputField';
import { api, API_HOST } from '../../../services/api';
import { storage } from '../../../services/storage';
import { DeleteModal } from '../stacks/components/DeleteModal';

interface Certificate {
  id: string;
  name: string;
  size: string;
}

const TeacherAccountScreen = () => {
  const navigation = useNavigation();
  const [formData, setFormData] = useState({
    firstName: '', lastName: '', email: '', password: '',
    shortDescription: '', longDescription: '', experience: '',
    language: 'Arabic',
  });
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [deleteVideoModalVisible, setDeleteVideoModalVisible] = useState(false);
  const [certificateToDelete, setCertificateToDelete] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const userData = await api.getProfile();
        setFormData(prev => ({
          ...prev,
          firstName: userData.firstName || '',
          lastName: userData.lastName || '',
          email: userData.email || '',
        }));
        setAvatarUrl(userData.avatarUrl || null);
        await storage.setUser({ ...userData });
      } catch (err) { console.error('Failed to load profile:', err); }
      finally { setLoading(false); }
    })();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.updateProfile({
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        ...(formData.password ? { password: formData.password } : {}),
      });
      const user = await storage.getUser();
      if (user) {
        await storage.setUser({ ...user, firstName: formData.firstName, lastName: formData.lastName, email: formData.email });
      }
      Alert.alert('Success', 'Profile updated');
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to save');
    } finally { setSaving(false); }
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
    } catch (err) { Alert.alert('Error', 'Could not open camera'); }
  };

  const openGallery = async () => {
    try {
      const result = await launchImageLibrary({ mediaType: 'photo', quality: 0.8, maxWidth: 800, maxHeight: 800 });
      if (result.assets?.[0]?.uri) uploadImage(result.assets[0].uri);
    } catch (err) { Alert.alert('Error', 'Could not open gallery'); }
  };

  const uploadImage = async (uri: string) => {
    try {
      const data = await api.uploadAvatar(uri);
      setAvatarUrl(data.avatarUrl);
      const user = await storage.getUser();
      if (user) await storage.setUser({ ...user, avatarUrl: data.avatarUrl });
    } catch (err: any) { Alert.alert('Error', err.message || 'Upload failed'); }
  };

  const handleUploadVideo = async () => {
    try {
      const result = await launchImageLibrary({ mediaType: 'video', quality: 1, videoQuality: 'high' });
      if (!result.didCancel && result.assets?.[0]) {
        setProfileVideo({ name: result.assets[0].fileName || 'video', size: '...', progress: 0, uri: result.assets[0].uri });
      }
    } catch (err) { console.error(err); }
  };

  const handleAddCertificate = async () => {
    try {
      const results = await DocumentPicker.pick({ type: [DocumentPicker.types.pdf, DocumentPicker.types.images], allowMultiSelection: false });
      if (results?.[0]) {
        setCertificates(prev => [...prev, { id: Date.now().toString(), name: results[0].name || 'Document', size: `${Math.round((results[0].size || 0) / 1024)} KB` }]);
      }
    } catch (err) { if (!DocumentPicker.isCancel(err)) console.error(err); }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" color="#10A7DA" style={{ marginTop: 100 }} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <DeleteModal visible={deleteVideoModalVisible} onClose={() => setDeleteVideoModalVisible(false)} onConfirm={() => setProfileVideo(undefined)} title="Delete video?" />
      <DeleteModal visible={!!certificateToDelete} onClose={() => setCertificateToDelete(null)} onConfirm={() => { setCertificates(prev => prev.filter(c => c.id !== certificateToDelete)); setCertificateToDelete(null); }} title="Delete certificate?" />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Icon name="chevron-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Account</Text>
      </View>

      <ScrollView style={styles.scrollView}>
        {/* Profile Image */}
        <TouchableOpacity style={styles.profileImageContainer} onPress={handlePickImage}>
          <Image
            source={avatarUrl ? { uri: `${API_HOST}${avatarUrl}` } : require('../../../../assets/profilepic.png')}
            style={styles.profileImage}
          />
          <View style={styles.editImageButton}>
            <Icon name="camera" size={16} color="#fff" />
          </View>
        </TouchableOpacity>

        <View style={styles.formContainer}>
          <TextInputField title="First Name" value={formData.firstName} onChangeText={text => setFormData({ ...formData, firstName: text })} />
          <TextInputField title="Last Name" value={formData.lastName} onChangeText={text => setFormData({ ...formData, lastName: text })} />
          <TextInputField title="short description" value={formData.shortDescription} onChangeText={text => setFormData({ ...formData, shortDescription: text })} placeholder="I am teacher for Arabic language and grammar...." />
          <TextInputField title="long description" value={formData.longDescription} onChangeText={text => setFormData({ ...formData, longDescription: text })} multiline numberOfLines={4} style={styles.multilineInput} />
          <TextInputField title="experience" value={formData.experience} onChangeText={text => setFormData({ ...formData, experience: text })} placeholder="+1" />
          <TextInputField title="Email" value={formData.email} onChangeText={text => setFormData({ ...formData, email: text })} keyboardType="email-address" autoCapitalize="none" />
          <TextInputField title="Password" value={formData.password} onChangeText={text => setFormData({ ...formData, password: text })} isPassword placeholder="New password" />
        </View>
      </ScrollView>

      <View style={styles.saveButtonContainer}>
        <TouchableOpacity style={styles.saveButton} onPress={handleSave} disabled={saving}>
          {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveButtonText}>Save Changes</Text>}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  scrollView: { flex: 1 },
  header: { backgroundColor: '#F2F4F7', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, height: 56 },
  backButton: { padding: 8, position: 'absolute', left: 8, zIndex: 1 },
  headerTitle: { fontSize: 20, fontWeight: '600', flex: 1, textAlign: 'center' },
  profileImageContainer: { alignItems: 'center', marginTop: 20, marginBottom: 24 },
  profileImage: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#E5E7EB' },
  editImageButton: {
    position: 'absolute', bottom: 0, right: '35%',
    backgroundColor: '#10A7DA', width: 32, height: 32,
    borderRadius: 16, borderWidth: 2, borderColor: '#fff',
    justifyContent: 'center', alignItems: 'center',
  },
  formContainer: { paddingHorizontal: 16, paddingBottom: 20 },
  multilineInput: { height: 100, textAlignVertical: 'top', paddingTop: 10 },
  saveButtonContainer: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 16, backgroundColor: '#fff' },
  saveButton: { backgroundColor: '#10A7DA', height: 48, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  saveButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});

export default TeacherAccountScreen;
