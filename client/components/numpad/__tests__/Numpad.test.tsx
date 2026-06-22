import React from 'react';
import { Pressable } from 'react-native';
import { create, act } from 'react-test-renderer';

jest.mock('@/contexts/ThemeContext', () => ({ useTheme: jest.fn(() => ({ isDark: false, toggleDark: jest.fn() })) }));

import Numpad from '../Numpad';

describe('Numpad', () => {
  it('renders 12 keys (1-9, ., 0, backspace)', () => {
    const tree = create(<Numpad onKey={jest.fn()} />).root;
    expect(tree.findAllByType(Pressable)).toHaveLength(12);
  });

  it('calls onKey with the digit when a digit key is pressed', () => {
    const onKey = jest.fn();
    const tree = create(<Numpad onKey={onKey} />).root;
    const key5 = tree.findByProps({ testID: 'numpad-key-5' });
    act(() => {
      key5.props.onPress();
    });
    expect(onKey).toHaveBeenCalledWith('5');
  });

  it('calls onKey with "backspace" when the backspace key is pressed', () => {
    const onKey = jest.fn();
    const tree = create(<Numpad onKey={onKey} />).root;
    const backspaceKey = tree.findByProps({ testID: 'numpad-key-backspace' });
    act(() => {
      backspaceKey.props.onPress();
    });
    expect(onKey).toHaveBeenCalledWith('backspace');
  });
});
