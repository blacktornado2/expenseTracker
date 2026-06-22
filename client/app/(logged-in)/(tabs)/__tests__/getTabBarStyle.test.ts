jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
}));

import { getTabBarStyle } from '../_layout';

describe('getTabBarStyle', () => {
  it('uses the white card surface + light shadow in light mode', () => {
    const style = getTabBarStyle(false);
    expect(style.backgroundColor).toBe('#FFFFFF');
    expect(style.shadowOpacity).toBe(0.05);
  });

  it('uses the dark card surface + deepened shadow in dark mode', () => {
    const style = getTabBarStyle(true);
    expect(style.backgroundColor).toBe('#192218');
    expect(style.shadowOpacity).toBe(0.5);
  });
});
