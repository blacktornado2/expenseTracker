import React, { useCallback, useEffect } from 'react';
import { Text, SafeAreaView, View, ScrollView, TouchableOpacity } from 'react-native';
import ExpenseBox from '@/components/ExpenseBox';
import PieChart from 'react-native-pie-chart';
import Feather from 'react-native-vector-icons/Feather';
import { useFocusEffect, useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { logoutUserRequest, logoutUserSuccess } from '@/redux/actions/user.actions';
import { useDispatch, useSelector } from 'react-redux';
import {transactionSelector} from '@/redux/store/selectors';
import { getAllTransactions } from '@/redux/actions/transaction.actions';
import transactionsData from '../utils/data/transactions.json';
import { getRecentTransactions } from '../utils/helpers';
import { format } from 'date-fns';

export const TransactionRow = ({
  key,
  date,
  title,
  amount,
  isLast,
  type,
}: {
  date: string;
  title: string;
  amount: string;
  isLast?: boolean;
  type: string;
}) => {
  const [month, day] = date.split(' ');

  const amountColor = type === 'debit' ? 'text-red-500' : 'text-green-500';

  return (
    <View className="px-5 py-4 bg-white rounded-2xl" key={key}>
      <View className="flex-row justify-between items-center">
        {/* Left side: Date + Title */}
        <View className="flex-row items-center flex-1">
          <View className="items-center">
            <Text className="text-lg font-bold">{day}</Text>
            <Text className="text-xs text-gray-500">{month}</Text>
          </View>
          <Text numberOfLines={2} className="ml-8 text-lg font-medium">{title}</Text>
        </View>

        {/* Right side: Amount */}
        <Text className={`text-lg font-semibold ${amountColor}`}>{amount}</Text>
      </View>

      {!isLast && <View className="mt-4 mx-2 h-px bg-gray-200" />}
    </View>
  );
};


const Dashboard = ({ navigation }: any) => {
  const router = useRouter();
  const dispatch = useDispatch();
  const {transactions} = useSelector(transactionSelector);

  useFocusEffect(
    useCallback(() => {
      dispatch(getAllTransactions());
    }, [dispatch])
  );

  const handleLogout = async () => {
    dispatch(logoutUserRequest());
    await AsyncStorage.removeItem('JWT_TOKEN');
    dispatch(logoutUserSuccess());
    router.replace('/login');
  }

  const categoryData = [
    { label: 'Food', value: 40, color: '#FF9384' },
    { label: 'Transport', value: 30, color: '#36A2EB' },
    { label: 'Shopping', value: 20, color: '#FFCE56' },
    { label: 'Other', value: 10, color: '#4BC0C0' },
  ];

  const sliceColor = categoryData.map(item => item.color);
  const recentTransactions = getRecentTransactions(transactionsData);

  return (
    <SafeAreaView className='flex-1 bg-gray-50'>
      <ScrollView contentContainerStyle={{ paddingBottom: 30 }}>
        <View className='mx-6 mt-15'>
          <View className="flex-row items-center justify-between mt-4">
            <Text className='text-4xl text-black font-bold pl-5'>Dashboard</Text>
            <TouchableOpacity className='bg-green-600 rounded-3xl shadow-md p-2' onPress={() => router.push('/addTransaction')}>
              <Feather name="plus" size={24} color="#FFF" />
            </TouchableOpacity>
          </View>

          <View className='flex-row gap-2 justify-between mt-6'>
            <ExpenseBox title='Total Income:' amount={5000} className="bg-green-400" />
            <ExpenseBox title='Total Expense:' amount={3000} className="bg-red-300" />
            <ExpenseBox title='Balance:' amount={2000} className="bg-gray-100" />
          </View>

          <View className='mt-8 px-5 bg-white py-8 rounded-2xl'>
            <Text className='text-2xl font-semibold mb-6'>Category Breakdown</Text>
            <View className='flex-row'>
              <PieChart
                widthAndHeight={160}
                series={categoryData}
                sliceColor={sliceColor}
                coverRadius={0.6}
                coverFill={'#FFF'}
              />
              <View className="mt-4 w-full ml-5">
                {categoryData.map((item, index) => (
                  <View key={index} className="flex-row items-center mb-2">
                    <View style={{ backgroundColor: item.color }} className="w-4 h-4 rounded-full mr-2" />
                    <Text className="text-base">{item.label} - {item.value} %</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>

          <Text className='text-2xl font-semibold mt-8 mb-4'>Recent Transactions</Text>
          <View className="bg-white rounded-2xl">
            {recentTransactions.map((txn, index) => {
              const txnDate = format(new Date(txn.date), 'MMM dd');
              const title = `${txn.category}`;
              const amount = txn.transactionType === 'debit' ? `-₹${txn.amount}` : `+₹${txn.amount}`;
              const isLast = index === recentTransactions.length - 1;

              return (
                <TransactionRow
                  key={txn.id}
                  date={txnDate}
                  title={title}
                  amount={amount}
                  type={txn.transactionType}
                  isLast={isLast}
                />
              );
            })}
          </View>
          <TouchableOpacity className='items-center' onPress={() => router.push('/transactions')}>
            <Text className='text-green-700 font-semibold mt-5 text-xl'>View All</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default Dashboard;
