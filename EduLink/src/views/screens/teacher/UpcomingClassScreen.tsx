import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Image,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import {DeleteModal} from '../stacks/components/DeleteModal';
import {api} from '../../../services/api';

interface ClassData {
  id: string;
  studentName: string;
  studentImage: string | null;
  dateTime: string;
  duration: string;
}

const UpcomingClassScreen: React.FC<{navigation: any}> = ({navigation}) => {
  const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);
  const [classData, setClassData] = useState<ClassData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await api.getUpcomingClass();
        setClassData(data);
      } catch (err) {
        console.error('Failed to load upcoming class:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleDeleteConfirm = async () => {
    if (!classData) return;
    try {
      await api.cancelClass(classData.id);
      setIsDeleteModalVisible(false);
      Alert.alert('Success', 'Class cancelled');
      navigation.goBack();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to cancel class');
    }
  };

  const handleDeletePress = () => {
    setIsDeleteModalVisible(true);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Icon name="chevron-back" size={24} color="#000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>upcoming Classes</Text>
          <View style={styles.placeholder} />
        </View>
        <ActivityIndicator size="large" color="#10A8DA" style={{marginTop: 60}} />
      </SafeAreaView>
    );
  }

  if (!classData) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Icon name="chevron-back" size={24} color="#000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>upcoming Classes</Text>
          <View style={styles.placeholder} />
        </View>
        <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
          <Text style={{fontSize: 18, color: '#666'}}>No upcoming classes</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Parse dateTime: "Mon, 11 June 2024 08:00 - 12:00"
  const parts = classData.dateTime.split(' ');
  const datePart = parts.slice(0, 4).join(' ');
  const timePart = parts.slice(4).join(' ');

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Icon name="chevron-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>upcoming Classes</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false} bounces={false}>
        <Image
          source={require('../../../../assets/classimage.png')}
          style={styles.teacherImage}
        />

        <View style={styles.classCard}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>upcoming Class</Text>
            <TouchableOpacity onPress={handleDeletePress}>
              <Icon name="trash-outline" size={24} color="#fff" />
            </TouchableOpacity>
          </View>

          <View style={styles.dateContainer}>
            <Icon name="calendar-outline" size={24} color="#fff" />
            <Text style={styles.date}>{datePart}</Text>
            <Text style={styles.label}>Appointments Date</Text>
          </View>

          <View style={styles.timeContainer}>
            <View style={styles.timeContent}>
              <Icon name="time-outline" size={24} color="#fff" />
              <Text style={styles.time}>{classData.duration}</Text>
            </View>
            <Text style={styles.timeRange}>{timePart}</Text>
            <Text style={styles.label}>Appointments Time</Text>
          </View>

          <View style={styles.aboutSection}>
            <Text style={styles.aboutTitle}>about the class</Text>
            <View style={styles.studentCard}>
              <Text style={styles.studentName}>{classData.studentName}</Text>
              <Text style={styles.studentLabel}>student</Text>
            </View>
            <Text style={styles.description}>
              Get ready for your upcoming session with {classData.studentName}. 
              Make sure to review the material and prepare any questions you may have.
            </Text>
          </View>

          <View style={styles.buttonContainer}>
            <TouchableOpacity style={styles.chatButton}>
              <Icon name="chatbubbles-outline" size={24} color="#000" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.startButton}>
              <Text style={styles.startButtonText}>start classs</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      <DeleteModal
        visible={isDeleteModalVisible}
        onClose={() => setIsDeleteModalVisible(false)}
        onConfirm={handleDeleteConfirm}
        title="Are you sure you want to delete this class?"
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F4F7',
  },
  scrollView: {
    flex: 1,
  },
  header: {
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
  teacherImage: {
    width: '100%',
    height: 200,
    resizeMode: 'cover',
  },
  classCard: {
    margin: 16,
    marginTop: -60,
    padding: 20,
    backgroundColor: '#008BB7',
    borderRadius: 24,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  cardTitle: {
    fontSize: 18,
    color: '#fff',
    fontWeight: '600',
    fontFamily: 'SF-Pro-Display-Semibold',
  },
  dateContainer: {
    alignItems: 'flex-start',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  date: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
    fontFamily: 'SF-Pro-Display-Semibold',
    marginTop: 5,
  },
  timeContainer: {
    alignItems: 'flex-start',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
  },
  timeContent: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    marginBottom: 5,
  },
  time: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
    fontFamily: 'SF-Pro-Display-Semibold',
    marginLeft: 12,
  },
  timeRange: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
    fontFamily: 'SF-Pro-Display-Semibold',
  },
  label: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    fontFamily: 'SF-Pro-Display-Regular',
  },
  aboutSection: {
    marginBottom: 24,
  },
  aboutTitle: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
    fontFamily: 'SF-Pro-Display-Semibold',
    marginBottom: 16,
  },
  studentCard: {
    backgroundColor: 'rgba(255, 255, 255, 1)',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  studentName: {
    fontSize: 16,
    color: '#000',
    fontWeight: '600',
    fontFamily: 'SF-Pro-Display-Semibold',
  },
  studentLabel: {
    fontSize: 14,
    color: '#000',
    fontFamily: 'SF-Pro-Display-Regular',
  },
  description: {
    fontSize: 14,
    color: '#fff',
    lineHeight: 20,
    fontFamily: 'SF-Pro-Display-Regular',
  },
  buttonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  chatButton: {
    backgroundColor: 'rgba(255, 255, 255, 1)',
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  startButton: {
    flex: 1,
    backgroundColor: '#47CD89',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  startButtonText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
    fontFamily: 'SF-Pro-Display-Semibold',
  },
});

export default UpcomingClassScreen;
