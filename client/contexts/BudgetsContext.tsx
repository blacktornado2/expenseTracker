import React, { useEffect, type ReactNode } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  getBudgets,
  createBudget,
  updateBudget as updateBudgetAction,
  deleteBudget as deleteBudgetAction,
} from '@/redux/actions/budget.actions';

export type Budget = {
  cat: string;
  limit: number;
};

type ServerBudget = { _id: string; category: string; limit: number };

export type BudgetsContextValue = {
  budgets: Budget[];
  addBudget: (budget: Budget) => Promise<void>;
  updateBudget: (cat: string, limit: number) => Promise<void>;
  deleteBudget: (cat: string) => Promise<void>;
};

// Provider is now a passthrough — Redux holds the state. Kept so app/_layout.tsx
// (which wraps the tree in <BudgetsProvider>) does not need to change.
export function BudgetsProvider({ children }: { children: ReactNode }) {
  return <>{children}</>;
}

export function useBudgets(): BudgetsContextValue {
  const dispatch = useDispatch();
  const serverBudgets = useSelector(
    (state: any) => (state.budget?.budgets ?? []) as ServerBudget[]
  );

  useEffect(() => {
    dispatch(getBudgets());
  }, [dispatch]);

  const budgets: Budget[] = serverBudgets.map((b) => ({ cat: b.category, limit: b.limit }));

  const idForCat = (cat: string): string | undefined =>
    serverBudgets.find((b) => b.category === cat)?._id;

  const addBudget = async (budget: Budget) => {
    dispatch(createBudget({ category: budget.cat, limit: budget.limit }));
  };

  const updateBudget = async (cat: string, limit: number) => {
    const id = idForCat(cat);
    if (id) dispatch(updateBudgetAction({ id, limit }));
  };

  const deleteBudget = async (cat: string) => {
    const id = idForCat(cat);
    if (id) dispatch(deleteBudgetAction(id));
  };

  return { budgets, addBudget, updateBudget, deleteBudget };
}
