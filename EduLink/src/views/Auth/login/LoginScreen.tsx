import React, {useState} from 'react';
import {View, Text, StyleSheet, TouchableOpacity, Image, Alert, ActivityIndicator} from 'react-native';
import Background from '../components/Background_Auth';
import TextComponent from '../components/TextComponent';
import TextInputField from '../components/TextInputField';
import GoogleButton from '../components/GoogleButton';
import FacebookButton from '../components/FacebookButton';
import styles from '../styles/AuthStyle';
import {StackNavigationProp} from '@react-navigation/stack';
import {RootStackParamList} from '../../../models/types';
import {api} from '../../../services/api';
import {storage} from '../../../services/storage';

type LoginScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  'LoginScreen'
>;

const LoginScreen = ({navigation}: {navigation: LoginScreenNavigationProp}) => {
  const [email, setEmail] = useState('karimshebo15@gmail.com');
  const [password, setPassword] = useState('password123!');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Error', 'Please enter email and password');
      return;
    }

    setLoading(true);
    try {
      const res = await api.login(email.trim(), password);
      await storage.setToken(res.token);
      await storage.setUser(res.user);

      if (res.user.role === 'teacher') {
        navigation.reset({index: 0, routes: [{name: 'TeacherTabs'}]});
      } else {
        navigation.reset({index: 0, routes: [{name: 'Tabs'}]});
      }
    } catch (err: any) {
      Alert.alert('Login Failed', err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Background>
      <View style={styles.container}>
        <View style={styles.logo}>
          <Image source={require('../../../../assets/logo.png')} style={styles.logoImage} resizeMode="contain" />
        </View>
        <View style={styles.form}>
          <TextComponent title={`Welcome back you've \n been missed!`} />
          <TextInputField
            title={'Email *'}
            placeholder={'Enter your email'}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <TextInputField
            title={'Password *'}
            placeholder={'password'}
            isPassword={true}
            value={password}
            onChangeText={setPassword}
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
            <GoogleButton onPress={() => console.log('google Auth')} />
            <FacebookButton onPress={() => console.log('facebook Auth')} />
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

export default LoginScreen;
