import React from 'react';
import { Text } from 'react-native';
import { create, act } from 'react-test-renderer';
import SegmentedToggle from '../SegmentedToggle';

describe('SegmentedToggle', () => {
  const options = [
    { value: 'bar', label: 'Bar' },
    { value: 'pie', label: 'Pie' },
  ] as const;

  it('renders both option labels', () => {
    const tree = create(<SegmentedToggle options={options} value="bar" onChange={jest.fn()} />).root;
    const texts = tree.findAllByType(Text).map((node) => node.props.children);
    expect(texts).toEqual(expect.arrayContaining(['Bar', 'Pie']));
  });

  it('calls onChange with the tapped option value', () => {
    const onChange = jest.fn();
    const tree = create(<SegmentedToggle options={options} value="bar" onChange={onChange} />).root;
    const pieText = tree.findAllByType(Text).find((node) => node.props.children === 'Pie')!;
    act(() => {
      pieText.parent!.props.onPress();
    });
    expect(onChange).toHaveBeenCalledWith('pie');
  });
});
