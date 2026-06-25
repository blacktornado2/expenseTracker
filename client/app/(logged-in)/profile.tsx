import React, { useEffect, useRef, useState } from 'react';
import {
  Image,
  Pressable,
  SafeAreaView,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useDispatch, useSelector } from 'react-redux';
import * as ImagePicker from 'expo-image-picker';
import { User as UserIcon, Phone, Mail, Cake, Wallet, Coins, Globe } from 'lucide-react-native';

import Avatar from '@/components/Avatar';
import IconTile from '@/components/IconTile';
import Card from '@/components/Card';
import { userSelector } from '@/redux/store/selectors';
import { fetchUserRequest, updateUserRequest } from '@/redux/actions/user.actions';
import { userToProfileDraft, profileDraftToUpdatePayload, type ProfileDraft } from '@/utils/profileMappings';
import { ageFromDob } from '@/utils/profileCalcs';

const GREEN = '#0FB46B';

type RowProps = {
  icon: React.ReactNode;
  tileBg: string;
  label: string;
  value: string;
  editing: boolean;
  onChangeText?: (v: string) => void;
  keyboardType?: 'default' | 'numeric' | 'phone-pad' | 'email-address';
  editable?: boolean;
  placeholder?: string;
};

function Row({ icon, tileBg, label, value, editing, onChangeText, keyboardType = 'default', editable = true, placeholder }: RowProps) {
  return (
    <View className="flex-row items-center py-3" style={{ gap: 12 }}>
      <IconTile backgroundColor={tileBg} size={38} radius={12}>
        {icon}
      </IconTile>
      <View className="flex-1">
        <Text className="text-tx-tertiary dark:text-tx-tertiary-dark text-xs font-semibold">{label}</Text>
        {editing && editable ? (
          <TextInput
            value={value}
            onChangeText={onChangeText}
            keyboardType={keyboardType}
            placeholder={placeholder}
            placeholderTextColor="#9AA096"
            className="text-tx-primary dark:text-tx-primary-dark"
            style={{ fontSize: 15, fontWeight: '700', paddingVertical: 2 }}
          />
        ) : (
          <Text className="text-tx-primary dark:text-tx-primary-dark font-bold" style={{ fontSize: 15 }}>
            {value || '—'}
          </Text>
        )}
      </View>
    </View>
  );
}

