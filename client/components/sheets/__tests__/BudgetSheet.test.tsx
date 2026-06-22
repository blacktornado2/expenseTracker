import React from 'react';
import { Pressable, Text } from 'react-native';
import { create, act } from 'react-test-renderer';

// Suppress non-native driver warning in test env (BottomSheet uses Animated)
jest.mock('react-native/src/private/animated/NativeAnimatedHelper');

jest.mock('@/contexts/ThemeContext', () => ({ useTheme: jest.fn(() => ({ isDark: false, toggleDark: jest.fn() })) }));

const mockAddBudget = jest.fn().mockResolvedValue(undefined);
const mockUpdateBudget = jest.fn().mockResolvedValue(undefined);
const mockDeleteBudget = jest.fn().mockResolvedValue(undefined);
let mockBudgets: { cat: string; limit: number }[] = [];
jest.mock('@/contexts/BudgetsContext', () => ({
  useBudgets: () => ({
    budgets: mockBudgets,
    addBudget: mockAddBudget,
    updateBudget: mockUpdateBudget,
    deleteBudget: mockDeleteBudget,
  }),
}));

jest.mock('@/utils/customCategories', () => ({
  loadCustomCategories: jest.fn().mockResolvedValue([]),
}));

// Mutable fake redux state so tests can simulate a pending -> resolved
// transition between renders, the same way real middleware would update
// the store after a CREATE/UPDATE/DELETE_BUDGET_REQUEST/SUCCESS/FAILURE sequence.
let mockBudgetState = {
  createError: null as any,
  updateError: null as any,
  deleteError: null as any,
  createPending: false,
  updatePending: false,
  deletePending: false,
};
jest.mock('react-redux', () => ({
  useSelector: (selector: any) => selector({ budget: mockBudgetState }),
}));

import BudgetSheet from '../BudgetSheet';

describe('BudgetSheet save/delete resolution', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    mockBudgets = [];
    mockBudgetState = {
      createError: null,
      updateError: null,
      deleteError: null,
      createPending: false,
      updatePending: false,
      deletePending: false,
    };
    mockAddBudget.mockClear();
    mockUpdateBudget.mockClear();
    mockDeleteBudget.mockClear();
  });

  afterEach(() => {
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  function findSaveButton(root: any) {
    return root.findAllByType(Pressable).find((n: any) =>
      n.findAllByType(Text).some((t: any) => t.props.children === 'Save budget')
    );
  }

  it('closes the sheet after a pending -> resolved save with no error (happy path)', async () => {
    const onClose = jest.fn();
    let tree: any;
    await act(async () => {
      tree = create(<BudgetSheet mode="add" onClose={onClose} />);
    });
    const root = tree.root;

    const limitInput = root.findByProps({ placeholder: '0' });
    act(() => {
      limitInput.props.onChangeText('500');
    });

    act(() => {
      findSaveButton(root).props.onPress();
    });
    expect(mockAddBudget).toHaveBeenCalled();

    // Store flips to pending.
    act(() => {
      mockBudgetState = { ...mockBudgetState, createPending: true };
      tree.update(<BudgetSheet mode="add" onClose={onClose} />);
    });
    expect(onClose).not.toHaveBeenCalled();

    // Store resolves: pending -> false, no error.
    act(() => {
      mockBudgetState = { ...mockBudgetState, createPending: false };
      tree.update(<BudgetSheet mode="add" onClose={onClose} />);
    });

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('keeps the sheet open, shows the inline error, and preserves the draft when the save fails', async () => {
    const onClose = jest.fn();
    let tree: any;
    await act(async () => {
      tree = create(<BudgetSheet mode="add" onClose={onClose} />);
    });
    const root = tree.root;

    const limitInput = root.findByProps({ placeholder: '0' });
    act(() => {
      limitInput.props.onChangeText('500');
    });

    act(() => {
      findSaveButton(root).props.onPress();
    });

    act(() => {
      mockBudgetState = { ...mockBudgetState, createPending: true };
      tree.update(<BudgetSheet mode="add" onClose={onClose} />);
    });

    act(() => {
      mockBudgetState = { ...mockBudgetState, createPending: false, createError: new Error('network') };
      tree.update(<BudgetSheet mode="add" onClose={onClose} />);
    });

    expect(onClose).not.toHaveBeenCalled();

    const limitInputAfter = root.findByProps({ placeholder: '0' });
    expect(limitInputAfter.props.value).toBe('500');

    const errorText = root.findAllByType(Text).find((t: any) =>
      typeof t.props.children === 'string' && t.props.children.includes("Couldn't save")
    );
    expect(errorText).toBeTruthy();
  });
});
