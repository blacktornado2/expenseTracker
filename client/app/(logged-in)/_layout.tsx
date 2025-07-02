import { Redirect, Stack } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect } from 'react';

export default function AuthLayout() {

    useEffect(() => {
        const checkAuth = async () => {
            const token = await AsyncStorage.getItem('JWT_TOKEN');
            if (token) {
                return <Redirect href="/login" />;
            }
        }
        checkAuth();
    }, []);

    return <Stack screenOptions={{ headerShown: false }} />;
}