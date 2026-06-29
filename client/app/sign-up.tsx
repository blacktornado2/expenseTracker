import React, { useEffect, useState } from 'react'
import { Text, TextInput, TouchableOpacity, View, KeyboardAvoidingView, ScrollView, Platform } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import { Eye, EyeOff } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useDispatch, useSelector } from 'react-redux';

import { registerUserRequest } from '@/redux/actions/user.actions';
import { userSelector } from '@/redux/store/selectors';
import { SHADOW_HERO } from '@/constants/shadows';
import { GRADIENT_BRAND, GRADIENT_BRAND_BUTTON, GRADIENT_DIAGONAL } from '@/constants/gradients';
import AuthPreviewChart from '@/components/AuthPreviewChart';

const SignUp = () => {
  const router = useRouter();
  const dispatch = useDispatch();

  const { registerUser } = useSelector(userSelector)

  const [name, setName] = useState("")
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (registerUser?.success) {
      router.navigate('/login');
    }
  }, [registerUser?.success]);

  const handleSubmit = (e: { preventDefault: () => void }) => {
    e.preventDefault();
    if (!name || !email || !password) {
      alert("Please fill all the fields");
      return;
    }

    dispatch(registerUserRequest({ name, email, password }));
  }

  return (
    <SafeAreaView className='flex-1 bg-bg-app dark:bg-bg-app-dark' edges={['top']}>
      <ScrollView className='flex-1' keyboardShouldPersistTaps='handled' contentContainerStyle={{ flexGrow: 1 }}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          {/* Hero header */}
          <LinearGradient
            colors={GRADIENT_BRAND}
            start={GRADIENT_DIAGONAL.start}
            end={GRADIENT_DIAGONAL.end}
            style={{ paddingTop: 36, paddingBottom: 64, paddingHorizontal: 24, overflow: 'hidden' }}
          >
            <View pointerEvents="none" style={{ position: 'absolute', top: -30, right: -30, width: 120, height: 120, borderRadius: 60, backgroundColor: 'rgba(255,255,255,0.08)' }} />
            <View pointerEvents="none" style={{ position: 'absolute', bottom: -20, left: -20, width: 90, height: 90, borderRadius: 45, backgroundColor: 'rgba(255,255,255,0.08)' }} />

            <View className='items-center'>
              <View className='h-16 w-16 rounded-full bg-white/20 items-center justify-center mb-4'>
                <FontAwesome5 name="rupee-sign" size={28} color="#FFFFFF" />
              </View>
              <Text style={{ fontFamily: 'Outfit_700Bold' }} className='text-white text-3xl tracking-wide'>
                Create account
              </Text>
              <Text className='text-white/80 text-base font-semibold mt-1'>
                Start tracking your expenses today
              </Text>
            </View>
          </LinearGradient>

          {/* Sign-Up Form */}
          <View
            className='bg-bg-card dark:bg-bg-card-dark mx-5 px-6 pt-8 pb-6'
            style={[{ borderRadius: 30, marginTop: -40 }, SHADOW_HERO]}
          >
            <View className='mb-5'>
              <Text className='text-sm font-bold text-tx-secondary dark:text-tx-secondary-dark mb-2'>
                Name
              </Text>
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder='Enter your full name'
                placeholderTextColor='#9AA096'
                className='px-4 rounded-2xl bg-bg-close dark:bg-bg-close-dark text-tx-primary dark:text-tx-primary-dark'
                style={{ height: 50, fontSize: 16, paddingVertical: 0, textAlignVertical: 'center', includeFontPadding: false }}
                autoCapitalize="words"
                keyboardType="default"
              />
            </View>
            <View className='mb-5'>
              <Text className='text-sm font-bold text-tx-secondary dark:text-tx-secondary-dark mb-2'>
                Email
              </Text>
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder='you@example.com'
                placeholderTextColor='#9AA096'
                className='px-4 rounded-2xl bg-bg-close dark:bg-bg-close-dark text-tx-primary dark:text-tx-primary-dark'
                style={{ height: 50, fontSize: 16, paddingVertical: 0, textAlignVertical: 'center', includeFontPadding: false }}
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
                  placeholder='Create a password'
                  placeholderTextColor='#9AA096'
                  className='flex-1 px-4 text-tx-primary dark:text-tx-primary-dark'
                  style={{ height: 50, fontSize: 16, paddingVertical: 0, textAlignVertical: 'center', includeFontPadding: false }}
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

            <TouchableOpacity
              onPress={(e) => handleSubmit(e)}
              style={{ borderRadius: 16, overflow: 'hidden' }}
            >
              <LinearGradient
                colors={GRADIENT_BRAND_BUTTON}
                start={GRADIENT_DIAGONAL.start}
                end={GRADIENT_DIAGONAL.end}
                style={{ paddingVertical: 16, alignItems: 'center' }}
              >
                <Text className='text-white text-base tracking-wide font-bold'>Sign Up</Text>
              </LinearGradient>
            </TouchableOpacity>

            <View className='flex-row justify-center items-center mt-6'>
              <Text className='text-tx-secondary dark:text-tx-secondary-dark text-sm font-semibold'>
                Already have an account?{' '}
              </Text>
              <TouchableOpacity onPress={() => { router.replace('/login') }}>
                <Text className='text-brand-green text-sm font-bold'>Log In</Text>
              </TouchableOpacity>
            </View>

            <AuthPreviewChart chartType="bar" />
          </View>
        </KeyboardAvoidingView>
      </ScrollView>
    </SafeAreaView>
  )
}

export default SignUp;
