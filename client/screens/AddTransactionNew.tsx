import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useDispatch, useSelector } from 'react-redux';
import { CalendarDays, Pencil } from 'lucide-react-native';
import { format } from 'date-fns';

import SegmentedToggle from '@/components/SegmentedToggle';
import Numpad from '@/components/numpad/Numpad';
import CategoryChips, { type CategoryOption } from '@/components/categories/CategoryChips';
import CategoryEditor, { type NewCategoryDraft } from '@/components/categories/CategoryEditor';
import { applyNumpadKey, parseAmount, type NumpadKeyValue } from '@/utils/amountInput';
import { BUILT_IN_CATEGORIES, getIconByKey } from '@/constants/categoryPalette';
import { getCategoryMeta } from '@/constants/categoryMeta';
import {
  loadCustomCategories,
  saveCustomCategories,
  addCustomCategory,
  removeCustomCategory,
  slugifyCategoryName,
  type CustomCategory,
} from '@/utils/customCategories';
import { createTransaction } from '@/redux/actions/transaction.actions';
import { userSelector } from '@/redux/store/selectors';
import { entryTypeToTxnType } from '@/utils/transactionMappings';
import { useTheme } from '@/contexts/ThemeContext';

type EntryType = 'expense' | 'income';

const ENTRY_OPTIONS: readonly [{ value: EntryType; label: string }, { value: EntryType; label: string }] = [
  { value: 'expense', label: 'Expense' },
  { value: 'income', label: 'Income' },
];

