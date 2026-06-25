import { View, Text, ScrollView, TextInput, KeyboardAvoidingView, TouchableOpacity, Platform } from 'react-native'
import React, { useState, useEffect } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import { Eye, EyeOff } from 'lucide-react-native';

import { loginUserRequest } from '@/redux/actions/user.actions';
import { userSelector } from '@/redux/store/selectors';
import { SHADOW_HERO } from '@/constants/shadows';
import AuthPreviewChart from '@/components/AuthPreviewChart';

const Login = () => {
  const router = useRouter();
  const dispatch = useDispatch();

  const { user, error } = useSelector(userSelector);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoginDisabled, setIsLoginDisabled] = useState(false);

  useEffect(() => {
    if (!!user) {
      router.replace('/');
    }
  }, [user])

  useEffect(() => {
    if (error) {
      setIsLoginDisabled(false);
    }
  }, [error])

  const resetForm = () => {
    setEmail('');
    setPassword('');
  }

  const loginUser = () => {
    setIsLoginDisabled(true);
    dispatch(loginUserRequest({ email, password }));
    resetForm();
  };

  return (
    <SafeAreaView className='flex-1 bg-bg-app dark:bg-bg-app-dark' edges={['top']}>
      <ScrollView className='flex-1' keyboardShouldPersistTaps='handled' contentContainerStyle={{ flexGrow: 1 }}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} className='flex-1'>
          {/* Hero header */}
          <LinearGradient
            colors={['#13C076', '#0A9E5E']}
            style={{ paddingTop: 36, paddingBottom: 64, paddingHorizontal: 24, overflow: 'hidden' }}
          >
            <View pointerEvents="none" style={{ position: 'absolute', top: -30, right: -30, width: 120, height: 120, borderRadius: 60, backgroundColor: 'rgba(255,255,255,0.08)' }} />
            <View pointerEvents="none" style={{ position: 'absolute', bottom: -20, left: -20, width: 90, height: 90, borderRadius: 45, backgroundColor: 'rgba(255,255,255,0.08)' }} />

            <View className='items-center'>
              <View className='h-16 w-16 rounded-full bg-white/20 items-center justify-center mb-4'>
                <FontAwesome5 name="rupee-sign" size={28} color="#FFFFFF" />
              </View>
              <Text style={{ fontFamily: 'BricolageGrotesque_800ExtraBold' }} className='text-white text-3xl tracking-wide'>
                Welcome back
              </Text>
              <Text className='text-white/80 text-base font-semibold mt-1'>
                Log in to keep tracking your spending
              </Text>
            </View>
          </LinearGradient>

          {/* Login Form */}
          <View
            className='flex-1 bg-bg-card dark:bg-bg-card-dark mx-5 px-6 pt-8 pb-6'
            style={[{ borderRadius: 30, marginTop: -40 }, SHADOW_HERO]}
          >
            <View className='mb-5'>
              <Text className='text-sm font-bold text-tx-secondary dark:text-tx-secondary-dark mb-2'>
                Email
              </Text>
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder='you@example.com'
                placeholderTextColor='#9AA096'
                className='px-4 py-3 text-base rounded-2xl bg-bg-close dark:bg-bg-close-dark text-tx-primary dark:text-tx-primary-dark'
                autoCapitalize="none"
                keyboardType="email-address"
              />
            </View>
            <View className='mb-6'>
              <Text className='text-sm font-bold text-tx-secondary dark:text-tx-secondary-dark mb-2'>
                Password
              </Text>
              <View className='flex-row items-center rounded-2xl bg-bg-close dark:bg-bg-close-dark'>
                <TextInput
                  value={password}
                  onChangeText={setPassword}
                  placeholder='Enter your password'
                  placeholderTextColor='#9AA096'
                  className='flex-1 px-4 py-3 text-base text-tx-primary dark:text-tx-primary-dark'
                  autoCapitalize="none"
                  secureTextEntry={!showPassword}
                />
                <TouchableOpacity onPress={() => setShowPassword((prev) => !prev)} className='px-4'>
                  {showPassword ? (
                    <EyeOff size={20} color="#8E948C" />
                  ) : (
                    <Eye size={20} color="#8E948C" />
                  )}
                </TouchableOpacity>
              </View>
            </View>

            {!!error && (
              <Text className='text-center text-brand-red font-semibold mb-4'>
                Invalid email or password. Please try again.
              </Text>
            )}

            <TouchableOpacity
              disabled={isLoginDisabled}
              onPress={loginUser}
              className='bg-brand-green flex items-center py-4 rounded-2xl'
              style={{ opacity: isLoginDisabled ? 0.6 : 1 }}
            >
              <Text className='text-white text-base tracking-wide font-bold'>Log In</Text>
            </TouchableOpacity>

            <View className='flex-row justify-center items-center mt-6'>
              <Text className='text-tx-secondary dark:text-tx-secondary-dark text-sm font-semibold'>
                Don&apos;t have an account?{' '}
              </Text>
              <TouchableOpacity onPress={() => router.navigate('/sign-up')}>
                <Text className='text-brand-green text-sm font-bold'>Sign Up</Text>
              </TouchableOpacity>
            </View>

            <AuthPreviewChart />
          </View>
        </KeyboardAvoidingView>
      </ScrollView>
    </SafeAreaView>
  )
}

export default Login;
