import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSelector } from 'react-redux';
import BottomSheet from './BottomSheet';
import CategoryChips, { type CategoryOption } from '@/components/categories/CategoryChips';
import { BUILT_IN_CATEGORIES, getIconByKey } from '@/constants/categoryPalette';
import { getCategoryMeta } from '@/constants/categoryMeta';
import { loadCustomCategories, type CustomCategory } from '@/utils/customCategories';
import { useBudgets, type Budget } from '@/contexts/BudgetsContext';
import { useTheme } from '@/contexts/ThemeContext';
import { resolveSaveOutcome, SAVE_ERROR_MESSAGE } from '@/utils/savingsCalcs';

type BudgetSheetProps = {
  mode: 'add' | 'edit' | null;
  editBudget?: Budget;
  onClose: () => void;
};

export default function BudgetSheet({ mode, editBudget, onClose }: BudgetSheetProps) {
  const { budgets, addBudget, updateBudget, deleteBudget } = useBudgets();
  const { isDark } = useTheme();
  const [selectedCat, setSelectedCat] = useState('');
  const [limitStr, setLimitStr] = useState('');
  const [limitError, setLimitError] = useState(false);
  const [customCategories, setCustomCategories] = useState<CustomCategory[]>([]);
  const [actionError, setActionError] = useState<string | null>(null);
  const createError = useSelector((s: any) => s.budget?.createError);
  const updateError = useSelector((s: any) => s.budget?.updateError);
  const deleteError = useSelector((s: any) => s.budget?.deleteError);
  const createPending = useSelector((s: any) => s.budget?.createPending ?? false);
  const updatePending = useSelector((s: any) => s.budget?.updatePending ?? false);
  const deletePending = useSelector((s: any) => s.budget?.deletePending ?? false);
  const lastAction = useRef<'add' | 'edit' | 'delete' | null>(null);
  const wasSaving = useRef(false);
  const wasDeleting = useRef(false);

  // Load custom categories once on mount
  useEffect(() => {
    loadCustomCategories().then(setCustomCategories);
  }, []);

  // Reset form when mode/editBudget changes
  useEffect(() => {
    if (mode === 'edit' && editBudget) {
      setSelectedCat(editBudget.cat);
      setLimitStr(String(editBudget.limit));
      setLimitError(false);
    } else if (mode === 'add') {
      setSelectedCat('');
      setLimitStr('');
      setLimitError(false);
    }
    setActionError(null);
    lastAction.current = null;
    wasSaving.current = false;
    wasDeleting.current = false;
  }, [mode, editBudget]);

  // After a save attempt, resolve once the relevant pending flag's
  // true -> false transition fires (not on error-reference equality, which
  // would never re-fire on a clean successful retry). On failure, keep the
  // sheet open with the draft intact and surface the inline error instead
  // of closing.
  useEffect(() => {
    if (lastAction.current !== 'add' && lastAction.current !== 'edit') return;
    const isPending = lastAction.current === 'add' ? createPending : updatePending;
    const hasError = !!(lastAction.current === 'add' ? createError : updateError);
    const outcome = resolveSaveOutcome(wasSaving.current, isPending, hasError);
    wasSaving.current = isPending;
    if (outcome === 'noop') return;
    lastAction.current = null;
    if (outcome === 'error') {
      setActionError(SAVE_ERROR_MESSAGE);
    } else {
      onClose();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [createPending, updatePending]);

  useEffect(() => {
    if (lastAction.current !== 'delete') return;
    const outcome = resolveSaveOutcome(wasDeleting.current, deletePending, !!deleteError);
    wasDeleting.current = deletePending;
    if (outcome === 'noop') return;
    lastAction.current = null;
    if (outcome === 'error') {
      setActionError("Couldn't delete — check your connection and try again.");
    } else {
      onClose();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deletePending]);

  const budgetedCats = useMemo(
    () => new Set(budgets.map((b) => b.cat)),
    [budgets]
  );

  const availableCategories: CategoryOption[] = useMemo(() => {
    const builtIns = BUILT_IN_CATEGORIES.filter(
      ({ key }) => mode !== 'add' || !budgetedCats.has(key)
    ).map(({ key, label }) => {
      const meta = getCategoryMeta(key);
      return { key, label, color: meta.color, Icon: meta.Icon };
    });

    const custom = customCategories
      .filter(({ key }) => mode !== 'add' || !budgetedCats.has(key))
      .map((cat) => ({
        key: cat.key,
        label: cat.label,
        color: cat.color,
        Icon: getIconByKey(cat.icon),
        custom: true as const,
      }));

    return [...builtIns, ...custom];
  }, [customCategories, budgetedCats, mode]);

  // Auto-select the first available category in add mode
  useEffect(() => {
    if (mode === 'add' && !selectedCat && availableCategories.length > 0) {
      setSelectedCat(availableCategories[0].key);
    }
  }, [mode, availableCategories, selectedCat]);

  const onSave = async () => {
    const limit = parseFloat(limitStr);
    if (!limit || limit <= 0) {
      setLimitError(true);
      return;
    }
    setActionError(null);
    if (mode === 'add') {
      lastAction.current = 'add';
      await addBudget({ cat: selectedCat, limit });
    } else if (mode === 'edit' && editBudget) {
      lastAction.current = 'edit';
      await updateBudget(editBudget.cat, limit);
    }
  };

  const onDelete = async () => {
    if (editBudget) {
      setActionError(null);
      lastAction.current = 'delete';
      await deleteBudget(editBudget.cat);
    }
  };

  const lockedMeta = mode === 'edit' && editBudget ? getCategoryMeta(editBudget.cat) : null;
  const lockedLabel = editBudget
    ? editBudget.cat.charAt(0).toUpperCase() + editBudget.cat.slice(1)
    : '';

  return (
    <BottomSheet visible={!!mode} onClose={onClose}>
      {/* Title */}
      <Text
        style={{ fontFamily: 'BricolageGrotesque_800ExtraBold', fontSize: 22, marginBottom: 20 }}
        className="text-tx-primary dark:text-tx-primary-dark"
      >
        {mode === 'add' ? 'New Budget' : 'Edit Budget'}
      </Text>

      {/* Category section */}
      <Text
        className="text-tx-primary dark:text-tx-primary-dark font-bold mb-3"
        style={{ fontFamily: 'PlusJakartaSans_700Bold' }}
      >
        Category
      </Text>

      {mode === 'edit' && lockedMeta ? (
        /* Locked category tile in edit mode */
        <View
          className="flex-row items-center self-start rounded-full px-3 py-2 mb-4"
          style={{
            backgroundColor: lockedMeta.softBg,
            borderWidth: 1,
            borderColor: lockedMeta.color,
          }}
        >
          <lockedMeta.Icon color={lockedMeta.color} size={16} />
          <Text
            style={{
              color: lockedMeta.color,
              marginLeft: 6,
              fontWeight: '700',
              fontFamily: 'PlusJakartaSans_700Bold',
            }}
          >
            {lockedLabel}
          </Text>
        </View>
      ) : availableCategories.length === 0 ? (
        <Text
          className="text-tx-tertiary dark:text-tx-tertiary-dark mb-4"
          style={{ fontFamily: 'PlusJakartaSans_400Regular', fontSize: 14 }}
        >
          All categories already have a budget.
        </Text>
      ) : (
        <View className="mb-4">
          <CategoryChips
            categories={availableCategories}
            selected={selectedCat}
            onSelect={setSelectedCat}
            editMode={false}
            onDelete={() => {}}
            onAdd={() => {}}
          />
        </View>
      )}

      {/* Monthly limit input */}
      <Text
        className="text-tx-primary dark:text-tx-primary-dark font-bold mb-2"
        style={{ fontFamily: 'PlusJakartaSans_700Bold' }}
      >
        Monthly limit
      </Text>
      <View
        className="flex-row items-center rounded-2xl px-3 py-3 mb-6"
        style={{
          borderWidth: 1.5,
          borderColor: limitError ? '#E8322A' : isDark ? '#263024' : '#E5E5E0',
          backgroundColor: limitError ? (isDark ? '#2A1A1A' : '#FFF5F5') : undefined,
        }}
      >
        <Text
          style={{
            color: isDark ? '#7E8E7C' : '#9AA096',
            marginRight: 2,
            fontWeight: '600',
            fontFamily: 'PlusJakartaSans_600SemiBold',
          }}
        >
          ₹
        </Text>
        <TextInput
          value={limitStr}
          onChangeText={(v) => {
            setLimitStr(v);
            setLimitError(false);
          }}
          keyboardType="numeric"
          placeholder="0"
          placeholderTextColor="#9AA096"
          style={{
            flex: 1,
            color: isDark ? '#E2E9E0' : '#2B2F2A',
            fontFamily: 'PlusJakartaSans_600SemiBold',
            fontSize: 16,
          }}
        />
      </View>

      {/* Save button */}
      <Pressable
        onPress={onSave}
        style={{ borderRadius: 16, overflow: 'hidden', marginBottom: 12 }}
      >
        <LinearGradient
          colors={['#13C076', '#0A9E5E']}
          style={{ height: 52, alignItems: 'center', justifyContent: 'center' }}
        >
          <Text
            style={{
              color: '#FFFFFF',
              fontWeight: '800',
              fontSize: 15,
              fontFamily: 'PlusJakartaSans_800ExtraBold',
            }}
          >
            Save budget
          </Text>
        </LinearGradient>
      </Pressable>

      {actionError ? (
        <Text className="text-center mb-3" style={{ color: '#E8322A', fontSize: 13, fontWeight: '600' }}>
          {actionError}
        </Text>
      ) : null}

      {/* Delete button — edit mode only */}
      {mode === 'edit' && (
        <Pressable
          onPress={onDelete}
          style={{
            borderRadius: 16,
            height: 52,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: isDark ? '#2A1A1A' : '#FFF0F0',
          }}
        >
          <Text
            style={{
              color: '#E8322A',
              fontWeight: '800',
              fontSize: 15,
              fontFamily: 'PlusJakartaSans_800ExtraBold',
            }}
          >
            Delete budget
          </Text>
        </Pressable>
      )}
    </BottomSheet>
  );
}
