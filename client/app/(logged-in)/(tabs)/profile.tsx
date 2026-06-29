import React from 'react';
import { Pressable, RefreshControl, SafeAreaView, ScrollView, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useDispatch, useSelector } from 'react-redux';
import { LinearGradient } from 'expo-linear-gradient';
import { Link2, Bell, Coins, LogOut, Moon } from 'lucide-react-native';
import { GRADIENT_BRAND, GRADIENT_DIAGONAL } from '@/constants/gradients';

import Avatar from '@/components/Avatar';
import SettingRow from '@/components/settings/SettingRow';
import ToggleSwitch from '@/components/settings/ToggleSwitch';
import { useTheme } from '@/contexts/ThemeContext';
import { userSelector } from '@/redux/store/selectors';
import { logoutUserRequest, fetchUserRequest } from '@/redux/actions/user.actions';

export default function Settings() {
  const router = useRouter();
  const dispatch = useDispatch();
  const { isDark, toggleDark } = useTheme();
  const { user, isLoading } = useSelector(userSelector) as any;

  const name = `${user?.firstName ?? ''} ${user?.lastName ?? ''}`.trim() || 'Your account';

  const onSignOut = () => {
    dispatch(logoutUserRequest());
    router.replace('/login');
  };

  return (
    <SafeAreaView className="flex-1 bg-bg-app dark:bg-bg-app-dark">
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: 20, paddingHorizontal: 18, paddingBottom: 26 }}
        refreshControl={
          <RefreshControl
            refreshing={!!isLoading}
            onRefresh={() => user?.email && dispatch(fetchUserRequest(user.email))}
            tintColor="#0FB46B"
          />
        }
      >
        <Text
          style={{ fontFamily: 'Outfit_700Bold', fontSize: 30 }}
          className="text-tx-primary dark:text-tx-primary-dark mb-4"
        >
          Settings
        </Text>

        {/* Profile card → Profile screen */}
        <Pressable onPress={() => router.push('/profile-details')}>
          <LinearGradient
            colors={GRADIENT_BRAND}
            start={GRADIENT_DIAGONAL.start}
            end={GRADIENT_DIAGONAL.end}
            style={{ borderRadius: 26, padding: 18, marginBottom: 20, flexDirection: 'row', alignItems: 'center', gap: 14 }}
          >
            <Avatar initial={(user?.firstName ?? 'U')[0]} size={52} radius={18} uri={user?.profilePicture} />
            <View className="flex-1">
              <Text style={{ color: '#FFFFFF', fontWeight: '800', fontSize: 17 }}>{name}</Text>
              <Text style={{ color: 'rgba(255,255,255,0.85)', fontWeight: '600', fontSize: 13, marginTop: 2 }}>
                Premium plan
              </Text>
            </View>
            <Text style={{ color: '#FFFFFF', fontSize: 22 }}>›</Text>
          </LinearGradient>
        </Pressable>

        <SettingRow
          tileBg="#E6F0FF"
          icon={<Link2 size={18} color="#2563EB" />}
          label="Linked accounts"
          trailing={
            <View style={{ backgroundColor: '#E6F0FF', borderRadius: 10, paddingHorizontal: 8, paddingVertical: 2 }}>
              <Text style={{ color: '#2563EB', fontWeight: '700', fontSize: 12 }}>2</Text>
            </View>
          }
        />

        <SettingRow tileBg="#FFF1E6" icon={<Bell size={18} color="#E8703A" />} label="Notifications" />

        <SettingRow
          tileBg="#FFF7E6"
          icon={<Coins size={18} color="#D97706" />}
          label="Currency & format"
          trailing={
            <Text className="text-tx-tertiary dark:text-tx-tertiary-dark font-bold text-sm">
              {user?.currency ?? 'INR'}
            </Text>
          }
        />

        {/* Dark mode toggle — wired to ThemeContext */}
        <SettingRow
          tileBg="#EFEAFE"
          icon={<Moon size={18} color="#7C5CFC" />}
          label="Dark mode"
          trailing={<ToggleSwitch value={isDark} onValueChange={toggleDark} />}
        />

        {/* Sign out */}
        <SettingRow
          tileBg="#FDE8E8"
          icon={<LogOut size={18} color="#DC2626" />}
          label="Sign out"
          labelColor="#DC2626"
          onPress={onSignOut}
        />
      </ScrollView>
    </SafeAreaView>
  );
}
