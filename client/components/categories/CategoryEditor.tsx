import React, { useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import ColorPicker from './ColorPicker';
import IconPicker from './IconPicker';
import { COLOR_SWATCHES, ICON_OPTIONS } from '@/constants/categoryPalette';

export type NewCategoryDraft = {
  name: string;
  color: string;
  icon: string;
};

type CategoryEditorProps = {
  onConfirm: (draft: NewCategoryDraft) => void;
  onCancel: () => void;
};

export default function CategoryEditor({ onConfirm, onCancel }: CategoryEditorProps) {
  const [name, setName] = useState('');
  const [color, setColor] = useState(COLOR_SWATCHES[0]);
  const [icon, setIcon] = useState(ICON_OPTIONS[0].key);

  const canConfirm = name.trim().length > 0;

  return (
    <View className="bg-bg-card dark:bg-bg-card-dark rounded-2xl p-4" style={{ gap: 12 }}>
      <TextInput
        testID="category-name-input"
        value={name}
        onChangeText={setName}
        placeholder="Category name"
        placeholderTextColor="#9AA096"
        className="border border-border-input dark:border-border-input-dark rounded-xl px-3 py-2 text-tx-primary dark:text-tx-primary-dark"
      />
      <ColorPicker colors={COLOR_SWATCHES} selected={color} onSelect={setColor} />
      <IconPicker icons={ICON_OPTIONS} selected={icon} onSelect={setIcon} />
      <View className="flex-row justify-end" style={{ gap: 16 }}>
        <Pressable testID="category-editor-cancel" onPress={onCancel}>
          <Text className="text-tx-secondary dark:text-tx-secondary-dark font-bold">Cancel</Text>
        </Pressable>
        <Pressable
          testID="category-editor-confirm"
          onPress={() => canConfirm && onConfirm({ name: name.trim(), color, icon })}
        >
          <Text
            className={
              canConfirm
                ? 'text-brand-green font-bold'
                : 'text-tx-tertiary dark:text-tx-tertiary-dark font-bold'
            }
          >
            Add
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
