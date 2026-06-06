import React, {useState} from 'react';
import {View, Text, StyleSheet, TouchableOpacity, Platform, Image, Alert} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../../../models/types';
import TextComponent from '../../components/TextComponent';
import TextInputField from '../../components/TextInputField';
import ButtonComponent from '../../components/ButtonComponent';
import styles from '../../styles/AuthStyle';
import Background from '../../components/Background_Auth';
import Icon from 'react-native-vector-icons/Ionicons';
import * as validation from '../../components/validation';
import ValidationCheck from './ValidationCheck';
import { api } from '../../../../services/api';

type ResetPasswordFormProps = {
  onResetPress: () => void;
  onBackPress: () => void;
  prefillToken: string;
  navigation: StackNavigationProp<RootStackParamList, 'ForgotPassword'>;
};

const ResetPasswordForm: React.FC<ResetPasswordFormProps> = ({ onResetPress, onBackPress, prefillToken, navigation }) => {
  const insets = useSafeAreaInsets();
  const [token, setToken] = useState(prefillToken);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleReset = async () => {
    if (!token.trim()) {
      Alert.alert('Missing Token', 'Please enter the reset token from your email.');
      return;
    }
    if (!validation.resetLongEnough(password)) {
      Alert.alert('Too Short', 'Password must be at least 6 characters.');
      return;
    }
    if (!validation.passwordsMatch(password, confirmPassword)) {
      Alert.alert('Mismatch', 'Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      await api.resetPassword(token.trim(), password);
      setSuccess(true);
    } catch (err: any) {
      Alert.alert(
        'Reset Failed',
        err.message || 'The token may be expired or already used. Please request a new one.',
      );
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <Background>
        <View style={styles.container}>
          <View style={styles.logo}>
            <Image source={require('../../../../../assets/logo.png')} style={styles.logoImage} resizeMode="contain" />
          </View>
          <View style={[styles.form, { alignItems: 'center' }]}>
            <Icon name="checkmark-circle-outline" size={70} color="#38a169" style={{ marginBottom: 16 }} />
            <TextComponent
              title="Password Changed!"
              subtitle="Your password has been reset successfully. You can now log in with your new password."
              subtitleStyle={{ textAlign: 'center', lineHeight: 22, marginBottom: 20 }}
            />
            <ButtonComponent title="Go to Login" onPress={onResetPress} />
          </View>
        </View>
      </Background>
    );
  }

  return (
    <Background>
      <View style={styles.container}>
        <View style={[localStyles.backButtonContainer, { marginTop: Platform.OS === 'ios' ? insets.top > 0 ? 0 : 5 : 0 }]}>
          <TouchableOpacity style={localStyles.backButton} onPress={onBackPress}>
            <Icon name="arrow-back" size={24} color="#10A7DA" />
          </TouchableOpacity>
        </View>
        <View style={styles.logo}>
          <Image source={require('../../../../../assets/logo.png')} style={styles.logoImage} resizeMode="contain" />
        </View>
        <View style={styles.form}>
          <TextComponent
            title="Create new password"
            subtitle="Enter the token from your email and choose a new password."
            subtitleStyle={{ marginBottom: '5%' }}
          />
          <TextInputField
            title="Reset Token"
            placeholder="Paste the token from your email"
            value={token}
            onChangeText={setToken}
            autoCapitalize="none"
          />
          <TextInputField
            title="New Password"
            placeholder="Min. 6 characters"
            isPassword={true}
            onChangeText={setPassword}
            value={password}
          />
          <TextInputField
            title="Confirm Password"
            placeholder="Re-enter your password"
            isPassword={true}
            warning={!!confirmPassword && !validation.passwordsMatch(password, confirmPassword)}
            onChangeText={setConfirmPassword}
            value={confirmPassword}
          />
          <ValidationCheck isValid={validation.resetLongEnough(password)} message="At least 6 characters" />
          <ValidationCheck isValid={validation.passwordsMatch(password, confirmPassword)} message="Passwords match" />
          <ButtonComponent
            title={loading ? 'Resetting...' : 'Reset Password'}
            onPress={handleReset}
            disabled={loading || validation.resetIsDisabled(password, confirmPassword)}
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

export default ResetPasswordForm;
