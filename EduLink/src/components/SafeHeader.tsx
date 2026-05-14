import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type SafeHeaderProps = {
  title: string;
  onBackPress?: () => void;
  showBackButton?: boolean;
  rightComponent?: React.ReactNode;
};

/**
 * A header component that properly handles safe area insets for iOS devices
 * Includes a back button and title with proper spacing
 */
const SafeHeader: React.FC<SafeHeaderProps> = ({ 
  title, 
  onBackPress, 
  showBackButton = true,
  rightComponent 
}) => {
  const insets = useSafeAreaInsets();
  
  return (
    <View 
      style={[
        styles.container, 
        { 
          paddingTop: Platform.OS === 'ios' ? insets.top > 0 ? 0 : 10 : 0,
          marginBottom: 10
        }
      ]}
    >
      {showBackButton && (
        <TouchableOpacity style={styles.backButton} onPress={onBackPress}>
          <Icon name="arrow-back" size={25} color="#10A7DA" />
        </TouchableOpacity>
      )}
      
      <View style={styles.titleContainer}>
        <Text style={styles.title}>{title}</Text>
      </View>
      
      {rightComponent && (
        <View style={styles.rightComponent}>
          {rightComponent}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: 'transparent',
  },
  backButton: {
    padding: 5,
    zIndex: 10,
  },
  titleContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#1F2A37',
  },
  rightComponent: {
    position: 'absolute',
    right: 16,
  },
});

export default SafeHeader;
