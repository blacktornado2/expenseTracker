import axios from 'axios';

import Constants from 'expo-constants';

import type { CreateTransactionPayload } from '../actions/transaction.actions';

const API_BASE_URL = Constants.expoConfig?.extra?.API_BASE_URL ?? '';

export const getAllTransactionsService = async (token: string) => {
    try {
        const {status, data} = await axios.get(`${API_BASE_URL}/transaction/user`, {
            headers: {
                'authorization': `Bearer ${token}`,
            },
        });
        return {status, data};
    } catch (err) {
        console.log('error fetching transactions', err);
    }
}

export const createTransactionService = async (token: string, payload: CreateTransactionPayload) => {
    const { status, data } = await axios.post(`${API_BASE_URL}/transaction`, payload, {
        headers: {
            'authorization': `Bearer ${token}`,
        },
    });
    return { status, data };
}