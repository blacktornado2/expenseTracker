import React from 'react';
import { Text } from 'react-native';
import { create, act } from 'react-test-renderer';
import { ShoppingCart, PawPrint } from 'lucide-react-native';

jest.mock('@/contexts/ThemeContext', () => ({ useTheme: jest.fn() }));
import { useTheme } from '@/contexts/ThemeContext';
import CategoryChips, { type CategoryOption } from '../CategoryChips';

const categories: CategoryOption[] = [
  { key: 'groceries', label: 'Groceries', color: '#2FB872', Icon: ShoppingCart },
  { key: 'pets', label: 'Pets', color: '#8A8F86', Icon: PawPrint, custom: true },
];

describe('CategoryChips', () => {
  beforeEach(() => {
    (useTheme as jest.Mock).mockReturnValue({ isDark: false, toggleDark: jest.fn() });
  });


  it('renders a chip per category with its label', () => {
    const tree = create(
      <CategoryChips categories={categories} selected="groceries" onSelect={jest.fn()} editMode={false} onDelete={jest.fn()} onAdd={jest.fn()} />
    ).root;
    const labels = tree.findAllByType(Text).map((node) => node.props.children);
    expect(labels).toEqual(expect.arrayContaining(['Groceries', 'Pets']));
  });

  it('calls onSelect when a chip is tapped outside edit mode', () => {
    const onSelect = jest.fn();
    const tree = create(
      <CategoryChips categories={categories} selected="groceries" onSelect={onSelect} editMode={false} onDelete={jest.fn()} onAdd={jest.fn()} />
    ).root;
    act(() => {
      tree.findByProps({ testID: 'category-chip-pets' }).props.onPress();
    });
    expect(onSelect).toHaveBeenCalledWith('pets');
  });

  it('does not call onSelect when tapped in edit mode', () => {
    const onSelect = jest.fn();
    const tree = create(
      <CategoryChips categories={categories} selected="groceries" onSelect={onSelect} editMode onDelete={jest.fn()} onAdd={jest.fn()} />
    ).root;
    act(() => {
      tree.findByProps({ testID: 'category-chip-pets' }).props.onPress();
    });
    expect(onSelect).not.toHaveBeenCalled();
  });

  it('shows a delete badge only for custom categories in edit mode, and calls onDelete', () => {
    const onDelete = jest.fn();
    const tree = create(
      <CategoryChips categories={categories} selected="groceries" onSelect={jest.fn()} editMode onDelete={onDelete} onAdd={jest.fn()} />
    ).root;
    expect(() => tree.findByProps({ testID: 'category-chip-delete-groceries' })).toThrow();
    act(() => {
      tree.findByProps({ testID: 'category-chip-delete-pets' }).props.onPress();
    });
    expect(onDelete).toHaveBeenCalledWith('pets');
  });

  it('renders an Add chip in edit mode that calls onAdd', () => {
    const onAdd = jest.fn();
    const tree = create(
      <CategoryChips categories={categories} selected="groceries" onSelect={jest.fn()} editMode onDelete={jest.fn()} onAdd={onAdd} />
    ).root;
    act(() => {
      tree.findByProps({ testID: 'category-chip-add' }).props.onPress();
    });
    expect(onAdd).toHaveBeenCalled();
  });
});
