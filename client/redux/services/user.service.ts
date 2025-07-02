import axios from 'axios';

import Constants from 'expo-constants';

const API_BASE_URL = Constants.expoConfig?.extra?.API_BASE_URL ?? '';

export const loginUserService = async ({ email, password }: { email: string, password: string }) => {
    try {
        const { data } = await axios.post(`${API_BASE_URL}/user/login`, {
            email, password
        });
        return data;
    } catch (error: any) {
        console.log("999")
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
