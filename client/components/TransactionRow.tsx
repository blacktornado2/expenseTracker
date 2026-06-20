import React, { ReactNode } from 'react';
import { View, Text } from 'react-native';
import { format } from 'date-fns';
import Card from './Card';
import IconTile from './IconTile';

type TransactionRowProps = {
  name: string;
  category: string;
  date: Date;
  amount: number;
  type: 'income' | 'expense';
  iconColor: string;
  icon?: ReactNode;
};

export default function TransactionRow({
  name,
  category,
  date,
  amount,
  type,
  iconColor,
  icon,
}: TransactionRowProps) {
  const formattedAmount = new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
  const sign = type === 'income' ? '+' : '-';
  const amountColor = type === 'income' ? '#16A34A' : '#E8322A';

  return (
    <Card radius={20} className="flex-row items-center px-4 py-3.5 mb-3" style={{ gap: 14 }}>
      <IconTile backgroundColor={iconColor} size={46} radius={15}>
        {icon}
      </IconTile>
      <View className="flex-1">
        <Text
          className="text-tx-primary dark:text-tx-primary-dark font-extrabold text-[15px]"
          numberOfLines={1}
        >
          {name}
        </Text>
        <Text className="text-tx-tertiary dark:text-tx-tertiary-dark font-semibold text-[12.5px]">
          {category} · {format(date, 'MMM d')}
        </Text>
      </View>
      <Text style={{ color: amountColor }} className="font-extrabold">
        {sign}₹{formattedAmount}
      </Text>
    </Card>
  );
}
