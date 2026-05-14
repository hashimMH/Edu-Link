import React from 'react';
import { View, Text, StyleSheet, StyleProp, TextStyle } from 'react-native';

type TextComponentProps = {
  title?: string;
  subtitle?: string;
  titleStyle?: any
  subtitleStyle?: StyleProp<TextStyle>;
  style?: StyleProp<TextStyle>;
};

const TextComponent: React.FC<TextComponentProps> = ({ title, subtitle, titleStyle, subtitleStyle, style }) => {
  return (
    <View style={styles.container}>
      {title && <Text style={[styles.title, titleStyle]}>{title}</Text> }
      {subtitle && <Text style={[styles.subtitle, subtitleStyle]}>{subtitle}</Text> }
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
  },
  title: {
    fontFamily: 'SF-Pro-Display-Bold',
    fontSize: 20,
    textAlign: 'center',
    color: '#1F2A37',
  },
  subtitle: {
    fontFamily: 'SF-Pro-Display',
    marginVertical: 8,
    fontSize: 14,
    textAlign: 'center',
    color: '#8899A8',
    fontWeight:'300'
  },
});

export default TextComponent;