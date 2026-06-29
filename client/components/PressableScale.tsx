import React, { useRef } from 'react';
import {
  Animated,
  Pressable,
  type GestureResponderEvent,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

type PressableScaleProps = PressableProps & {
  /** Scale to spring to while pressed (default 0.95). */
  scaleTo?: number;
  /** Style for the animated wrapper — use this for layout (e.g. flex: 1). */
  containerStyle?: StyleProp<ViewStyle>;
};

/**
 * A Pressable that springs down slightly while held for a tactile, premium
 * feel. Built on the RN core Animated API (native driver) to stay consistent
 * with the rest of the app — no reanimated/babel changes required.
 *
 * Layout note: put flex / sizing styles on `containerStyle` (the animated
 * wrapper) and visual styles (background, shadow, radius) on `style` (the inner
 * Pressable), so a flex:1 child still fills its row.
 */
export default function PressableScale({
  scaleTo = 0.95,
  containerStyle,
  style,
  onPressIn,
  onPressOut,
  children,
  ...rest
}: PressableScaleProps) {
  const scale = useRef(new Animated.Value(1)).current;

  const handlePressIn = (e: GestureResponderEvent) => {
    Animated.spring(scale, { toValue: scaleTo, useNativeDriver: true, speed: 50, bounciness: 0 }).start();
    onPressIn?.(e);
  };

  const handlePressOut = (e: GestureResponderEvent) => {
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 40, bounciness: 6 }).start();
    onPressOut?.(e);
  };

  return (
    <Animated.View style={[containerStyle, { transform: [{ scale }] }]}>
      <Pressable style={style} onPressIn={handlePressIn} onPressOut={handlePressOut} {...rest}>
        {children}
      </Pressable>
    </Animated.View>
  );
}
