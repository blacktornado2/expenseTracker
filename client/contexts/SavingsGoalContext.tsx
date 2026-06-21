import React, { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'SAVINGS_GOAL';

export type SavingsGoalContextValue = {
  goal: number;
  setGoal: (goal: number) => Promise<void>;
};

const SavingsGoalContext = createContext<SavingsGoalContextValue | undefined>(undefined);

async function loadGoal(): Promise<number> {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEY);
    const parsed = stored ? Number(stored) : 0;
    return Number.isFinite(parsed) ? parsed : 0;
  } catch {
    return 0;
  }
}

async function saveGoal(goal: number): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, String(goal));
  } catch {
    // silent — matches BudgetsContext convention
  }
}

export function SavingsGoalProvider({ children }: { children: ReactNode }) {
  const [goal, setGoalState] = useState<number>(0);

  useEffect(() => {
    loadGoal().then(setGoalState);
  }, []);

  const setGoal = async (next: number) => {
    setGoalState(next);
    await saveGoal(next);
  };

  return (
    <SavingsGoalContext.Provider value={{ goal, setGoal }}>
      {children}
    </SavingsGoalContext.Provider>
  );
}

export function useSavingsGoal(): SavingsGoalContextValue {
  const ctx = useContext(SavingsGoalContext);
  if (!ctx) throw new Error('useSavingsGoal must be used within SavingsGoalProvider');
  return ctx;
}
