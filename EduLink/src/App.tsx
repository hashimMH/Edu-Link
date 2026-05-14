import React, {useState, useEffect} from 'react';
import {NavigationContainer} from '@react-navigation/native';
import StackNavigator from './navigation/StackNavigator';
import {Provider} from 'react-redux';
import {store} from './store/store';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {storage} from './services/storage';
import {ActivityIndicator, View} from 'react-native';

const App = () => {
  const [initialRoute, setInitialRoute] = useState<string | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = await storage.getToken();
        const user = await storage.getUser();

        if (token && user) {
          // Token exists — go straight to the right home screen
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

  // Show splash/loading while checking auth
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
        <NavigationContainer>
          <StackNavigator initialRoute={initialRoute} />
        </NavigationContainer>
      </SafeAreaProvider>
    </Provider>
  );
};

export default App;
