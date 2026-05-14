import React from 'react';
import { StyleSheet, View, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type BackgroundProps = {
  children: React.ReactNode;
};

const Background: React.FC<BackgroundProps> = ({ children }) => {
  return (
	<View style={{flex:1, backgroundColor: '#ffffff'}}>
		<SafeAreaView style={styles.overlay} edges={['right', 'left']}>
			{children}
		</SafeAreaView>
	</View>
  );
};

const styles = StyleSheet.create({
  background: {
    flex: 1,
    width: '100%',
    height: '100%',
    color:'#ffffff',
    
  },
  overlay: {
    flex: 1,
  },
});

export default Background;