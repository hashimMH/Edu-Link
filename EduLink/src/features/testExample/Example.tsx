import React from 'react';
import { View, Text, Button, TouchableOpacity } from 'react-native';
import { useSelector } from 'react-redux';
import { RootState } from '../../app/store';
import { useDispatch } from 'react-redux';
import { decrement, increment, incrementByAmount } from '../countSlice';

const Example = () => {
	const count = useSelector((state: RootState) => state.counter.value)
	const dispatch = useDispatch()

	return (
		<View style={{flex :1 , alignItems:'center', justifyContent:'center'}}>

			<View style={{width:'60%'}}>

			<Text style={{textAlign:'center', padding:20, fontSize:25}}>{count}</Text>
				{/* <Button  onPress={() => dispatch(increment())} title="+" /> */}
				<TouchableOpacity style={{backgroundColor:'red', height:100, justifyContent:"center", alignItems:"center"}} onPress={() => dispatch(increment())}><Text>+</Text></TouchableOpacity>
				<Button onPress={() => dispatch(decrement())} title="-" />
				<Button onPress={() => dispatch(incrementByAmount(100))} title="++" />

			</View>
		</View>
	);
};

export default Example;