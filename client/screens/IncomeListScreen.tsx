import React, { useState } from 'react';
import { Pressable, SafeAreaView, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSelector } from 'react-redux';

import Card from '@/components/Card';
import TransactionRow from '@/components/TransactionRow';
import EditTransactionSheet from '@/components/sheets/EditTransactionSheet';
import { getCategoryMeta } from '@/constants/categoryMeta';
import { transactionSelector } from '@/redux/store/selectors';
import type { RawStoreTxn } from '@/utils/transactionMappings';

const GREEN = '#0FB46B';

export default function IncomeListScreen() {
  const router = useRouter();
  const { transactions } = useSelector(transactionSelector) as any;
  const [selectedTxn, setSelectedTxn] = useState<RawStoreTxn | null>(null);

  const incomeTxns: RawStoreTxn[] = (Array.isArray(transactions) ? transactions : [])
    .filter((txn: RawStoreTxn) => txn.transactionType === 'credit')
    .sort((a: RawStoreTxn, b: RawStoreTxn) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const totalIncome = incomeTxns.reduce((sum, txn) => sum + txn.amount, 0);

  return (
    <SafeAreaView className="flex-1 bg-bg-app dark:bg-bg-app-dark">
      <ScrollView contentContainerStyle={{ paddingTop: 54, paddingHorizontal: 18, paddingBottom: 26 }}>
        <View className="flex-row items-center justify-between mb-5">
          <Pressable onPress={() => router.back()}>
            <Text style={{ color: GREEN }} className="font-bold text-base">← Home</Text>
          </Pressable>
          <Text className="text-tx-primary dark:text-tx-primary-dark font-extrabold text-base">Income</Text>
          <View style={{ width: 60 }} />
        </View>

        <Card radius={22} className="p-4 mb-5" style={{ backgroundColor: '#0FB46B' }}>
          <Text style={{ color: 'rgba(255,255,255,0.85)' }} className="text-xs font-semibold">
            Total income
          </Text>
          <Text style={{ color: '#FFFFFF' }} className="font-extrabold text-2xl mt-1">
            ₹{totalIncome.toLocaleString('en-IN')}
          </Text>
          <Text style={{ color: 'rgba(255,255,255,0.85)' }} className="text-xs font-semibold mt-1">
            {incomeTxns.length} transaction{incomeTxns.length === 1 ? '' : 's'}
          </Text>
        </Card>

        {incomeTxns.length === 0 ? (
          <Text className="text-tx-tertiary dark:text-tx-tertiary-dark text-sm text-center mt-4">
            No income recorded yet
          </Text>
        ) : (
          incomeTxns.map((txn) => {
            const meta = getCategoryMeta(txn.category);
            return (
              <TouchableOpacity key={txn._id} onPress={() => setSelectedTxn(txn)}>
                <TransactionRow
                  name={txn.description || txn.category}
                  category={txn.category}
                  date={new Date(txn.date)}
                  amount={txn.amount}
                  type="income"
                  iconColor={meta.color}
                  icon={<meta.Icon size={20} color="#FFFFFF" />}
                />
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>
      <EditTransactionSheet txn={selectedTxn} onClose={() => setSelectedTxn(null)} />
    </SafeAreaView>
  );
}
