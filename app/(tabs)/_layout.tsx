import { Tabs } from 'expo-router';
import React from 'react';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

export default function TabLayout() {

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: 'blue',
        headerShown: false,
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: () => <MaterialIcons name="dashboard" size={24} color="grey" />
        }}
      />
      <Tabs.Screen
        name="transaction"
        options={{
          title: 'Transaction',
          tabBarIcon: () => <MaterialIcons name="payments" size={24} color="forestgreen" />
        }}
      />
      <Tabs.Screen
        name="new"
        options={{
          title: 'Transaction',
          tabBarIcon: () => <MaterialIcons name="payments" size={24} color="forestgreen" />
        }}
      />
    </Tabs>
  );
}
