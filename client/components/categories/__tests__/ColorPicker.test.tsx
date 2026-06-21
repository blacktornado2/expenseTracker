// client/components/categories/__tests__/ColorPicker.test.tsx
import React from 'react';
import { Pressable } from 'react-native';
import { create, act } from 'react-test-renderer';
import ColorPicker from '../ColorPicker';

describe('ColorPicker', () => {
  const colors = ['#111111', '#222222', '#333333'];

  it('renders one swatch per color', () => {
    const tree = create(<ColorPicker colors={colors} selected={colors[0]} onSelect={jest.fn()} />).root;
    expect(tree.findAllByType(Pressable)).toHaveLength(3);
  });

  it('calls onSelect with the tapped color', () => {
    const onSelect = jest.fn();
    const tree = create(<ColorPicker colors={colors} selected={colors[0]} onSelect={onSelect} />).root;
    const swatch = tree.findByProps({ testID: 'color-swatch-#222222' });
    act(() => {
      swatch.props.onPress();
    });
    expect(onSelect).toHaveBeenCalledWith('#222222');
  });
});
