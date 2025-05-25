import React from 'react';
import { View, Text, Image, TouchableOpacity, SafeAreaView, ScrollView } from 'react-native';

const ProfileTab = () => {
  const user = {
    name: 'John Doe',
    gender: 'Male',
    age: 29,
    email: 'johndoe@example.com',
    phone: '+1 234 567 890',
    location: 'San Francisco, CA',
    joined: '2020-05-15',
    image: 'https://i.pravatar.cc/300',
  };

  const handleLogout = () => {
    alert('Logged out!');
  };

  const joinedDate = new Date(user.joined).toLocaleDateString();

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          justifyContent: 'center',
          paddingHorizontal: 24,
          paddingVertical: 40,
        }}
        keyboardShouldPersistTaps="handled"
      >
        <View className="items-center mb-8">
          <Image
            source={{ uri: user.image }}
            className="w-32 h-32 rounded-full mb-6"
            style={{ borderWidth: 4, borderColor: '#e5e7eb' }}
          />
          <Text className="text-3xl font-bold text-gray-900 mb-2">{user.name}</Text>
        </View>

        <View className="space-y-4">
          <DetailRow icon="🧑" label="Gender" value={user.gender} />
          <DetailRow icon="🎂" label="Age" value={user.age} />
          <DetailRow icon="✉️" label="Email" value={user.email} />
          <DetailRow icon="📞" label="Phone" value={user.phone} />
          <DetailRow icon="📍" label="Location" value={user.location} />
          <DetailRow icon="📅" label="Joined" value={joinedDate} />
        </View>

        <View className="mt-12">
          <TouchableOpacity
            onPress={handleLogout}
            className="bg-red-600 py-4 rounded-full shadow-lg"
          >
            <Text className="text-white text-center text-lg font-semibold tracking-wide">Logout</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const DetailRow = ({ icon, label, value }) => (
  <View className="flex-row items-center justify-center">
    <Text className="text-2xl mr-3">{icon}</Text>
    <Text className="text-gray-700 text-lg font-medium">
      {label}: <Text className="font-semibold">{value}</Text>
    </Text>
  </View>
);

export default ProfileTab;
