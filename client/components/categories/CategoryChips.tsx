import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Plus, X, type LucideIcon } from 'lucide-react-native';
import PressableScale from '@/components/PressableScale';
import { useTheme } from '@/contexts/ThemeContext';
import { gradientFor, GRADIENT_DIAGONAL } from '@/constants/gradients';
import { shadowForGradientCard } from '@/constants/shadows';

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
  const { isDark } = useTheme();
  const borderColor = isDark ? '#263024' : '#E5E5E0';
  const tertiaryText = isDark ? '#7E8E7C' : '#9AA096';
  const primaryText = isDark ? '#E2E9E0' : '#2B2F2A';
  return (
    <View className="flex-row flex-wrap" style={{ gap: 10 }}>
      {categories.map((category) => {
        const active = category.key === selected;
        const iconColor = active ? '#FFFFFF' : category.color;
        const textColor = active ? '#FFFFFF' : primaryText;
        const content = (
          <>
            <category.Icon color={iconColor} size={16} />
            <Text style={{ color: textColor, marginLeft: 6, fontWeight: '700' }}>{category.label}</Text>
          </>
        );
        return (
          <View key={category.key} style={{ position: 'relative' }}>
            {active ? (
              // Selected: vivid per-category gradient fill with a matching glow.
              <PressableScale
                testID={`category-chip-${category.key}`}
                onPress={() => !editMode && onSelect(category.key)}
                style={{ borderRadius: 999, overflow: 'hidden', ...shadowForGradientCard(category.color) }}
              >
                <LinearGradient
                  colors={gradientFor(category.color)}
                  start={GRADIENT_DIAGONAL.start}
                  end={GRADIENT_DIAGONAL.end}
                  style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8 }}
                >
                  {content}
                </LinearGradient>
              </PressableScale>
            ) : (
              <PressableScale
                testID={`category-chip-${category.key}`}
                onPress={() => !editMode && onSelect(category.key)}
                className="flex-row items-center rounded-full px-3 py-2"
                style={{ borderWidth: 1, borderColor }}
              >
                {content}
              </PressableScale>
            )}
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
          style={{ borderWidth: 1, borderColor: tertiaryText, borderStyle: 'dashed' }}
        >
          <Plus color={tertiaryText} size={16} />
          <Text style={{ color: tertiaryText, marginLeft: 6, fontWeight: '700' }}>Add</Text>
        </Pressable>
      ) : null}
    </View>
  );
}
