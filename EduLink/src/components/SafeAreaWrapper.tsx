import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

type SafeAreaWrapperProps = {
  children: React.ReactNode;
  style?: any;
};

/**
 * A wrapper component that provides safe area insets for iOS devices
 * Ensures content is properly positioned away from notches, status bars, and home indicators
 */
const SafeAreaWrapper: React.FC<SafeAreaWrapperProps> = ({ children, style }) => {
  const insets = useSafeAreaInsets();
  
  return (
    <SafeAreaView style={[styles.container, style]}>
      <View 
        style={[
          styles.content, 
          { 
            paddingTop: Platform.OS === 'ios' ? 0 : 16,
            paddingBottom: Platform.OS === 'ios' ? insets.bottom : 16 
          }
        ]}
      >
        {children}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
});

export default SafeAreaWrapper;
