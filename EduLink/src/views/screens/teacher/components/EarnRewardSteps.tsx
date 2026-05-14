import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Modal,
  Image,
  ScrollView,
  Pressable,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import FontAwesome6 from 'react-native-vector-icons/FontAwesome6';
import {storage} from '../../../../services/storage';
interface ContactInfo {
  userName: string;
  email: string;
  phone: string;
  country: string;
  city: string;
  zipCode: string;
}

interface EarnRewardStepsProps {
  onClose: () => void;
}

const EarnRewardSteps: React.FC<EarnRewardStepsProps> = ({ onClose }) => {
  const [step, setStep] = useState(1);
  const [contactInfo, setContactInfo] = useState<ContactInfo>({
    userName: '',
    email: '',
    phone: '',
    country: '',
    city: '',
    zipCode: '',
  });

  useEffect(() => {
    storage.getUser().then(u => {
      if (u) {
        setContactInfo(prev => ({
          ...prev,
          userName: `${u.firstName} ${u.lastName}`,
          email: u.email,
        }));
      }
    });
  }, []);
  const [paymentMethod, setPaymentMethod] = useState('paypal');
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const updateContactInfo = (field: keyof ContactInfo, value: string) => {
    setContactInfo(prev => ({ ...prev, [field]: value }));
  };

  const handleNextStep = () => {
    if (step === 1) {
      // If at payment method selection, go to the appropriate form based on selection
      if (paymentMethod === 'paypal') {
        setStep(2); // Go to PayPal form
      } else if (paymentMethod === 'cash') {
        setStep(3); // Go to Cash form
      }
    } else {
      // If at either contact form (step 2 or 3), show success and close
      setShowSuccessModal(true);
      setTimeout(() => {
        setShowSuccessModal(false);
        onClose();
      }, 2000);
    }
  };

  const handlePreviousStep = () => {
    // If on Cash form (step 3), go back to payment selection (step 1)
    if (step === 3 && paymentMethod === 'cash') {
      setStep(1);
    } 
    // If on PayPal form or any other step, handle normally
    else if (step > 1) {
      setStep(step - 1);
    } 
    // If on first step, close the component
    else {
      onClose();
    }
  };

  const renderStepOne = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.sectionTitle}>Select the Payment Methods you Want to Use</Text>

      <View style={styles.paymentMethodsContainer}>
        <TouchableOpacity 
          style={styles.paymentMethodRow} 
          onPress={() => setPaymentMethod('paypal')}
        >
          <View style={styles.radioContainer}>
            <View style={[
              styles.radioOuter, 
              paymentMethod === 'paypal' && styles.radioOuterSelected
            ]}>
              {paymentMethod === 'paypal' && (
                <View style={styles.radioInner} />
              )}
            </View>
          </View>
          <Text style={styles.paymentMethodText}>Paypal</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.paymentMethodRow} 
          onPress={() => setPaymentMethod('cash')}
        >
          <View style={styles.radioContainer}>
            <View style={[
              styles.radioOuter, 
              paymentMethod === 'cash' && styles.radioOuterSelected
            ]}>
              {paymentMethod === 'cash' && (
                <View style={styles.radioInner} />
              )}
            </View>
          </View>
          <Text style={styles.paymentMethodText}>Cash</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity 
        style={styles.earnButton} 
        onPress={handleNextStep}
      >
        <Text style={styles.earnButtonText}>Earn $50</Text>
        <Icon name="arrow-forward" size={18} color="#fff" />
      </TouchableOpacity>
    </View>
  );

  // PayPal option form
  const renderStepTwo = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.sectionTitle}>Contact information</Text>

      <View style={styles.formContainer}>
        <Text style={styles.inputLabel}>Email / User name</Text>
        <TextInput
          style={styles.input}
          value={contactInfo.userName}
          onChangeText={(text) => updateContactInfo('userName', text)}
          placeholder="Enter email or username"
          placeholderTextColor="#9CA3AF"
        />
      </View>

      <TouchableOpacity 
        style={styles.paypalButton} 
        onPress={handleNextStep}
      >
        <Image 
          source={require('../../../../../assets/paypal-logo.png')} 
          style={styles.paypalLogo}
          resizeMode="contain" 
        />
      </TouchableOpacity>
    </View>
  );

  // Cash option form
  const renderStepThree = () => (
    <ScrollView style={styles.scrollContainer}>
      <View style={styles.stepContainer}>
        <Text style={styles.sectionTitle}>Contact information</Text>

        <View style={styles.formContainer}>
          <Text style={styles.inputLabel}>User Name</Text>
          <TextInput
            style={styles.input}
            value={contactInfo.userName}
            onChangeText={(text) => updateContactInfo('userName', text)}
            placeholder="Enter username"
            placeholderTextColor="#9CA3AF"
          />
          
          <Text style={styles.inputLabel}>Email <Text style={styles.required}>*</Text></Text>
          <TextInput
            style={styles.input}
            value={contactInfo.email}
            onChangeText={(text) => updateContactInfo('email', text)}
            placeholder="Enter email"
            placeholderTextColor="#9CA3AF"
            keyboardType="email-address"
          />
          
          <Text style={styles.inputLabel}>Phone</Text>
          <TextInput
            style={styles.input}
            value={contactInfo.phone}
            onChangeText={(text) => updateContactInfo('phone', text)}
            placeholder="Enter phone number"
            placeholderTextColor="#9CA3AF"
            keyboardType="phone-pad"
          />
          
          <Text style={styles.inputLabel}>Country</Text>
          <View style={styles.input}>
            <Text style={styles.dropdownText}>{contactInfo.country}</Text>
            <Icon name="chevron-down" size={16} color="#9CA3AF" />
          </View>
          
          <Text style={styles.inputLabel}>City</Text>
          <View style={styles.input}>
            <Text style={styles.dropdownText}>{contactInfo.city}</Text>
            <Icon name="chevron-down" size={16} color="#9CA3AF" />
          </View>
          
          <Text style={styles.inputLabel}>Zip Code</Text>
          <TextInput
            style={styles.input}
            value={contactInfo.zipCode}
            onChangeText={(text) => updateContactInfo('zipCode', text)}
            placeholder="ZIP CODE"
            placeholderTextColor="#9CA3AF"
          />
        </View>

        <TouchableOpacity 
          style={styles.cashButton} 
          onPress={handleNextStep}
        >
          <Text style={styles.cashButtonText}>Cash</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handlePreviousStep} style={styles.backButton}>
          <Icon name="chevron-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {step === 1 ? 'Payment Methods' : 'Earnings'}
        </Text>
        <View style={{ width: 24 }} />
      </View>

      {step === 1 && renderStepOne()}
      {step === 2 && paymentMethod === 'paypal' && renderStepTwo()}
      {step === 3 && paymentMethod === 'cash' && renderStepThree()}

      <Modal
        transparent={true}
        visible={showSuccessModal}
        animationType="fade"
      >
        <Pressable style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Done!</Text>
            </View>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
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
  stepContainer: {
    flex: 1,
    padding: 20,
  },
  scrollContainer: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 16,
    color: '#1F2937',
    marginBottom: 16,
    fontWeight: '500',
  },
  formContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    color: '#1F2937',
    marginBottom: 8,
    fontWeight: '500',
  },
  required: {
    color: 'red',
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    padding: 14,
    fontSize: 16,
    marginBottom: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dropdownText: {
    color: '#6B7280',
    fontSize: 16,
  },
  paypalButton: {
    backgroundColor: '#0EA5E9',
    borderRadius: 10,
    padding: 12,
    alignItems: 'center',
    marginVertical: 16,
  },
  paypalLogo: {
    height: 40,
    width: 180,
  },
  earnButton: {
    backgroundColor: '#0EA5E9',
    borderRadius: 10,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    marginTop: 20,
  },
  earnButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginRight: 8,
  },
  cashButton: {
    backgroundColor: '#0EA5E9',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
    marginTop: 20,
  },
  cashButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  paymentMethodsContainer: {
    marginTop: 16,
  },
  paymentMethodRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  radioContainer: {
    marginRight: 12,
  },
  radioOuter: {
    height: 24,
    width: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#9CA3AF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioOuterSelected: {
    borderColor: '#3B82F6',
  },
  radioInner: {
    height: 12,
    width: 12,
    borderRadius: 6,
    backgroundColor: '#3B82F6',
  },
  paymentMethodText: {
    fontSize: 16,
    color: '#1F2937',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '90%',
    height: '50%',
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 16,
    justifyContent:'flex-end',
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
   // marginBottom: 16,
    bottom: 16,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#fff',
    textAlign: 'center',
    padding: 16,
  },
});

export default EarnRewardSteps;
