import { call, put, select } from 'redux-saga/effects';
import AsyncStorage from '@react-native-async-storage/async-storage';

jest.mock('@react-native-async-storage/async-storage', () => ({
  multiRemove: jest.fn(),
}));

import { updateUserSaga, logoutUserSaga, fetchUserSaga } from '../user.sagas';
import { userSelector } from '../../store/selectors';
import { updateUserService, getUserProfileService } from '../../services/user.service';
import {
  updateUserSuccess,
  updateUserFailure,
  fetchUserSuccess,
  fetchUserFailure,
  logoutUserSuccess,
} from '../../actions/user.actions';
import { normalizeServerUser } from '../../../utils/profileMappings';

describe('updateUserSaga', () => {
  const action = {
    type: 'UPDATE_USER_REQUEST',
    payload: { email: 'ada@example.com', firstName: 'Ada', monthlyIncome: 50000 },
  };

  it('selects token, calls the service, and puts success with the normalized user', () => {
    const gen = updateUserSaga(action as any);
    expect(gen.next().value).toEqual(select(userSelector));
    expect(gen.next({ token: 'abc' }).value).toEqual(
      call(updateUserService, 'abc', 'ada@example.com', { firstName: 'Ada', monthlyIncome: 50000 })
    );
    const data = { user: { _id: 'id1', email: 'ada@example.com', firstName: 'Ada' } };
    expect(gen.next({ data }).value).toEqual(put(updateUserSuccess(normalizeServerUser(data.user))));
    expect(gen.next().done).toBe(true);
  });

  it('puts a failure action when the service throws', () => {
    const gen = updateUserSaga(action as any);
    gen.next();
    gen.next({ token: 'abc' });
    const error = new Error('network error');
    expect(gen.throw(error).value).toEqual(put(updateUserFailure(error)));
  });
});

describe('fetchUserSaga', () => {
  const action = { type: 'GET_USER_REQUEST', payload: 'ada@example.com' };

  it('selects token, calls the profile service, and puts success with the normalized user', () => {
    const gen = fetchUserSaga(action as any);
    expect(gen.next().value).toEqual(select(userSelector));
    expect(gen.next({ token: 'abc' }).value).toEqual(
      call(getUserProfileService, 'abc', 'ada@example.com')
    );
    const data = { _id: 'id1', email: 'ada@example.com', firstName: 'Ada' };
    expect(gen.next({ data }).value).toEqual(put(fetchUserSuccess(normalizeServerUser(data))));
    expect(gen.next().done).toBe(true);
  });

  it('puts a failure action when the service throws', () => {
    const gen = fetchUserSaga(action as any);
    gen.next();
    gen.next({ token: 'abc' });
    const error = new Error('boom');
    expect(gen.throw(error).value).toEqual(put(fetchUserFailure(error)));
  });
});

describe('logoutUserSaga', () => {
  it('clears the persisted session from AsyncStorage and puts logout success', () => {
    const gen = logoutUserSaga();
    expect(gen.next().value).toEqual(call([AsyncStorage, 'multiRemove'], ['JWT_TOKEN', 'USER']));
    expect(gen.next().value).toEqual(put(logoutUserSuccess()));
    expect(gen.next().done).toBe(true);
  });
});
