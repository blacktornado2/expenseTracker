import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { CalendarDays, Pencil } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import { format } from 'date-fns';
import { useDispatch, useSelector } from 'react-redux';

import BottomSheet from './BottomSheet';
import SegmentedToggle from '@/components/SegmentedToggle';
import CategoryChips, { type CategoryOption } from '@/components/categories/CategoryChips';
import { BUILT_IN_CATEGORIES, getIconByKey } from '@/constants/categoryPalette';
import { getCategoryMeta } from '@/constants/categoryMeta';
import { loadCustomCategories, type CustomCategory } from '@/utils/customCategories';
import { transactionSelector } from '@/redux/store/selectors';
import { updateTransaction, deleteTransaction } from '@/redux/actions/transaction.actions';
import { rawToTxDraft, txDraftToUpdatePayload, type RawStoreTxn, type TxDraft } from '@/utils/transactionMappings';
import { useTheme } from '@/contexts/ThemeContext';

type EntryType = 'expense' | 'income';

const ENTRY_OPTIONS = [
  { value: 'expense' as EntryType, label: 'Expense' },
  { value: 'income' as EntryType, label: 'Income' },
] as const;

type Props = {
  txn: RawStoreTxn | null;
  onClose: () => void;
};

export default function EditTransactionSheet({ txn, onClose }: Props) {
  const dispatch = useDispatch();
  const txState = useSelector(transactionSelector as any) as any;
  const { updateError, deleteError, updatePending, deletePending } = txState;
  const { isDark } = useTheme();

  const [draft, setDraft] = useState<TxDraft | null>(null);
  const [customCategories, setCustomCategories] = useState<CustomCategory[]>([]);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [nameError, setNameError] = useState(false);
  const [amountError, setAmountError] = useState(false);
  const [hadError, setHadError] = useState(false);

  const wasUpdating = useRef(false);
  const wasDeleting = useRef(false);

  useEffect(() => {
    if (txn) {
      setDraft(rawToTxDraft(txn));
      setNameError(false);
      setAmountError(false);
      setHadError(false);
      wasUpdating.current = false;
      wasDeleting.current = false;
    }
  }, [txn]);

  useEffect(() => {
    loadCustomCategories().then(setCustomCategories);
  }, []);

  useEffect(() => {
    if (wasUpdating.current && !updatePending) {
      if (updateError) setHadError(true);
      wasUpdating.current = false;
      if (!updateError) onClose();
    }
  }, [updatePending]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (wasDeleting.current && !deletePending) {
      if (deleteError) setHadError(true);
      wasDeleting.current = false;
      if (!deleteError) onClose();
    }
  }, [deletePending]); // eslint-disable-line react-hooks/exhaustive-deps

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
      custom: true as const,
    }));
    return [...builtIns, ...custom];
  }, [customCategories]);

  const onSave = () => {
    if (!draft) return;
    const hasNameError = draft.name.trim().length === 0;
    const hasAmountError = !draft.amountStr || parseFloat(draft.amountStr) <= 0;
    setNameError(hasNameError);
    setAmountError(hasAmountError);
    if (hasNameError || hasAmountError) return;
    setHadError(false);
    wasUpdating.current = true;
    dispatch(updateTransaction({ id: draft.id, ...txDraftToUpdatePayload(draft) }));
  };

  const onDelete = () => {
    if (!draft) return;
    setHadError(false);
    wasDeleting.current = true;
    dispatch(deleteTransaction(draft.id));
  };

  const isBusy = updatePending || deletePending;
  const error = hadError && (updateError || deleteError)
    ? (updateError ? 'Failed to save changes. Please try again.' : 'Failed to delete. Please try again.')
    : null;

  return (
    <BottomSheet visible={!!txn} onClose={onClose}>
      {draft ? (
        <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          {/* Expense/Income toggle */}
          <View className="items-center mb-5">
            <SegmentedToggle
              options={ENTRY_OPTIONS}
              value={draft.entryType}
              onChange={(v) => setDraft((d) => d ? { ...d, entryType: v } : d)}
            />
          </View>

          {/* Name field */}
          <View
            className="flex-row items-center rounded-2xl px-3 py-3 mb-3"
            style={{ borderWidth: 1, borderColor: nameError ? '#E8322A' : isDark ? '#263024' : '#E5E5E0', backgroundColor: nameError ? (isDark ? '#2A1A1A' : '#FFF5F5') : undefined }}
          >
            <Pencil color={isDark ? '#7E8E7C' : '#9AA096'} size={18} />
            <TextInput
              value={draft.name}
              onChangeText={(v) => { setDraft((d) => d ? { ...d, name: v } : d); setNameError(false); }}
              placeholder="Name"
              placeholderTextColor="#9AA096"
              style={{ marginLeft: 8, flex: 1, color: isDark ? '#E2E9E0' : '#2B2F2A' }}
            />
          </View>

          {/* Amount field */}
          <View
            className="flex-row items-center rounded-2xl px-3 py-3 mb-3"
            style={{ borderWidth: 1, borderColor: amountError ? '#E8322A' : isDark ? '#263024' : '#E5E5E0', backgroundColor: amountError ? (isDark ? '#2A1A1A' : '#FFF5F5') : undefined }}
          >
            <Text style={{ color: isDark ? '#7E8E7C' : '#9AA096', marginRight: 2, fontWeight: '600' }}>₹</Text>
            <TextInput
              value={draft.amountStr}
              onChangeText={(v) => { setDraft((d) => d ? { ...d, amountStr: v } : d); setAmountError(false); }}
              keyboardType="numeric"
              placeholder="0"
              placeholderTextColor="#9AA096"
              style={{ flex: 1, color: isDark ? '#E2E9E0' : '#2B2F2A' }}
            />
          </View>

          {/* Date field */}
          <Pressable
            className="flex-row items-center rounded-2xl px-3 py-3 mb-4"
            style={{ borderWidth: 1, borderColor: isDark ? '#263024' : '#E5E5E0' }}
            onPress={() => setShowDatePicker(true)}
          >
            <CalendarDays color={isDark ? '#7E8E7C' : '#9AA096'} size={18} />
            <Text style={{ marginLeft: 8, color: isDark ? '#E2E9E0' : '#2B2F2A' }}>
              {format(new Date(draft.date), 'MMMM dd, yyyy')}
            </Text>
          </Pressable>

          <DateTimePickerModal
            isVisible={showDatePicker}
            mode="date"
            date={new Date(draft.date)}
            onConfirm={(date) => {
              setShowDatePicker(false);
              setDraft((d) => d ? { ...d, date: date.toISOString() } : d);
            }}
            onCancel={() => setShowDatePicker(false)}
          />

          {/* Category */}
          <Text className="text-tx-primary dark:text-tx-primary-dark font-bold mb-3">Category</Text>
          <CategoryChips
            categories={categoryOptions}
            selected={draft.category}
            onSelect={(key) => setDraft((d) => d ? { ...d, category: key } : d)}
            editMode={false}
            onDelete={() => {}}
            onAdd={() => {}}
          />

          {/* Inline error */}
          {error ? (
            <Text style={{ color: '#E8322A', marginTop: 12, textAlign: 'center', fontWeight: '600' }}>
              {error}
            </Text>
          ) : null}

          {/* Save button */}
          <Pressable
            onPress={onSave}
            disabled={isBusy}
            style={{ marginTop: 24, borderRadius: 16, overflow: 'hidden' }}
          >
            <LinearGradient
              colors={['#13C076', '#0A9E5E']}
              style={{ height: 52, alignItems: 'center', justifyContent: 'center' }}
            >
              {isBusy && wasUpdating.current ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={{ color: '#FFFFFF', fontWeight: '800', fontSize: 15 }}>Save changes</Text>
              )}
            </LinearGradient>
          </Pressable>

          {/* Delete button */}
          <Pressable
            onPress={onDelete}
            disabled={isBusy}
            style={{ marginTop: 12, borderRadius: 16, height: 52, alignItems: 'center', justifyContent: 'center', backgroundColor: isDark ? '#2A1A1A' : '#FFF0F0' }}
          >
            {isBusy && wasDeleting.current ? (
              <ActivityIndicator color="#E8322A" />
            ) : (
              <Text style={{ color: '#E8322A', fontWeight: '800', fontSize: 15 }}>Delete transaction</Text>
            )}
          </Pressable>
        </ScrollView>
      ) : null}
    </BottomSheet>
  );
}
