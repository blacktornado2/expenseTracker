import axios from 'axios';

import Constants from 'expo-constants';
import type { UpdateUserPayload } from '@/utils/profileMappings';

const API_BASE_URL = Constants.expoConfig?.extra?.API_BASE_URL ?? '';

export const loginUserService = async ({ email, password }: { email: string, password: string }) => {
    try {
        const { data } = await axios.post(`${API_BASE_URL}/user/login`, {
            email, password
        });
        return data;
    } catch (error: any) {
        console.log(error.message);
    }
}

export const registerUserService = async ({ name, email, password }: { name: string, email: string, password: string }) => {
    try {
        const response = await axios.post(`${API_BASE_URL}/user/register`, {
            firstName: name, email, password
        });
        return response;
    } catch (error: any) {
        console.log(error.message);
    }
}

export const updateUserService = async (
  token: string,
  email: string,
  payload: Partial<UpdateUserPayload>
) => {
  const { status, data } = await axios.put(`${API_BASE_URL}/user/${email}`, payload, {
    headers: { authorization: `Bearer ${token}` },
  });
  return { status, data };
};

export const getUserProfileService = async (token: string, email: string) => {
  const { status, data } = await axios.get(`${API_BASE_URL}/user/${email}`, {
    headers: { authorization: `Bearer ${token}` },
  });
  return { status, data };
};
