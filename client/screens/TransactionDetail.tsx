import AntDesign from '@expo/vector-icons/AntDesign';
import { useNavigation, useLocalSearchParams } from 'expo-router';
import React, { useLayoutEffect } from 'react';
import { View, Text, Pressable } from 'react-native';
import { format } from 'date-fns';

const TransactionDetail = () => {
  const navigation = useNavigation();
  const { txn } = useLocalSearchParams();
  const transaction = txn ? JSON.parse(txn) : null;

  useLayoutEffect(() => {
    navigation.setOptions({
      title: 'Transaction Details',
      headerLeft: () => (
        <Pressable onPress={() => navigation.goBack()} style={{ marginLeft: 10 }}>
          <AntDesign name="arrowleft" size={24} color="black" />
        </Pressable>
      ),
    });
  }, [navigation]);

  if (!transaction) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-100">
        <Text className="text-lg text-gray-500">No transaction data found.</Text>
      </View>
    );
  }

  const { description, amount, date, type, category } = transaction;
  const amountColor = type === 'debit' ? 'text-red-500' : 'text-green-500';
  const amountPrefix = type === 'debit' ? '-' : '+';
  const formattedDate = format(new Date(date), 'dd-MM-yyyy');

  return (
    <View className="flex-1 bg-gray-100 p-5">
      <View className="bg-white rounded-2xl shadow-md p-6">
        {/* Header Section */}
        <View className="flex-row items-center mb-4">
          <View className="bg-gray-100 p-3 rounded-full mr-4">
            <Text className="text-2xl">{category.icon || '📂'}</Text>
          </View>
          <View>
            <Text className="text-xl font-semibold text-gray-800">{description}</Text>
            <Text className="text-sm text-gray-500">{category.name}</Text>
          </View>
        </View>

        {/* Amount */}
        <View className="mb-4">
          <Text className="text-sm text-gray-400 mb-1">Amount</Text>
          <Text className={`text-2xl font-bold ${amountColor}`}>
            {amountPrefix}₹{amount.toLocaleString('en-IN')}
          </Text>
        </View>

        {/* Date */}
        <View className="mb-4">
          <Text className="text-sm text-gray-400 mb-1">Date</Text>
          <Text className="text-base text-gray-700">{formattedDate}</Text>
        </View>

        {/* Type */}
        <View className="mb-4">
          <Text className="text-sm text-gray-400 mb-1">Transaction Type</Text>
          <Text className="text-base capitalize text-gray-700">{type}</Text>
        </View>

        {/* Category */}
        <View>
          <Text className="text-sm text-gray-400 mb-1">Category</Text>
          <Text className="text-base text-gray-700">{category.name}</Text>
        </View>
      </View>
    </View>
  );
};

export default TransactionDetail;
