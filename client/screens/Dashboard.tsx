import React, { useCallback, useState } from 'react';
import { RefreshControl, SafeAreaView, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { useDispatch, useSelector } from 'react-redux';
import { format } from 'date-fns';
import { LinearGradient } from 'expo-linear-gradient';
import { Moon, Sun, Sunset, ArrowUpRight, PiggyBank } from 'lucide-react-native';

import EditTransactionSheet from '@/components/sheets/EditTransactionSheet';
import { txnTypeToEntryType, type RawStoreTxn } from '@/utils/transactionMappings';
import IconTile from '@/components/IconTile';
import Avatar from '@/components/Avatar';
import TransactionRow from '@/components/TransactionRow';
import HeroCard from '@/components/HeroCard';
import SpendBreakdownCard from '@/components/SpendBreakdownCard';
import PressableScale from '@/components/PressableScale';
import FadeInView from '@/components/FadeInView';
import { getCategoryMeta } from '@/constants/categoryMeta';
import { shadowForGradientCard } from '@/constants/shadows';
import { GRADIENT_INCOME, GRADIENT_VIOLET, GRADIENT_DIAGONAL } from '@/constants/gradients';
import { getAllTransactions } from '@/redux/actions/transaction.actions';
import { fetchUserRequest } from '@/redux/actions/user.actions';
import {
  transactionSelector,
  transactionsRefreshingSelector,
  userSelector,
  selectMonthSpent,
  selectMonthIncome,
  selectSpendByCategory,
} from '@/redux/store/selectors';

const DEFAULT_MONTHLY_BUDGET = 50000;

type Greeting = {
  text: string;
  Icon: typeof Sun;
  color: string;
};

function getGreeting(hour: number): Greeting {
  if (hour >= 5 && hour < 12) {
    return { text: 'Good morning', Icon: Sun, color: '#F59E0B' };
  }
  if (hour >= 12 && hour < 17) {
    return { text: 'Good afternoon', Icon: Sun, color: '#F97316' };
  }
  if (hour >= 17 && hour < 21) {
    return { text: 'Good evening', Icon: Sunset, color: '#E8703A' };
  }
  return { text: 'Good night', Icon: Moon, color: '#7C5CFC' };
}

export default function Dashboard() {
  const router = useRouter();
  const dispatch = useDispatch();
  const { transactions } = useSelector(transactionSelector);
  const { user } = useSelector(userSelector);
  const monthSpent = useSelector(selectMonthSpent);
  const monthIncome = useSelector(selectMonthIncome);
  const spendByCategory = useSelector(selectSpendByCategory);
  const refreshing = useSelector(transactionsRefreshingSelector);

  useFocusEffect(
    useCallback(() => {
      dispatch(getAllTransactions());
      if (user?.email) {
        dispatch(fetchUserRequest(user.email));
      }
    }, [dispatch, user?.email])
  );

  const now = new Date();
  const greeting = getGreeting(now.getHours());
  const monthLabel = format(now, 'MMMM');
  const saved = monthIncome - monthSpent;
  const monthlyBudget = user?.monthlyIncome && user.monthlyIncome > 0 ? user.monthlyIncome : DEFAULT_MONTHLY_BUDGET;
  const budgetLeft = Math.max(0, monthlyBudget - monthSpent);
  const spentPct = monthlyBudget > 0 ? (monthSpent / monthlyBudget) * 100 : 0;

  const chartData = spendByCategory.map((entry) => ({
    label: entry.label,
    value: entry.value,
    color: getCategoryMeta(entry.label).color,
  }));

  const [selectedTxn, setSelectedTxn] = useState<RawStoreTxn | null>(null);

  const recentTransactions = Array.isArray(transactions)
    ? [...transactions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5)
    : [];

  return (
    <SafeAreaView className="flex-1 bg-bg-app dark:bg-bg-app-dark">
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: 20, paddingHorizontal: 18, paddingBottom: 26 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              dispatch(getAllTransactions());
              if (user?.email) {
                dispatch(fetchUserRequest(user.email));
              }
            }}
            tintColor="#0FB46B"
          />
        }
      >
        <View className="flex-row items-center justify-between mb-5">
          <View className="flex-row items-center" style={{ gap: 10 }}>
            <View
              className="bg-bg-subtle dark:bg-bg-subtle-dark"
              style={{
                width: 26,
                height: 26,
                borderRadius: 9,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <greeting.Icon size={15} color={greeting.color} />
            </View>
            <View>
              <Text className="text-tx-tertiary dark:text-tx-tertiary-dark text-xs font-semibold">
                {greeting.text}
              </Text>
              <Text className="text-tx-primary dark:text-tx-primary-dark text-base font-extrabold">
                {monthLabel} overview
              </Text>
            </View>
          </View>
          <TouchableOpacity onPress={() => router.push('/profile')}>
            <Avatar initial={user?.firstName?.[0] ?? 'A'} uri={user?.profilePicture} />
          </TouchableOpacity>
        </View>

        <FadeInView delay={0}>
          <HeroCard
            label={user?.firstName ?? 'You'}
            subtitle="Spent this month"
            amount={monthSpent}
            progressPct={spentPct}
            footerLeft={`₹${budgetLeft.toLocaleString('en-IN')} left`}
            footerRight={`of ₹${monthlyBudget.toLocaleString('en-IN')}`}
          />
        </FadeInView>

        <FadeInView delay={80} style={{ flexDirection: 'row', marginTop: 16, gap: 12 }}>
          <PressableScale containerStyle={{ flex: 1, borderRadius: 22, ...shadowForGradientCard('#22C55E') }} onPress={() => router.push('/income-list')}>
            <LinearGradient
              colors={GRADIENT_INCOME}
              start={GRADIENT_DIAGONAL.start}
              end={GRADIENT_DIAGONAL.end}
              style={{ borderRadius: 22, padding: 16, overflow: 'hidden' }}
            >
              <View
                pointerEvents="none"
                style={{ position: 'absolute', top: -24, right: -24, width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(255,255,255,0.10)' }}
              />
              <IconTile backgroundColor="rgba(255,255,255,0.22)">
                <ArrowUpRight size={18} color="#FFFFFF" />
              </IconTile>
              <Text className="text-white/80 text-xs font-semibold mt-3">Income</Text>
              <Text className="text-white text-lg font-extrabold">
                ₹{monthIncome.toLocaleString('en-IN')}
              </Text>
            </LinearGradient>
          </PressableScale>
          <PressableScale containerStyle={{ flex: 1, borderRadius: 22, ...shadowForGradientCard('#7C5CFC') }} onPress={() => router.push('/savings')}>
            <LinearGradient
              colors={GRADIENT_VIOLET}
              start={GRADIENT_DIAGONAL.start}
              end={GRADIENT_DIAGONAL.end}
              style={{ borderRadius: 22, padding: 16, overflow: 'hidden' }}
            >
              <View
                pointerEvents="none"
                style={{ position: 'absolute', top: -24, right: -24, width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(255,255,255,0.10)' }}
              />
              <IconTile backgroundColor="rgba(255,255,255,0.22)">
                <PiggyBank size={18} color="#FFFFFF" />
              </IconTile>
              <Text className="text-white/80 text-xs font-semibold mt-3">Saved</Text>
              <Text className="text-white text-lg font-extrabold">
                ₹{saved.toLocaleString('en-IN')}
              </Text>
            </LinearGradient>
          </PressableScale>
        </FadeInView>

        <FadeInView delay={160}>
          <SpendBreakdownCard data={chartData} />
        </FadeInView>

        <View className="flex-row items-center justify-between mt-6 mb-3">
          <Text className="text-tx-primary dark:text-tx-primary-dark text-base font-extrabold">Recent</Text>
          <TouchableOpacity onPress={() => router.push('/transactions')}>
            <Text style={{ color: '#0FB46B' }} className="font-bold text-sm">
              See all
            </Text>
          </TouchableOpacity>
        </View>

        {recentTransactions.length === 0 ? (
          <Text className="text-tx-tertiary dark:text-tx-tertiary-dark text-sm text-center mt-4">
            No transactions yet
          </Text>
        ) : (
          recentTransactions.map((txn: any) => {
            const meta = getCategoryMeta(txn.category);
            const type = txnTypeToEntryType(txn.transactionType);
            return (
              <TouchableOpacity
                key={txn._id ?? txn.id}
                onPress={() => setSelectedTxn(txn as RawStoreTxn)}
              >
                <TransactionRow
                  name={txn.description || txn.category}
                  category={txn.category}
                  date={new Date(txn.date)}
                  amount={txn.amount}
                  type={type}
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
