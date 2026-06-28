import React, { useEffect, useRef, useState } from 'react';
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useDispatch, useSelector } from 'react-redux';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { GRADIENT_BRAND_BUTTON, GRADIENT_DIAGONAL } from '@/constants/gradients';
import {
  User as UserIcon,
  Phone,
  Mail,
  Calendar,
  DollarSign,
  Coins,
  Globe,
  Image as ImageIcon,
} from 'lucide-react-native';

import IconTile from '@/components/IconTile';
import Card from '@/components/Card';
import { userSelector } from '@/redux/store/selectors';
import { fetchUserRequest, updateUserRequest } from '@/redux/actions/user.actions';
import { userToProfileDraft, profileDraftToUpdatePayload, type ProfileDraft } from '@/utils/profileMappings';
import { ageFromDob } from '@/utils/profileCalcs';

const GREEN = '#0FB46B';
const PHOTO_BG = '#5FB97E';
const PHOTO_FG = '#2F8F57';
const DIVIDER = 'rgba(127,127,127,0.16)';

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
  divider?: boolean;
};

function Row({
  icon,
  tileBg,
  label,
  value,
  editing,
  onChangeText,
  keyboardType = 'default',
  editable = true,
  placeholder,
  divider = true,
}: Readonly<RowProps>) {
  return (
    <View
      className="flex-row items-center"
      style={{
        gap: 12,
        paddingVertical: 13,
        borderBottomWidth: divider ? StyleSheet.hairlineWidth : 0,
        borderBottomColor: DIVIDER,
      }}
    >
      <IconTile backgroundColor={tileBg} size={38} radius={12}>
        {icon}
      </IconTile>
      <View className="flex-1">
        <Text
          className="text-tx-tertiary dark:text-tx-tertiary-dark"
          style={{ fontSize: 11, fontWeight: '700', letterSpacing: 0.7, textTransform: 'uppercase' }}
        >
          {label}
        </Text>
        {editing && editable ? (
          <TextInput
            value={value}
            onChangeText={onChangeText}
            keyboardType={keyboardType}
            placeholder={placeholder}
            placeholderTextColor="#9AA096"
            className="text-tx-primary dark:text-tx-primary-dark"
            style={{ fontSize: 16, fontWeight: '700', paddingVertical: 2 }}
          />
        ) : (
          <Text className="text-tx-primary dark:text-tx-primary-dark font-bold" style={{ fontSize: 16, marginTop: 1 }}>
            {value || '—'}
          </Text>
        )}
      </View>
    </View>
  );
}

