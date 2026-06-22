import React, { useEffect, type ReactNode } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { getSavingsGoal, setSavingsGoal as setSavingsGoalAction } from '@/redux/actions/savingsGoal.actions';

export type SavingsGoalContextValue = {
  goal: number;
  setGoal: (goal: number) => Promise<void>;
};

// Passthrough provider — Redux holds the state. Kept so app/_layout.tsx
// (which wraps the tree in <SavingsGoalProvider>) does not need to change.
export function SavingsGoalProvider({ children }: { children: ReactNode }) {
  return <>{children}</>;
}

export function useSavingsGoal(): SavingsGoalContextValue {
  const dispatch = useDispatch();
  const goal = useSelector((state: any) => state.savingsGoal?.amount ?? 0);

  useEffect(() => {
    dispatch(getSavingsGoal());
  }, [dispatch]);

  const setGoal = async (next: number) => {
    dispatch(setSavingsGoalAction(next));
  };

  return { goal, setGoal };
}
