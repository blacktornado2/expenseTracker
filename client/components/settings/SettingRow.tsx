import React from 'react';
import { Pressable, Text, View } from 'react-native';
import IconTile from '@/components/IconTile';
import Card from '@/components/Card';

type SettingRowProps = {
  icon: React.ReactNode;
  tileBg: string;
  label: string;
  onPress?: () => void;
  trailing?: React.ReactNode;
  labelColor?: string;
};

export default function SettingRow({ icon, tileBg, label, onPress, trailing, labelColor }: SettingRowProps) {
  return (
    <Pressable onPress={onPress} disabled={!onPress}>
      <Card radius={18} className="flex-row items-center px-4 py-3 mb-3" style={{ gap: 12 }}>
        <IconTile backgroundColor={tileBg} size={38} radius={12}>
          {icon}
        </IconTile>
        <Text
          className="flex-1 font-bold text-[15px] text-tx-primary dark:text-tx-primary-dark"
          style={labelColor ? { color: labelColor } : undefined}
        >
          {label}
        </Text>
        {trailing}
      </Card>
    </Pressable>
  );
}
