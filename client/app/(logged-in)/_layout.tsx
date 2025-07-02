import { Redirect, Stack, useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';

export default function AuthLayout() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(true);

    // const [token, setToken] = useState(async () => await AsyncStorage.getItem('JWT_TOKEN'));

    useEffect(() => {
        const checkAuth = async () => {
            try {
                const token = await AsyncStorage.getItem('JWT_TOKEN');
                console.log("token", token);
                if (!token) {
                    router.replace('/login');
                }
            } catch (error) {
                console.error(error);
                router.replace('/login');
            } finally {
                setIsLoading(false)

            }
        }
        checkAuth();
    }, [isLoading]);

    if (isLoading) return null;

    return <Stack screenOptions={{ headerShown: false }} />;
}