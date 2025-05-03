import React from 'react'
import { View, Text } from 'react-native'

const ExpenseBox = ({
    title,
    amount,
    className,
  }: {
    title: string
    amount: number
    className?: string
  }) => {
  return (
    <View className={`p-4 rounded-2xl ${className} shadow-md shadow-black/20`}>
        <Text className='text-base font-semibold'>{title}</Text>
        <Text className='text-slate-700'>&#8377;{amount}</Text>
    </View>
  )
}

export default ExpenseBox;
