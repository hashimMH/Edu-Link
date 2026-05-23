import React from 'react';
import { View, TouchableOpacity, StyleSheet, Text, Image } from 'react-native';

type GoogleButtonProps = {
  onPress: () => void;
};

const GoogleButton: React.FC<GoogleButtonProps> = ({ onPress }) => {
  const GIcon = require('../../../../assets/google_icon.png');
  return (
    <TouchableOpacity style={styles.button} onPress={onPress}>
      <Image source={GIcon} style={styles.icon} />
      <Text style={styles.text}>Sign in with Google</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    paddingVertical: 14,
    paddingHorizontal: 20,
    width: '100%',
    maxWidth: 320,
    gap: 10,
  },
  icon: {
    width: 22,
    height: 22,
    resizeMode: 'contain',
  },
  text: {
    color: '#1F2937',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default GoogleButton;
