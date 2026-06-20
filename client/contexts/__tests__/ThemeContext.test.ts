import AsyncStorage from '@react-native-async-storage/async-storage';
import { loadStoredTheme, persistTheme } from '../ThemeContext';

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
}));

describe('loadStoredTheme', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('returns "dark" when AsyncStorage has "dark" stored', async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce('dark');
    const result = await loadStoredTheme();
    expect(result).toBe('dark');
  });

  it('returns "light" when AsyncStorage has "light" stored', async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce('light');
    const result = await loadStoredTheme();
    expect(result).toBe('light');
  });

  it('returns "light" when nothing is stored', async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(null);
    const result = await loadStoredTheme();
    expect(result).toBe('light');
  });

  it('returns "light" when the AsyncStorage read throws', async () => {
    (AsyncStorage.getItem as jest.Mock).mockRejectedValueOnce(new Error('disk error'));
    const result = await loadStoredTheme();
    expect(result).toBe('light');
  });
});

describe('persistTheme', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('writes the scheme to AsyncStorage under the theme_preference key', async () => {
    (AsyncStorage.setItem as jest.Mock).mockResolvedValueOnce(undefined);
    await persistTheme('dark');
    expect(AsyncStorage.setItem).toHaveBeenCalledWith('theme_preference', 'dark');
  });

  it('does not throw when the AsyncStorage write fails', async () => {
    (AsyncStorage.setItem as jest.Mock).mockRejectedValueOnce(new Error('disk full'));
    await expect(persistTheme('dark')).resolves.toBeUndefined();
  });
});
