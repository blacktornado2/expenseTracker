import { ButtonType } from '../types/global.d.ts';

import { View, Text, ScrollView, TextInput, KeyboardAvoidingView, TouchableOpacity } from 'react-native'
import React, { useState } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context';

import FontAwesome5 from '@expo/vector-icons/FontAwesome5';

const Login = () => {

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const loginUser = () => { };
    const signUp = () => { };

    return (
        <SafeAreaView >
            <ScrollView className='flex flex-col bg-gray-100'>
                <KeyboardAvoidingView>
                    {/* Login header */}
                    <View className='mt-20 flex flex-col justify-center gap-3'>
                        <View className='flex justify-center mx-auto items-center flex-1 h-24 w-24 rounded-full bg-white border border-green-600'>
                            <FontAwesome5 name="rupee-sign" size={48} color="forestgreen" />
                        </View>
                        <Text className='text-4xl text-center font-bold tracking-wider'>Login</Text>
                    </View>

                    {/* Login Form */}
                    <View className='flex flex-col bg-white justify-center mt-10 mx-6 px-5 py-5'>
                        <View className='mb-5'>
                            <Text className='text-xl mb-1 rounded'>
                                Email
                            </Text>
                            <TextInput value={email} onChangeText={setEmail} placeholder='Enter your email' className='pt-2 pb-3 px-4 text-lg flex flex-row items-center bg-gray-100' />
                        </View>
                        <View className='mb-8'>
                            <Text className='text-xl mb-1 rounded'>
                                Password
                            </Text>
                            <TextInput value={password} onChangeText={setPassword} placeholder='Enter your password' className='pt-2 pb-3 px-4 text-lg bg-gray-100' />
                        </View>
                        <TouchableOpacity onPress={loginUser} className='bg-green-600 flex items-center py-3 rounded-xl'>
                            <Text className='text-white text-lg  tracking-wide font-bold'>Login</Text>
                        </TouchableOpacity>
                        <Text className='text-center text-lg font-bold mt-2'>
                            OR
                        </Text>
                        <TouchableOpacity onPress={signUp} className='mt-2 bg-blue-600 flex items-center py-3 rounded-xl'>
                            <Text className='text-white text-lg tracking-wide font-bold'>Sign Up</Text>
                        </TouchableOpacity>
                    </View>
                </KeyboardAvoidingView>
            </ScrollView>
        </SafeAreaView>
    )
}

export default Login