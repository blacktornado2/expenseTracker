import React from 'react';
import { Image, View, Text } from 'react-native';

type AvatarProps = {
  initial: string;
  size?: number;
  radius?: number;
  uri?: string;
};

export default function Avatar({ initial, size = 46, radius = 16, uri }: AvatarProps) {
  if (uri) {
    return (
      <Image
        source={{ uri }}
        style={{ width: size, height: size, borderRadius: radius, backgroundColor: '#16201A' }}
      />
    );
  }

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
