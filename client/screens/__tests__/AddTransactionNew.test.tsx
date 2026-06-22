import React from 'react';
import { Text, TextInput } from 'react-native';
import { create, act } from 'react-test-renderer';

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn().mockResolvedValue(null),
  setItem: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('@/contexts/ThemeContext', () => ({ useTheme: jest.fn(() => ({ isDark: false, toggleDark: jest.fn() })) }));

const mockDispatch = jest.fn();
// Mutable fake redux state so tests can simulate a pending -> resolved
// transition between renders, the same way real middleware would update
// the store after a CREATE_TRANSACTION_REQUEST/SUCCESS/FAILURE sequence.
let mockTransactionState = { transactions: [] as any[], createError: null as any, createPending: false };
jest.mock('react-redux', () => ({
  useDispatch: () => mockDispatch,
  useSelector: (selector: any) => selector({ transaction: mockTransactionState, user: { token: 'tok' } }),
}));

const mockBack = jest.fn();
const mockReplace = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: () => ({ back: mockBack, replace: mockReplace }),
}));

import AddTransactionNew from '../AddTransactionNew';
import { createTransaction } from '@/redux/actions/transaction.actions';

describe('AddTransactionNew', () => {
  beforeEach(() => {
    mockDispatch.mockClear();
    mockReplace.mockClear();
    mockTransactionState = { transactions: [], createError: null, createPending: false };
  });

  it('shows an amount validation error when submitting at zero', async () => {
    let tree: any;
    await act(async () => {
      tree = create(<AddTransactionNew />);
    });
    const root = tree.root;
    const submitButton = root.findByProps({ testID: 'submit-transaction' });
    act(() => {
      submitButton.props.onPress();
    });
    expect(mockDispatch).not.toHaveBeenCalled();
    expect(root.findByProps({ testID: 'amount-display' }).props.style).toMatchObject({ color: '#E8322A' });
  });

  it('shows a name validation error when submitting without a name', async () => {
    let tree: any;
    await act(async () => {
      tree = create(<AddTransactionNew />);
    });
    const root = tree.root;
    act(() => {
      root.findByProps({ testID: 'numpad-key-5' }).props.onPress();
    });
    const submitButton = root.findByProps({ testID: 'submit-transaction' });
    act(() => {
      submitButton.props.onPress();
    });
    expect(mockDispatch).not.toHaveBeenCalled();
    const nameInput = root.findByProps({ testID: 'transaction-name-input' });
    expect(nameInput.props.style).toMatchObject({ borderColor: '#E8322A' });
  });

  it('dispatches createTransaction with mapped expense -> debit on valid submit', async () => {
    let tree: any;
    await act(async () => {
      tree = create(<AddTransactionNew />);
    });
    const root = tree.root;
    act(() => {
      root.findByProps({ testID: 'numpad-key-5' }).props.onPress();
    });
    const nameInput = root.findByProps({ testID: 'transaction-name-input' });
    act(() => {
      nameInput.props.onChangeText('Coffee');
    });
    const submitButton = root.findByProps({ testID: 'submit-transaction' });
    act(() => {
      submitButton.props.onPress();
    });
    expect(mockDispatch).toHaveBeenCalledWith(
      createTransaction(
        expect.objectContaining({ transactionType: 'debit', amount: 5, description: 'Coffee' })
      )
    );
  });

  it('switches to income and maps to credit on submit', async () => {
    let tree: any;
    await act(async () => {
      tree = create(<AddTransactionNew />);
    });
    const root = tree.root;
    const incomeLabel = root.findAllByType(Text).find((node) => node.props.children === 'Income')!;
    const incomePressable = root.findAllByType(require('react-native').Pressable).find((node) =>
      node.findAllByType(Text).includes(incomeLabel)
    )!;
    act(() => {
      incomePressable.props.onPress();
    });
    act(() => {
      root.findByProps({ testID: 'numpad-key-5' }).props.onPress();
    });
    act(() => {
      root.findByProps({ testID: 'transaction-name-input' }).props.onChangeText('Salary');
    });
    act(() => {
      root.findByProps({ testID: 'submit-transaction' }).props.onPress();
    });
    expect(mockDispatch).toHaveBeenCalledWith(
      createTransaction(expect.objectContaining({ transactionType: 'credit', amount: 5 }))
    );
  });

  it('stays on the form with an inline error on failure, then navigates away on a same-draft retry success', async () => {
    let tree: any;
    await act(async () => {
      tree = create(<AddTransactionNew />);
    });
    const root = tree.root;

    act(() => {
      root.findByProps({ testID: 'numpad-key-5' }).props.onPress();
    });
    act(() => {
      root.findByProps({ testID: 'transaction-name-input' }).props.onChangeText('Coffee');
    });
    act(() => {
      root.findByProps({ testID: 'submit-transaction' }).props.onPress();
    });

    // Store flips to pending.
    act(() => {
      mockTransactionState = { ...mockTransactionState, createPending: true };
      tree.update(<AddTransactionNew />);
    });
    expect(mockReplace).not.toHaveBeenCalled();

    // Store resolves with an error: stay on the form, draft intact, inline error shown.
    act(() => {
      mockTransactionState = { ...mockTransactionState, createPending: false, createError: new Error('network') };
      tree.update(<AddTransactionNew />);
    });
    expect(mockReplace).not.toHaveBeenCalled();
    const nameInputAfterFailure = root.findByProps({ testID: 'transaction-name-input' });
    expect(nameInputAfterFailure.props.value).toBe('Coffee');
    const errorText = root.findAllByType(Text).find((t: any) =>
      typeof t.props.children === 'string' && t.props.children.includes("Couldn't save")
    );
    expect(errorText).toBeTruthy();

    // Retry with the identical draft: store flips to pending again, then
    // resolves with no error. The stale createError must not block this
    // success transition, and the same-value retry must still resolve.
    act(() => {
      root.findByProps({ testID: 'submit-transaction' }).props.onPress();
    });
    act(() => {
      mockTransactionState = { ...mockTransactionState, createPending: true };
      tree.update(<AddTransactionNew />);
    });
    act(() => {
      mockTransactionState = { ...mockTransactionState, createPending: false, createError: null };
      tree.update(<AddTransactionNew />);
    });

    expect(mockReplace).toHaveBeenCalledWith('/(logged-in)/(tabs)/transactions');
  });
});
