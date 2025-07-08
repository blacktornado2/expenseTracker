import React, { useEffect, useState } from 'react'
import { Text, TextInput, TouchableOpacity, View, KeyboardAvoidingView } from 'react-native'
import Toast from 'react-native-toast-message';
import { useRouter } from 'expo-router';
import { useDispatch, useSelector } from 'react-redux';

import { registerUserRequest } from '@/redux/actions/user.actions';
import { userSelector } from '@/redux/store/selectors';
import { SafeAreaView } from 'react-native-safe-area-context';

const SignUp = () => {
  const router = useRouter();
  const dispatch = useDispatch();

  const { registerUser } = useSelector(userSelector)

  const [name, setName] = useState("")
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    if (registerUser?.success) {
      router.navigate('/login');
    }
  }, [registerUser?.success]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name || !email || !password) {
      return Toast.show({
        type: 'error',
        text1: 'Error!',
        text2: 'Please fill in all fields.',
        visibilityTime: 3000
      })
    }

    dispatch(registerUserRequest({ name, email, password }));
  }

  return (
    <SafeAreaView className='flex-1 bg-gray-100'>
      <KeyboardAvoidingView className='flex-1 w-full'>
        <Text className='text-2xl font-bold'>Sign Up Screen</Text>

        <View className='h-[500px] bg-white justify-center mt-10 mx-6 px-5'>
          <View className='mb-5'>
            <Text className='text-xl mb-1 rounded'>
              Name
            </Text>
            <TextInput value={name}
              onChangeText={setName}
              placeholder='Enter your first name'
              className='pt-2 pb-3 px-4 text-lg flex flex-row items-center bg-gray-100'
              autoCapitalize="none"
              keyboardType="default" />
          </View>
          <View className='mb-5'>
            <Text className='text-xl mb-1 rounded'>
              Email
            </Text>
            <TextInput value={email}
              onChangeText={setEmail}
              placeholder='Enter your email'
              className='pt-2 pb-3 px-4 text-lg flex flex-row items-center bg-gray-100'
              autoCapitalize="none"
              keyboardType="email-address" />
          </View>
          <View className='mb-8'>
            <Text className='text-xl mb-1 rounded'>
              Password
            </Text>
            <TextInput value={password}
              onChangeText={setPassword}
              placeholder='Enter your password'
              className='pt-2 pb-3 px-4 text-lg bg-gray-100'
              autoCapitalize="none"
              secureTextEntry
            />
          </View>
          <TouchableOpacity onPress={(e) => handleSubmit(e)} className='bg-green-600 flex items-center py-3 rounded-xl'>
            <Text className='text-white text-lg tracking-wide font-bold'>Sign-Up</Text>
          </TouchableOpacity>
          <Text className='text-center text-lg font-bold mt-2'>
            OR
          </Text>
          <TouchableOpacity onPress={() => { router.replace('/login') }} className='mt-2 bg-blue-600 flex items-center py-3 rounded-xl'>
            <Text className='text-white text-lg tracking-wide font-bold'>Login</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

export default SignUp;