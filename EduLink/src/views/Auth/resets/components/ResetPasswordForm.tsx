import React, {useState} from 'react';
import {View, Text, StyleSheet, TouchableOpacity, Platform, Image} from 'react-native';
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

type ResetPasswordFormProps = {
  onResetPress: () => void;
  navigation: StackNavigationProp<RootStackParamList, 'ForgotPassword'>;
};

const ResetPasswordForm: React.FC<ResetPasswordFormProps> = ({
  onResetPress,
  navigation
}) => {
  const insets = useSafeAreaInsets();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  return (
    <Background>
      <View style={styles.container}>
        {/* Back Button */}
        <View style={[localStyles.backButtonContainer, { marginTop: Platform.OS === 'ios' ? insets.top > 0 ? 0 : 5 : 0 }]}>
          <TouchableOpacity 
            style={localStyles.backButton}
            onPress={() => onResetPress()}
          >
            <Icon name="arrow-back" size={24} color="#10A7DA" />
          </TouchableOpacity>
        </View>
        
        <View style={styles.logo}>
          <Image source={require('../../../../../assets/logo.png')} style={styles.logoImage} resizeMode="contain" />
        </View>
        <View style={styles.form}>
          <TextComponent
            title="Create your new password below"
            subtitle="Your password must be at least 8 characters long, and contain at least one number, and one symbol"
            subtitleStyle={{marginBottom: '10%'}}
          />
          <TextInputField
            title="Password"
            placeholder="Enter New Password"
            isPassword={true}
            onChangeText={setPassword}
            value={password}
          />
          <TextInputField
            title="Confirm Password"
            placeholder="Enter Confirm Password"
            isPassword={true}
            warning={
              !!confirmPassword &&
              !validation.passwordsMatch(password, confirmPassword)
            }
            onChangeText={setConfirmPassword}
            value={confirmPassword}
          />
          <ValidationCheck
            isValid={validation.isLongEnough(password)}
            message="Minimum 8 characters"
          />
          <ValidationCheck
            isValid={validation.hasNumber(password)}
            message="At least one number"
          />
          <ValidationCheck
            isValid={validation.hasSymbol(password)}
            message="At least one symbol"
          />
          <ButtonComponent
            title="Reset"
            onPress={onResetPress}
            disabled={validation.isDisabled(password, confirmPassword)}
          />
        </View>
      </View>
    </Background>
  );
};

const localStyles = StyleSheet.create({
  backButtonContainer: {
    position: 'absolute',
    top: 5,
    left: 16,
    zIndex: 10,
  },
  backButton: {
    padding: 5,
  },
});

export default ResetPasswordForm;
