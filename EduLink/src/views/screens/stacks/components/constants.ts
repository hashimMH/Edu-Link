import { Dimensions } from 'react-native';

const { width } = Dimensions.get('window');
export const DAYS_IN_WEEK = 7;
export const DAY_SIZE = (width - 48) / DAYS_IN_WEEK;

export const TIME_SLOTS = [
  ['09:00 AM', '09:30 AM', '10:00 AM', '10:30 AM'],
  ['12:00 PM', '12:30 PM', '01:30 PM', '02:00 PM'],
  ['03:00 PM', '03:30 PM', '04:00 PM', '04:30 PM'],
  ['05:00 PM', '05:30 PM', '06:00 PM', '06:30 PM'],
  ['07:00 PM', '07:30 PM', '08:00 PM', '08:30 PM'],
];

export const WEEK_DAYS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
