import React, { Suspense } from 'react';
import {createStackNavigator} from '@react-navigation/stack';
import {RootStackParamList} from '../models/types';
import { View, ActivityIndicator } from 'react-native';

import TabNavigator from './TabNavigator';
import TeacherTabNavigator from './TeacherTabNavigator';
import LoginScreen from '../views/Auth/login/LoginScreen';
import ForgotPassword from '../views/Auth/resets/ForgotPassword';
import Registration from '../views/Auth/registration/registrationScreen';
import TutorInfoScreen from '../views/screens/stacks/TutorInfoScreen';
import MessagesScreen from '../views/screens/stacks/MessagesScreen';
import ChatScreen from '../views/screens/stacks/ChatScreen';
import AccountScreen from '../views/screens/stacks/AccountScreen';
import TeacherAccountScreen from '../views/screens/teacher/TeacherAccountScreen';
import LessonHistoryScreen from '../views/screens/stacks/LessonHistoryScreen';
import NotificationScreen from '../views/screens/stacks/NotificationScreen';
import MyScheduleScreen from '../views/screens/stacks/MyScheduleScreen';
import AppointmentScreen from '../views/screens/stacks/AppointmentScreen';
import TeacherReviewsScreen from '../views/screens/teacher/TeacherReviewsScreen';
import UpcomingClassScreen from '../views/screens/teacher/UpcomingClassScreen';
import TeacherEarningsScreen from '../views/screens/teacher/TeacherEarningsScreen';
import AllPaymentsScreen from '../views/screens/teacher/AllPaymentsScreen';
// Lazy-load LiveClassScreen so LiveKit native modules only initialize
// when the user actually enters a class — avoids audioRecordSamplesDispatcher crash at startup
const LiveClassScreen = React.lazy(() => import('../views/screens/stacks/LiveClassScreen'));

const Stack = createStackNavigator<RootStackParamList>();

const StackNavigator = ({initialRoute = 'LoginScreen'}: {initialRoute?: string}) => {
  return (
    <Stack.Navigator initialRouteName={initialRoute as any}>
      <Stack.Screen name="LoginScreen" component={LoginScreen} options={{headerShown: false}} />
      <Stack.Screen name="Tabs" component={TabNavigator} options={{headerShown: false}} />
      <Stack.Screen name="TeacherTabs" component={TeacherTabNavigator} options={{headerShown: false}} />
      <Stack.Screen name="ForgotPassword" component={ForgotPassword} options={{headerShown: false}} />
      <Stack.Screen name="RegistrationScreen" component={Registration} options={{headerShown: false}} />
      <Stack.Screen name="TutorInfoScreen" component={TutorInfoScreen} options={{headerShown: false}} />
      <Stack.Screen name="AppointmentScreen" component={AppointmentScreen} options={{headerShown: false}} />
      <Stack.Screen name="MessagesScreen" component={MessagesScreen} options={{headerShown: false}} />
      <Stack.Screen name="ChatScreen" component={ChatScreen} options={{headerShown: false}} />
      <Stack.Screen name="AccountScreen" component={AccountScreen} options={{headerShown: false}} />
      <Stack.Screen name="TeacherAccountScreen" component={TeacherAccountScreen} options={{headerShown: false}} />
      <Stack.Screen name="LessonHistoryScreen" component={LessonHistoryScreen} options={{headerShown: false}} />
      <Stack.Screen name="NotificationScreen" component={NotificationScreen} options={{headerShown: false}} />
      <Stack.Screen name="MyScheduleScreen" component={MyScheduleScreen} options={{headerShown: false}} />
      <Stack.Screen name="TeacherReviewsScreen" component={TeacherReviewsScreen} options={{headerShown: false}} />
      <Stack.Screen name="UpcomingClassScreen" component={UpcomingClassScreen} options={{headerShown: false}} />
      <Stack.Screen name="TeacherEarningsScreen" component={TeacherEarningsScreen} options={{headerShown: false}} />
      <Stack.Screen name="AllPaymentsScreen" component={AllPaymentsScreen} options={{headerShown: false}} />
      <Stack.Screen name="LiveClassScreen" options={{headerShown: false}}>
        {() => (
          <Suspense fallback={<View style={{flex:1, justifyContent:'center', alignItems:'center', backgroundColor:'#0F172A'}}><ActivityIndicator size="large" color="#10A7DA" /></View>}>
            <LiveClassScreen />
          </Suspense>
        )}
      </Stack.Screen>
    </Stack.Navigator>
  );
};

export default StackNavigator;
