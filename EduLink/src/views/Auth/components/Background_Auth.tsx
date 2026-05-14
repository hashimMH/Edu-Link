import React from 'react';
import { ImageBackground, StyleSheet, View, ViewStyle, StyleProp, Platform } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

type BackgroundProps = {
  children: React.ReactNode;
};

const Background: React.FC<BackgroundProps> = ({ children }) => {

	const imageSource = require('../../../../assets/backgroundAuth.png');
  return (
	<View style={{flex:1, backgroundColor: '#ffffff'}}>
		<ImageBackground source={imageSource} style={styles.background} resizeMode="cover">
			<SafeAreaView style={styles.overlay} edges={['right', 'left']}>
				{children}
			</SafeAreaView>
		</ImageBackground>
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
    paddingTop: Platform.OS === 'ios' ? 30 : 10,
  },
});

export default Background;