import React from 'react';
import { Pressable } from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import { Plus } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

export default function Fab() {
  const router = useRouter();
  const pathname = usePathname();

  if (pathname.includes('/budgets')) {
    return null;
  }

  return (
    <Pressable
      onPress={() => router.push('/addTransactionNew')}
      style={{ position: 'absolute', right: 18, bottom: 24 }}
    >
      <LinearGradient
        colors={['#13C076', '#0A9E5E']}
        style={{
          width: 56,
          height: 56,
          borderRadius: 18,
          alignItems: 'center',
          justifyContent: 'center',
          shadowColor: '#0FB46B',
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.5,
          shadowRadius: 28,
          elevation: 6,
        }}
      >
        <Plus color="#FFFFFF" size={28} />
      </LinearGradient>
    </Pressable>
  );
}
