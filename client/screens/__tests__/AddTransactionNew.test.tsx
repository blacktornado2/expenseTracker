import React from 'react';
import { Text, TextInput } from 'react-native';
import { create, act } from 'react-test-renderer';

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn().mockResolvedValue(null),
  setItem: jest.fn().mockResolvedValue(undefined),
}));

const mockDispatch = jest.fn();
jest.mock('react-redux', () => ({
  useDispatch: () => mockDispatch,
  useSelector: (selector: any) => selector({ transaction: { transactions: [], createError: null }, user: { token: 'tok' } }),
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
});
