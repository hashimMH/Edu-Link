import React, {useState} from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform, Image, Alert } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../../../models/types';
import TextComponent from '../../components/TextComponent';
import TextInputField from '../../components/TextInputField';
import ButtonComponent from '../../components/ButtonComponent';
import styles from '../../styles/AuthStyle';
import Background from '../../components/Background_Auth';
import { api } from '../../../../services/api';

type ForgotPasswordFormProps = {
  onBackToLogin: () => void;
  navigation: StackNavigationProp<RootStackParamList, 'ForgotPassword'>;
}

const ForgotPasswordForm: React.FC<ForgotPasswordFormProps> = ({ onBackToLogin, navigation }) => {
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSendReset = async () => {
    if (!email.trim()) {
      Alert.alert('Error', 'Please enter your email');
      return;
    }

    setLoading(true);
    try {
      await api.forgotPassword(email.trim());
      setSent(true);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Something went wrong. Try again.');
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <Background>
        <View style={styles.container}>
          <View style={styles.logo}>
            <Image source={require('../../../../../assets/logo.png')} style={styles.logoImage} resizeMode="contain" />
          </View>
          <View style={[styles.form, { alignItems: 'center' }]}>
            <Icon name="mail-outline" size={64} color="#10A7DA" style={{ marginBottom: 20 }} />
            <TextComponent
              title="Reset Link Sent"
              subtitle={`We've sent a password reset link to ${email}.\n\nOpen the link in your browser to create a new password, then sign in here with it.`}
              subtitleStyle={{ textAlign: 'center', lineHeight: 22 }}
            />
            <View style={{ marginTop: 24 }}>
              <ButtonComponent title="Back to Sign In" onPress={onBackToLogin} />
            </View>
          </View>
        </View>
      </Background>
    );
  }

  return (
    <Background>
      <View style={styles.container}>
        <View style={[localStyles.backButtonContainer, { marginTop: Platform.OS === 'ios' ? insets.top > 0 ? 0 : 5 : 0 }]}>
          <TouchableOpacity style={localStyles.backButton} onPress={() => navigation.goBack()}>
            <Icon name="arrow-back" size={24} color="#10A7DA" />
          </TouchableOpacity>
        </View>
        <View style={styles.logo}>
          <Image source={require('../../../../../assets/logo.png')} style={styles.logoImage} resizeMode="contain" />
        </View>
        <View style={styles.form}>
          <TextComponent
            title="Password Recovery"
            subtitle="Enter your email and we'll send you a link to reset your password."
            subtitleStyle={{ marginBottom: '10%' }}
          />
          <TextInputField title="Email *" placeholder="Enter your email" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
          <ButtonComponent
            title={loading ? 'Sending...' : 'Send Reset Link'}
            onPress={handleSendReset}
            disabled={loading}
          />
        </View>
      </View>
    </Background>
  );
};

const localStyles = StyleSheet.create({
  backButtonContainer: { position: 'absolute', top: 5, left: 16, zIndex: 10 },
  backButton: { padding: 5 },
});

export default ForgotPasswordForm;