export default function ProfileScreen() {
  const router = useRouter();
  const dispatch = useDispatch();
  const { user, isLoading, error } = useSelector(userSelector) as any;

  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<ProfileDraft>(userToProfileDraft(user ?? {}));
  const [hadError, setHadError] = useState(false);
  const wasSaving = useRef(false);

  useEffect(() => {
    if (user?.email) {
      dispatch(fetchUserRequest(user.email));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keep the draft in sync with the latest user whenever we're not editing.
  useEffect(() => {
    if (!editing && user) {
      setDraft(userToProfileDraft(user));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // Exit edit mode on a successful save; stay (with an error) on failure.
  useEffect(() => {
    if (wasSaving.current && !isLoading) {
      wasSaving.current = false;
      if (error) {
        setHadError(true);
      } else {
        setEditing(false);
        setHadError(false);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading]);

  const setField = (key: keyof ProfileDraft) => (v: string) => setDraft((d) => ({ ...d, [key]: v }));

  const pickImage = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) return; // permission denied → keep the fallback avatar, no crash
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.5,
    });
    if (!result.canceled && result.assets?.[0]) {
      setDraft((d) => ({ ...d, profilePicture: result.assets[0].uri }));
    }
  };

  const onToggle = () => {
    if (editing) {
      if (!user?.email) return;
      setHadError(false);
      wasSaving.current = true;
      dispatch(updateUserRequest({ email: user.email, ...profileDraftToUpdatePayload(draft) }));
    } else {
      setDraft(userToProfileDraft(user ?? {}));
      setEditing(true);
    }
  };

  const fullName = `${draft.firstName} ${draft.lastName}`.trim() || user?.firstName || 'You';
  const age = ageFromDob(draft.dob);
  const dobDisplay = draft.dob ? new Date(draft.dob).toLocaleDateString('en-IN') : '';

  return (
    <SafeAreaView className="flex-1 bg-bg-app dark:bg-bg-app-dark">
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingTop: 20, paddingHorizontal: 18, paddingBottom: 26 }}>
        {/* Header */}
        <View className="flex-row items-center justify-between mb-5">
          <Pressable onPress={() => router.back()}>
            <Text style={{ color: GREEN }} className="font-bold text-base">‹ Settings</Text>
          </Pressable>
          <Text className="text-tx-primary dark:text-tx-primary-dark font-extrabold text-base">Profile</Text>
          <Pressable
            onPress={onToggle}
            style={{ backgroundColor: GREEN, borderRadius: 14, paddingHorizontal: 16, paddingVertical: 8 }}
          >
            <Text style={{ color: '#FFFFFF' }} className="font-bold text-sm">{editing ? 'Save' : 'Edit'}</Text>
          </Pressable>
        </View>

        {/* Avatar + name */}
        <View className="items-center mb-6">
          <Pressable onPress={editing ? pickImage : undefined}>
            {draft.profilePicture ? (
              <Image
                source={{ uri: draft.profilePicture }}
                style={{ width: 88, height: 88, borderRadius: 44, backgroundColor: '#13C076' }}
              />
            ) : (
              <Avatar initial={(draft.firstName || user?.firstName || 'U')[0]} size={88} radius={44} />
            )}
          </Pressable>
          {editing ? (
            <Text style={{ color: GREEN }} className="font-semibold text-xs mt-2">Tap avatar to change</Text>
          ) : null}
          <Text
            style={{ fontFamily: 'BricolageGrotesque_800ExtraBold', fontSize: 20 }}
            className="text-tx-primary dark:text-tx-primary-dark mt-3"
          >
            {fullName}
          </Text>
          <Text className="text-tx-tertiary dark:text-tx-tertiary-dark text-sm">{user?.email ?? ''}</Text>
        </View>

        {/* Personal */}
        <Text className="text-tx-secondary dark:text-tx-secondary-dark font-bold text-sm mb-1">Personal</Text>
        <Card radius={20} className="px-4 py-1 mb-5">
          <Row editing={editing} tileBg="#E6F6EC" icon={<UserIcon size={18} color="#16A34A" />} label="First name" value={draft.firstName} onChangeText={setField('firstName')} />
          <Row editing={editing} tileBg="#EFEAFE" icon={<UserIcon size={18} color="#7C5CFC" />} label="Last name" value={draft.lastName} onChangeText={setField('lastName')} />
          <Row editing={editing} tileBg="#FFF1E6" icon={<Cake size={18} color="#E8703A" />} label="Date of birth" value={editing ? draft.dob : `${dobDisplay}${age !== null ? `  ·  Age ${age}` : ''}`} onChangeText={setField('dob')} placeholder="YYYY-MM-DD" />
          <Row editing={editing} tileBg="#E6F0FF" icon={<Phone size={18} color="#2563EB" />} label="Mobile" value={draft.mobile} onChangeText={setField('mobile')} keyboardType="phone-pad" />
          <Row editing={false} tileBg="#FDE8E8" icon={<Mail size={18} color="#DC2626" />} label="Email" value={user?.email ?? ''} editable={false} />
        </Card>

        {/* Financial */}
        <Text className="text-tx-secondary dark:text-tx-secondary-dark font-bold text-sm mb-1">Financial</Text>
        <Card radius={20} className="px-4 py-1 mb-5">
          <Row editing={editing} tileBg="#E6F6EC" icon={<Wallet size={18} color="#16A34A" />} label="Monthly income" value={editing ? draft.monthlyIncome : (draft.monthlyIncome ? `₹${Number(draft.monthlyIncome).toLocaleString('en-IN')}` : '')} onChangeText={setField('monthlyIncome')} keyboardType="numeric" />
          <Row editing={editing} tileBg="#FFF7E6" icon={<Coins size={18} color="#D97706" />} label="Currency" value={draft.currency} onChangeText={setField('currency')} />
          <Row editing={editing} tileBg="#E6F6F6" icon={<Globe size={18} color="#0D9488" />} label="Country" value={draft.country} onChangeText={setField('country')} />
        </Card>

        {hadError && error ? (
          <Text style={{ color: '#E8322A' }} className="text-center font-semibold mb-2">
            Failed to save changes. Please try again.
          </Text>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}
