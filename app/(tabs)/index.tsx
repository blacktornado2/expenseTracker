import { TouchableOpacity, Text } from 'react-native';
import { useRouter } from 'expo-router';

export default function HomeScreen() {
  const router = useRouter();

  return (
    <TouchableOpacity onPress={() => router.navigate('/explore')} style={{paddingTop: 30}}>
          <Text>Home</Text>
      </TouchableOpacity>
  );
}
