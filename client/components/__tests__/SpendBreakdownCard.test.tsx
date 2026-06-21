import React from 'react';
import { Pressable, Text } from 'react-native';
import { create, act } from 'react-test-renderer';
import { Circle } from 'react-native-svg';
import SpendBreakdownCard from '../SpendBreakdownCard';

jest.mock('@/contexts/ThemeContext', () => ({
  useTheme: jest.fn(() => ({ isDark: false, toggleDark: jest.fn() })),
}));

describe('SpendBreakdownCard', () => {
  const data = [
    { label: 'Groceries', value: 500, color: '#2FB872' },
    { label: 'Transport', value: 150, color: '#2BB3FF' },
  ];

  it('renders the legend with every category label', () => {
    const tree = create(<SpendBreakdownCard data={data} />).root;
    const texts = tree.findAllByType(Text).map((node) => node.props.children);
    expect(texts).toEqual(expect.arrayContaining(['Groceries', 'Transport']));
  });

  it('defaults to bar mode and switches to pie mode on toggle', () => {
    const tree = create(<SpendBreakdownCard data={data} />).root;
    expect(tree.findAllByType(Circle)).toHaveLength(0);

    const pieText = tree.findAllByType(Text).find((node) => node.props.children === 'Pie')!;
    const piePressable = tree
      .findAllByType(Pressable)
      .find((node) => node.findAllByType(Text).includes(pieText))!;
    act(() => {
      piePressable.props.onPress();
    });

    expect(tree.findAllByType(Circle).length).toBeGreaterThan(0);
  });

  it('shows an empty state when there is no spend', () => {
    const tree = create(<SpendBreakdownCard data={[]} />).root;
    const texts = tree.findAllByType(Text).map((node) => node.props.children);
    expect(texts).toContain('No spending yet');
  });
});
