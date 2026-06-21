// client/constants/__tests__/categoryPalette.test.ts
import { BUILT_IN_CATEGORIES, COLOR_SWATCHES, ICON_OPTIONS, getIconByKey, withAlpha } from '../categoryPalette';
import { Tag } from 'lucide-react-native';

describe('categoryPalette', () => {
  it('has exactly 12 color swatches', () => {
    expect(COLOR_SWATCHES).toHaveLength(12);
  });

  it('has exactly 30 icon options', () => {
    expect(ICON_OPTIONS).toHaveLength(30);
  });

  it('has 11 built-in categories matching categoryMeta keys', () => {
    expect(BUILT_IN_CATEGORIES).toHaveLength(11);
    expect(BUILT_IN_CATEGORIES.map((c) => c.key)).toContain('groceries');
  });

  it('getIconByKey resolves a known icon key', () => {
    const match = ICON_OPTIONS[0];
    expect(getIconByKey(match.key)).toBe(match.Icon);
  });

  it('getIconByKey falls back to Tag for an unknown key', () => {
    expect(getIconByKey('not-a-real-icon')).toBe(Tag);
  });

  it('withAlpha appends a default alpha suffix', () => {
    expect(withAlpha('#2FB872')).toBe('#2FB8721A');
  });

  it('withAlpha accepts a custom alpha suffix', () => {
    expect(withAlpha('#2FB872', 'FF')).toBe('#2FB872FF');
  });
});
