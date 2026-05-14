import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, ActivityIndicator } from 'react-native';

type GoogleButtonProps = {
  onPress: () => void;
  loading?: boolean;
};

const GoogleButton: React.FC<GoogleButtonProps> = ({ onPress, loading = false }) => {
 const GIcon = require('../../../../assets/google_icon.png');
	return (
    <TouchableOpacity style={styles.button} onPress={onPress} disabled={loading}>
      <View style={styles.iconContainer}>
        <Image
          source={GIcon}
          style={styles.icon}
        />
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
    backgroundColor: '#fff',
    borderRadius: 17,
	borderWidth: 1,
    width: 61,
	height: 61,
    margin: 10,
  },
  iconContainer: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  icon: {
    width: 24,
    height: 24,
    resizeMode: 'contain',
  },
  loading: {
    marginLeft: 10,
  },
});

export default GoogleButton;
