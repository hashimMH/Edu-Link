import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  Alert,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import { launchImageLibrary } from 'react-native-image-picker';
import DocumentPicker, { DocumentPickerResponse } from 'react-native-document-picker';
import TextInputField from '../../Auth/components/TextInputField';
import { api, UserData } from '../../../services/api';
import { DeleteModal } from '../stacks/components/DeleteModal';

interface Certificate {
  id: string;
  name: string;
  size: string;
}

interface TeacherData extends UserData {
  shortDescription: string;
  longDescription: string;
  experience: string;
  language: string;
  profileVideo?: {
    name: string;
    size: string;
    progress: number;
    uri?: string;
  };
  certificates: Certificate[];
}

const TeacherAccountScreen = () => {
  const navigation = useNavigation();
  const [formData, setFormData] = useState<TeacherData>({
    id: '1',
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    shortDescription: '',
    longDescription: '',
    experience: '',
    language: 'Arabic',
    profileVideo: {
      name: 'profile video',
      size: '16 MB',
      progress: 40,
    },
    certificates: [],
  });
  const [isUploading, setIsUploading] = useState(false);
  const [deleteVideoModalVisible, setDeleteVideoModalVisible] = useState(false);
  const [certificateToDelete, setCertificateToDelete] = useState<string | null>(null);

  useEffect(() => {
    const loadUserData = async () => {
      try {
        const userData = await api.getUserData();
        // Merge with default teacher data
        setFormData(prev => ({
          ...prev,
          ...userData,
          certificates: prev.certificates || [],
        }));
      } catch (error) {
        console.error('Failed to load user data:', error);
      }
    };

    loadUserData();
  }, []);

  const handleSave = () => {
    // Implement save functionality
    console.log('Saving teacher profile data:', formData);
    Alert.alert('Success', 'Profile updated successfully');
  };

  const handleChangeLanguage = () => {
    // Navigate to language selection screen or show a picker
    console.log('Change language pressed');
  };

  const handleDeleteVideo = () => {
    setDeleteVideoModalVisible(true);
  };

  const confirmDeleteVideo = () => {
    setFormData(prev => ({
      ...prev,
      profileVideo: undefined,
    }));
    setDeleteVideoModalVisible(false);
  };

  const handleUploadVideo = async () => {
    try {
      const result = await launchImageLibrary({
        mediaType: 'video',
        quality: 1,
        videoQuality: 'high',
      });

      if (!result.didCancel && result.assets && result.assets.length > 0) {
        const selectedVideo = result.assets[0];
        
        // Simulate upload progress
        setIsUploading(true);
        setFormData(prev => ({
          ...prev,
          profileVideo: {
            name: selectedVideo.fileName || 'profile video',
            size: `${Math.round(selectedVideo.fileSize ? selectedVideo.fileSize / (1024 * 1024) : 0)} MB`,
            progress: 0,
            uri: selectedVideo.uri,
          },
        }));

        // Simulate upload progress
        let progress = 0;
        const progressInterval = setInterval(() => {
          progress += 10;
          setFormData(prev => ({
            ...prev,
            profileVideo: prev.profileVideo ? {
              ...prev.profileVideo,
              progress,
            } : undefined,
          }));

          if (progress >= 100) {
            clearInterval(progressInterval);
            setIsUploading(false);
            Alert.alert('Success', 'Video uploaded successfully');
          }
        }, 500);
      }
    } catch (error) {
      console.error('Error uploading video:', error);
      Alert.alert('Error', 'Failed to upload video. Please try again.');
      setIsUploading(false);
    }
  };

  const handleAddCertificate = async () => {
    try {
      // Using the correct API for DocumentPicker v9.3.1
      const results: DocumentPickerResponse[] = await DocumentPicker.pick({
        type: [DocumentPicker.types.pdf, DocumentPicker.types.images],
        allowMultiSelection: false,
      });
      
      if (results && results.length > 0) {
        const selectedFile = results[0];
        
        // Add the certificate to the list
        const newCertificate: Certificate = {
          id: Date.now().toString(),
          name: selectedFile.name || 'Document',
          size: `${Math.round((selectedFile.size || 0) / 1024)} KB`,
        };

        setFormData(prev => ({
          ...prev,
          certificates: [...prev.certificates, newCertificate],
        }));
      }
    } catch (error) {
      if (DocumentPicker.isCancel(error)) {
        // User cancelled the picker
        console.log('User cancelled document picker');
      } else {
        console.error('Error adding certificate:', error);
        Alert.alert('Error', 'Failed to add certificate. Please try again.');
      }
    }
  };

  const handleDeleteCertificate = (id: string) => {
    setCertificateToDelete(id);
  };

  const confirmDeleteCertificate = () => {
    if (certificateToDelete) {
      setFormData(prev => ({
        ...prev,
        certificates: prev.certificates.filter(cert => cert.id !== certificateToDelete),
      }));
      setCertificateToDelete(null);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Delete Video Modal */}
      <DeleteModal
        visible={deleteVideoModalVisible}
        onClose={() => setDeleteVideoModalVisible(false)}
        onConfirm={confirmDeleteVideo}
        title="Delete video?"
      />

      {/* Delete Certificate Modal */}
      <DeleteModal
        visible={!!certificateToDelete}
        onClose={() => setCertificateToDelete(null)}
        onConfirm={confirmDeleteCertificate}
        title="Delete certificate?"
      />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Icon name="chevron-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Account</Text>
      </View>

      <ScrollView style={styles.scrollView}>
        {/* Profile Image */}
        <View style={styles.profileImageContainer}>
          <Image
            source={require('../../../../assets/profilepic.png')}
            style={styles.profileImage}
          />
          <TouchableOpacity style={styles.editImageButton}>
            <Icon name="pencil" size={17} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Form Fields */}
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
            title="short description"
            value={formData.shortDescription}
            onChangeText={(text) => setFormData({ ...formData, shortDescription: text })}
            placeholder="I am teacher for Arabic language and grammar...."
          />

          <TextInputField
            title="long description"
            value={formData.longDescription}
            onChangeText={(text) => setFormData({ ...formData, longDescription: text })}
            placeholder="I am teacher for Arabic language and grammar...."
            multiline
            numberOfLines={4}
            style={styles.multilineInput}
          />

          <TextInputField
            title="experience"
            value={formData.experience}
            onChangeText={(text) => setFormData({ ...formData, experience: text })}
            placeholder="+1"
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
          />

          {/* Language Section */}
          <View style={styles.languageSection}>
            <Text style={styles.label}>language you are studying</Text>
            <TouchableOpacity style={styles.changeButton} onPress={handleChangeLanguage}>
              <Text style={styles.changeButtonText}>Change</Text>
            </TouchableOpacity>
          </View>

          {/* Profile Video Section */}
          <View style={styles.sectionContainer}>
            <View style={styles.uploudTitle}>
              <Text style={styles.label}>profile video</Text>
              <TouchableOpacity 
                style={styles.uploadButton} 
                onPress={handleUploadVideo}
                disabled={isUploading}
              >
                <Icon name="cloud-upload-outline" size={24} color="#475467" />
              </TouchableOpacity>
            </View>
            
            {formData.profileVideo && (
              <View style={styles.videoContainer}>
                <View style={styles.videoInfo}>
                  <View style={styles.videoIconContainer}>
                    <Text style={styles.videoFormat}>MP4</Text>
                  </View>
                  <View style={styles.videoDetails}>
                    <Text style={styles.videoName}>{formData.profileVideo.name}</Text>
                    <Text style={styles.videoSize}>{formData.profileVideo.size}</Text>
                    <View style={styles.progressContainer}>
                      <View 
                        style={[
                          styles.progressBar, 
                          { width: `${formData.profileVideo.progress}%` }
                        ]} 
                      />
                      <Text style={styles.progressText}>{formData.profileVideo.progress}%</Text>
                    </View>
                  </View>
                </View>
                
                <TouchableOpacity onPress={handleDeleteVideo}>
                  <Icon name="trash-outline" size={20} color="#000" />
                </TouchableOpacity>
              </View>
            )}
            
          </View>

          {/* Certificates Section */}
          <View style={styles.sectionContainer}>
          <View style={styles.uploudTitle}>
            <Text style={styles.label}>Add certificates</Text>
            <TouchableOpacity 
              style={styles.uploadButton} 
              onPress={handleAddCertificate}
            >
              <Icon name="cloud-upload-outline" size={24} color="#475467" />
            </TouchableOpacity>
          </View>
            
            {formData.certificates.map(certificate => (
              <View key={certificate.id} style={styles.certificateItem}>
                <View style={styles.certificateInfo}>
                  <View style={styles.certificateIconContainer}>
                    <Icon name="document-text-outline" size={20} color="#10A7DA" />
                  </View>
                  <View style={styles.certificateDetails}>
                    <Text style={styles.certificateName}>{certificate.name}</Text>
                    <Text style={styles.certificateSize}>{certificate.size}</Text>
                  </View>
                </View>
                
                <TouchableOpacity onPress={() => handleDeleteCertificate(certificate.id)}>
                  <Icon name="trash-outline" size={20} color="#000" />
                </TouchableOpacity>
              </View>
            ))}

          </View>
        </View>
      </ScrollView>

      {/* Save Button */}
      <View style={styles.saveButtonContainer}>
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
    backgroundColor: '#F2F4F7',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    height: 56,
    position: 'relative',
  },
  backButton: {
    padding: 8,
    position: 'absolute',
    left: 8,
    zIndex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
  },
  profileImageContainer: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 30,
    position: 'relative',
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  editImageButton: {
    position: 'absolute',
    bottom: 0,
    right: '35%',
    backgroundColor: '#10A7DA',
    borderRadius: 15,
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  formContainer: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  multilineInput: {
    height: 100,
    textAlignVertical: 'top',
    paddingTop: 10,
  },
  languageSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2A37',
    marginBottom: 8,
  },
  changeButton: {
  },
  changeButtonText: {
    color: '#10A7DA',
    fontWeight: '600',
  },
  sectionContainer: {
    marginVertical: 16,
  },
  uploudTitle:{ 
    flexDirection: 'row', 
    justifyContent: 'space-between' ,
    alignItems:'center'
  },
  uploadButton: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D9D9D9',
    padding: 10,
    marginTop: 8,
  },
  uploadText: {
    color: '#10A7DA',
    fontWeight: '600',
    marginLeft: 8,
  },
  videoContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
   // backgroundColor: '#F2F4F7',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 12,
    marginTop: 8,
  },
  videoInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  videoIconContainer: {
    backgroundColor: '#10A7DA',
    borderRadius: 8,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoFormat: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 12,
  },
  videoDetails: {
    marginLeft: 12,
  },
  videoName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2A37',
  },
  videoSize: {
    fontSize: 12,
    color: '#6B7280',
  },
  progressContainer: {
    marginTop: 8,
    backgroundColor: '#F2F4F7',
    borderRadius: 8,
    height: 8,
    position: 'relative',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#7F56D9',
    borderRadius: 8,
  },
  progressText: {
    position: 'absolute',
    right: -30,
    fontSize: 10,
    color: '#000',
   // fontWeight: '600',
  },
  certificateItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F2F4F7',
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
  },
  certificateInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  certificateIconContainer: {
    backgroundColor: '#F2F4F7',
    borderRadius: 8,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  certificateDetails: {
    marginLeft: 12,
  },
  certificateName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2A37',
  },
  certificateSize: {
    fontSize: 12,
    color: '#6B7280',
  },
  saveButtonContainer: {
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
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

export default TeacherAccountScreen;
