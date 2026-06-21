import React, { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'BUDGETS';

export type Budget = {
  cat: string;
  limit: number;
};

type BudgetsContextValue = {
  budgets: Budget[];
  addBudget: (budget: Budget) => Promise<void>;
  updateBudget: (cat: string, limit: number) => Promise<void>;
  deleteBudget: (cat: string) => Promise<void>;
};

const BudgetsContext = createContext<BudgetsContextValue | undefined>(undefined);

async function loadBudgets(): Promise<Budget[]> {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEY);
    return stored ? (JSON.parse(stored) as Budget[]) : [];
  } catch {
    return [];
  }
}

async function saveBudgets(budgets: Budget[]): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(budgets));
  } catch {
    // silent — matches customCategories.ts convention
  }
}

export function BudgetsProvider({ children }: { children: ReactNode }) {
  const [budgets, setBudgets] = useState<Budget[]>([]);

  useEffect(() => {
    loadBudgets().then(setBudgets);
  }, []);

  const addBudget = async (budget: Budget) => {
    const next = [...budgets.filter((b) => b.cat !== budget.cat), budget];
    setBudgets(next);
    await saveBudgets(next);
  };

  const updateBudget = async (cat: string, limit: number) => {
    const next = budgets.map((b) => (b.cat === cat ? { cat, limit } : b));
    setBudgets(next);
    await saveBudgets(next);
  };

  const deleteBudget = async (cat: string) => {
    const next = budgets.filter((b) => b.cat !== cat);
    setBudgets(next);
    await saveBudgets(next);
  };

  return (
    <BudgetsContext.Provider value={{ budgets, addBudget, updateBudget, deleteBudget }}>
      {children}
    </BudgetsContext.Provider>
  );
}

export function useBudgets(): BudgetsContextValue {
  const ctx = useContext(BudgetsContext);
  if (!ctx) throw new Error('useBudgets must be used within BudgetsProvider');
  return ctx;
}
