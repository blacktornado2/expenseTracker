import { Redirect, Stack } from 'expo-router';
import { useSelector } from 'react-redux';
import { userSelector } from '@/redux/store/selectors';

export default function AuthLayout() {
    const { user } = useSelector(userSelector);

    if (!user) {
        return <Redirect href="/login" />;
    }

    return <Stack screenOptions={{headerShown: false}}/>;
}