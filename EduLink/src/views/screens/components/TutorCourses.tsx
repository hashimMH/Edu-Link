import React from 'react';
import { StyleSheet, View, Text, Image, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import MaterialIcon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';
import {StackNavigationProp} from '@react-navigation/stack';
import { TutorCourse } from '../../../models/types';


const StarRating: React.FC<{ rating: number }> = ({ rating }) => {
  const stars = [];
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 >= 0.5;

  for (let i = 0; i < 5; i++) {
    if (i < fullStars) {
      stars.push(<Icon key={i} name="star" size={12} color="#FFD700" style={styles.star} />);
    } else if (i === fullStars && hasHalfStar) {
      stars.push(<Icon key={i} name="star-half-o" size={12} color="#FFD700" style={styles.star} />);
    } else {
      stars.push(<Icon key={i} name="star-o" size={12} color="#FFD700" style={styles.star} />);
    }
  }

  return <View style={styles.starsContainer}>{stars}</View>;
};

const TutorCard: React.FC<{ tutor: TutorCourse }> = ({ tutor }) => {
  const navigation = useNavigation<StackNavigationProp<any>>();

  return (
    <TouchableOpacity 
      style={styles.tutorCard}
      onPress={() => navigation.navigate('TutorInfoScreen', { tutor: tutor })}
    >
      <View style={styles.tutorInfo}>
        <Image source={(tutor as any).avatarUrl ? {uri: (tutor as any).avatarUrl} : require("../../../../assets/karim.png")} style={styles.tutorImage} />
        {tutor.isAvailable !== undefined && (
          <View style={[styles.statusDot, tutor.isAvailable ? styles.statusOnline : styles.statusOffline]} />
        )}
        <View style={styles.tutorDetails}>
          <Text style={styles.tutorName}>{tutor.name}</Text>
          <View style={styles.tutorStats}>
            {tutor.isPositive && (
              <View style={styles.statItem}>
                <MaterialIcon name="thumb-up-outline" size={16} color="#1686C0" style={styles.statIcon} />
                <Text style={styles.statText}>{Math.round((tutor.rating / 5) * 100)}% positive</Text>
              </View>
            )}
            <View style={styles.statItem}>
              <MaterialIcon name="flag-outline" size={16} color="#1686C0" style={styles.statIcon} />
              <Text style={styles.statText}>{tutor.accent}</Text>
            </View>
        
            <View  style={styles.statItem}>
              <MaterialIcon name="earth" size={16} color="#1686C0" style={styles.statIcon} />
              <Text style={styles.statText}>{tutor.interests[0]}</Text>
            </View>
         
          </View>
        </View>
      </View>
      <View style={styles.rightSection}>
        <View style={styles.reviewSection}>
        <View style={{paddingRight: 10}}>
          <Text style={styles.reviewText}>Reviews</Text>
          <View style={styles.ratingContainer}>
            <Text style={styles.rating}>{tutor.rating}</Text>
            <StarRating rating={tutor.rating} />
          </View>
        </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};


const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  seeAll: {
    color: '#2B95E9',
    fontSize: 14,
  },
  tutorCard: {
    flexDirection: 'row',
    backgroundColor: 'white',
    overflow: 'hidden',
    borderRadius: 12,
    marginBottom: 12,
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  tutorInfo: {
    flexDirection: 'row',
    flex: 1,
  },
  tutorImage: {
    width: 100,
    height: '100%',
    marginRight: 12,
  },
  tutorDetails: {
    flex: 1,
  },
  tutorName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  tutorStats: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginBottom: 5,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 4,
  },
  statIcon: {
    marginRight: 4,
  },
  statText: {
    color: '#1686C0',
    fontFamily: 'SF-Pro-Display-Regular',
    fontSize: 12,
  },
  rightSection: {
    alignItems: 'flex-end',
  },
  reviewSection: {
    alignItems: 'flex-end',
    marginBottom: 8,
  },
  reviewText: {
    fontSize: 12,
    color: '#666',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rating: {
    fontSize: 14,
    fontWeight: '600',
    marginRight: 4,
  },
  starsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 4,
  },
  star: {
    marginHorizontal: 1,
  },
  statusDot: {
    width: 15,
    height: 15,
    borderRadius: 8,
    position: 'absolute',
    top: 4,
    left: 9,
    borderWidth: 3,
    borderColor: '#fff',
  },
  statusOnline: {
    backgroundColor: '#4CAF50',
  },
  statusOffline: {
    backgroundColor: '#FC282E',
  },
});

export { TutorCard };
