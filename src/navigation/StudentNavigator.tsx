import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { HomeScreen } from '../screens/student/HomeScreen';
import { LibraryScreen } from '../screens/student/LibraryScreen';
import { WalletScreen } from '../screens/student/WalletScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { BookDetailScreen } from '../screens/student/BookDetailScreen';
import { FundWalletScreen } from '../screens/student/FundWalletScreen';
import type { BookDTO } from '../sharedTypes';

export type HomeStackParamList = {
  Home: undefined;
  BookDetail: { book: BookDTO };
};

export type WalletStackParamList = {
  WalletHome: undefined;
  FundWallet: undefined;
};

const HomeStack = createNativeStackNavigator<HomeStackParamList>();
const WalletStack = createNativeStackNavigator<WalletStackParamList>();
type StudentTabParamList = {
  HomeTab: undefined;
  LibraryTab: undefined;
  WalletTab: undefined;
  ProfileTab: undefined;
};

const Tab = createBottomTabNavigator<StudentTabParamList>();

function HomeStackNavigator() {
  return (
    <HomeStack.Navigator screenOptions={{ headerShown: false }}>
      <HomeStack.Screen name="Home" component={HomeScreen} />
      <HomeStack.Screen
        name="BookDetail"
        component={BookDetailScreen}
        options={{ presentation: 'card' }}
      />
    </HomeStack.Navigator>
  );
}

function WalletStackNavigator() {
  return (
    <WalletStack.Navigator screenOptions={{ headerShown: false }}>
      <WalletStack.Screen name="WalletHome" component={WalletScreen} />
      <WalletStack.Screen name="FundWallet" component={FundWalletScreen} />
    </WalletStack.Navigator>
  );
}

const TAB_ICONS: Record<keyof StudentTabParamList, string> = {
  HomeTab: '🏠',
  LibraryTab: '📚',
  WalletTab: '👛',
  ProfileTab: '👤',
};

export function StudentNavigator() {
  const { colors } = useTheme();

  return (
    <Tab.Navigator
      screenOptions={({ route }: { route: { name: keyof StudentTabParamList } }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.border },
        tabBarIcon: () => <Text style={{ fontSize: 18 }}>{TAB_ICONS[route.name]}</Text>,
      })}
    >
      <Tab.Screen name="HomeTab" component={HomeStackNavigator} options={{ title: 'Browse' }} />
      <Tab.Screen name="LibraryTab" component={LibraryScreen} options={{ title: 'Library' }} />
      <Tab.Screen
        name="WalletTab"
        component={WalletStackNavigator}
        options={{ title: 'Wallet' }}
      />
      <Tab.Screen name="ProfileTab" component={ProfileScreen} options={{ title: 'Profile' }} />
    </Tab.Navigator>
  );
}
