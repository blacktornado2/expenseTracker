import React from 'react';
import { View } from 'react-native';

import Dashboard from '@/screens/Dashboard';

export default function HomeScreen() {

  return (
    <View className='pt-10 bg-gray-50 flex-1'>
      <Dashboard />
    </View>
  );
}
