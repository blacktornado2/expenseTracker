jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
}));

import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  loadCustomCategories,
  saveCustomCategories,
  addCustomCategory,
  removeCustomCategory,
  slugifyCategoryName,
  type CustomCategory,
} from '../customCategories';

describe('loadCustomCategories', () => {
  it('parses stored JSON into an array', async () => {
    const stored: CustomCategory[] = [{ key: 'pets', label: 'Pets', color: '#8A8F86', icon: 'paw-print' }];
    (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(JSON.stringify(stored));
    expect(await loadCustomCategories()).toEqual(stored);
  });

  it('returns an empty array when nothing is stored', async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(null);
    expect(await loadCustomCategories()).toEqual([]);
  });

  it('returns an empty array if AsyncStorage rejects', async () => {
    (AsyncStorage.getItem as jest.Mock).mockRejectedValueOnce(new Error('boom'));
    expect(await loadCustomCategories()).toEqual([]);
  });
});

describe('saveCustomCategories', () => {
  it('stringifies and stores the category list', async () => {
    const categories: CustomCategory[] = [{ key: 'pets', label: 'Pets', color: '#8A8F86', icon: 'paw-print' }];
    await saveCustomCategories(categories);
    expect(AsyncStorage.setItem).toHaveBeenCalledWith('CUSTOM_CATEGORIES', JSON.stringify(categories));
  });
});

describe('addCustomCategory', () => {
  it('appends a new category', () => {
    const result = addCustomCategory([], { key: 'pets', label: 'Pets', color: '#8A8F86', icon: 'paw-print' });
    expect(result).toEqual([{ key: 'pets', label: 'Pets', color: '#8A8F86', icon: 'paw-print' }]);
  });

  it('replaces an existing category with the same key', () => {
    const existing: CustomCategory[] = [{ key: 'pets', label: 'Pets', color: '#000000', icon: 'tag' }];
    const updated: CustomCategory = { key: 'pets', label: 'Pets', color: '#8A8F86', icon: 'paw-print' };
    expect(addCustomCategory(existing, updated)).toEqual([updated]);
  });
});

describe('removeCustomCategory', () => {
  it('removes the category matching the given key', () => {
    const existing: CustomCategory[] = [
      { key: 'pets', label: 'Pets', color: '#8A8F86', icon: 'paw-print' },
      { key: 'gym', label: 'Gym', color: '#10B981', icon: 'dumbbell' },
    ];
    expect(removeCustomCategory(existing, 'pets')).toEqual([existing[1]]);
  });
});

describe('slugifyCategoryName', () => {
  it('lowercases and hyphenates a name', () => {
    expect(slugifyCategoryName('Pet Supplies')).toBe('pet-supplies');
  });

  it('strips leading/trailing punctuation', () => {
    expect(slugifyCategoryName('  Gym! ')).toBe('gym');
  });
});
