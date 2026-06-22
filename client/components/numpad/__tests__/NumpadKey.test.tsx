import React from 'react';
import { create } from 'react-test-renderer';
import { Pressable } from 'react-native';

jest.mock('@/contexts/ThemeContext', () => ({ useTheme: jest.fn() }));
import { useTheme } from '@/contexts/ThemeContext';
import NumpadKey from '../NumpadKey';

const flat = (style: any) => (Array.isArray(style) ? Object.assign({}, ...style) : style);

describe('NumpadKey', () => {
  it('uses the subtle key shadow in light mode', () => {
    (useTheme as jest.Mock).mockReturnValue({ isDark: false, toggleDark: jest.fn() });
    const root = create(<NumpadKey label="1" onPress={jest.fn()} />).root;
    const style = flat(root.findByType(Pressable).props.style);
    expect(style.shadowOpacity).toBe(0.06);
  });

  it('deepens the key shadow in dark mode', () => {
    (useTheme as jest.Mock).mockReturnValue({ isDark: true, toggleDark: jest.fn() });
    const root = create(<NumpadKey label="1" onPress={jest.fn()} />).root;
    const style = flat(root.findByType(Pressable).props.style);
    expect(style.shadowOpacity).toBe(0.45);
  });
});
