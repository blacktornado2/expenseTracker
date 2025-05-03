import React from 'react';
import { SafeAreaView, ScrollView, Text, View } from 'react-native';
import transactionsData from '../utils/data/transactions.json'; // assuming JSON is saved as transactions.json
import { format } from 'date-fns';
import { TransactionRow } from './Dashboard';

const TransactionHistory = () => {
  return (
    <SafeAreaView className="flex-1 bg-gray">
      <ScrollView>
        <Text className="text-3xl font-bold px-5 pt-5 pb-2">Transaction History</Text>

        {transactionsData.map((monthGroup) => (
          <View key={monthGroup.month} className="mb-6 mx-5">
            <Text className="text-xl font-semibold py-2">
              {format(new Date(monthGroup.month + '-01'), 'MMMM yyyy')}
            </Text>

            {monthGroup.transactions.map((txn, index, arr) => {
                const txnDate = format(new Date(txn.date), 'MMM dd'); // e.g. "Apr 03"
                const title = `${txn.category.icon} ${txn.description}`;
                const isLast = index === arr.length - 1;
                const amount = txn.type === 'debit' ? `-₹${txn.amount}` : `+₹${txn.amount}`;

                return (
                    <View key={txn.id} className="mb-1.5 rounded-full">
                        <TransactionRow
                            date={txnDate}
                            title={title}
                            amount={amount}
                            isLast={true}
                            type={type}
                        />
                    </View>
                );
            })}

          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
};

export default TransactionHistory;
