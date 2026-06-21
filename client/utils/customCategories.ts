import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'CUSTOM_CATEGORIES';

export type CustomCategory = {
  key: string;
  label: string;
  color: string;
  icon: string;
};

export async function loadCustomCategories(): Promise<CustomCategory[]> {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

export async function saveCustomCategories(categories: CustomCategory[]): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(categories));
  } catch {
    // silent: matches ThemeContext persistence convention
  }
}

export function addCustomCategory(
  categories: CustomCategory[],
  newCategory: CustomCategory
): CustomCategory[] {
  const withoutExisting = categories.filter((cat) => cat.key !== newCategory.key);
  return [...withoutExisting, newCategory];
}

export function removeCustomCategory(categories: CustomCategory[], key: string): CustomCategory[] {
  return categories.filter((cat) => cat.key !== key);
}

export function slugifyCategoryName(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}
