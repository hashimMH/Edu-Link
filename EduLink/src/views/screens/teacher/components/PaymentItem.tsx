import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { Payment } from '../../../../services/api';

// Payment interface is now imported from the API service

interface PaymentItemProps {
  payment: Payment;
  onPress?: (payment: Payment) => void;
}

const PaymentItem: React.FC<PaymentItemProps> = ({ payment, onPress }) => {
  return (
    <TouchableOpacity 
      style={styles.paymentItem} 
      onPress={onPress ? () => onPress(payment) : undefined}
      disabled={!onPress}
      activeOpacity={onPress ? 0.7 : 1}
    >
      <View style={styles.paymentIconContainer}>
        <Icon name="card-outline" size={22} color="#555" />
      </View>
      <View style={styles.paymentLeft}>
        <View style={styles.paymentDetails}>
          <Text style={styles.paymentType}>{payment.type}</Text>
          <Text style={styles.paymentCardInfo}>
            {payment.cardType} **** {payment.cardNumber}
          </Text>
        </View>
        <View style={styles.paymentRight}>
          <Text style={styles.paymentAmount}>${payment.amount.toFixed(2)}</Text>
          <Text style={styles.paymentDate}>{payment.date}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  paymentItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  paymentLeft: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    borderRadius: 6,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  paymentIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  paymentDetails: {
    justifyContent: 'center',
  },
  paymentType: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1F2937',
    marginBottom: 2,
  },
  paymentCardInfo: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  paymentRight: {
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  paymentAmount: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
  },
  paymentDate: {
    fontSize: 12,
    color: '#9CA3AF',
  },
});

export default PaymentItem;
