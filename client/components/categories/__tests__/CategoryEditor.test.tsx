// client/components/categories/__tests__/CategoryEditor.test.tsx
import React from 'react';
import { Pressable, TextInput } from 'react-native';
import { create, act } from 'react-test-renderer';

jest.mock('@/contexts/ThemeContext', () => ({ useTheme: jest.fn() }));
import { useTheme } from '@/contexts/ThemeContext';
import CategoryEditor from '../CategoryEditor';
import { COLOR_SWATCHES, ICON_OPTIONS } from '@/constants/categoryPalette';

describe('CategoryEditor', () => {
  beforeEach(() => {
    (useTheme as jest.Mock).mockReturnValue({ isDark: false, toggleDark: jest.fn() });
  });


  it('does not call onConfirm when the name is empty', () => {
    const onConfirm = jest.fn();
    const tree = create(<CategoryEditor onConfirm={onConfirm} onCancel={jest.fn()} />).root;
    const confirmButton = tree.findByProps({ testID: 'category-editor-confirm' });
    act(() => {
      confirmButton.props.onPress();
    });
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it('calls onConfirm with the typed name and default color/icon', () => {
    const onConfirm = jest.fn();
    const tree = create(<CategoryEditor onConfirm={onConfirm} onCancel={jest.fn()} />).root;
    const input = tree.findByType(TextInput);
    act(() => {
      input.props.onChangeText('Pet Supplies');
    });
    const confirmButton = tree.findByProps({ testID: 'category-editor-confirm' });
    act(() => {
      confirmButton.props.onPress();
    });
    expect(onConfirm).toHaveBeenCalledWith({
      name: 'Pet Supplies',
      color: COLOR_SWATCHES[0],
      icon: ICON_OPTIONS[0].key,
    });
  });

  it('calls onCancel when Cancel is pressed', () => {
    const onCancel = jest.fn();
    const tree = create(<CategoryEditor onConfirm={jest.fn()} onCancel={onCancel} />).root;
    const cancelButton = tree.findByProps({ testID: 'category-editor-cancel' });
    act(() => {
      cancelButton.props.onPress();
    });
    expect(onCancel).toHaveBeenCalled();
  });
});
