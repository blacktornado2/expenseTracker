import store from './store';

import { UserStateType, Transaction } from '@/types/global';

export type StoreRootState = ReturnType<typeof store.getState>;

export const userSelector = (state: StoreRootState): UserStateType => state.user;
export const transactionSelector = (state: StoreRootState): Transaction => state.transaction;