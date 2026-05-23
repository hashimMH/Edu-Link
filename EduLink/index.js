/**
 * @format
 */

// MUST be the very first import — initialises the Firebase DEFAULT app
import '@react-native-firebase/app';

import {AppRegistry} from 'react-native';
import App from './src/App';
import {name as appName} from './app.json';

// Register WebRTC globals for LiveKit video calls
import {registerGlobals} from '@livekit/react-native';
registerGlobals();

// Configure Google Sign-In with your Firebase Web Client ID
// Get this from: Firebase Console → Project Settings → Your App → Web client ID
import {configureGoogleSignIn} from './src/services/firebaseAuth';
configureGoogleSignIn('746674100825-j0ffel9drjhj58uskn2v6kh6anslnnh5.apps.googleusercontent.com');

AppRegistry.registerComponent(appName, () => App);
