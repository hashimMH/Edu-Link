import React from 'react';
import { StyleSheet, View, Text, Image, TouchableOpacity, Platform } from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import MaterialIcon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';
import {StackNavigationProp} from '@react-navigation/stack';
import { TutorCourse } from '../../../models/types';
import { API_HOST } from '../../../services/api';

function getImageSource(avatarUrl: string | null | undefined) {
  if (!avatarUrl) return require("../../../../assets/karim.png");
  if (avatarUrl.startsWith('http')) return { uri: avatarUrl };
  return { uri: `${API_HOST}${avatarUrl}` };
}


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
  const positivePct = Math.round((tutor.rating / 5) * 100);
  const firstInterest = tutor.interests?.[0] || '';

  return (
    <TouchableOpacity 
      style={styles.tutorCard}
      activeOpacity={0.85}
      onPress={() => navigation.navigate('TutorInfoScreen', { tutor: tutor })}
    >
      {/* Avatar */}
      <Image source={getImageSource((tutor as any).avatarUrl)} style={styles.tutorImage} />
      {tutor.isAvailable !== undefined && (
        <View style={[styles.statusDot, tutor.isAvailable ? styles.statusOnline : styles.statusOffline]} />
      )}

      {/* Info column */}
      <View style={styles.infoColumn}>
        <Text style={styles.tutorName} numberOfLines={1}>{tutor.name}</Text>
        
        {/* Stats — vertically stacked */}
        <View style={styles.statItem}>
          <MaterialIcon name="thumb-up-outline" size={14} color="#1686C0" />
          <Text style={styles.statText}>{positivePct}% positive</Text>
        </View>
        <View style={styles.statItem}>
          <MaterialIcon name="flag-outline" size={14} color="#1686C0" />
          <Text style={styles.statText}>{tutor.accent}</Text>
        </View>
        {firstInterest ? (
          <View style={styles.statItem}>
            <MaterialIcon name="earth" size={14} color="#1686C0" />
            <Text style={styles.statText}>{firstInterest}</Text>
          </View>
        ) : null}
      </View>

      {/* Reviews */}
      <View style={styles.reviewColumn}>
        <View style={{alignItems: 'flex-start'}}>
          <Text style={styles.reviewLabel}>Reviews</Text>
          <View style={styles.ratingRow}>
            <StarRating rating={tutor.rating} />
            <Text style={styles.ratingValue}>{tutor.rating}</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};


const styles = StyleSheet.create({
  tutorCard: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: 12,
    marginBottom: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  tutorImage: {
    width: 100,
    alignSelf: 'stretch',
  },
  infoColumn: {
    flex: 1,
    marginRight: 8,
    paddingVertical: 10,
    paddingLeft: 10,
  },
  tutorName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 6,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 3,
  },
  statText: {
    color: '#1686C0',
    fontFamily: 'SF-Pro-Display-Regular',
    fontSize: 12,
    marginLeft: 5,
  },
  reviewColumn: {
    alignItems: 'flex-end',
    justifyContent: 'center',
    paddingRight: 12,
    paddingVertical: 10,
  },
  reviewLabel: {
    fontSize: 11,
    color: '#9CA3AF',
    marginBottom: 4,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
    marginLeft: 4,
  },
  starsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  star: {
    marginHorizontal: 1,
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    position: 'absolute',
    top: 8,
    left: 68,
    borderWidth: 2,
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
