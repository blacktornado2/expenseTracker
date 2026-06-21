import React from 'react';
import { Text } from 'react-native';
import { create, act } from 'react-test-renderer';
import BottomSheet from '../BottomSheet';

// Suppress non-native driver warning in test env
jest.mock('react-native/src/private/animated/NativeAnimatedHelper');

// Freeze timers so in-flight spring animations don't fire after the test env tears down
beforeEach(() => jest.useFakeTimers());
afterEach(() => jest.useRealTimers());

describe('BottomSheet', () => {
  it('renders nothing when visible is false', () => {
    const tree = create(
      <BottomSheet visible={false} onClose={jest.fn()}>
        <Text>content</Text>
      </BottomSheet>
    );
    expect(tree.toJSON()).toBeNull();
  });

  it('renders children when visible is true', () => {
    let tree: ReturnType<typeof create>;
    act(() => {
      tree = create(
        <BottomSheet visible onClose={jest.fn()}>
          <Text testID="child">hello</Text>
        </BottomSheet>
      );
    });
    expect(tree!.toJSON()).not.toBeNull();
  });
});
