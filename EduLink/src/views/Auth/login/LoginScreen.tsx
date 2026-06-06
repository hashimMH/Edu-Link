import React, {useState} from 'react';
import {View, Text, StyleSheet, TouchableOpacity, Image, Alert, ActivityIndicator, Platform} from 'react-native';
import Background from '../components/Background_Auth';
import TextComponent from '../components/TextComponent';
import TextInputField from '../components/TextInputField';
import GoogleButton from '../components/GoogleButton';
import AppleButton from '../components/AppleButton';
import styles from '../styles/AuthStyle';
import {StackNavigationProp} from '@react-navigation/stack';
import {RootStackParamList} from '../../../models/types';
import {api} from '../../../services/api';
import {storage} from '../../../services/storage';
import {signInWithGoogle, signInWithApple} from '../../../services/firebaseAuth';

type LoginScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  'LoginScreen'
>;

type ErrorType = 'none' | 'empty' | 'invalid' | 'network' | 'server' | 'unknown';

function getErrorMessage(type: ErrorType, serverMsg?: string): string {
  switch (type) {
    case 'empty':
      return 'Please enter your email and password.';
    case 'invalid':
      return 'Invalid email or password. Please check and try again.';
    case 'network':
      return 'Unable to connect. Check your internet connection and try again.';
    case 'server':
      return 'Server is temporarily unavailable. Please try again later.';
    case 'unknown':
      return serverMsg || 'Something went wrong. Please try again.';
    default:
      return '';
  }
}

function classifyError(err: any): ErrorType {
  const msg = (err.message || '').toLowerCase();
  if (!msg) return 'unknown';
  if (msg.includes('network') || msg.includes('connect') || msg.includes('timeout') || msg.includes('abort')) {
    return 'network';
  }
  if (msg.includes('invalid email') || msg.includes('invalid password') || msg.includes('invalid email or password')) {
    return 'invalid';
  }
  if (msg.includes('server') || msg.includes('500') || msg.includes('503') || msg.includes('unavailable')) {
    return 'server';
  }
  if (msg.includes('session expired')) {
    return 'invalid';
  }
  return 'unknown';
}

const LoginScreen = ({navigation}: {navigation: LoginScreenNavigationProp}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<{type: ErrorType; message: string}>({type: 'none', message: ''});

  const clearError = () => {
    if (error.type !== 'none') setError({type: 'none', message: ''});
  };

  const handleLogin = async () => {
    clearError();

    if (!email.trim() || !password.trim()) {
      setError({type: 'empty', message: getErrorMessage('empty')});
      return;
    }

    setLoading(true);
    try {
      const res = await api.login(email.trim(), password);
      await storage.setToken(res.token);
      await storage.setRefreshToken(res.refreshToken);
      await storage.setUser(res.user);

      if (res.user.role === 'teacher') {
        navigation.reset({index: 0, routes: [{name: 'TeacherTabs'}]});
      } else {
        navigation.reset({index: 0, routes: [{name: 'Tabs'}]});
      }
    } catch (err: any) {
      const errorType = classifyError(err);
      setError({type: errorType, message: getErrorMessage(errorType, err.message)});
    } finally {
      setLoading(false);
    }
  };

  const handleSocialAuth = async () => {
    setLoading(true);
    clearError();
    try {
      let data;
      if (Platform.OS === 'ios') {
        data = await signInWithApple();
      } else {
        data = await signInWithGoogle();
      }
      if (data.user.role === 'teacher') {
        navigation.reset({index: 0, routes: [{name: 'TeacherTabs'}]});
      } else {
        navigation.reset({index: 0, routes: [{name: 'Tabs'}]});
      }
    } catch (err: any) {
      if (err.message?.includes('not available') || err.message?.includes('not configured')) {
        setError({type: 'unknown', message: err.message});
      } else if (err.code !== 'CANCELLED') {
        setError({type: 'unknown', message: err.message || 'Social sign in failed. Please use email login instead.'});
      }
    } finally {
      setLoading(false);
    }
  };

  const hasError = error.type !== 'none';

  return (
    <Background>
      <View style={styles.container}>
        <View style={styles.logo}>
          <Image source={require('../../../../assets/logo.png')} style={styles.logoImage} resizeMode="contain" />
        </View>
        <View style={styles.form}>
          <TextComponent title="Welcome back!" subtitle="Sign in to continue learning" subtitleStyle={{marginBottom: '5%'}} />

          {hasError && (
            <View style={localStyles.errorBox}>
              <Text style={localStyles.errorText}>{error.message}</Text>
            </View>
          )}

          <TextInputField
            title="Email *"
            placeholder="Enter your email"
            value={email}
            onChangeText={(t) => { setEmail(t); clearError(); }}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <TextInputField
            title="Password *"
            placeholder="Password"
            isPassword={true}
            value={password}
            onChangeText={(t) => { setPassword(t); clearError(); }}
          />
          <TouchableOpacity
            style={styles.forgotStyle}
            onPress={() => navigation.navigate('ForgotPassword')}>
            <Text style={styles.forgot}>Forgot Password?</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.loginbt, loading && {opacity: 0.7}]}
            onPress={handleLogin}
            disabled={loading}>
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.loginText}>Login</Text>
            )}
          </TouchableOpacity>
        </View>
        <View style={{flex: 1, width: '100%', alignItems: 'center'}}>
          <View style={styles.or}>
            <Text style={styles.orText}> or continue with </Text>
          </View>

          <View style={styles.btn_view}>
            {Platform.OS === 'ios' ? (
              <AppleButton onPress={handleSocialAuth} />
            ) : (
              <GoogleButton onPress={handleSocialAuth} />
            )}
          </View>
          <View style={styles.footer}>
            <Text style={styles.footerText}>Don't have an Account? </Text>
            <TouchableOpacity onPress={()=> navigation.navigate('RegistrationScreen')}>
              <Text style={[styles.footerText, {color: '#10A7DA'}]}>sign up</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Background>
  );
};

const localStyles = StyleSheet.create({
  errorBox: {
    backgroundColor: '#FFF5F5',
    borderWidth: 1,
    borderColor: '#FED7D7',
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
  },
  errorText: {
    color: '#C53030',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default LoginScreen;
