import axios from 'axios';
import Constants from 'expo-constants';

const API_BASE_URL = Constants.expoConfig?.extra?.API_BASE_URL ?? '';

export const getSavingsGoalService = async (token: string) => {
  const { status, data } = await axios.get(`${API_BASE_URL}/savings-goal`, {
    headers: { authorization: `Bearer ${token}` },
  });
  return { status, data };
};

export const setSavingsGoalService = async (token: string, amount: number) => {
  const { status, data } = await axios.put(`${API_BASE_URL}/savings-goal`, { amount }, {
    headers: { authorization: `Bearer ${token}` },
  });
  return { status, data };
};
