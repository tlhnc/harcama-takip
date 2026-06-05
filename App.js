import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Text, View, ActivityIndicator } from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppProvider, useApp } from './src/context/AppContext';
import AnaSayfa from './src/screens/AnaSayfa';
import IslemEkle from './src/screens/IslemEkle';
import Istatistik from './src/screens/Istatistik';
import Kategoriler from './src/screens/Kategoriler';
import IslemDetay from './src/screens/IslemDetay';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function TabNavigator() {
  const insets = useSafeAreaInsets();
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: '#1E40AF',
        tabBarInactiveTintColor: '#94A3B8',
        tabBarStyle: {
          backgroundColor: '#fff',
          borderTopColor: '#E2E8F0',
          height: 58 + insets.bottom,
          paddingBottom: insets.bottom > 0 ? insets.bottom : 4,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
        headerStyle: { backgroundColor: '#1E40AF' },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: 'bold', fontSize: 18 },
      }}
    >
      <Tab.Screen
        name="AnaSayfa"
        component={AnaSayfa}
        options={{
          title: 'Ana Sayfa',
          headerTitle: '💰 Harcama Takip',
          tabBarIcon: () => <Text style={{ fontSize: 22 }}>🏠</Text>,
        }}
      />
      <Tab.Screen
        name="IslemEkle"
        component={IslemEkle}
        options={{
          title: 'İşlem Ekle',
          headerTitle: '➕ İşlem Ekle',
          tabBarIcon: () => <Text style={{ fontSize: 22 }}>➕</Text>,
        }}
      />
      <Tab.Screen
        name="Istatistik"
        component={Istatistik}
        options={{
          title: 'İstatistik',
          headerTitle: '📊 İstatistik',
          tabBarIcon: () => <Text style={{ fontSize: 22 }}>📊</Text>,
        }}
      />
      <Tab.Screen
        name="Kategoriler"
        component={Kategoriler}
        options={{
          title: 'Ayarlar',
          headerTitle: '⚙️ Ayarlar',
          tabBarIcon: () => <Text style={{ fontSize: 22 }}>⚙️</Text>,
        }}
      />
    </Tab.Navigator>
  );
}

function Navigasyon() {
  const { yukleniyor } = useApp();

  if (yukleniyor) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#1E40AF' }}>
        <Text style={{ fontSize: 40, marginBottom: 16 }}>💰</Text>
        <Text style={{ color: '#fff', fontSize: 22, fontWeight: 'bold', marginBottom: 8 }}>
          Harcama Takip
        </Text>
        <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 14, marginBottom: 32 }}>
          Veriler yükleniyor...
        </Text>
        <ActivityIndicator size="large" color="#fff" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Main" component={TabNavigator} />
        <Stack.Screen
          name="IslemDetay"
          component={IslemDetay}
          options={{
            headerShown: true,
            headerStyle: { backgroundColor: '#1E40AF' },
            headerTintColor: '#fff',
            headerTitle: '✏️ İşlem Düzenle',
            headerBackTitle: 'Geri',
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AppProvider>
        <Navigasyon />
      </AppProvider>
    </SafeAreaProvider>
  );
}