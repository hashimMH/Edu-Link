import React, {useState, useEffect, useRef} from 'react';
import {NavigationContainer, NavigationContainerRef} from '@react-navigation/native';
import StackNavigator from './navigation/StackNavigator';
import {Provider} from 'react-redux';
import {store} from './store/store';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {storage} from './services/storage';
import {onAuthExpired} from './services/api';
import {ActivityIndicator, View, Alert} from 'react-native';
import {RootStackParamList} from './models/types';

const App = () => {
  const [initialRoute, setInitialRoute] = useState<string | null>(null);
  const navigationRef = useRef<NavigationContainerRef<RootStackParamList>>(null);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = await storage.getToken();
        const user = await storage.getUser();

        if (token && user) {
          if (user.role === 'teacher') {
            setInitialRoute('TeacherTabs');
          } else {
            setInitialRoute('Tabs');
          }
        } else {
          setInitialRoute('LoginScreen');
        }
      } catch {
        setInitialRoute('LoginScreen');
      }
    };
    checkAuth();
  }, []);

  // Listen for token expiry — auto-logout to login screen
  useEffect(() => {
    return onAuthExpired(() => {
      Alert.alert(
        'Session Expired',
        'Your session has expired. Please login again.',
        [{ text: 'OK' }]
      );
      // Navigate to login screen
      navigationRef.current?.reset({
        index: 0,
        routes: [{ name: 'LoginScreen' }],
      });
    });
  }, []);

  if (!initialRoute) {
    return (
      <View style={{flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#10A7DA'}}>
        <ActivityIndicator size="large" color="#fff" />
      </View>
    );
  }

  return (
    <Provider store={store}>
      <SafeAreaProvider>
        <NavigationContainer ref={navigationRef}>
          <StackNavigator initialRoute={initialRoute} />
        </NavigationContainer>
      </SafeAreaProvider>
    </Provider>
  );
};

export default App;
