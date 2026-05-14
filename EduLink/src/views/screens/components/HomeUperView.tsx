import React from 'react';
import { StyleSheet, View, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type HomeUperViewProps = {
  children: React.ReactNode;
};

const HomeUperView: React.FC<HomeUperViewProps> = ({ children }) => {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.upperBackground, { height: Platform.OS === 'ios' && insets.top > 0 ? '28%' : '25%' }]}>
      <View style={styles.leftCircleWrapper}>
        <View style={styles.leftInnerCircle} />
      </View>
      
      <View style={styles.rightCircleWrapper}>
        <View style={styles.rightInnerCircle} />
      </View>
      
      <View style={styles.overlay}>
        {children}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  upperBackground: {
    position: 'relative',
    width: '100%',
    // height is dynamically set based on platform
    backgroundColor: '#0E92BE',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    overflow: 'hidden',
  },
  leftCircleWrapper: {
    position: 'absolute',
    width: 300,
    height: 300,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    borderRadius: 150,
    justifyContent: 'center',
    top: 20,
    left: -80,
  },
  leftInnerCircle: {
    width: 200,
    height: 200,
    backgroundColor: '#0E92BE',
    alignSelf: 'center',
    borderRadius: 100,
  },
  rightCircleWrapper: {
    position: 'absolute',
    width: 150,
    height: 150,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    borderRadius: 150,
    justifyContent: 'center',
    top: 20,
    right: -100,
  },
  rightInnerCircle: {
    width: 80,
    height: 80,
    backgroundColor: '#0E92BE',
    alignSelf: 'center',
    borderRadius: 100,
  },
  overlay: {
    flex: 1,
  },
});

export default HomeUperView;