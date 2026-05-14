import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  StatusBar,
  SafeAreaView,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../../models/types';
import PaymentItem from './components/PaymentItem';
import EarnRewardSteps from './components/EarnRewardSteps';
import { api, Payment, PaymentData } from '../../../services/api';

const TeacherEarningsScreen = () => {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const [showEarnSteps, setShowEarnSteps] = useState(false);
  const [balance, setBalance] = useState(0);
  const [income, setIncome] = useState(0);
  const [pending, setPending] = useState(0);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Fetch payment data from API
  useEffect(() => {
    const fetchPaymentData = async () => {
      try {
        setIsLoading(true);
        const data = await api.getPaymentData();
        setBalance(data.balance);
        setIncome(data.income);
        setPending(data.pending);
        
        // Only take the first 4 payments for the earnings screen
        setPayments(data.payments.slice(0, 4));
        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching payment data:', error);
        setIsLoading(false);
      }
    };
    
    fetchPaymentData();
  }, []);
  
  /* Old mock data
  const [payments, setPayments] = useState<Payment[]>([
  */

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      {showEarnSteps ? (
        <EarnRewardSteps onClose={() => setShowEarnSteps(false)} />
      ) : (
        <>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
              <Icon name="chevron-back" size={24} color="#000" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Earnings</Text>
            <View style={{ width: 24 }} />
          </View>
      
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Balance Card with Background */}
        <View style={styles.balanceCardContainer}>
          <Image 
            source={require('../../../../assets/rectangle4.png')} 
            style={styles.backgroundCard}
            resizeMode="cover"
          />
          
          {/* Main Balance Card */}
          <View style={styles.balanceCard}>
            <View style={styles.balanceLeft}>
              <View style={styles.balanceIconContainer}>
                <Icon name="cash" size={60} color="#064E3B" />
                <Icon name="stats-chart" size={30} color="#10B981" style={styles.secondaryIcon} />
              </View>
            </View>
            <View style={styles.balanceRight}>
              <Text style={styles.balanceAmount}>
                {isLoading ? '$ --' : `$${formatNumber(balance)}`}
              </Text>
              <Text style={styles.balanceLabel}>Current Balance</Text>
            </View>
          </View>
        </View>
        
        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Icon name="wallet-outline" size={24} color="#2E7D32" style={styles.statIcon} />
            <Text style={styles.statAmount}>
              {isLoading ? '$ --' : `$ ${formatNumber(income)}`}
            </Text>
            <Text style={styles.statLabel}>Income</Text>
          </View>
          
          <View style={styles.statCard}>
            <Icon name="time-outline" size={24} color="#D32F2F" style={styles.statIcon} />
            <Text style={styles.statAmount}>
              {isLoading ? '$ --' : `$ ${formatNumber(pending)}`}
            </Text>
            <Text style={styles.statLabel}>Pending</Text>
          </View>
        </View>
        
        {/* Latest Payments */}
        <View style={styles.paymentsHeader}>
          <Text style={styles.paymentsTitle}>Latest payments</Text>
          <TouchableOpacity onPress={() => navigation.navigate('AllPaymentsScreen')}>
            <Text style={styles.seeAllButton}>ALL</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.paymentsContainer}>
          {payments.map((payment) => (
            <PaymentItem key={payment.id} payment={payment} />
          ))}
        </View>
        
        {/* Refer Button */}
        <TouchableOpacity 
          style={styles.referButton}
          onPress={() => setShowEarnSteps(true)}
        >
          <Text style={styles.referButtonText}>Earn $50</Text>
          <Icon name="arrow-forward" size={18} color="#fff" />
        </TouchableOpacity>
      </ScrollView>
      </>
      )}
    </SafeAreaView>
  );
};

// Helper function to format numbers with commas
const formatNumber = (num: number): string => {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#f0f2f5',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 16,
  },
  balanceCardContainer: {
    position: 'relative',
    alignItems: 'center',
    marginVertical: 16,
    marginBottom:40,
  },
  backgroundCard: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    //left: 8,
    borderRadius: 12,
    zIndex: -1,
  },
  balanceCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    width:'95%',
    top: 20,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  balanceLeft: {
    backgroundColor: '#F8FAFC',
    width: '40%',
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  balanceIconContainer: {
    width: 100,
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  secondaryIcon: {
    position: 'absolute',
    right: 0,
    bottom: 0,
  },
  balanceRight: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  balanceAmount: {
    fontSize: 26,
    fontWeight: '700',
    color: '#064E3B',
    marginBottom: 6,
  },
  balanceLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  statCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    width: '48%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  statIcon: {
    marginBottom: 8,
  },
  statAmount: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
    color: '#1F2937',
  },
  statLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  paymentsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  paymentsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  seeAllButton: {
    fontSize: 14,
    fontWeight: '500',
    color: '#4B5563',
  },
  paymentsContainer: {
    backgroundColor: '#fff',
   // borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 24,
  },
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
    //backgroundColor: '#F3F4F6',
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
  referButton: {
    backgroundColor: '#0EA5E9',
    borderRadius: 10,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  referButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginRight: 8,
  },
});

export default TeacherEarningsScreen;
