import { View } from 'react-native';
import { useRouter } from 'expo-router';
import React from 'react';
import Dashboard from '@/screens/Dashboard';

export default function HomeScreen() {
  const router = useRouter();

  return (
    <View className='bg-gray-50 flex-1'>
          <Dashboard />
      </View>
  );
}
