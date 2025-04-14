import { Text, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';

export default function TabTwoScreen() {
  const router = useRouter();
  return (
    <TouchableOpacity onPress={() => router.navigate('/')} style={{paddingTop: 30}}>
      <Text>Explore</Text>
    </TouchableOpacity>
  );
}