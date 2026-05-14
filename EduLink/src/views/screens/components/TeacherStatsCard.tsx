import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import {TeacherStats} from '../../../models/types';

interface StatCardProps {
  title: string;
  value: number;
  iconName: string;
  backgroundColor: string;
  iconBackgroundColor: string;
}

const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  iconName,
  backgroundColor,
  iconBackgroundColor,
}) => {
  return (
    <View style={[styles.statBox, {backgroundColor}]}>
      <View style={styles.statContent}>
        <Text style={styles.statTitle}>{title}</Text>
        <View style={[styles.iconContainer, {backgroundColor: iconBackgroundColor}]}>
          <Icon
            name={iconName}
            size={20}
            color="#fff"
          />
        </View>
        <Text style={styles.statValue}>{value}</Text>
      </View>
    </View>
  );
};

export interface StatData {
  title: string;
  value: number;
  iconName: string;
  backgroundColor: string;
  iconBackgroundColor: string;
}

interface TeacherStatsCardProps {
  statsData: StatData[];
}

const TeacherStatsCard: React.FC<TeacherStatsCardProps> = ({statsData}) => {
  return (
    <View style={styles.statsContainer}>
      {statsData.map((stat, index) => (
        <StatCard key={index} {...stat} />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    //paddingHorizontal: 16,
    marginTop: 20,
  },
  statBox: {
    width: '48%',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  statContent: {
    alignItems: 'flex-start',
  },
  iconContainer: {
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 8,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F1F39',
    fontFamily: 'SF-Pro-Display-Semibold',
  },
  statTitle: {
    fontSize: 16,
    maxWidth: '80%',
    color: '#1F2A37',
    fontFamily: 'SF-Pro-Display-Bold',
   // textAlign: 'center',
  },
});

export default TeacherStatsCard;
export {StatCard};
