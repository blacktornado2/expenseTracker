import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { useRouter } from 'expo-router';

export default function AddTransactionNew() {
  const router = useRouter();

  return (
    <View className="flex-1 bg-bg-app dark:bg-bg-app-dark pt-14 px-5">
      <Pressable onPress={() => router.back()}>
        <Text className="text-brand-green font-bold text-base">Cancel</Text>
      </Pressable>
      <Text className="text-tx-primary dark:text-tx-primary-dark font-extrabold text-2xl text-center mt-6">
        New expense
      </Text>
      <Text className="text-tx-secondary dark:text-tx-secondary-dark text-center mt-8">
        Coming soon
      </Text>
    </View>
  );
}
