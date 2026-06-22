import axios from 'axios';
import Constants from 'expo-constants';

import type { CreateBudgetPayload } from '../actions/budget.actions';

const API_BASE_URL = Constants.expoConfig?.extra?.API_BASE_URL ?? '';

export const getBudgetsService = async (token: string) => {
  const { status, data } = await axios.get(`${API_BASE_URL}/budget`, {
    headers: { authorization: `Bearer ${token}` },
  });
  return { status, data };
};

export const createBudgetService = async (token: string, payload: CreateBudgetPayload) => {
  const { status, data } = await axios.post(`${API_BASE_URL}/budget`, payload, {
    headers: { authorization: `Bearer ${token}` },
  });
  return { status, data };
};

export const updateBudgetService = async (token: string, id: string, payload: { limit: number }) => {
  const { status, data } = await axios.put(`${API_BASE_URL}/budget/${id}`, payload, {
    headers: { authorization: `Bearer ${token}` },
  });
  return { status, data };
};

export const deleteBudgetService = async (token: string, id: string) => {
  const { status, data } = await axios.delete(`${API_BASE_URL}/budget/${id}`, {
    headers: { authorization: `Bearer ${token}` },
  });
  return { status, data };
};
