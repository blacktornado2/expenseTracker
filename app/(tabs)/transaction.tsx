import { Text, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import React from 'react';

import AddTransactionScreen from '@/screens/AddTransaction';

export default function TabTwoScreen() {
  return (
    <TouchableOpacity onPress={() => router.navigate('/')} style={{ paddingTop: 30 }}>
      <Text>Transaction</Text>
      <AddTransactionScreen />
    </TouchableOpacity>
  );
}