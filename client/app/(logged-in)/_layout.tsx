import { Redirect, Stack, useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { userSelector } from '@/redux/store/selectors';
import { getBudgets } from '@/redux/actions/budget.actions';
import { getSavingsGoal } from '@/redux/actions/savingsGoal.actions';
import { loginUserSuccess } from '@/redux/actions/user.actions';
import { getAllTransactions } from '@/redux/actions/transaction.actions';
import { createBudgetService } from '@/redux/services/budget.service';
import { setSavingsGoalService } from '@/redux/services/savingsGoal.service';
import { runDataMigration } from '@/utils/dataMigration';

export default function AuthLayout() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(true);
    const dispatch = useDispatch();
    const { token } = useSelector(userSelector);

    // const [token, setToken] = useState(async () => await AsyncStorage.getItem('JWT_TOKEN'));

    useEffect(() => {
        const checkAuth = async () => {
            try {
                const storedToken = await AsyncStorage.getItem('JWT_TOKEN');
                if (!storedToken) {
                    router.replace('/login');
                    return;
                }
                // Redux state is in-memory and resets on every reload. Rehydrate the
                // session from storage so authed sagas (which read the token from redux)
                // can fetch data, then kick off the initial loads.
                const userRaw = await AsyncStorage.getItem('USER');
                const storedUser = userRaw ? JSON.parse(userRaw) : null;
                dispatch(loginUserSuccess(storedUser, storedToken));
                dispatch(getAllTransactions());
                dispatch(getBudgets());
                dispatch(getSavingsGoal());
            } catch (error) {
                console.error(error);
                router.replace('/login');
            } finally {
                setIsLoading(false)

            }
        }
        checkAuth();
    }, [isLoading]);

    useEffect(() => {
        if (!token) return;
        runDataMigration({
            isMigrated: async () => (await AsyncStorage.getItem('PHASE9_MIGRATED')) === 'true',
            setMigrated: async () => { await AsyncStorage.setItem('PHASE9_MIGRATED', 'true'); },
            loadLocalBudgets: async () => {
                const raw = await AsyncStorage.getItem('BUDGETS');
                return raw ? JSON.parse(raw) : [];
            },
            loadLocalGoal: async () => {
                const raw = await AsyncStorage.getItem('SAVINGS_GOAL');
                const n = raw ? Number(raw) : 0;
                return Number.isFinite(n) ? n : 0;
            },
            postBudget: async (payload) => { await createBudgetService(token, payload); },
            putGoal: async (amount) => { await setSavingsGoalService(token, amount); },
            clearLocal: async () => { await AsyncStorage.multiRemove(['BUDGETS', 'SAVINGS_GOAL']); },
        }).then((result) => {
            if (result === 'migrated') {
                dispatch(getBudgets());
                dispatch(getSavingsGoal());
            }
        });
    }, [token, dispatch]);

    if (isLoading) return null;

    return <Stack screenOptions={{ headerShown: false }} />;
}