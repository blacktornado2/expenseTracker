import React from 'react';
import { Circle } from 'react-native-svg';
import { create } from 'react-test-renderer';

jest.mock('@/contexts/ThemeContext', () => ({ useTheme: jest.fn() }));
import { useTheme } from '@/contexts/ThemeContext';
import Donut from '../Donut';

describe('Donut', () => {
  beforeEach(() => {
    (useTheme as jest.Mock).mockReturnValue({ isDark: false, toggleDark: jest.fn() });
  });


  it('renders one stroke circle per non-background segment, plus the track', () => {
    const data = [
      { label: 'A', value: 1, color: '#111111' },
      { label: 'B', value: 1, color: '#222222' },
    ];
    const tree = create(<Donut data={data} />).root;
    const circles = tree.findAllByType(Circle);
    // 1 background track + 1 per data segment
    expect(circles).toHaveLength(3);
  });

  it('renders only the background track when total value is 0', () => {
    const tree = create(<Donut data={[{ label: 'A', value: 0, color: '#111111' }]} />).root;
    const circles = tree.findAllByType(Circle);
    expect(circles).toHaveLength(1);
  });
});
