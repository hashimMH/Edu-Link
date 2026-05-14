import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { TeacherTabParamList } from '../models/types';
import HomeScreen from '../views/screens/teacher/HomeScreen';
import TeacherProfileScreen from '../views/screens/teacher/TeacherProfileScreen';
import MessagesScreen from '../views/screens/stacks/MessagesScreen';
import ScheduleScreen from '../views/screens/teacher/ScheduleScreen';
import CustomTabBar from './CustomTabBar';

// Placeholder component - to be implemented later
// const ScheduleScreen = () => null;

const Tab = createBottomTabNavigator<TeacherTabParamList>();

const TeacherTabNavigator = () => {
  return (
    <Tab.Navigator 
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        tabBarShowLabel: true,
        tabBarActiveTintColor: '#2F80ED',
        tabBarInactiveTintColor: '#9CA3AF',
      }}
    >
      <Tab.Screen 
        name="Home" 
        component={HomeScreen}
        options={{
          headerShown: false,
        }}
      />
      <Tab.Screen 
        name="Scheduled" 
        component={ScheduleScreen}
        options={{
          headerShown: false,
        }}
      />
      <Tab.Screen 
        name="Messages" 
        component={MessagesScreen}
        options={{
          headerShown: false
        }}
      />
      <Tab.Screen 
        name="Profile" 
        component={TeacherProfileScreen}
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

export default TeacherTabNavigator;
