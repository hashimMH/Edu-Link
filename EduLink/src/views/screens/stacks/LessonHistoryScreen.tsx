import React, { useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import FontAwesome6 from 'react-native-vector-icons/FontAwesome6';
import { useNavigation } from '@react-navigation/native';
import { api, LessonItem } from '../../../services/api';


const LessonHistoryScreen = () => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const [lessonsData, setLessonsData] = useState<LessonItem[]>([]);
  const [sortNewest, setSortNewest] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadLessonHistory = async () => {
      try {
        const lessons = await api.getLessonHistory();
        setLessonsData(lessons);
      } catch (error) {
        console.error('Failed to load lesson history:', error);
      } finally {
        setLoading(false);
      }
    };

    loadLessonHistory();
  }, []);

  // Sort lessons based on creation time using built-in methods
  const sortedLessons = useMemo(() => {
    return [...lessonsData].sort((a, b) => 
      sortNewest 
        ? b.createdAt.localeCompare(a.createdAt)
        : a.createdAt.localeCompare(b.createdAt)
    );
  }, [lessonsData, sortNewest]);

  const toggleSort = () => {
    setSortNewest(!sortNewest);
  };

  const renderEmptyState = () => (
    <View style={styles.emptyStateContainer}>
      <Image
        source={require('../../../../assets/novideo.png')}
        style={styles.emptyStateImage}
      />
    </View>
  );

  const renderLessonItem = (item: LessonItem) => (
    <View key={item.id} style={styles.lessonItem}>
      <View style={styles.playButtonContainer}>
        <Icon name="play" size={24} color="#fff" />
      </View>
      <View style={styles.lessonContent}>
        <Text style={styles.lessonTitle}>{item.title}</Text>
        <View style={styles.durationContainer}>
          <Icon name="checkmark-circle" size={16} color="#10A7DA" />
          <Text style={styles.durationText}>{item.duration}</Text>
        </View>
        <Text style={styles.lessonDescription}>{item.description}</Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['right', 'left', 'bottom']}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: Platform.OS === 'ios' ? insets.top > 0 ? insets.top : 10 : 0 }]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Icon name="chevron-back" size={24} color="#1F2A37" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Lesson History</Text>
        <View style={styles.placeholderRight} />
      </View>

      {loading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color="#10A7DA" />
        </View>
      ) : sortedLessons.length > 0 ? (
        <ScrollView style={styles.scrollView}>
          <TouchableOpacity style={styles.sortContainer} onPress={toggleSort}>
            <FontAwesome6 
              name={"arrow-right-arrow-left"} 
              style={{transform: [{rotate: '90deg'}]}}
              size={15} 
              color="#fff" 
            />
            <Text style={styles.sortText}>{sortNewest ? 'newest' : 'oldest'}</Text>
          </TouchableOpacity>
          {sortedLessons.map(renderLessonItem)}
        </ScrollView>
      ) : (
        renderEmptyState()
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingTop:40
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
  scrollView: {
    flex: 1,
  },
  sortContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#10A7DA',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    margin: 16,
  },
  sortText: {
    color: '#fff',
    marginLeft: 10,
    fontSize: 14,
    fontWeight: '500',
  },
  emptyStateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyStateImage: {
    width: 200,
    height: 200,
    resizeMode: 'contain',
    marginBottom: 16,
  },
  emptyStateText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
  },
  lessonItem: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    marginHorizontal: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  playButtonContainer: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: '#10A7DA',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  lessonContent: {
    flex: 1,
  },
  lessonTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  durationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  durationText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 4,
  },
  lessonDescription: {
    fontSize: 14,
    color: '#999',
    lineHeight: 20,
  },
});

export default LessonHistoryScreen;
