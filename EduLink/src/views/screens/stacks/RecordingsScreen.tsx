import React, {useState, useCallback} from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator, Platform,
} from 'react-native';
import {SafeAreaView, useSafeAreaInsets} from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import {useNavigation, useFocusEffect} from '@react-navigation/native';
import {StackNavigationProp} from '@react-navigation/stack';
import {RootStackParamList} from '../../../models/types';
import {api} from '../../../services/api';

interface RecordingItem {
  id: string;
  classId: string;
  title: string;
  date: string;
  duration: string;
  teacherName: string;
  hasNotes: boolean;
  hasMaterials: boolean;
  createdAt: string;
}

const RecordingsScreen = () => {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const insets = useSafeAreaInsets();
  const [recordings, setRecordings] = useState<RecordingItem[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      api.getRecordings()
        .then(setRecordings)
        .catch(err => console.log('Recordings:', err))
        .finally(() => setLoading(false));
    }, [])
  );

  const renderRecording = ({item}: {item: RecordingItem}) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => navigation.navigate('RecordingDetailScreen', {recordingId: item.id})}
    >
      <View style={styles.cardIcon}>
        <Icon name="play-circle" size={32} color="#10A7DA" />
      </View>
      <View style={styles.cardContent}>
        <Text style={styles.cardTitle} numberOfLines={1}>{item.title}</Text>
        <Text style={styles.cardSubtitle}>{item.teacherName}</Text>
        <View style={styles.cardMeta}>
          <View style={styles.metaItem}>
            <Icon name="calendar-outline" size={12} color="#9CA3AF" />
            <Text style={styles.metaText}>{item.date}</Text>
          </View>
          {item.duration && (
            <View style={styles.metaItem}>
              <Icon name="time-outline" size={12} color="#9CA3AF" />
              <Text style={styles.metaText}>{item.duration}</Text>
            </View>
          )}
        </View>
        <View style={styles.cardTags}>
          {item.hasNotes && (
            <View style={styles.tag}>
              <Icon name="document-text-outline" size={10} color="#10A7DA" />
              <Text style={styles.tagText}>Notes</Text>
            </View>
          )}
          {item.hasMaterials && (
            <View style={styles.tag}>
              <Icon name="attach-outline" size={10} color="#10A7DA" />
              <Text style={styles.tagText}>Materials</Text>
            </View>
          )}
        </View>
      </View>
      <Icon name="chevron-forward" size={20} color="#9CA3AF" />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} edges={['right', 'left', 'bottom']}>
      <View style={[styles.header, {paddingTop: Platform.OS === 'ios' ? insets.top > 0 ? insets.top : 10 : 0}]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Icon name="chevron-back" size={24} color="#1F2A37" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Recordings</Text>
        <View style={styles.placeholderRight} />
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#10A7DA" style={{marginTop: 40}} />
      ) : recordings.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Icon name="videocam-outline" size={64} color="#D1D5DB" />
          <Text style={styles.emptyTitle}>No recordings yet</Text>
          <Text style={styles.emptySubtitle}>Your recorded classes will appear here</Text>
        </View>
      ) : (
        <FlatList
          data={recordings}
          renderItem={renderRecording}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={() => <View style={{height: 8}} />}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#F9FAFB', paddingTop:40},
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: '#F9FAFB', paddingVertical: 16, paddingHorizontal: 16,
    borderBottomWidth: 1, borderBottomColor: '#E5E7EB',
  },
  backButton: {padding: 8},
  placeholderRight: {width: 40, height: 40},
  headerTitle: {fontWeight: '600', fontSize: 18, color: '#1F2937'},
  listContent: {padding: 16},
  card: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#fff', borderRadius: 16, padding: 14,
    shadowColor: '#000', shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
  },
  cardIcon: {
    width: 52, height: 52, borderRadius: 14,
    backgroundColor: '#EBF5FF', justifyContent: 'center', alignItems: 'center',
    marginRight: 12,
  },
  cardContent: {flex: 1},
  cardTitle: {fontSize: 15, fontWeight: '600', color: '#1F2937', marginBottom: 2},
  cardSubtitle: {fontSize: 12, color: '#6B7280', marginBottom: 4},
  cardMeta: {flexDirection: 'row', gap: 12, marginBottom: 4},
  metaItem: {flexDirection: 'row', alignItems: 'center', gap: 3},
  metaText: {fontSize: 11, color: '#9CA3AF'},
  cardTags: {flexDirection: 'row', gap: 6},
  tag: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    backgroundColor: '#EBF5FF', paddingHorizontal: 6, paddingVertical: 2,
    borderRadius: 4,
  },
  tagText: {fontSize: 10, color: '#10A7DA', fontWeight: '500'},
  emptyContainer: {flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40},
  emptyTitle: {fontSize: 18, fontWeight: '600', color: '#9CA3AF', marginTop: 16},
  emptySubtitle: {fontSize: 14, color: '#D1D5DB', marginTop: 4, textAlign: 'center'},
});

export default RecordingsScreen;
