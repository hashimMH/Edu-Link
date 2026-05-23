import React, {useState, useCallback} from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  Image, ActivityIndicator, Platform, Alert,
} from 'react-native';
import {SafeAreaView, useSafeAreaInsets} from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import {useNavigation, useFocusEffect} from '@react-navigation/native';
import {StackNavigationProp} from '@react-navigation/stack';
import {RootStackParamList} from '../../../models/types';
import {api} from '../../../services/api';

const API_HOST = Platform.OS === 'android' ? 'http://10.0.2.2:3000' : 'http://localhost:3000';

function getImageSource(avatarUrl: string | null | undefined) {
  if (!avatarUrl) return require('../../../../assets/karim.png');
  if (avatarUrl.startsWith('http')) return { uri: avatarUrl };
  return { uri: `${API_HOST}${avatarUrl}` };
}

const SavedTutorsScreen = () => {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const insets = useSafeAreaInsets();
  const [saved, setSaved] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      api.getSavedTutors()
        .then(setSaved)
        .catch(() => {})
        .finally(() => setLoading(false));
    }, [])
  );

  const handleRemove = (tutorId: string, name: string) => {
    Alert.alert('Remove', `Remove ${name} from saved?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          try {
            await api.unsaveTutor(tutorId);
            setSaved(prev => prev.filter(s => s.tutor.id !== tutorId));
          } catch (err: any) {
            Alert.alert('Error', err.message);
          }
        },
      },
    ]);
  };

  const renderItem = ({item}: {item: any}) => {
    const t = item.tutor;
    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => navigation.navigate('TutorInfoScreen', { tutor: t })}
      >
        <Image source={getImageSource(t.avatarUrl)} style={styles.avatar} />
        <View style={styles.info}>
          <Text style={styles.name}>{t.name}</Text>
          <Text style={styles.accent}>{t.accent}</Text>
          <View style={styles.interests}>
            {t.interests?.slice(0, 3).map((i: string) => (
              <View key={i} style={styles.chip}>
                <Text style={styles.chipText}>{i}</Text>
              </View>
            ))}
          </View>
        </View>
        <View style={styles.actions}>
          <View style={styles.rating}>
            <Icon name="star" size={14} color="#FFB800" />
            <Text style={styles.ratingText}>{t.rating}</Text>
          </View>
          <TouchableOpacity
            style={styles.removeBtn}
            onPress={() => handleRemove(t.id, t.name)}
          >
            <Icon name="bookmark" size={22} color="#10A7DA" />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['right', 'left', 'bottom']}>
      <View style={[styles.header, {paddingTop: Platform.OS === 'ios' ? Math.max(insets.top, 10) : 0}]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Icon name="chevron-back" size={24} color="#1F2A37" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Saved Tutors</Text>
        <View style={{width: 40}} />
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#10A7DA" style={{marginTop: 40}} />
      ) : saved.length === 0 ? (
        <View style={styles.empty}>
          <Icon name="bookmark-outline" size={64} color="#D1D5DB" />
          <Text style={styles.emptyTitle}>No saved tutors</Text>
          <Text style={styles.emptySub}>Browse tutors and save them for later</Text>
        </View>
      ) : (
        <FlatList
          data={saved}
          renderItem={renderItem}
          keyExtractor={item => item.savedId}
          contentContainerStyle={styles.list}
          ItemSeparatorComponent={() => <View style={{height: 8}} />}
        />
      )}
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
  headerTitle: {fontWeight: '600', fontSize: 18, color: '#1F2937'},
  list: {padding: 16},
  card: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#fff', borderRadius: 16, padding: 12,
    shadowColor: '#000', shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
  },
  avatar: {width: 60, height: 60, borderRadius: 14, marginRight: 12},
  info: {flex: 1},
  name: {fontSize: 15, fontWeight: '600', color: '#1F2937', marginBottom: 2},
  accent: {fontSize: 12, color: '#6B7280', marginBottom: 6},
  interests: {flexDirection: 'row', gap: 4},
  chip: {
    backgroundColor: '#EBF5FF', paddingHorizontal: 8, paddingVertical: 2,
    borderRadius: 8,
  },
  chipText: {fontSize: 10, color: '#10A7DA'},
  actions: {alignItems: 'flex-end', gap: 8},
  rating: {flexDirection: 'row', alignItems: 'center', gap: 3},
  ratingText: {fontSize: 13, fontWeight: '600', color: '#1F2937'},
  removeBtn: {padding: 4},
  empty: {flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40},
  emptyTitle: {fontSize: 18, fontWeight: '600', color: '#9CA3AF', marginTop: 16},
  emptySub: {fontSize: 14, color: '#D1D5DB', marginTop: 4},
});

export default SavedTutorsScreen;
