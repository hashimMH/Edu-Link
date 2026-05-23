import React, {useState, useEffect} from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform, Alert,
} from 'react-native';
import {SafeAreaView, useSafeAreaInsets} from 'react-native-safe-area-context';
import Video from 'react-native-video';
import Icon from 'react-native-vector-icons/Ionicons';
import {RouteProp} from '@react-navigation/native';
import {StackNavigationProp} from '@react-navigation/stack';
import {RootStackParamList} from '../../../models/types';
import {api} from '../../../services/api';

type Props = {
  route: RouteProp<RootStackParamList, 'TutorInfoScreen'>;
  navigation: StackNavigationProp<RootStackParamList>;
};

const TutorInfoScreen: React.FC<Props> = ({route, navigation}) => {
  const {tutor} = route.params;
  const [isPlaying, setIsPlaying] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.checkTutorSaved(tutor.id)
      .then(r => setIsSaved(r.saved))
      .catch(() => {});
  }, [tutor.id]);

  const handleChatPress = async () => {
    try {
      let tutorUserId = (tutor as any).userId;
      
      // If userId is not in the cached tutor data, fetch it from the API
      if (!tutorUserId) {
        const full = await api.getTutorById(tutor.id);
        tutorUserId = (full as any).userId;
      }
      
      const msg = await api.sendMessage(tutorUserId, '👋 Hi!');
      navigation.navigate('ChatScreen', {
        userId: tutorUserId,
        name: tutor.name,
        chatId: (msg as any).chatId || 'new',
      });
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Could not start chat');
    }
  };

  const handleToggleSave = async () => {
    if (saving) return;
    setSaving(true);
    try {
      if (isSaved) {
        await api.unsaveTutor(tutor.id);
        setIsSaved(false);
      } else {
        await api.saveTutor(tutor.id);
        setIsSaved(true);
      }
    } catch (err: any) {
      Alert.alert('Error', err.message);
    } finally {
      setSaving(false);
    }
  };

  const insets = useSafeAreaInsets();

  const getVideoUri = () => {
    const rawUrl = (tutor as any).videoUrl || (tutor as any).introVideoUrl || tutor.video || '';
    if (!rawUrl) return '';
    // If it's already a full URL (http/https), use as-is
    if (rawUrl.startsWith('http://') || rawUrl.startsWith('https://')) return rawUrl;
    // Prepend API host for relative paths like /uploads/videos/...
    const API_HOST = Platform.OS === 'android' ? 'http://10.0.2.2:3000' : 'http://localhost:3000';
    return `${API_HOST}${rawUrl}`;
  };

  const togglePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  return (
    <SafeAreaView style={styles.container} edges={['right', 'left', 'bottom']}>
      <View style={[styles.header, {paddingTop: Platform.OS === 'ios' ? insets.top > 0 ? insets.top : 10 : 0}]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Icon name="chevron-back" size={24} color="#1F2A37" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{tutor.name}</Text>
        <View style={{flexDirection: 'row', gap: 8}}>
          <TouchableOpacity onPress={handleToggleSave} style={styles.messageButton}>
            <Icon name={isSaved ? 'bookmark' : 'bookmark-outline'} size={24} color="#10A7DA" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.messageButton} onPress={handleChatPress}>
            <Icon name="chatbubble-ellipses" size={24} color="#10A7DA" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.scrollContent}
        contentContainerStyle={{paddingTop: Platform.OS === 'ios' ? insets.top > 0 ? 10 : 0 : 0}}>
        <TouchableOpacity onPress={togglePlayPause} style={styles.videoContainer}>
          <Video
            source={{uri: getVideoUri() || undefined}}
            style={styles.tutorImage}
            resizeMode="cover"
            repeat
            paused={!isPlaying}
            muted={false}
          />
          {!isPlaying && (
            <View style={styles.playIconOverlay}>
              <Icon name="play-circle" size={60} color="rgba(0, 0, 0, 0.3)" />
            </View>
          )}
        </TouchableOpacity>

        <View style={styles.infoSection}>
          <Text style={styles.sectionTitle}>Description</Text>
          <Text style={styles.description}>
            {tutor.description || 'No description available.'}
          </Text>
        </View>

        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <View style={[styles.statIconContainer, {backgroundColor: 'rgba(122, 206, 250, 0.5)'}]}>
              <Icon name="thumbs-up" size={24} color="#10A7DA" />
            </View>
            <Text style={styles.statValue}>{Math.round((tutor.rating / 5) * 100)}%</Text>
            <Text style={styles.statLabel}>positive</Text>
          </View>
          <View style={styles.statItem}>
            <View style={[styles.statIconContainer, {backgroundColor: 'rgba(253, 241, 243, 0.5)'}]}>
              <Icon name="trophy" size={24} color="#FF4D67" />
            </View>
            <Text style={styles.statValue}>{(tutor as any).experienceYears || 0} Yrs</Text>
            <Text style={styles.statLabel}>Experience</Text>
          </View>
          <View style={styles.statItem}>
            <View style={[styles.statIconContainer, {backgroundColor: 'rgba(254, 246, 236, 0.5)'}]}>
              <Icon name="star" size={24} color="#FFB800" />
            </View>
            <Text style={styles.statValue}>{tutor.rating}</Text>
            <Text style={styles.statLabel}>Ratings</Text>
          </View>
        </View>
      </ScrollView>

      <View style={[styles.bottomContainer, {marginBottom: Platform.OS === 'ios' ? insets.bottom > 0 ? insets.bottom : 10 : 10}]}>
        <TouchableOpacity
          style={styles.bookButton}
          onPress={() => navigation.navigate('AppointmentScreen', {tutor})}>
          <Text style={styles.bookButtonText}>Schedule</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#F9FAFB'},
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#fff',
    borderBottomWidth: 1, borderBottomColor: '#E5E7EB',
  },
  backButton: {padding: 8},
  headerTitle: {fontSize: 18, fontWeight: '600', color: '#1F2A37'},
  messageButton: {padding: 8},
  scrollContent: {flex: 1},
  tutorImage: {width: '100%', height: 250, resizeMode: 'cover'},
  infoSection: {
    borderTopLeftRadius: 20, borderTopRightRadius: 20,
    backgroundColor: '#F9FAFB', marginTop: -40, padding: 16,
  },
  sectionTitle: {fontSize: 18, fontWeight: '600', color: '#1F2A37', marginBottom: 8},
  description: {fontSize: 14, color: '#4B5563', lineHeight: 20},
  statsContainer: {
    flexDirection: 'row', justifyContent: 'space-between',
    marginTop: 24, paddingHorizontal: 20,
  },
  statItem: {
    backgroundColor: '#fff', paddingHorizontal: 16, paddingBottom: 16,
    borderRadius: 12, alignItems: 'center',
  },
  statIconContainer: {
    width: 48, height: 60, borderBottomLeftRadius: 12, borderBottomRightRadius: 12,
    alignItems: 'center', justifyContent: 'flex-end', paddingBottom: 8, marginBottom: 8,
  },
  statValue: {fontSize: 16, fontWeight: '600', color: '#1F2A37', marginBottom: 4},
  statLabel: {fontSize: 12, color: '#6B7280'},
  bottomContainer: {marginHorizontal: 16, marginTop: 24, paddingBottom: 10},
  bookButton: {
    backgroundColor: '#10A7DA', padding: 16, borderRadius: 12, alignItems: 'center',
  },
  bookButtonText: {color: '#fff', fontSize: 16, fontWeight: '600'},
  videoContainer: {position: 'relative', width: '100%', height: 250},
  playIconOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.3)',
  },
});

export default TutorInfoScreen;
