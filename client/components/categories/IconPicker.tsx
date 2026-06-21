import React from 'react';
import { Pressable, View } from 'react-native';
import type { LucideIcon } from 'lucide-react-native';

type IconOption = { key: string; Icon: LucideIcon };

type IconPickerProps = {
  icons: IconOption[];
  selected: string;
  onSelect: (key: string) => void;
};

export default function IconPicker({ icons, selected, onSelect }: IconPickerProps) {
  return (
    <View className="flex-row flex-wrap" style={{ gap: 10 }}>
      {icons.map(({ key, Icon }) => {
        const active = key === selected;
        return (
          <Pressable
            key={key}
            testID={`icon-option-${key}`}
            onPress={() => onSelect(key)}
            className={`w-10 h-10 rounded-xl items-center justify-center ${
              active ? 'bg-brand-green' : 'bg-bg-close dark:bg-bg-close-dark'
            }`}
          >
            <Icon color={active ? '#FFFFFF' : '#2B2F2A'} size={20} />
          </Pressable>
        );
      })}
    </View>
  );
}
