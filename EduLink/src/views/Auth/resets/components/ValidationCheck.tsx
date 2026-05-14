// ValidationCheck.tsx
import React from 'react';
import { View, Text , StyleSheet} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons'; 

interface ValidationCheckProps {
  isValid: boolean;
  message: string; 
}

const ValidationCheck: React.FC<ValidationCheckProps> = ({ isValid, message }) => {
  return (
      <View style={pstyles.container}>
        <View
          style={{
            height: 16,
            width: 16,
            borderRadius: 50,
            backgroundColor: '#F2F2F7',
            margin: 5,
          }}
        >
          {isValid && (
            <Icon
              name="checkmark-circle"
              size={16}
              color="#08C8F3"
              style={{ alignSelf: 'center' }}
            />
          )}
        </View>
        <Text style={pstyles.validText}>{message}</Text>
      </View>
  );
};

const pstyles = StyleSheet.create({
	container:{
		alignSelf:'flex-start',
		flexDirection: 'row',
		alignItems: 'center' 
	},
	validText: {
	  fontFamily: 'SF-Pro-Display-Regular',
	  fontWeight: '400',
	  fontSize: 14,
  color: '#8899A8',
},
});

export default ValidationCheck;
