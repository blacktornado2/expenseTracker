import React from 'react';
import { View } from 'react-native';
import { create } from 'react-test-renderer';
import StackedBar from '../StackedBar';

// Suppress non-native driver warning in test env
jest.mock('react-native/src/private/animated/NativeAnimatedHelper');

describe('StackedBar', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('sizes each segment proportionally to its value', () => {
    const data = [
      { label: 'A', value: 30, color: '#111111' },
      { label: 'B', value: 70, color: '#222222' },
    ];
    const tree = create(<StackedBar data={data} />).root;
    const segments = tree.findAllByType(View).filter((node) => node.props.style?.backgroundColor);
    expect(segments).toHaveLength(2);
    expect(segments[0].props.style.flex).toBeCloseTo(0.3);
    expect(segments[1].props.style.flex).toBeCloseTo(0.7);
  });

  it('renders an empty track when total value is 0', () => {
    const tree = create(<StackedBar data={[{ label: 'A', value: 0, color: '#111111' }]} />).root;
    const segments = tree.findAllByType(View).filter((node) => node.props.style?.backgroundColor);
    expect(segments).toHaveLength(0);
  });
});
