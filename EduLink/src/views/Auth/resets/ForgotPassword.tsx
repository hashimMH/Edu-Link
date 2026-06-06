import React from 'react';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../../models/types';
import ForgotPasswordForm from './components/ForgotPasswordForm';

type HomeScreenNavigationProp = StackNavigationProp<RootStackParamList, 'ForgotPassword'>;

const ForgotPassword = ({ navigation }: { navigation: HomeScreenNavigationProp }) => {
  return (
    <ForgotPasswordForm
      onBackToLogin={() => navigation.navigate('LoginScreen')}
      navigation={navigation}
    />
  );
};

export default ForgotPassword;
