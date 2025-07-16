import React from 'react';
import { Stack, useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';
import { jwtDecode } from 'jwt-decode';

export default function AuthLayout() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const checkAuth = async () => {
            try {
                const token = await AsyncStorage.getItem('JWT_TOKEN');
                console.log("token: ", token);

                if (!token) {
                    router.replace('/login');
                    return;
                }

                const { exp } = jwtDecode(token) as { exp: number };
                const isTokenExpired = Date.now() > (exp * 1000);

                if (isTokenExpired) {
                    router.replace('/login');
                    return;
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