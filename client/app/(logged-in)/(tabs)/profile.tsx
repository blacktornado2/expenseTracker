import React from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import { useDispatch } from 'react-redux';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { logoutUserRequest, logoutUserSuccess } from '@/redux/actions/user.actions';

const user = {
  name: 'John Doe',
  gender: 'Male',
  age: 29,
  email: 'johndoe@example.com',
  phone: '+1 234 567 890',
  location: 'San Francisco, CA',
  joined: '2020-05-15',
  image: require('@/assets/images/no_user.png'),
};

const Profile = () => {
  const dispatch = useDispatch();
  const router = useRouter();

  const handleLogout = async () => {
    dispatch(logoutUserRequest());
    await AsyncStorage.removeItem('JWT_TOKEN');
    dispatch(logoutUserSuccess());
    router.replace('/login');
  }

  const joinedDate = new Date(user.joined).toLocaleDateString();

  const DetailRow = ({ label, value }) => (
    <View className="flex-row justify-between px-4 py-2 border-b border-gray-200">
      <Text className="text-gray-600 font-medium">{label}</Text>
      <Text className="text-gray-800 font-semibold">{value}</Text>
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-gray-100">
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          justifyContent: 'center',
          padding: 24,
        }}
        keyboardShouldPersistTaps="handled"
      >
        <View className="bg-white rounded-2xl shadow-md p-6">
          {/* Profile Picture and Name */}
          <View className="items-center mb-6">
            <Image
              source={user.image}
              className="w-36 h-36 rounded-full mb-4"
              style={{
                borderWidth: 3,
                borderColor: 'lightblue',
                shadowColor: '#000',
                shadowOpacity: 0.1,
                shadowRadius: 6,
                elevation: 6,
              }}
            />
            <Text className="text-2xl font-bold text-gray-900">{user.name}</Text>
          </View>

          {/* User Details */}
          <View className="bg-gray-50 rounded-xl overflow-hidden mb-6">
            <DetailRow label="Gender" value={user.gender} />
            <DetailRow label="Age" value={user.age} />
            <DetailRow label="Email" value={user.email} />
            <DetailRow label="Phone" value={user.phone} />
            <DetailRow label="Location" value={user.location} />
            <DetailRow label="Joined" value={joinedDate} />
          </View>

          {/* Logout Button */}
          <TouchableOpacity
            onPress={handleLogout}
            className="bg-red-600 py-4 rounded-full shadow-md"
          >
            <Text className="text-white font-bold text-center text-lg font-extrabold tracking-wide">
              Logout
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default Profile;