function SectionLabel({ children }: Readonly<{ children: string }>) {
  return (
    <Text
      className="text-tx-tertiary dark:text-tx-tertiary-dark"
      style={{ fontSize: 12, fontWeight: '700', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 8, marginLeft: 4 }}
    >
      {children}
    </Text>
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
      mediaTypes: ['images'],
      allowsEditing: true, // shows a crop + "Choose" confirm step and dismisses the picker
      allowsMultipleSelection: false,
      aspect: [1, 1], // square crop for the circular avatar
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
  const dobLabel = age === null ? 'Date of birth' : `Date of birth · Age ${age}`;
  const dobDisplay = draft.dob
    ? new Date(draft.dob).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : '';
  const incomeDisplay = draft.monthlyIncome ? `₹${Number(draft.monthlyIncome).toLocaleString('en-IN')}` : '';

  return (
    <SafeAreaView className="flex-1 bg-bg-app dark:bg-bg-app-dark">
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
      <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingTop: 20, paddingHorizontal: 18, paddingBottom: 26 }}>
        {/* Header */}
        <View className="flex-row items-center justify-between mb-5">
          <Pressable onPress={() => router.back()} hitSlop={8}>
            <Text style={{ color: GREEN }} className="font-bold text-base">‹ Settings</Text>
          </Pressable>
          <Text className="text-tx-primary dark:text-tx-primary-dark font-extrabold text-base">Profile</Text>
          <Pressable onPress={onToggle} style={{ borderRadius: 16, overflow: 'hidden' }}>
            <LinearGradient
              colors={GRADIENT_BRAND_BUTTON}
              start={GRADIENT_DIAGONAL.start}
              end={GRADIENT_DIAGONAL.end}
              style={{ paddingHorizontal: 18, paddingVertical: 8 }}
            >
              <Text style={{ color: '#FFFFFF' }} className="font-bold text-sm">{editing ? 'Save' : 'Edit'}</Text>
            </LinearGradient>
          </Pressable>
        </View>

        {/* Avatar + name */}
        <View className="items-center mb-6">
          <Pressable onPress={editing ? pickImage : undefined}>
            {draft.profilePicture ? (
              <Image
                source={{ uri: draft.profilePicture }}
                style={{ width: 96, height: 96, borderRadius: 48, backgroundColor: PHOTO_BG }}
              />
            ) : (
              <View
                style={{
                  width: 96,
                  height: 96,
                  borderRadius: 48,
                  backgroundColor: PHOTO_BG,
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderWidth: 2,
                  borderColor: 'rgba(255,255,255,0.55)',
                  borderStyle: 'dashed',
                }}
              >
                <ImageIcon size={26} color={PHOTO_FG} />
                <Text style={{ color: PHOTO_FG, fontWeight: '700', fontSize: 13, marginTop: 3 }}>Photo</Text>
              </View>
            )}
          </Pressable>
          {editing ? (
            <Text style={{ color: GREEN }} className="font-semibold text-xs mt-2">Tap avatar to change</Text>
          ) : null}
          <Text
            style={{ fontFamily: 'Outfit_700Bold', fontSize: 22 }}
            className="text-tx-primary dark:text-tx-primary-dark mt-3"
          >
            {fullName}
          </Text>
          <Text className="text-tx-tertiary dark:text-tx-tertiary-dark text-sm mt-0.5">{user?.email ?? ''}</Text>
        </View>

        {/* Personal */}
        <SectionLabel>Personal</SectionLabel>
        <Card radius={20} className="px-4 mb-6">
          <Row editing={editing} tileBg="#E6F6EC" icon={<UserIcon size={18} color="#16A34A" />} label="First name" value={draft.firstName} onChangeText={setField('firstName')} />
          <Row editing={editing} tileBg="#E6F6EC" icon={<UserIcon size={18} color="#16A34A" />} label="Last name" value={draft.lastName} onChangeText={setField('lastName')} />
          <Row editing={editing} tileBg="#E6F0FF" icon={<Calendar size={18} color="#3B82F6" />} label={editing ? 'Date of birth' : dobLabel} value={editing ? draft.dob : dobDisplay} onChangeText={setField('dob')} placeholder="YYYY-MM-DD" />
          <Row editing={editing} tileBg="#FFE6F0" icon={<Phone size={18} color="#EC4899" />} label="Mobile" value={draft.mobile} onChangeText={setField('mobile')} keyboardType="phone-pad" />
          <Row editing={false} tileBg="#FFEAEA" icon={<Mail size={18} color="#F87171" />} label="Email" value={user?.email ?? ''} editable={false} divider={false} />
        </Card>

        {/* Financial */}
        <SectionLabel>Financial</SectionLabel>
        <Card radius={20} className="px-4 mb-5">
          <Row editing={editing} tileBg="#E6F6EC" icon={<DollarSign size={18} color="#16A34A" />} label="Monthly income" value={editing ? draft.monthlyIncome : incomeDisplay} onChangeText={setField('monthlyIncome')} keyboardType="numeric" />
          <Row editing={editing} tileBg="#FFF7E6" icon={<Coins size={18} color="#D97706" />} label="Currency" value={draft.currency} onChangeText={setField('currency')} />
          <Row editing={editing} tileBg="#EFEAFE" icon={<Globe size={18} color="#7C5CFC" />} label="Country" value={draft.country} onChangeText={setField('country')} divider={false} />
        </Card>

        {hadError && error ? (
          <Text style={{ color: '#E8322A' }} className="text-center font-semibold mb-2">
            Failed to save changes. Please try again.
          </Text>
        ) : null}
      </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
