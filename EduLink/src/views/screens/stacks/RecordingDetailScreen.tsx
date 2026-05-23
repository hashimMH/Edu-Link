import React, {useState, useEffect} from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  ActivityIndicator, Platform, TextInput, Linking, Alert,
} from 'react-native';
import {SafeAreaView, useSafeAreaInsets} from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import {useNavigation, useRoute, RouteProp} from '@react-navigation/native';
import {RootStackParamList} from '../../../models/types';
import {api} from '../../../services/api';
import Video from 'react-native-video';

const API_HOST = Platform.OS === 'android' ? 'http://10.0.2.2:3000' : 'http://localhost:3000';

interface RecordingDetail {
  id: string; classId: string; title: string; date: string;
  duration: string; videoUrl: string | null; thumbnailUrl: string | null;
  teacherName: string; classDate: string; classTime: string;
  notes: string; teacherNotes: string;
  materials: { title: string; url: string; type: string }[];
}

const RecordingDetailScreen = () => {
  const navigation = useNavigation();
  const route = useRoute<RouteProp<RootStackParamList, 'RecordingDetailScreen'>>();
  const {recordingId} = route.params;
  const insets = useSafeAreaInsets();

  const [recording, setRecording] = useState<RecordingDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [notes, setNotes] = useState('');
  const [savingNotes, setSavingNotes] = useState(false);
  const [activeTab, setActiveTab] = useState<'video' | 'notes' | 'materials'>('video');

  useEffect(() => {
    api.getRecording(recordingId).then(data => {
      setRecording(data);
      setNotes(data.notes || '');
    }).catch(err => {
      Alert.alert('Error', err.message || 'Failed to load recording');
      navigation.goBack();
    }).finally(() => setLoading(false));
  }, [recordingId]);

  const handleSaveNotes = async () => {
    setSavingNotes(true);
    try {
      await api.saveRecordingNotes(recordingId, notes);
      Alert.alert('Saved', 'Notes saved');
    } catch (err: any) {
      Alert.alert('Error', err.message);
    } finally {
      setSavingNotes(false);
    }
  };

  const getVideoUri = () => {
    if (!recording?.videoUrl) return '';
    if (recording.videoUrl.startsWith('http')) return recording.videoUrl;
    return `${API_HOST}${recording.videoUrl}`;
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" color="#10A7DA" style={{marginTop: 100}} />
      </SafeAreaView>
    );
  }

  if (!recording) return null;

  return (
    <SafeAreaView style={styles.container} edges={['right', 'left', 'bottom']}>
      <View style={[styles.header, {paddingTop: Platform.OS === 'ios' ? insets.top > 0 ? insets.top : 10 : 0}]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Icon name="chevron-back" size={24} color="#1F2A37" />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>{recording.title}</Text>
        <View style={styles.placeholderRight} />
      </View>

      <ScrollView style={styles.scrollView}>
        {/* Info card */}
        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>{recording.title}</Text>
          <Text style={styles.infoTeacher}>{recording.teacherName}</Text>
          <View style={styles.infoRow}>
            <View style={styles.infoItem}>
              <Icon name="calendar-outline" size={14} color="#6B7280" />
              <Text style={styles.infoText}>{recording.date}</Text>
            </View>
            {recording.duration && (
              <View style={styles.infoItem}>
                <Icon name="time-outline" size={14} color="#6B7280" />
                <Text style={styles.infoText}>{recording.duration}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Tab bar */}
        <View style={styles.tabBar}>
          {(['video', 'notes', 'materials'] as const).map(tab => (
            <TouchableOpacity
              key={tab}
              style={[styles.tab, activeTab === tab && styles.tabActive]}
              onPress={() => setActiveTab(tab)}
            >
              <Icon
                name={tab === 'video' ? 'play-circle-outline' : tab === 'notes' ? 'document-text-outline' : 'attach-outline'}
                size={18}
                color={activeTab === tab ? '#10A7DA' : '#9CA3AF'}
              />
              <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
                {tab === 'video' ? 'Video' : tab === 'notes' ? 'Notes' : 'Materials'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Tab content */}
        {activeTab === 'video' && (
          <View style={styles.videoContainer}>
            {recording.videoUrl ? (
              <>
                <TouchableOpacity onPress={() => setIsPlaying(!isPlaying)} style={styles.videoPlayer}>
                  <Video
                    source={{uri: getVideoUri()}}
                    style={styles.video}
                    resizeMode="contain"
                    paused={!isPlaying}
                    controls={false}
                  />
                  {!isPlaying && (
                    <View style={styles.playOverlay}>
                      <Icon name="play-circle" size={60} color="rgba(255,255,255,0.9)" />
                    </View>
                  )}
                </TouchableOpacity>
                <Text style={styles.videoHint}>Tap to {isPlaying ? 'pause' : 'play'}</Text>
              </>
            ) : (
              <View style={styles.noVideo}>
                <Icon name="videocam-outline" size={48} color="#D1D5DB" />
                <Text style={styles.noVideoText}>No video recording available</Text>
                <Text style={styles.noVideoSubtext}>The recording may still be processing</Text>
              </View>
            )}
          </View>
        )}

        {activeTab === 'notes' && (
          <View style={styles.notesSection}>
            {/* Teacher notes */}
            {recording.teacherNotes ? (
              <View style={styles.teacherNotesCard}>
                <View style={styles.notesHeader}>
                  <Icon name="school-outline" size={16} color="#8B5CF6" />
                  <Text style={styles.notesHeaderText}>Teacher's Notes</Text>
                </View>
                <Text style={styles.teacherNotesText}>{recording.teacherNotes}</Text>
              </View>
            ) : null}

            {/* Personal notes */}
            <View style={styles.personalNotesCard}>
              <View style={styles.notesHeader}>
                <Icon name="create-outline" size={16} color="#10A7DA" />
                <Text style={styles.notesHeaderText}>My Notes</Text>
              </View>
              <TextInput
                style={styles.notesInput}
                value={notes}
                onChangeText={setNotes}
                placeholder="Write your personal notes here..."
                placeholderTextColor="#9CA3AF"
                multiline
                textAlignVertical="top"
              />
              <TouchableOpacity
                style={[styles.saveNotesBtn, savingNotes && {opacity: 0.6}]}
                onPress={handleSaveNotes}
                disabled={savingNotes}
              >
                <Text style={styles.saveNotesText}>{savingNotes ? 'Saving...' : 'Save Notes'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {activeTab === 'materials' && (
          <View style={styles.materialsSection}>
            {recording.materials?.length > 0 ? (
              recording.materials.map((mat, i) => (
                <TouchableOpacity
                  key={i}
                  style={styles.materialCard}
                  onPress={() => {
                    const url = mat.url.startsWith('http') ? mat.url : `${API_HOST}${mat.url}`;
                    Linking.openURL(url).catch(() => Alert.alert('Error', 'Could not open file'));
                  }}
                >
                  <View style={styles.materialIcon}>
                    <Icon
                      name={mat.type === 'pdf' ? 'document-outline' : mat.type === 'image' ? 'image-outline' : 'link-outline'}
                      size={22} color="#10A7DA"
                    />
                  </View>
                  <View style={styles.materialInfo}>
                    <Text style={styles.materialTitle}>{mat.title}</Text>
                    <Text style={styles.materialType}>{mat.type?.toUpperCase()}</Text>
                  </View>
                  <Icon name="download-outline" size={20} color="#10A7DA" />
                </TouchableOpacity>
              ))
            ) : (
              <View style={styles.noVideo}>
                <Icon name="attach-outline" size={48} color="#D1D5DB" />
                <Text style={styles.noVideoText}>No materials shared</Text>
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#F9FAFB'},
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: '#F9FAFB', paddingVertical: 16, paddingHorizontal: 16,
    borderBottomWidth: 1, borderBottomColor: '#E5E7EB',
  },
  backButton: {padding: 8},
  placeholderRight: {width: 40, height: 40},
  headerTitle: {fontWeight: '600', fontSize: 18, color: '#1F2937', flex: 1, textAlign: 'center'},
  scrollView: {flex: 1},
  infoCard: {backgroundColor: '#fff', margin: 16, borderRadius: 16, padding: 16},
  infoTitle: {fontSize: 20, fontWeight: '700', color: '#1F2937', marginBottom: 4},
  infoTeacher: {fontSize: 14, color: '#6B7280', marginBottom: 12},
  infoRow: {flexDirection: 'row', gap: 16},
  infoItem: {flexDirection: 'row', alignItems: 'center', gap: 4},
  infoText: {fontSize: 13, color: '#6B7280'},
  tabBar: {
    flexDirection: 'row', marginHorizontal: 16,
    backgroundColor: '#fff', borderRadius: 12, padding: 3,
  },
  tab: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, paddingVertical: 10, borderRadius: 10,
  },
  tabActive: {backgroundColor: '#EBF5FF'},
  tabText: {fontSize: 13, fontWeight: '500', color: '#9CA3AF'},
  tabTextActive: {color: '#10A7DA'},
  videoContainer: {margin: 16, alignItems: 'center'},
  videoPlayer: {
    width: '100%', aspectRatio: 16/9, borderRadius: 12,
    backgroundColor: '#000', overflow: 'hidden',
  },
  video: {width: '100%', height: '100%'},
  playOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center', alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  videoHint: {fontSize: 12, color: '#9CA3AF', marginTop: 8},
  noVideo: {padding: 40, alignItems: 'center'},
  noVideoText: {fontSize: 16, color: '#9CA3AF', marginTop: 12, fontWeight: '500'},
  noVideoSubtext: {fontSize: 13, color: '#D1D5DB', marginTop: 4},
  notesSection: {margin: 16, gap: 16},
  teacherNotesCard: {backgroundColor: '#F5F3FF', borderRadius: 14, padding: 16},
  notesHeader: {flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8},
  notesHeaderText: {fontSize: 14, fontWeight: '600', color: '#1F2937'},
  teacherNotesText: {fontSize: 14, color: '#4B5563', lineHeight: 22},
  personalNotesCard: {backgroundColor: '#fff', borderRadius: 14, padding: 16},
  notesInput: {
    backgroundColor: '#F9FAFB', borderRadius: 10, padding: 12,
    fontSize: 14, color: '#1F2937', minHeight: 120, marginBottom: 12,
    borderWidth: 1, borderColor: '#E5E7EB',
  },
  saveNotesBtn: {
    backgroundColor: '#10A7DA', borderRadius: 10,
    paddingVertical: 12, alignItems: 'center',
  },
  saveNotesText: {color: '#fff', fontSize: 14, fontWeight: '600'},
  materialsSection: {margin: 16, gap: 8},
  materialCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#fff', borderRadius: 14, padding: 14,
    gap: 12,
  },
  materialIcon: {
    width: 44, height: 44, borderRadius: 12,
    backgroundColor: '#EBF5FF', justifyContent: 'center', alignItems: 'center',
  },
  materialInfo: {flex: 1},
  materialTitle: {fontSize: 14, fontWeight: '600', color: '#1F2937'},
  materialType: {fontSize: 11, color: '#9CA3AF', marginTop: 2},
});

export default RecordingDetailScreen;
