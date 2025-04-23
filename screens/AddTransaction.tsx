import { View, Text, TextInput, TouchableOpacity, Button } from 'react-native'
import { useState } from 'react'
import DateTimePickerModal from "react-native-modal-datetime-picker";
import { format } from "date-fns";
import { useRouter } from 'expo-router';

import AntDesign from '@expo/vector-icons/AntDesign';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

import { ADD_TRANSACTION, AMOUNT, CATEGORY, DATE, DESCRIPTION } from '../constants';

// TODO: How date and time work in date-fns
const AddTransactionScreen = () => {

  const router = useRouter();

  // TODO: make all the variables here, that are used in the form
  const [amount, setAmount] = useState(0);
  const [isDatePickerVisible, setDatePickerVisibility] = useState(false);
  const [date, setDate] = useState(format(new Date(), 'MMMM dd, yyyy'));

  return (
    <View className='px-8 pt-16 bg-gray-100'>
      <Text className='text-4xl pb-5 font-bold'>{ADD_TRANSACTION}</Text>
      <View className='my-3'>
        <View className='mb-2 flex flex-row'>
          <FontAwesome5 name="money-bill" size={24} color="green" />
          <Text className='mx-2 text-xl'>{AMOUNT}</Text>
        </View>
        <TextInput className='border border-gray-300 py-2 px-4 text-xl flex bg-white' placeholder='&#8377; 0' />
      </View>
      <View className='my-3'>
        <View className='mb-2 flex flex-row'>
          <MaterialIcons name="category" size={24} color="blue" />
          <Text className='mx-2 text-xl'>{CATEGORY}</Text>
        </View>
        <TextInput className='border border-gray-300 py-2 px-4 text-xl flex bg-white' placeholder='category' />
      </View>
      <View className='my-3'>
        <View className='mb-2 flex flex-row'>
          <MaterialIcons name="description" size={24} color="brown" />
          <Text className='mx-2 text-xl'>{DESCRIPTION}</Text>
        </View>
        <TextInput
          className='border border-gray-300 py-2 px-4 text-lg h-36 bg-white'
          multiline
          placeholder='Add Description about the transaction'
          numberOfLines={5}
        />
      </View>
      <View className='my-3'>
        <Text className='text-xl mb-2'>{DATE}</Text>
        <TouchableOpacity onPress={() => setDatePickerVisibility(!isDatePickerVisible)} className='border border-gray-300 py-2 px-4 text-lg flex flex-row items-center bg-white' >
          <AntDesign name="calendar" size={24} color="green" />
          <Text className='text-lg mx-4'>{date}</Text>
        </TouchableOpacity>
      </View>
      <DateTimePickerModal
        isVisible={isDatePickerVisible}
        mode="date"
        onConfirm={(date) => { setDatePickerVisibility(false); setDate(format(date, 'MMMM dd, yyyy')) }}
        onCancel={() => setDatePickerVisibility(false)}
      />
      <Button
        title='Save'
        onPress={() => {
          // TODO: Call the saveTransaction API and navigate to home 
          console.log('Button Clicked'); 
          router.navigate('/') 
        }}
        color='green'
      />
    </View>
  )
}

export default AddTransactionScreen;