import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { Plus, X, type LucideIcon } from 'lucide-react-native';
import { withAlpha } from '@/constants/categoryPalette';

export type CategoryOption = {
  key: string;
  label: string;
  color: string;
  Icon: LucideIcon;
  custom?: boolean;
};

type CategoryChipsProps = {
  categories: CategoryOption[];
  selected: string;
  onSelect: (key: string) => void;
  editMode: boolean;
  onDelete: (key: string) => void;
  onAdd: () => void;
};

export default function CategoryChips({
  categories,
  selected,
  onSelect,
  editMode,
  onDelete,
  onAdd,
}: CategoryChipsProps) {
  return (
    <View className="flex-row flex-wrap" style={{ gap: 10 }}>
      {categories.map((category) => {
        const active = category.key === selected;
        return (
          <View key={category.key} style={{ position: 'relative' }}>
            <Pressable
              testID={`category-chip-${category.key}`}
              onPress={() => !editMode && onSelect(category.key)}
              className="flex-row items-center rounded-full px-3 py-2"
              style={{
                backgroundColor: active ? withAlpha(category.color) : 'transparent',
                borderWidth: 1,
                borderColor: active ? category.color : '#E5E5E0',
              }}
            >
              <category.Icon color={category.color} size={16} />
              <Text style={{ color: active ? category.color : '#2B2F2A', marginLeft: 6, fontWeight: '700' }}>
                {category.label}
              </Text>
            </Pressable>
            {editMode && category.custom ? (
              <Pressable
                testID={`category-chip-delete-${category.key}`}
                onPress={() => onDelete(category.key)}
                style={{
                  position: 'absolute',
                  top: -6,
                  right: -6,
                  width: 18,
                  height: 18,
                  borderRadius: 9,
                  backgroundColor: '#E8322A',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <X color="#FFFFFF" size={12} />
              </Pressable>
            ) : null}
          </View>
        );
      })}
      {editMode ? (
        <Pressable
          testID="category-chip-add"
          onPress={onAdd}
          className="flex-row items-center rounded-full px-3 py-2"
          style={{ borderWidth: 1, borderColor: '#9AA096', borderStyle: 'dashed' }}
        >
          <Plus color="#9AA096" size={16} />
          <Text style={{ color: '#9AA096', marginLeft: 6, fontWeight: '700' }}>Add</Text>
        </Pressable>
      ) : null}
    </View>
  );
}
