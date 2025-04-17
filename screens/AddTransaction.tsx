import { View, Text, TextInput } from 'react-native'
import {useState} from 'react'

import {ADD_TRANSACTION, AMOUNT, CATEGORY, DATE, DESCRIPTION} from '../constants';

const AddTransactionScreen = () => {

const [amount, setAmount] = useState(0);


  return (
    <View className='px-8 mt-8'>
      <Text className='text-4xl pb-5 font-bold'>{ADD_TRANSACTION}</Text>
      <View className='my-3'>
        <Text className='text-lg mb-2'>{AMOUNT}</Text>
        <TextInput className='border border-gray-300 py-2 px-4 text-xl flex' placeholder='&#8377; 0'/>
      </View>
      <View className='my-3'>
        <Text className='text-lg mb-2'>{CATEGORY}</Text>
        <TextInput className='border border-gray-300 py-2 px-4 text-lg'/>
      </View>
      <View className='my-3'>
        <Text className='text-lg mb-2'>{DESCRIPTION}</Text>
        <TextInput 
         className='border border-gray-300 py-2 px-4 text-lg h-36'
         multiline
         numberOfLines={5}
         />
      </View>
      <View className='my-3'>
        <Text className='text-lg mb-2'>{DATE}</Text>
        <TextInput className='border border-gray-300 py-2 px-4 text-lg'/>
      </View>
    </View>
  )
}

export default AddTransactionScreen;