const { pickAllowedUserUpdates, ALLOWED_UPDATE_FIELDS } = require('../userUpdate');

describe('pickAllowedUserUpdates', () => {
  it('keeps all whitelisted profile fields', () => {
    const body = {
      firstName: 'Ada',
      lastName: 'Lovelace',
      dob: '1990-01-01',
      gender: 'female',
      mobile: '9999999999',
      monthlyIncome: 50000,
      currency: 'INR',
      country: 'India',
      profilePicture: 'file:///pic.jpg',
    };
    expect(pickAllowedUserUpdates(body)).toEqual(body);
  });

  it('drops email, password, _id, and role', () => {
    const body = {
      firstName: 'Ada',
      email: 'new@evil.com',
      password: 'hunter2',
      _id: 'abc123',
      role: 'admin',
    };
    expect(pickAllowedUserUpdates(body)).toEqual({ firstName: 'Ada' });
  });

  it('returns an empty object for an empty body', () => {
    expect(pickAllowedUserUpdates({})).toEqual({});
  });

  it('returns an empty object when body is undefined', () => {
    expect(pickAllowedUserUpdates()).toEqual({});
  });

  it('does not include whitelisted keys that are absent from the body', () => {
    expect(pickAllowedUserUpdates({ mobile: '123' })).toEqual({ mobile: '123' });
  });

  it('exposes the expected whitelist', () => {
    expect(ALLOWED_UPDATE_FIELDS).toEqual([
      'firstName', 'lastName', 'dob', 'gender',
      'mobile', 'monthlyIncome', 'currency', 'country', 'profilePicture',
    ]);
  });
});
