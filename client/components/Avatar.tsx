import React from 'react';
import { View, Text } from 'react-native';

type AvatarProps = {
  initial: string;
  size?: number;
  radius?: number;
};

export default function Avatar({ initial, size = 46, radius = 16 }: AvatarProps) {
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: radius,
        backgroundColor: '#16201A',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Text style={{ color: '#FFFFFF', fontWeight: '800', fontSize: size * 0.4 }}>
        {initial.toUpperCase()}
      </Text>
    </View>
  );
}
