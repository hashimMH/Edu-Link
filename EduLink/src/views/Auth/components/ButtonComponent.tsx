// components/ButtonComponent.tsx
import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle, TextStyle, TouchableOpacityProps } from 'react-native';

type ButtonComponentProps = TouchableOpacityProps & {
  title: string;
  onPress: () => void;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

const ButtonComponent: React.FC<ButtonComponentProps> = ({ title, onPress, style, textStyle, ...props }) => {
  return (
    <TouchableOpacity style={[styles.button, style]} onPress={onPress} {...props}>
      <Text style={[styles.buttonText, textStyle]}>{title}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
	marginVertical: '10%',
	backgroundColor: '#10A7DA',
	width: '80%',
	height: 50,
	borderRadius: 12,
	alignItems: 'center',
	justifyContent: 'center',
  },
  buttonText: {
    fontFamily: 'SF-Pro-Display-Semibold',
    fontStyle: 'normal',
    fontSize: 20,
    lineHeight: 24,
    fontWeight: '400',
    color: '#ffffff',
  },
});

export default ButtonComponent;
