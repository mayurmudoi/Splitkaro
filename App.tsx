import React, {useEffect, useState} from 'react';
import {View, Text, Button, ScrollView, TouchableOpacity, Image} from 'react-native';
import Permissions from 'react-native-permissions';
import SmsAndroid from 'react-native-get-sms-android';
import AsyncStorage from '@react-native-async-storage/async-storage';

const App = () => {
	const [filteredMessages, setFilteredMessages] = useState([]);

	useEffect(() => {
		requestSmsPermission();
		retrieveStoredMessages();
	}, []);

	const requestSmsPermission = async () => {
		const result = await Permissions.request('android.permission.READ_SMS');
		if (result === 'granted') {
			readSmsInbox();
		} else {
			console.log('SMS permission denied');
		}
	};

	const storeMessages = async (messages) => {
		try {
			await AsyncStorage.setItem('filteredMessages', JSON.stringify(messages));
		} catch (error) {
			console.error('Failed to store messages', error);
		}
	};

	const retrieveStoredMessages = async () => {
		try {
			const storedMessages = await AsyncStorage.getItem('filteredMessages');
			if (storedMessages !== null) {
				setFilteredMessages(JSON.parse(storedMessages));
			}
		} catch (error) {
			console.error('Failed to retrieve messages', error);
		}
	};

	const readSmsInbox = () => {
		const filter = {
			box: 'inbox',
			minDate: 0,
			maxDate: Date.now(),
			indexFrom: 0,
			maxCount: 1000,
		};

		SmsAndroid.list(
			JSON.stringify(filter),
			(fail) => {
				console.log('Failed to read SMS', fail);
			},
			(count, smsList) => {
				const messages = JSON.parse(smsList);
				filterTransactionMessages(messages);
			}
		);
	};

	const filterTransactionMessages = (messages) => {
		const keywords = ['expense', 'purchase', 'spent', 'debited', 'credited', 'transaction', 'amount', 'invoice'];
		const filtered = messages.filter((message) =>
			keywords.some((keyword) => message.body.toLowerCase().includes(keyword))
		);
		setFilteredMessages(filtered);
		storeMessages(filtered);
	};

	const deleteMessage = (index) => {
		const updatedMessages = filteredMessages.filter((_, i) => i !== index);
		setFilteredMessages(updatedMessages);
		storeMessages(updatedMessages);
	};

	return (
		<ScrollView style={{padding: 20, backgroundColor: 'white'}}>
			<Text style={{fontSize: 24, marginBottom: 10, color: 'black', fontWeight: '500'}}>Transaction
				Messages:</Text>
			{filteredMessages.length === 0 ? (
				<Text>No transaction-related messages found.</Text>
			) : (
				filteredMessages.map((msg, index) => (
					<View key={index} style={{flexDirection:'row', justifyContent:'center', alignItems:'center', gap:8, marginVertical:8, }}>
						<View style={{padding: 10, borderRadius: 16, backgroundColor: '#f8f8f8', flex:1}}>
							<View style={{flexDirection: 'row', justifyContent: 'space-between'}}>
								<Text
									style={{fontSize: 16, fontWeight: '500', color: 'black'}}>User: {msg.address}</Text>
								<Text style={{fontSize: 16, fontWeight: '500', color: 'black'}}>
									{new Date(parseInt(msg.date)).toLocaleDateString()}
								</Text>
							</View>
							<Text style={{fontSize: 14, color: 'black', marginTop: 4}} numberOfLines={2}>
								Description: {msg.body}
							</Text>
						</View>
						<View>
							<TouchableOpacity
								style={{
									backgroundColor: '#facccc',
									padding: 10,
									borderRadius: 8,
									alignItems: 'center',
								}}
								onPress={() => deleteMessage(index)}
							>
								<Image source={require('./assets/icons/delete.png')} style={{height: 24, width: 24}}/>
							</TouchableOpacity>
						</View>
					</View>
				))
			)}
			<Button title="Read SMS Again" onPress={readSmsInbox}/>
		</ScrollView>
	);
};

export default App;
