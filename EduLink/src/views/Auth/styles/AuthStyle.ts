import {StyleSheet} from 'react-native';

const AuthStyle = StyleSheet.create({
  container: {
    flex: 1,
    marginTop: '5%',
    alignItems: 'center',
  },
  form: {
    width: '100%',
    padding: 16,
    alignItems: 'center',
  },
  forgot: {
    fontFamily: 'SF-Pro-Display-Semibold',
    fontSize: 14,
    fontWeight: '400',
    color: '#10A7DA',
  },
  forgotStyle: {
    alignSelf: 'flex-end',
  },
  loginbt: {
    marginVertical: '10%',
    backgroundColor: '#10A7DA',
    width: '80%',
    height: 50,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loginText: {
    fontFamily: 'SF-Pro-Display-Semibold',
    fontStyle: 'normal',
    fontSize: 20,
    lineHeight: 24,
    fontWeight: '400',
    color: '#ffffff',
  },
  or: {
    flex: 0.5,
    alignItems: 'center',
    width: '100%',
    borderTopWidth: 1,
    borderColor: '#DFE4EA',
  },
  orText: {
    marginTop: -12,
    fontFamily: 'SF-Pro-Display-Semibold',
    fontSize: 14,
    fontWeight: '400',
    color: '#1F2A37',
    backgroundColor: '#ffffff',
  },
  logo: {
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  logoText: {
    fontFamily: 'SF-Pro-Display-Bold',
    fontSize: 30,
    fontWeight: '700',
    color: '#10A7DA',
  },
  logoImage: {
    width: 240,
    height: 80,
  },
  btn_view: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  footer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  footerText: {
    fontFamily: 'SF-Pro-Display-Semibold',
    fontSize: 14,
    fontWeight: '500',
    color: '#9EA1AE',
  },
  validText: {
    color: 'green',
  },
  invalidText: {
    color: 'red',
  },
});

export default AuthStyle;
