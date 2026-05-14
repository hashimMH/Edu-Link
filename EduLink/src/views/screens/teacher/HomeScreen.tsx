import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  SafeAreaView,
  Platform,
  Image,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {RootStackParamList, TabParamList} from '../../../models/types';
import HomeUperView from '../components/HomeUperView';
import Icon from 'react-native-vector-icons/Ionicons';
import Background from '../components/Background';
import ProgressBar from '../components/ProgressBar';
import TeacherStatsCard, {StatData} from '../components/TeacherStatsCard';
import {useNavigation} from '@react-navigation/native';
import {CompositeNavigationProp} from '@react-navigation/native';
import {StackNavigationProp} from '@react-navigation/stack';
import {BottomTabNavigationProp} from '@react-navigation/bottom-tabs';
import {api, TeacherStats} from '../../../services/api';
import {storage} from '../../../services/storage';
import {connectSocket} from '../../../services/socket';

type TeacherHomeScreenNavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<TabParamList>,
  StackNavigationProp<RootStackParamList>
>;

const {width} = Dimensions.get('window');
const PADDING = 16;
const CARD_MARGIN = 8;
const CARD_WIDTH = (width - 2 * PADDING - 2 * CARD_MARGIN) / 2;

const HomeScreen = () => {
  const navigation = useNavigation<TeacherHomeScreenNavigationProp>();
  const insets = useSafeAreaInsets();
  const [stats, setStats] = useState<TeacherStats | null>(null);
  const [upcomingClass, setUpcomingClass] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState('');
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const load = async () => {
      try {
        const [statsData, upcomingData] = await Promise.all([
          api.getTeacherStats(),
          api.getUpcomingClass(),
        ]);
        setStats(statsData);
        setUpcomingClass(upcomingData);
      } catch (err) {
        console.error('Failed to load teacher dashboard:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
    storage.getUser().then(u => {
      if (u) setUserName(u.firstName);
      else api.getProfile().then(p => setUserName(p.firstName)).catch(() => {});
    });

    connectSocket().then(socket => {
      socket.on('new_notification', () => setUnreadCount(prev => prev + 1));
    }).catch(() => {});
  }, []);

  if (loading || !stats) {
    return (
      <Background>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.notificationButton}
            onPress={() => {
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
      </Background>
    );
  }

  const statsData: StatData[] = [
    {
      title: 'Current Students',
      value: stats.currentStudents,
      iconName: 'people-outline',
      backgroundColor: '#EBF5FF',
      iconBackgroundColor: '#08C8F3',
    },
    {
      title: 'Booked Classes',
      value: stats.bookedClasses,
      iconName: 'calendar-outline',
      backgroundColor: '#E6FCF4',
      iconBackgroundColor: '#47CD89',
    },
    {
      title: 'Completed Classes',
      value: stats.completedClasses,
      iconName: 'checkmark-circle-outline',
      backgroundColor: '#E6FCF4',
      iconBackgroundColor: '#47CD89',
    },
    {
      title: 'Cancelled Classes',
      value: stats.cancelledClasses,
      iconName: 'close-circle-outline',
      backgroundColor: '#FFE5E5',
      iconBackgroundColor: '#F04438',
    },
  ];

  return (
    <Background>
      <View style={[styles.header, {top: Platform.OS === 'ios' ? insets.top > 0 ? insets.top + 10 : 40 : 40}]}>
        <TouchableOpacity
          style={styles.notificationButton}
          onPress={() => navigation.navigate('NotificationScreen')}>
          <Icon name="notifications-outline" size={24} color="#fff" />
        </TouchableOpacity>
      </View>
      <HomeUperView>
        <View style={[styles.title, {top: Platform.OS === 'ios' ? insets.top > 0 ? 70 : 40 : 40}]}>
          <View style={{flex: 1, left: 20}}>
            <Text style={styles.mainText}>Hello,</Text>
            <Text style={styles.mainText}>{userName || 'Teacher'} 👋</Text>
          </View>
        </View>
      </HomeUperView>

      <ScrollView
        style={styles.container}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}>
        <View style={[{paddingTop: 65}]}>
          <TouchableOpacity
            style={styles.upcomingSection}
            onPress={() => navigation.navigate('UpcomingClassScreen')}>
            <View style={styles.upcomingHeader}>
              <Text style={styles.sectionTitle}>upcoming Classes</Text>
              <Icon name="chevron-forward" size={24} color="#FFFFFF" />
            </View>
            <View style={styles.classCard}>
              <View style={styles.appointmentRow}>
                <View style={styles.appointmentItem}>
                  <Icon name="calendar-outline" size={24} color="#FFFFFF" style={styles.appointmentIcon} />
                  <View>
                    <Text style={styles.appointmentDate}>
                      {upcomingClass?.dateTime?.split(' ').slice(0, 4).join(' ') || 'No upcoming'}
                    </Text>
                    <Text style={styles.appointmentLabel}>Appointments Date</Text>
                  </View>
                </View>
                <View style={styles.appointmentItem}>
                  <Icon name="time-outline" size={24} color="#FFFFFF" style={styles.appointmentIcon} />
                  <View>
                    <Text style={styles.appointmentTime}>
                      {upcomingClass?.dateTime?.split(' ').slice(4).join(' ') || '--'}
                    </Text>
                    <Text style={styles.appointmentLabel}>Appointments Time</Text>
                  </View>
                </View>
              </View>
              <View style={styles.studentCard}>
                <Image
                  source={require('../../../../assets/karim.png')}
                  style={styles.studentImage}
                />
                <View style={styles.studentDetails}>
                  <Text style={styles.studentName}>
                    {upcomingClass?.studentName || 'No student'}
                  </Text>
                  <Text style={styles.studentLabel}>student</Text>
                </View>
              </View>
            </View>
          </TouchableOpacity>

          <TeacherStatsCard statsData={statsData} />

          <View style={styles.reviewsSection}>
            <View style={styles.reviewsHeader}>
              <Text style={[styles.sectionTitle, {color: '#000'}]}>Reviews</Text>
              <TouchableOpacity onPress={() => navigation.navigate('TeacherReviewsScreen')}>
                <Text style={styles.viewAllText}>View All</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.reviewCard}>
              <View style={styles.ratingContainer}>
                <Icon name="star" size={16} color="#FFC960" />
                <Text style={styles.ratingText}>{stats.averageRating}</Text>
              </View>
              <View style={styles.reviewDetails}>
                <Text style={styles.reviewerName}>Average Rating</Text>
                <Text style={styles.reviewDate}>Based on student reviews</Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
      <View
        style={[
          styles.learnedToday,
          {marginTop: Platform.OS === 'ios' ? insets.top > 0 ? '40%' : '32%' : '32%'},
        ]}>
        <View style={styles.learnedTodayContent}>
          <View>
            <Text style={styles.pprogress}>Profile progress</Text>
            <View style={styles.timeContainer}>
              <Text style={styles.cardtimeText}>2 </Text>
              <Text style={styles.timeTotal}>/ 3</Text>
            </View>
          </View>
          <View style={{marginLeft: '30%'}}>
            <Text style={styles.myCoursesText}>My students</Text>
            <Text style={[styles.pprogress, {alignSelf: 'flex-end', bottom: '-20%'}]}>70%</Text>
          </View>
        </View>
        <ProgressBar progress={0.75} />
      </View>
    </Background>
  );
};

