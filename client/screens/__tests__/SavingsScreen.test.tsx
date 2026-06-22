import React from 'react';
import { create, act } from 'react-test-renderer';

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn().mockResolvedValue(null),
  setItem: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('@/contexts/ThemeContext', () => ({ useTheme: jest.fn(() => ({ isDark: false, toggleDark: jest.fn() })) }));

const mockBack = jest.fn();
jest.mock('expo-router', () => ({ useRouter: () => ({ back: mockBack }) }));

const mockMonthly = [{ month: 5, year: 2026, spent: 4000, income: 10000, cats: [] }];
jest.mock('@/redux/store/selectors', () => ({ selectMonthlyData: () => mockMonthly }));

// Mutable fake redux state so tests can simulate a pending -> resolved
// transition between renders, the same way real middleware would update
// the store after a SET_SAVINGS_GOAL_REQUEST/SUCCESS/FAILURE sequence.
let mockSavingsGoalState = { amount: 5000, error: null as any, pending: false };
const mockDispatch = jest.fn();
jest.mock('react-redux', () => ({
  useDispatch: () => mockDispatch,
  useSelector: (selector: any) => selector({ savingsGoal: mockSavingsGoalState }),
}));

import SavingsScreen from '../SavingsScreen';

describe('SavingsScreen goal save resolution', () => {
  beforeEach(() => {
    mockDispatch.mockClear();
    mockSavingsGoalState = { amount: 5000, error: null, pending: false };
  });

  it('collapses edit mode after a pending -> resolved save, even when the goal value is unchanged', () => {
    let tree: any;
    act(() => {
      tree = create(<SavingsScreen />);
    });
    const root = tree.root;

    // Open the editor and "save" the same value that's already stored.
    const editButton = root.findAllByType(require('react-native').Pressable).find((n: any) =>
      n.findAllByType(require('react-native').Text).some((t: any) => t.props.children === 'Edit goal')
    );
    act(() => {
      editButton.props.onPress();
    });

    const goalInput = root.findByProps({ testID: 'goal-input' });
    expect(goalInput.props.value).toBe('5000');

    // Simulate dispatching the save with the identical value: store flips to pending.
    act(() => {
      mockSavingsGoalState = { amount: 5000, error: null, pending: true };
      tree.update(<SavingsScreen />);
    });
    // Still in edit mode while pending.
    expect(() => root.findByProps({ testID: 'goal-input' })).not.toThrow();

    // Store resolves: pending -> false, no error, value identical to before.
    act(() => {
      mockSavingsGoalState = { amount: 5000, error: null, pending: false };
      tree.update(<SavingsScreen />);
    });

    expect(() => root.findByProps({ testID: 'goal-input' })).toThrow();
  });

  it('stays in edit mode and surfaces the inline error when the save fails', () => {
    let tree: any;
    act(() => {
      tree = create(<SavingsScreen />);
    });
    const root = tree.root;

    const editButton = root.findAllByType(require('react-native').Pressable).find((n: any) =>
      n.findAllByType(require('react-native').Text).some((t: any) => t.props.children === 'Edit goal')
    );
    act(() => {
      editButton.props.onPress();
    });

    act(() => {
      mockSavingsGoalState = { amount: 5000, error: null, pending: true };
      tree.update(<SavingsScreen />);
    });

    act(() => {
      mockSavingsGoalState = { amount: 5000, error: new Error('network'), pending: false };
      tree.update(<SavingsScreen />);
    });

    // Edit mode stays open with the draft intact.
    const goalInput = root.findByProps({ testID: 'goal-input' });
    expect(goalInput.props.value).toBe('5000');

    const errorText = root.findAllByType(require('react-native').Text).find((t: any) =>
      typeof t.props.children === 'string' && t.props.children.includes("Couldn't save")
    );
    expect(errorText).toBeTruthy();
  });
});
