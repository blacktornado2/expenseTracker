import store from './store';

import { UserStateType } from '@/types/global';

export type StoreRootState = ReturnType<typeof store.getState>;

export const userSelector = (state: StoreRootState): UserStateType => state.user;