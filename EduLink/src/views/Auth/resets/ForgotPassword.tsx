import React, {useState} from 'react';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../../models/types';
import ForgotPasswordForm from './components/ForgotPasswordForm';
import ResetPasswordForm from './components/ResetPasswordForm';

type HomeScreenNavigationProp = StackNavigationProp<RootStackParamList, 'ForgotPassword'>;

const ForgotPassword = ({ navigation }: { navigation: HomeScreenNavigationProp }) => {
	const [email, setEmail] = useState('');
	const [showNext, setShowNext] = useState(false);
	
	
	if(!showNext) {
		return (
			<ForgotPasswordForm 
				onResetPress={() => setShowNext(true)} 
				navigation={navigation} 
			/>
		);
	}else {
		return (
			<ResetPasswordForm 
				onResetPress={() => navigation.navigate('LoginScreen')} 
				navigation={navigation} 
			/>
		);
	}
};

export default ForgotPassword;