const styles = StyleSheet.create({
  header: {
    position: 'absolute',
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
  container: {
    padding: 20,
    backgroundColor: '#fff',
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: '35%',
  },
  upcomingSection: {
    backgroundColor: '#006A82',
    borderRadius: 24,
    padding: 20,
    marginBottom: 24,
    width: '100%',
  },
  upcomingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    fontFamily: 'SF-Pro-Display-Semibold',
  },
  classCard: {
    width: '100%',
    borderRadius: 16,
    padding: 5,
  },
  appointmentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  appointmentItem: {
    width: '48%',
    padding: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  appointmentIcon: {
    marginRight: 12,
  },
  appointmentDate: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'SF-Pro-Display-Semibold',
    marginBottom: 4,
  },
  appointmentTime: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'SF-Pro-Display-Semibold',
    marginBottom: 4,
  },
  appointmentLabel: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 10,
    fontFamily: 'SF-Pro-Display-Regular',
  },
  studentCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  studentImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  studentDetails: {
    flex: 1,
  },
  studentName: {
    color: '#1F2937',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'SF-Pro-Display-Semibold',
    marginBottom: 2,
  },
  studentLabel: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 14,
    fontFamily: 'SF-Pro-Display-Regular',
  },
  reviewsSection: {
    marginBottom: 24,
    width: '100%',
  },
  reviewsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  viewAllText: {
    fontSize: 14,
    color: '#2F80ED',
    fontFamily: 'SF-Pro-Display-Regular',
  },
  reviewCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  ratingContainer: {
    backgroundColor: '#10A8DA',
    borderRadius: 15,
    padding: 8,
    marginRight: 12,
    alignItems: 'center',
    gap: 4,
    minWidth: 60,
    justifyContent: 'center',
  },
  ratingText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'SF-Pro-Display-Bold',
  },
  reviewDetails: {
    flex: 1,
  },
  reviewerName: {
    fontSize: 16,
    color: '#1F2A37',
    fontFamily: 'SF-Pro-Display-Medium',
    marginBottom: 4,
  },
  reviewDate: {
    fontSize: 14,
    color: '#4B5563',
    fontFamily: 'SF-Pro-Display-Regular',
    marginBottom: 2,
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
    shadowOffset: {width: 0, height: 15},
    shadowOpacity: 0.1,
    shadowRadius: 7,
    elevation: 2,
  },
  learnedTodayContent: {
    flexDirection: 'row',
    justifyContent: 'center',
    margin: 15,
  },
  pprogress: {
    fontFamily: 'SF-Pro-Text-Medium',
    fontWeight: '400',
    fontSize: 12,
    lineHeight: 20,
    color: '#858597',
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardtimeText: {
    fontFamily: 'SF-Pro-Text-Medium',
    fontWeight: '600',
    fontSize: 20,
    lineHeight: 24,
    color: '#171725',
  },
  timeTotal: {
    fontFamily: 'SF-Pro-Text-Medium',
    fontWeight: '400',
    fontSize: 16,
    lineHeight: 24,
    color: '#858597',
  },
  myCoursesText: {
    fontFamily: 'SF-Pro-Text-Medium',
    fontWeight: '600',
    fontSize: 12,
    lineHeight: 20,
    color: '#171725',
  },
});

export default HomeScreen;
