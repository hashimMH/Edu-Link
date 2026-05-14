import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';

// ProgressBar component
const ProgressBar = ({ progress }: { progress: number }) => {
  const clampedProgress = Math.max(0, Math.min(1, progress));

  if (Platform.OS === 'ios') {
    return (
      <View style={styles.container}>
        <View style={styles.background}>
          <View 
            style={[
              styles.progress, 
              { 
                width: `${clampedProgress * 100}%`,
                backgroundColor: '#08C8F3',
              }
            ]} 
          />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.background}>
        <LinearGradient
          colors={['rgba(255, 255, 255, 0.0)', '#08C8F3']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[styles.progress, { width: `${clampedProgress * 100}%` }]}
        />
      </View>
    </View>
  );
};

// Styles
const styles = StyleSheet.create({
  container: {
    height: 10,
    width: '90%',
    alignSelf: 'center',
    borderRadius: 5,
    overflow: 'hidden',
    backgroundColor: '#F4F3FD',
  },
  background: {
    flex: 1,
    backgroundColor: '#F4F3FD',
    borderRadius: 5,
    justifyContent: 'center',
  },
  progress: {
    height: '100%',
    borderRadius: 5,
  },
});

export default ProgressBar;