export default function AddTransactionNew() {
  const router = useRouter();
  const dispatch = useDispatch();
  useSelector(userSelector);
  const { isDark } = useTheme();

  const [entryType, setEntryType] = useState<EntryType>('expense');
  const [amountStr, setAmountStr] = useState('');
  const [name, setName] = useState('');
  const [date] = useState(() => new Date());
  const [customCategories, setCustomCategories] = useState<CustomCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState(BUILT_IN_CATEGORIES[0].key);
  const [editMode, setEditMode] = useState(false);
  const [showEditor, setShowEditor] = useState(false);
  const [amountError, setAmountError] = useState(false);
  const [nameError, setNameError] = useState(false);

  useEffect(() => {
    loadCustomCategories().then(setCustomCategories);
  }, []);

  const categoryOptions: CategoryOption[] = useMemo(() => {
    const builtIns = BUILT_IN_CATEGORIES.map(({ key, label }) => {
      const meta = getCategoryMeta(key);
      return { key, label, color: meta.color, Icon: meta.Icon };
    });
    const custom = customCategories.map((cat) => ({
      key: cat.key,
      label: cat.label,
      color: cat.color,
      Icon: getIconByKey(cat.icon),
      custom: true,
    }));
    return [...builtIns, ...custom];
  }, [customCategories]);

  const onNumpadKey = (key: NumpadKeyValue) => {
    setAmountStr((current) => applyNumpadKey(current, key));
    setAmountError(false);
  };

  const onAddCategory = async (draft: NewCategoryDraft) => {
    const key = slugifyCategoryName(draft.name);
    const newCategory: CustomCategory = { key, label: draft.name, color: draft.color, icon: draft.icon };
    const updated = addCustomCategory(customCategories, newCategory);
    setCustomCategories(updated);
    await saveCustomCategories(updated);
    setSelectedCategory(key);
    setShowEditor(false);
  };

  const onDeleteCategory = async (key: string) => {
    const updated = removeCustomCategory(customCategories, key);
    setCustomCategories(updated);
    await saveCustomCategories(updated);
    if (selectedCategory === key) {
      setSelectedCategory(BUILT_IN_CATEGORIES[0].key);
    }
  };

  const onSubmit = () => {
    const amount = parseAmount(amountStr);
    const hasAmountError = amount <= 0;
    const hasNameError = name.trim().length === 0;
    setAmountError(hasAmountError);
    setNameError(hasNameError);
    if (hasAmountError || hasNameError) {
      return;
    }
    dispatch(
      createTransaction({
        transactionType: entryTypeToTxnType(entryType),
        amount,
        category: selectedCategory,
        date: date.toISOString(),
        description: name.trim(),
      })
    );
    router.replace('/(logged-in)/(tabs)/transactions');
  };

  const amountColor = amountError ? '#E8322A' : entryType === 'income' ? '#0FB46B' : isDark ? '#E2E9E0' : '#2B2F2A';

  return (
    <ScrollView className="flex-1 bg-bg-app dark:bg-bg-app-dark" contentContainerStyle={{ paddingTop: 56, paddingHorizontal: 20, paddingBottom: 40 }}>
      <View className="flex-row items-center justify-between">
        <Pressable onPress={() => router.back()}>
          <Text className="text-brand-green font-bold text-base">Cancel</Text>
        </Pressable>
        <Text className="text-tx-primary dark:text-tx-primary-dark font-extrabold text-lg">
          {entryType === 'income' ? 'New income' : 'New expense'}
        </Text>
        <View style={{ width: 48 }} />
      </View>

      <View className="items-center mt-4">
        <SegmentedToggle options={ENTRY_OPTIONS} value={entryType} onChange={setEntryType} />
      </View>

      <View className="items-center mt-8">
        <Text className="text-tx-secondary dark:text-tx-secondary-dark text-sm">Amount</Text>
        <Text testID="amount-display" style={{ color: amountColor, fontFamily: 'BricolageGrotesque_800ExtraBold', fontSize: 58 }}>
          {`₹${amountStr || '0'}`}
        </Text>
      </View>

      <View
        className="flex-row items-center mt-6 rounded-2xl px-3 py-3"
        style={{
          borderWidth: 1,
          borderColor: nameError ? '#E8322A' : isDark ? '#263024' : '#E5E5E0',
          backgroundColor: nameError ? (isDark ? '#2A1A1A' : '#FFF5F5') : undefined,
        }}
      >
        <Pencil color={isDark ? '#7E8E7C' : '#9AA096'} size={18} />
        <TextInput
          testID="transaction-name-input"
          value={name}
          onChangeText={(value) => {
            setName(value);
            setNameError(false);
          }}
          placeholder="Name"
          placeholderTextColor="#9AA096"
          style={{ marginLeft: 8, flex: 1, color: isDark ? '#E2E9E0' : '#2B2F2A', borderColor: nameError ? '#E8322A' : 'transparent', borderWidth: 1 }}
        />
      </View>

      <View className="flex-row items-center mt-4 rounded-2xl px-3 py-3" style={{ borderWidth: 1, borderColor: isDark ? '#263024' : '#E5E5E0' }}>
        <CalendarDays color={isDark ? '#7E8E7C' : '#9AA096'} size={18} />
        <Text style={{ marginLeft: 8, color: isDark ? '#E2E9E0' : '#2B2F2A' }}>{format(date, 'MMMM dd, yyyy')}</Text>
      </View>

      <View className="mt-6">
        <View className="flex-row items-center justify-between mb-3">
          <Text className="text-tx-primary dark:text-tx-primary-dark font-bold">Category</Text>
          <Pressable onPress={() => setEditMode((value) => !value)}>
            <Text className="text-brand-green font-bold">{editMode ? 'Done' : 'Edit'}</Text>
          </Pressable>
        </View>
        <CategoryChips
          categories={categoryOptions}
          selected={selectedCategory}
          onSelect={setSelectedCategory}
          editMode={editMode}
          onDelete={onDeleteCategory}
          onAdd={() => setShowEditor(true)}
        />
        {showEditor ? (
          <View className="mt-3">
            <CategoryEditor onConfirm={onAddCategory} onCancel={() => setShowEditor(false)} />
          </View>
        ) : null}
      </View>

      <View className="mt-6">
        <Numpad onKey={onNumpadKey} />
      </View>

      <Pressable
        testID="submit-transaction"
        onPress={onSubmit}
        className="mt-6 rounded-2xl items-center justify-center"
        style={{ height: 56, backgroundColor: entryType === 'income' ? '#0FB46B' : '#E8322A' }}
      >
        <Text className="text-white font-extrabold text-base">
          {entryType === 'income' ? 'Add income' : 'Add expense'}
        </Text>
      </Pressable>
    </ScrollView>
  );
}
