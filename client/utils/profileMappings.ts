import type { User } from '@/types/global';

export type ProfileDraft = {
  firstName: string;
  lastName: string;
  dob: string;
  mobile: string;
  monthlyIncome: string;
  currency: string;
  country: string;
  profilePicture?: string;
};

export type UpdateUserPayload = {
  firstName: string;
  lastName: string;
  dob: string;
  mobile: string;
  monthlyIncome: number;
  currency: string;
  country: string;
  profilePicture?: string;
};

function toDateString(dob?: Date | string): string {
  if (!dob) return '';
  const d = new Date(dob);
  return Number.isNaN(d.getTime()) ? '' : d.toISOString();
}

export function userToProfileDraft(user: Partial<User>): ProfileDraft {
  return {
    firstName: user.firstName ?? '',
    lastName: user.lastName ?? '',
    dob: toDateString(user.dob),
    mobile: user.mobile ?? '',
    monthlyIncome: user.monthlyIncome ? String(user.monthlyIncome) : '',
    currency: user.currency ?? 'INR',
    country: user.country ?? '',
    profilePicture: user.profilePicture,
  };
}

export function profileDraftToUpdatePayload(draft: ProfileDraft): UpdateUserPayload {
  const payload: UpdateUserPayload = {
    firstName: draft.firstName.trim(),
    lastName: draft.lastName.trim(),
    dob: draft.dob,
    mobile: draft.mobile.trim(),
    monthlyIncome: parseFloat(draft.monthlyIncome) || 0,
    currency: draft.currency.trim() || 'INR',
    country: draft.country.trim(),
  };
  if (draft.profilePicture !== undefined) {
    payload.profilePicture = draft.profilePicture;
  }
  return payload;
}

export function normalizeServerUser(raw: any): User {
  const { _id, ...rest } = raw ?? {};
  return { ...rest, id: _id ?? raw?.id } as User;
}
