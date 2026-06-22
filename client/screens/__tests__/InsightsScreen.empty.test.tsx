import React from 'react';
import { create, act } from 'react-test-renderer';

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn().mockResolvedValue(null),
  setItem: jest.fn().mockResolvedValue(undefined),
}));
jest.mock('@/contexts/ThemeContext', () => ({ useTheme: jest.fn(() => ({ isDark: false, toggleDark: jest.fn() })) }));

let mockMonthly: any[] = [{ month: 5, year: 2026, spent: 0, income: 0, cats: [] }];
jest.mock('react-redux', () => ({ useSelector: (fn: any) => fn() }));
jest.mock('@/redux/store/selectors', () => ({ selectMonthlyData: () => mockMonthly }));

import InsightsScreen from '../InsightsScreen';

const text = (root: any) =>
  root.findAllByType('Text' as any).map((n: any) => JSON.stringify(n.props.children)).join(' ');

describe('InsightsScreen empty state', () => {
  it('shows "No expenses recorded" when the selected month has no categories', () => {
    mockMonthly = [{ month: 5, year: 2026, spent: 0, income: 0, cats: [] }];
    let renderer: any;
    act(() => { renderer = create(<InsightsScreen />); });
    const root = renderer.root;
    expect(text(root)).toContain('No expenses recorded');
  });

  it('renders without throwing and shows "No expenses recorded" when monthlyData is empty', () => {
    mockMonthly = [];
    let renderer: any;
    expect(() => {
      act(() => { renderer = create(<InsightsScreen />); });
    }).not.toThrow();
    const root = renderer.root;
    expect(text(root)).toContain('No expenses recorded');
  });
});
