import React from 'react';
import { create } from 'react-test-renderer';
import { View } from 'react-native';
import Card from '../Card';

jest.mock('@/contexts/ThemeContext', () => ({
  useTheme: jest.fn(),
}));

import { useTheme } from '@/contexts/ThemeContext';

describe('Card', () => {
  it('applies the shadow style in light mode', () => {
    (useTheme as jest.Mock).mockReturnValue({ isDark: false, toggleDark: jest.fn() });
    const tree = create(<Card><View testID="child" /></Card>).root;
    const root = tree.findByType(View);
    const flatStyle = Array.isArray(root.props.style) ? Object.assign({}, ...root.props.style) : root.props.style;
    expect(flatStyle.shadowOpacity).toBe(0.05);
  });

  it('removes the shadow style in dark mode', () => {
    (useTheme as jest.Mock).mockReturnValue({ isDark: true, toggleDark: jest.fn() });
    const tree = create(<Card><View testID="child" /></Card>).root;
    const root = tree.findByType(View);
    const flatStyle = Array.isArray(root.props.style) ? Object.assign({}, ...root.props.style) : root.props.style;
    expect(flatStyle.shadowOpacity).toBeUndefined();
  });
});
