import React from 'react';
import { SafeAreaView, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { format } from 'date-fns';
import { TransactionRow } from './Dashboard';
import { useRouter } from 'expo-router';
import { useSelector } from 'react-redux';
import { transactionSelector } from '@/redux/store/selectors';

const categoryIcons: Record<string, string> = {
  'Shopping': '🛍️',
  'salary': '💰',
  'Bank Transfer': '🏦',
  'Bill Payment': '📄',
  'Snacks and food': '🍔',
  // Add more as needed
};

const TransactionHistory = () => {
  const router = useRouter();
  const {transactions} = useSelector(transactionSelector);
    
  const groupTransactionsByMonth = (transactions: any[]) => {
    const grouped: Record<string, any[]> = {};

    transactions.forEach(txn => {
      const monthKey = format(new Date(txn.date), 'yyyy-MM');

      const normalizedTxn = {
        id: txn._id,
        userId: txn.user,
        type: txn.transactionType,
        amount: txn.amount,
        date: txn.date,
        category: {
          name: txn.category,
          icon: categoryIcons[txn.category] || '💳',
        },
        description: txn.description || txn.category,
      };

      if (!grouped[monthKey]) {
        grouped[monthKey] = [];
      }

      grouped[monthKey].push(normalizedTxn);
    });

    const result = Object.keys(grouped)
      .sort((a, b) => b.localeCompare(a))
      .map(month => ({
        month,
        transactions: grouped[month].sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
        ),
      }));

    return result;
  };

  const groupedByMonth = groupTransactionsByMonth(transactions);

  return (
    <SafeAreaView className="flex-1 bg-gray">
      <ScrollView>
        <Text className="text-3xl font-bold px-5 pt-5 pb-2">Transaction History</Text>

        {groupedByMonth.map(monthGroup => (
          <View key={monthGroup.month} className="mb-6 mx-5">
            <Text className="text-xl font-bold py-2">
              {format(new Date(`${monthGroup.month}-01`), 'MMMM yyyy')}
            </Text>

            {monthGroup.transactions.map((txn, index, arr) => {
              const txnDate = format(new Date(txn.date), 'MMM dd');
              const title = `${txn.category.icon} ${txn.description}`;
              const amount = txn.type === 'debit' ? `-₹${txn.amount}` : `+₹${txn.amount}`;

              return (
                <TouchableOpacity
                  key={txn.id}
                  className="mb-1.5 rounded-full"
                  onPress={() =>
                    router.push({
                      pathname: '/transactionDetail',
                      params: { txn: JSON.stringify(txn) },
                    })
                  }
                >
                  <TransactionRow
                    date={txnDate}
                    title={title}
                    amount={amount}
                    isLast={true}
                    type={txn.type}
                  />
                </TouchableOpacity>
              );
            })}
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
};

export default TransactionHistory;
