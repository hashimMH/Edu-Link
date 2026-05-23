import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { TabParamList } from '../models/types';
import { Platform } from 'react-native';
import HomeScreen from '../views/screens/tabs/HomeScreen';
import ProfileScreen from '../views/screens/tabs/ProfileScreen';
import AIChatScreen from '../views/screens/tabs/AIChatScreen';
import TutorScreen from '../views/screens/tabs/TutorScreen';
import CustomTabBar from './CustomTabBar';

const Tab = createBottomTabNavigator<TabParamList>();


const TabNavigator = () => {
  return (
    <Tab.Navigator 
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        tabBarHideOnKeyboard: true,
        tabBarStyle: {
          height: Platform.OS === 'ios' ? 90 : 70,
          paddingBottom: Platform.OS === 'ios' ? 25 : 10,
        },
      }}>
      <Tab.Screen name="Home" component={HomeScreen}  options={{headerShown:false}}/>
      <Tab.Screen 
        name="Tutors" 
        component={TutorScreen} 
        options={{
          headerStyle: {
            backgroundColor: '#F2F4F7',
          },
          headerTintColor: '#1F2A37',
          headerTitleStyle: {
            fontFamily: 'SF-Pro-Display-Semibold',
            fontSize: 20,
          },
          headerTitleAlign: 'center',
          headerShadowVisible: false,
        }}
      />
      <Tab.Screen name="AIChat" component={AIChatScreen} options={{headerShown: false}} />
      <Tab.Screen 
        name="Profile" 
        component={ProfileScreen}
        options={{
          headerStyle: {
            backgroundColor: '#F2F4F7',
          },
          headerTintColor: '#1F2A37',
          headerTitleStyle: {
            fontFamily: 'SF-Pro-Display-Semibold',
            fontSize: 20,
          },
          headerTitleAlign: 'center',
          headerShadowVisible: false,
        }}
      />
    </Tab.Navigator>
  );
};

export default TabNavigator;