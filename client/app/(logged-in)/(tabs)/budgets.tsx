import React from 'react';
import { View, Text } from 'react-native';
import Card from '@/components/Card';

export default function Budgets() {
  return (
    <View className="flex-1 bg-bg-app dark:bg-bg-app-dark pt-14 px-5 items-center justify-center">
      <Card radius={24} className="p-6">
        <Text className="text-tx-primary dark:text-tx-primary-dark font-bold text-base">
          Coming soon
        </Text>
      </Card>
    </View>
  );
}
