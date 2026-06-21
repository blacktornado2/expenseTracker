// client/components/categories/__tests__/IconPicker.test.tsx
import React from 'react';
import { Pressable } from 'react-native';
import { create, act } from 'react-test-renderer';
import { Tag, Car } from 'lucide-react-native';
import IconPicker from '../IconPicker';

describe('IconPicker', () => {
  const icons = [
    { key: 'tag', Icon: Tag },
    { key: 'car', Icon: Car },
  ];

  it('renders one pressable per icon', () => {
    const tree = create(<IconPicker icons={icons} selected="tag" onSelect={jest.fn()} />).root;
    expect(tree.findAllByType(Pressable)).toHaveLength(2);
  });

  it('calls onSelect with the tapped icon key', () => {
    const onSelect = jest.fn();
    const tree = create(<IconPicker icons={icons} selected="tag" onSelect={onSelect} />).root;
    const carOption = tree.findByProps({ testID: 'icon-option-car' });
    act(() => {
      carOption.props.onPress();
    });
    expect(onSelect).toHaveBeenCalledWith('car');
  });
});
