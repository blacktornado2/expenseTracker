import React from 'react';
import { useRouter, usePathname } from 'expo-router';
import { Plus } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import PressableScale from '@/components/PressableScale';
import { GRADIENT_BRAND, GRADIENT_DIAGONAL } from '@/constants/gradients';
import { SHADOW_FAB } from '@/constants/shadows';

export default function Fab() {
  const router = useRouter();
  const pathname = usePathname();

  if (pathname.includes('/budgets')) {
    return null;
  }

  return (
    <PressableScale
      onPress={() => router.push('/addTransactionNew')}
      containerStyle={{ position: 'absolute', right: 18, bottom: 90 }}
    >
      <LinearGradient
        colors={GRADIENT_BRAND}
        start={GRADIENT_DIAGONAL.start}
        end={GRADIENT_DIAGONAL.end}
        style={[{
          width: 56,
          height: 56,
          borderRadius: 18,
          alignItems: 'center',
          justifyContent: 'center',
        }, SHADOW_FAB]}
      >
        <Plus color="#FFFFFF" size={28} />
      </LinearGradient>
    </PressableScale>
  );
}
