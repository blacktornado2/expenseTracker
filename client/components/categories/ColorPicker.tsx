import React from 'react';
import { Pressable, View } from 'react-native';
import { Check } from 'lucide-react-native';

type ColorPickerProps = {
  colors: string[];
  selected: string;
  onSelect: (color: string) => void;
};

export default function ColorPicker({ colors, selected, onSelect }: ColorPickerProps) {
  return (
    <View className="flex-row flex-wrap" style={{ gap: 10 }}>
      {colors.map((color) => (
        <Pressable
          key={color}
          testID={`color-swatch-${color}`}
          onPress={() => onSelect(color)}
          style={{
            width: 36,
            height: 36,
            borderRadius: 18,
            backgroundColor: color,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {selected === color ? <Check color="#FFFFFF" size={18} /> : null}
        </Pressable>
      ))}
    </View>
  );
}
