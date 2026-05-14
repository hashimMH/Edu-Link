import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TextInputProps, StyleProp, TextStyle, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import TextComponent from './TextComponent';

type TextInputFieldProps = TextInputProps & {
  title?: string;
  placeholder?: string;
  titleStyle?: StyleProp<TextStyle>;
  isPassword?: boolean;
  warning?: boolean;
  errorMessage?: string
};

const TextInputField: React.FC<TextInputFieldProps> = ({
  title,
  placeholder,
  titleStyle,
  isPassword = false,
  warning,
  errorMessage,
  ...props }) => {
  const [isSecure, setIsSecure] = useState(isPassword);

  return (
    <View style={styles.container}>
      <View style={[styles.inputContainer, warning && { borderColor: '#FB4612' }]}>
        <TextInput
          style={styles.input}
          placeholder={placeholder}
          placeholderTextColor="#999"
          secureTextEntry={isSecure}
          {...props}
        />
        {isPassword && (
          <TouchableOpacity style={styles.iconContainer} onPress={() => setIsSecure(!isSecure)}>
            <Icon name={isSecure ? 'eye-off' : 'eye'} size={20} color="#333" />
          </TouchableOpacity>
        )}
        <Text style={[styles.title, titleStyle, warning && { color: '#FB4612' }]}>{title}</Text>
      </View>
      <View style={{ justifyContent: 'flex-start', }}>{errorMessage &&
        <TextComponent
          title={errorMessage}
          titleStyle={styles.errorText}></TextComponent>}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 12,
    width: '100%',
  },
  title: {
    position: 'absolute',
    top: -10,
    left: 15,
    backgroundColor: 'white',
    paddingHorizontal: 5,
    fontFamily: 'SF-Pro-Display-Semibold',
    fontWeight: '400',
    fontSize: 14,
    color: '#1F2A37',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    backgroundColor: 'white',
    borderColor: '#DFE4EA',
    borderRadius: 12,
    paddingRight: 10,
  },
  input: {
    flex: 1,
    height: 50,
    paddingLeft: 12,
    fontSize: 16,
    color: '#333',
  },
  iconContainer: {
    padding: 5,
  },
  errorText: {
    color: '#FB4612',
    fontSize: 12,
    marginTop: 4,
  }
});

export default TextInputField;