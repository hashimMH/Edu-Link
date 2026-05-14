import { StyleSheet } from "react-native";

 const RegStyle = StyleSheet.create({
    container: {
      flexDirection:'row',
      alignItems:'center',
      position:'relative',
      paddingVertical: 10,
      marginBottom: 10
    },
    backButton: {
      padding: 5,
      zIndex: 10
    },
      centeredText: {
        position: 'absolute',
        left: 100,
        right: 0,
        textAlign: 'center',
        fontSize: 18,
        fontWeight: 'bold',
    },
});

export default RegStyle