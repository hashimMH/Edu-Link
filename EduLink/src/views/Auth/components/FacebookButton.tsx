// src/components/FacebookButton.tsx
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';

type FacebookButtonProps = {
  onPress: () => void;
  loading?: boolean;
};

const FacebookButton: React.FC<FacebookButtonProps> = ({ onPress, loading = false }) => {
  return (
    <TouchableOpacity style={styles.button} onPress={onPress} disabled={loading}>
      <View style={styles.iconContainer}>
        <Icon name="logo-facebook" size={24} color="#fff" />
      </View>
      {loading && <ActivityIndicator size="small" color="#fff" style={styles.loading} />}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1877F2',
    borderRadius: 17,
    width: 61,
	height: 61,
	margin: 10,
  },
  iconContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loading: {
    marginLeft: 10,
  },
});

export default FacebookButton;
