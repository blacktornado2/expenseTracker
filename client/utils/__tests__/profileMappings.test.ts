import {
  userToProfileDraft,
  profileDraftToUpdatePayload,
  normalizeServerUser,
  type ProfileDraft,
} from '../profileMappings';

const draft: ProfileDraft = {
  firstName: 'Ada',
  lastName: 'Lovelace',
  dob: '1990-01-01T00:00:00.000Z',
  mobile: '9999999999',
  monthlyIncome: '50000',
  currency: 'INR',
  country: 'India',
  profilePicture: 'file:///pic.jpg',
};

describe('userToProfileDraft', () => {
  it('maps user fields to string-based draft fields', () => {
    const result = userToProfileDraft({
      firstName: 'Ada',
      lastName: 'Lovelace',
      dob: '1990-01-01T00:00:00.000Z',
      mobile: '9999999999',
      monthlyIncome: 50000,
      currency: 'INR',
      country: 'India',
      profilePicture: 'file:///pic.jpg',
    });
    expect(result).toEqual(draft);
  });

  it('fills missing fields with empty strings and a default currency', () => {
    const result = userToProfileDraft({ firstName: 'Bob' });
    expect(result).toEqual({
      firstName: 'Bob',
      lastName: '',
      dob: '',
      mobile: '',
      monthlyIncome: '',
      currency: 'INR',
      country: '',
      profilePicture: undefined,
    });
  });

  it('renders a zero monthlyIncome as an empty string, not "0"', () => {
    const result = userToProfileDraft({ firstName: 'Bob', monthlyIncome: 0 });
    expect(result.monthlyIncome).toBe('');
  });
});

describe('profileDraftToUpdatePayload', () => {
  it('parses monthlyIncome to a number and trims strings', () => {
    const result = profileDraftToUpdatePayload({ ...draft, firstName: '  Ada  ', monthlyIncome: '50000' });
    expect(result).toEqual({
      firstName: 'Ada',
      lastName: 'Lovelace',
      dob: '1990-01-01T00:00:00.000Z',
      mobile: '9999999999',
      monthlyIncome: 50000,
      currency: 'INR',
      country: 'India',
      profilePicture: 'file:///pic.jpg',
    });
  });

  it('coerces an empty or non-numeric monthlyIncome to 0', () => {
    expect(profileDraftToUpdatePayload({ ...draft, monthlyIncome: '' }).monthlyIncome).toBe(0);
    expect(profileDraftToUpdatePayload({ ...draft, monthlyIncome: 'abc' }).monthlyIncome).toBe(0);
  });

  it('omits profilePicture from the payload when it is undefined', () => {
    const { profilePicture, ...rest } = draft;
    const result = profileDraftToUpdatePayload({ ...rest, profilePicture: undefined });
    expect('profilePicture' in result).toBe(false);
  });
});

describe('normalizeServerUser', () => {
  it('maps _id to id and preserves other fields', () => {
    const result = normalizeServerUser({
      _id: 'abc123',
      email: 'ada@example.com',
      firstName: 'Ada',
      monthlyIncome: 50000,
    });
    expect(result.id).toBe('abc123');
    expect(result.email).toBe('ada@example.com');
    expect(result.firstName).toBe('Ada');
    expect(result.monthlyIncome).toBe(50000);
  });

  it('falls back to an existing id when _id is absent', () => {
    expect(normalizeServerUser({ id: 'xyz', firstName: 'Bob' }).id).toBe('xyz');
  });
});
