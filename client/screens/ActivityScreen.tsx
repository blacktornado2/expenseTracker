import React, { useMemo, useState } from 'react';
import { FlatList, Pressable, RefreshControl, SafeAreaView, Text, TextInput, View } from 'react-native';
import { Search, X } from 'lucide-react-native';
import { useDispatch, useSelector } from 'react-redux';

import TransactionRow from '@/components/TransactionRow';
import EditTransactionSheet from '@/components/sheets/EditTransactionSheet';
import { getAllTransactions } from '@/redux/actions/transaction.actions';
import { transactionSelector, transactionsRefreshingSelector } from '@/redux/store/selectors';
import { getCategoryMeta } from '@/constants/categoryMeta';
import { filterTransactions, type ActivityFilter } from '@/utils/transactionFilters';
import { txnTypeToEntryType, type RawStoreTxn } from '@/utils/transactionMappings';
import { useTheme } from '@/contexts/ThemeContext';

const FILTER_CHIPS: { label: string; value: ActivityFilter; color: string }[] = [
  { label: 'All', value: 'all', color: '#2BB3FF' },
  { label: 'Expenses', value: 'expenses', color: '#E8322A' },
  { label: 'Income', value: 'income', color: '#0FB46B' },
];

export default function ActivityScreen() {
  const dispatch = useDispatch();
  const storeState = useSelector(transactionSelector as any) as { transactions: RawStoreTxn[] };
  const { transactions } = storeState;
  const refreshing = useSelector(transactionsRefreshingSelector);
  const { isDark } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<ActivityFilter>('all');
  const [selectedTxn, setSelectedTxn] = useState<RawStoreTxn | null>(null);

  const filtered = useMemo(
    () => filterTransactions(transactions ?? [], filter, searchQuery),
    [transactions, filter, searchQuery]
  );

  const sorted = useMemo(
    () =>
      [...filtered].sort(
        (a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime()
      ),
    [filtered]
  );

  return (
    <SafeAreaView className="flex-1 bg-bg-app dark:bg-bg-app-dark">
      <FlatList
        data={sorted}
        keyExtractor={(item: any) => item._id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: 20, paddingHorizontal: 18, paddingBottom: 26 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => dispatch(getAllTransactions())} tintColor="#0FB46B" />
        }
        ListHeaderComponent={
          <View>
            <Text
              style={{ fontFamily: 'Outfit_700Bold', fontSize: 30 }}
              className="text-tx-primary dark:text-tx-primary-dark mb-4"
            >
              Activity
            </Text>

            {/* Search field */}
            <View
              className="flex-row items-center bg-white dark:bg-bg-card-dark mb-4"
              style={{ borderRadius: 16, borderWidth: 1.5, borderColor: isDark ? '#263024' : '#E5E5E0', paddingHorizontal: 12, paddingVertical: 10 }}
            >
              <Search color={isDark ? '#7E8E7C' : '#9AA096'} size={18} />
              <TextInput
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="Search by name or category"
                placeholderTextColor="#9AA096"
                style={{ flex: 1, marginLeft: 8, color: isDark ? '#E2E9E0' : '#2B2F2A' }}
              />
              {searchQuery.length > 0 ? (
                <Pressable onPress={() => setSearchQuery('')}>
                  <X color={isDark ? '#7E8E7C' : '#9AA096'} size={18} />
                </Pressable>
              ) : null}
            </View>

            {/* Filter chips */}
            <View className="flex-row mb-4" style={{ gap: 8 }}>
              {FILTER_CHIPS.map((chip) => {
                const active = filter === chip.value;
                return (
                  <Pressable
                    key={chip.value}
                    onPress={() => setFilter(chip.value)}
                    style={{
                      paddingHorizontal: 16,
                      paddingVertical: 8,
                      borderRadius: 20,
                      backgroundColor: active ? chip.color : isDark ? '#192218' : '#FFFFFF',
                    }}
                  >
                    <Text style={{ color: active ? '#FFFFFF' : isDark ? '#E2E9E0' : '#2B2F2A', fontWeight: '700', fontSize: 13 }}>
                      {chip.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        }
        ListEmptyComponent={
          <View className="items-center mt-16" style={{ gap: 8 }}>
            <Search color={isDark ? '#7E8E7C' : '#9AA096'} size={40} />
            <Text className="text-tx-primary dark:text-tx-primary-dark font-bold text-base">
              No transactions found
            </Text>
            <Text className="text-tx-tertiary dark:text-tx-tertiary-dark text-sm text-center">
              Try a different search or filter
            </Text>
          </View>
        }
        renderItem={({ item }: { item: any }) => {
          const meta = getCategoryMeta(item.category);
          const type = txnTypeToEntryType(item.transactionType);
          return (
            <Pressable onPress={() => setSelectedTxn(item as RawStoreTxn)}>
              <TransactionRow
                name={item.description || item.category}
                category={item.category}
                date={new Date(item.date)}
                amount={item.amount}
                type={type}
                iconColor={meta.color}
                icon={<meta.Icon size={20} color="#FFFFFF" />}
              />
            </Pressable>
          );
        }}
      />

      <EditTransactionSheet txn={selectedTxn} onClose={() => setSelectedTxn(null)} />
    </SafeAreaView>
  );
}
