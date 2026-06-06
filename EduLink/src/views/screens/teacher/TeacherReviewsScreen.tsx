import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import Background from '../components/Background';
import {api, ReviewItem} from '../../../services/api';

const ReviewRow = ({review}: {review: ReviewItem}) => (
  <TouchableOpacity style={styles.reviewItem}>
    <View style={styles.ratingBox}>
      <Icon name="star" size={16} color="#FFC960" />
      <Text style={styles.ratingText}>{review.rating}</Text>
    </View>
    <View style={styles.reviewContent}>
      <Text style={styles.studentName}>
        {review.studentName || review.student_name || 'Unknown'}
      </Text>
      <Text style={styles.dateTime}>{review.date}</Text>
      <Text style={styles.dateTime}>{review.time}</Text>
      {review.comment ? <Text style={styles.commentText} numberOfLines={2}>{review.comment}</Text> : null}
    </View>
  </TouchableOpacity>
);

const TeacherReviewsScreen = ({navigation}: any) => {
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await api.getMyReviews();
        setReviews(data);
      } catch (err) {
        console.error('Failed to load reviews:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <Background>
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}>
            <Icon name="chevron-back" size={24} color="#000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Reviews</Text>
          <View style={styles.placeholder} />
        </View>
        {loading ? (
          <ActivityIndicator size="large" color="#10A8DA" style={{marginTop: 40}} />
        ) : (
          <FlatList
            data={reviews}
            renderItem={({item}) => <ReviewRow review={item} />}
            keyExtractor={item => item.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={
              <Text style={styles.empty}>No reviews yet</Text>
            }
          />
        )}
      </SafeAreaView>
    </Background>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    backgroundColor: '#F2F4F7',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F1F39',
    fontFamily: 'SF-Pro-Display-Semibold',
  },
  placeholder: {
    width: 40,
  },
  listContent: {
    padding: 16,
  },
  reviewItem: {
    flexDirection: 'row',
    marginBottom: 16,
    alignItems: 'flex-start',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  ratingBox: {
    backgroundColor: '#10A8DA',
    borderRadius: 15,
    padding: 8,
    marginRight: 12,
    alignItems: 'center',
    gap: 4,
    minWidth: 60,
  },
  ratingText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'SF-Pro-Display-Semibold',
  },
  reviewContent: {
    flex: 1,
  },
  studentName: {
    fontSize: 16,
    color: '#1F1F39',
    fontWeight: '600',
    fontFamily: 'SF-Pro-Display-Semibold',
    marginBottom: 4,
  },
  dateTime: {
    fontSize: 14,
    color: '#6E7191',
    fontFamily: 'SF-Pro-Display-Regular',
  },
  commentText: {
    fontSize: 14,
    color: '#4A5568',
    fontFamily: 'SF-Pro-Display-Regular',
    marginTop: 6,
    lineHeight: 20,
  },
  empty: {
    textAlign: 'center',
    color: '#999',
    marginTop: 40,
    fontSize: 16,
  },
});

export default TeacherReviewsScreen;
