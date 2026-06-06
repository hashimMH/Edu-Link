import React, {useState, useEffect} from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, Platform,
} from 'react-native';
import {SafeAreaView, useSafeAreaInsets} from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import {useNavigation, useRoute, RouteProp} from '@react-navigation/native';
import {RootStackParamList} from '../../../models/types';
import {api} from '../../../services/api';

const LegalScreen = () => {
  const navigation = useNavigation();
  const route = useRoute<RouteProp<RootStackParamList, 'LegalScreen'>>();
  const {pageKey} = route.params;
  const insets = useSafeAreaInsets();

  const [page, setPage] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getLegalPage(pageKey)
      .then(setPage)
      .catch(err => console.log('Legal page:', err))
      .finally(() => setLoading(false));
  }, [pageKey]);

  return (
    <SafeAreaView style={styles.container} edges={['right', 'left', 'bottom']}>
      <View style={[styles.header, {paddingTop: Platform.OS === 'ios' ? Math.max(insets.top, 10) : 0}]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Icon name="chevron-back" size={24} color="#1F2A37" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{page?.title || (pageKey === 'privacy' ? 'Privacy Policy' : 'Terms & Conditions')}</Text>
        <View style={{width: 40}} />
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#10A7DA" style={{marginTop: 40}} />
      ) : (
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
          {page?.content ? (
            <View>
              {page.content.split('\n').map((line: string, i: number) => {
                if (line.startsWith('# ')) {
                  return <Text key={i} style={styles.h1}>{line.replace('# ', '')}</Text>;
                }
                if (line.startsWith('## ')) {
                  return <Text key={i} style={styles.h2}>{line.replace('## ', '')}</Text>;
                }
                if (line.startsWith('- ')) {
                  return <Text key={i} style={styles.listItem}>  • {line.replace('- ', '')}</Text>;
                }
                if (line.trim() === '') {
                  return <View key={i} style={{height: 8}} />;
                }
                if (line.startsWith('**') && line.endsWith('**')) {
                  return <Text key={i} style={styles.bold}>{line.replace(/\*\*/g, '')}</Text>;
                }
                return <Text key={i} style={styles.paragraph}>{line}</Text>;
              })}
              {page.updated_at && (
                <Text style={styles.updated}>Last updated: {new Date(page.updated_at).toLocaleDateString()}</Text>
              )}
            </View>
          ) : (
            <Text style={styles.paragraph}>Content not available.</Text>
          )}
        </ScrollView>
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
  scrollView: {flex: 1},
  content: {padding: 20, paddingBottom: 40},
  h1: {fontSize: 22, fontWeight: '700', color: '#1F2937', marginTop: 16, marginBottom: 8},
  h2: {fontSize: 17, fontWeight: '600', color: '#374151', marginTop: 20, marginBottom: 6},
  paragraph: {fontSize: 15, color: '#4B5563', lineHeight: 24},
  listItem: {fontSize: 15, color: '#4B5563', lineHeight: 24},
  bold: {fontSize: 14, fontWeight: '600', color: '#374151', marginTop: 12},
  updated: {fontSize: 12, color: '#9CA3AF', marginTop: 24, fontStyle: 'italic'},
});

export default LegalScreen;
