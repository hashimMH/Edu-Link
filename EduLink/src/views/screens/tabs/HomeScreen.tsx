import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, Image, FlatList, ScrollView, TouchableOpacity, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Progress from 'react-native-progress';
import ProgressBar from '../components/ProgressBar';
import Background from '../components/Background';
import HomeUperView from '../components/HomeUperView';
import { TutorCard } from '../components/TutorCourses';
import Icon from 'react-native-vector-icons/Ionicons';
import { CompositeNavigationProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { RootStackParamList, TabParamList } from '../../../models/types';
import { api, SubscriptionItem, Tutor } from '../../../services/api';
import { useDispatch } from 'react-redux';
import { storeTutors } from '../../../store/tutorSlice';
import { storage } from '../../../services/storage';
import { connectSocket, getSocket } from '../../../services/socket';

const SubscriptionCard: React.FC<{ item: SubscriptionItem }> = ({ item }) => (
  <View style={styles.subscriptionCard}>
    <View style={styles.subscriptionHeader}>
      <Text style={styles.subscriptionTitle}>{item.title}</Text>
      <View style={styles.priceContainer}>
        <Text style={styles.dollarSign}>$</Text>
        <Text style={styles.subscriptionPrice}>{item.price}</Text>
      </View>
    </View>
    <View style={styles.subscriptionDetails}>
      <Text style={styles.subscriptionText}>{item.lessons} Lesson</Text>
      <Text style={styles.subscriptionText}> <Text style={styles.subscriptionDot}>• </Text>{item.duration}</Text>
    </View>
  </View>
);

type HomeScreenNavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<TabParamList, 'Home'>,
  StackNavigationProp<RootStackParamList>
>;

const HomeScreen = ({ navigation }: { navigation: HomeScreenNavigationProp }) => {
  const dispatch = useDispatch();
  const [subscriptions, setSubscriptions] = useState<SubscriptionItem[]>([]);
  const [subscriptionsEnabled, setSubscriptionsEnabled] = useState(true);
  const [tutors, setTutors] = useState<Tutor[]>([]);
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState<number>(0);
  const [todayMinutes, setTodayMinutes] = useState<number>(0);
  const [totalMinutes, setTotalMinutes] = useState<number>(60);
  const [daysLeft, setDaysLeft] = useState<number>(0);
  const [userName, setUserName] = useState('');
  const [unreadCount, setUnreadCount] = useState(0);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [subscriptionsData, tutorsData, statusData] = await Promise.all([
          api.getSubscriptions(),
          api.getTutors(),
          api.getSubscriptionStatus().catch(() => ({ enabled: true })),
        ]);
        setSubscriptions(subscriptionsData);
        setSubscriptionsEnabled(statusData.enabled);
        setTutors(tutorsData);
        dispatch(storeTutors(tutorsData));

        // Fetch real learning stats
        try {
          const [lessons, mySubs] = await Promise.all([
            api.getLessonHistory(),
            api.getMySubscriptions().catch(() => []),
          ]);
          // Compute today's minutes from lessons
          const now = new Date();
          const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
          const todayLessons = lessons.filter((l: any) => l.createdAt >= todayStart);
          let mins = 0;
          todayLessons.forEach((l: any) => {
            const match = (l.duration || '').match(/(\d+)/);
            if (match) mins += parseInt(match[1], 10);
          });
          setTodayMinutes(mins);

          // Total from subscription
          const active = (mySubs as any[]).filter((s: any) => s.status === 'active');
          if (active.length > 0) {
            setTotalMinutes(active[0].lessons * 60 || 60);
            // Days left from expires_at
            if (active[0].expires_at) {
              const exp = new Date(active[0].expires_at);
              const diff = Math.ceil((exp.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
              setDaysLeft(Math.max(0, diff));
            }
          }

          // Progress
          const completed = lessons.length;
          const total = active.length > 0 ? active[0].lessons : 12;
          setProgress(Math.min(1, completed / Math.max(total, 1)));
        } catch (_) {}
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    // Load user name from storage
    storage.getUser().then(u => {
      if (u) setUserName(u.firstName);
      else api.getProfile().then(p => setUserName(p.firstName)).catch(() => {});
    });

    // Connect socket and listen for notifications
    connectSocket().then(socket => {
      socket.on('new_notification', () => {
        setUnreadCount(prev => prev + 1);
      });
    }).catch(() => {});
  }, [dispatch]);

  if (loading) {
    return <View />;
  }

  return (
    <Background>
      <View style={[styles.header, { top: Platform.OS === 'ios' ? insets.top > 0 ? insets.top + 10 : 40 : 40 }]}>
        <TouchableOpacity style={styles.notificationButton} onPress={() => {
          setUnreadCount(0);
          navigation.navigate('NotificationScreen');
        }}>
          <Icon name="notifications-outline" size={24} color="#fff" />
          {unreadCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>
      <HomeUperView>
        <View style={[styles.title, { top: Platform.OS === 'ios' ? insets.top > 0 ? 55 : 40 : 40 }]}>
          <View style={{ flex: 1, left: 20 }}>
            <Text style={styles.mainText}>Hello,</Text>
            <Text style={styles.mainText}>{userName || 'Student'} 👋</Text>
          </View>
        </View>
      </HomeUperView>
      <ScrollView>
        <View style={[{ paddingTop: '20%' }]}>
          {subscriptionsEnabled && subscriptions.length > 0 && (
          <>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>subscriptions</Text>
            <TouchableOpacity>
              <Text style={styles.seeAll}>See All</Text>
            </TouchableOpacity>
          </View>
          <FlatList
            data={subscriptions}
            renderItem={({ item }) => <SubscriptionCard item={item} />}
            keyExtractor={item => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.subscriptionContainer}
          />
          </>
          )}
          <View style={styles.section}>
            <View style={[styles.sectionHeader, { paddingHorizontal: 4 }]}>
              <Text style={styles.sectionTitle}>Courses by Tutors</Text>
              <TouchableOpacity style={styles.seeMoreButton} onPress={() => navigation.navigate('Tutors')}>
                <Text style={styles.seeMoreText}>See All</Text>
              </TouchableOpacity>
            </View>

            {tutors.slice(0, 3).map(tutor => (
              <TutorCard key={tutor.id} tutor={tutor} />
            ))}
          </View>
        </View>
      </ScrollView>
      <View style={[styles.learnedToday, { marginTop: Platform.OS === 'ios' ? insets.top > 0 ? '35%' : '32%' : '32%' }]}>
        <View style={styles.learnedTodayContent}>
          <View>
            <Text style={styles.learnedTodayText}>Learnd today</Text>
            <View style={styles.timeContainer}>
              <Text style={styles.timeText}>{todayMinutes}min </Text>
              <Text style={styles.timeTotal}>/ {totalMinutes}min</Text>
            </View>
          </View>
          <View style={{ marginLeft: '30%', }}>
            <Text style={styles.myCoursesText}>My courses</Text>
            <Text style={styles.learnedTodayText}>{daysLeft} Days Left</Text>
          </View>
        </View>
        <ProgressBar progress={progress} />
      </View>
    </Background>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    position: 'absolute',
    top: 40,
    right: 20,
    zIndex: 1,
  },
  notificationButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#FF3B30',
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },
  title: {
    flexDirection: 'row',
    width: '100%',
    height: 57,
    top: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mainText: {
    fontFamily: 'SF-Pro-Text-Medium',
    fontWeight: '600',
    fontSize: 32,
    lineHeight: 35,
    color: '#FFFFFF',
  },
  secondaryText: {
    fontFamily: 'Poppins',
    fontWeight: '400',
    fontSize: 14,
    lineHeight: 21,
    color: '#FFFFFF',
  },

  learnedToday: {
    position: 'absolute',
    width: 335,
    height: 96,
    alignSelf: 'center',
    marginTop: '32%',
    borderRadius: 15,
    backgroundColor: '#fff',
    shadowColor: '#171a1f',
    shadowOffset: { width: 0, height: 15 },
    shadowOpacity: 0.1,
    shadowRadius: 7,
    elevation: 2,
  },
  learnedTodayContent: {
    flexDirection: 'row',
    justifyContent: 'center',
    margin: 15,
  },
  learnedTodayText: {
    fontFamily: 'SF-Pro-Text-Medium',
    fontWeight: '400',
    fontSize: 12,
    lineHeight: 20,
    color: '#858597',
  },
  timeContainer: {
    flexDirection: 'row',
    marginTop: 10,
  },
  timeText: {
    fontFamily: 'SF-Pro-Text-Medium',
    fontWeight: '600',
    fontSize: 20,
    lineHeight: 20,
    color: '#1F1F39',
  },
  timeTotal: {
    fontFamily: 'SF-Pro-Text-Medium',
    fontWeight: '400',
    fontSize: 10,
    lineHeight: 20,
    color: '#1F1F39',
  },
  myCoursesText: {
    color: '#1686C0',
    marginBottom: 10,
  },
  section: {
    marginTop: 24,
    paddingHorizontal: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000',
    fontFamily: 'SF-Pro-Display-Semibold',
  },
  seeMoreButton: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  seeMoreText: {
    color: '#2B95E9',
    fontSize: 14,
    fontFamily: 'SF-Pro-Display-Regular',
  },
  seeAll: {
    fontSize: 14,
    color: '#007AFF',
  },
  subscriptionContainer: {
    paddingHorizontal: 15,
  },
  subscriptionCard: {
    width: 343,
    height: 140,
    backgroundColor: '#1997C1',
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 5,
  },
  subscriptionHeader: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
    paddingHorizontal: 5,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  dollarSign: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFF',
    marginTop: 4,
  },
  subscriptionTitle: {
    fontFamily: 'SF-Pro-Display-Bold',
    fontSize: 24,
    color: '#FFF',
  },
  subscriptionPrice: {
    fontFamily: 'SF-Pro-Display-Bold',
    fontSize: 32,
    color: '#FFF',
    marginLeft: 2,
  },
  subscriptionDetails: {
    backgroundColor: '#FFFFFF',
    width: '100%',
    height: 40,
    borderRadius: 10,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
  },
  subscriptionText: {
    fontSize: 16,
    fontFamily: 'SF-Pro-Display-Bold',
    color: '#000000',
  },
  subscriptionDot: {
    fontSize: 16,
    color: '#000000',
    fontFamily: 'SF-Pro-Display-Bold',
    marginHorizontal: 8,
  },
});

export default HomeScreen;
