import axios from 'axios';

import Constants from 'expo-constants';

const BASE_URL = Constants.expoConfig?.extra?.BASE_URL || '';

export const loginUserService = async ({email, password}: {email: string, password: string}) => {
    try {
        const {data} = await axios.post(`${BASE_URL}/user/login`, {
            email, password
        });
        return data;
    } catch (error: any) {
        console.log(error.message);
    }
} 