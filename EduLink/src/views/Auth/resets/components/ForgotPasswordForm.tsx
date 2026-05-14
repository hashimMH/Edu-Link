import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform, Image } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../../../models/types';
import TextComponent from '../../components/TextComponent';
import TextInputField from '../../components/TextInputField';
import ButtonComponent from '../../components/ButtonComponent';
import styles from '../../styles/AuthStyle';
import Background from '../../components/Background_Auth';

type ForgotPasswordFormProps = {
  onResetPress: () => void;
  navigation: StackNavigationProp<RootStackParamList, 'ForgotPassword'>;
}

const ForgotPasswordForm: React.FC<ForgotPasswordFormProps> = ({ onResetPress, navigation }) => {
  const insets = useSafeAreaInsets();
  return (
	<Background>
    <View style={styles.container}>
      {/* Back Button */}
      <View style={[localStyles.backButtonContainer, { marginTop: Platform.OS === 'ios' ? insets.top > 0 ? 0 : 5 : 0 }]}>
        <TouchableOpacity 
          style={localStyles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Icon name="arrow-back" size={24} color="#10A7DA" />
        </TouchableOpacity>
      </View>
      
      <View style={styles.logo}>
        <Image source={require('../../../../../assets/logo.png')} style={styles.logoImage} resizeMode="contain" />
      </View>
      <View style={styles.form}>
        <TextComponent
          title="Password Recovery"
          subtitle="Enter your email to receive instructions for resetting your password."
          subtitleStyle={{ marginBottom: '10%' }}
        />
        <TextInputField title="Email *" placeholder="Enter your email" />
        <ButtonComponent title="Reset password" onPress={onResetPress} />
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

export default ForgotPasswordForm;
