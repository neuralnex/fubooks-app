import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { HomeScreen } from '../screens/student/HomeScreen';
import { LibraryScreen } from '../screens/student/LibraryScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { BookDetailScreen } from '../screens/student/BookDetailScreen';
import { CartScreen } from '../screens/student/CartScreen';
import { CheckoutScreen } from '../screens/student/CheckoutScreen';
import { useCart } from '../hooks/useCart';
import type { BookDTO } from '../sharedTypes';

export type HomeStackParamList = {
  Home: undefined;
  BookDetail: { book: BookDTO };
};

const HomeStack = createNativeStackNavigator<HomeStackParamList>();
const CartStack = createNativeStackNavigator();
type StudentTabParamList = {
  HomeTab: undefined;
  LibraryTab: undefined;
  CartTab: undefined;
  ProfileTab: undefined;
};

const Tab = createBottomTabNavigator<StudentTabParamList>();

function HomeStackNavigator() {
  return (
    <HomeStack.Navigator screenOptions={{ headerShown: false }}>
      <HomeStack.Screen name="Home" component={HomeScreen} />
      <HomeStack.Screen name="BookDetail" component={BookDetailScreen} options={{ presentation: 'card' }} />
    </HomeStack.Navigator>
  );
}

function CartStackNavigator() {
  return (
    <CartStack.Navigator screenOptions={{ headerShown: false }}>
      <CartStack.Screen name="CartHome" component={CartScreen} />
      <CartStack.Screen name="Checkout" component={CheckoutScreen} />
    </CartStack.Navigator>
  );
}

const TAB_ICONS: Record<keyof StudentTabParamList, string> = {
  HomeTab: '🏠',
  LibraryTab: '📚',
  CartTab: '🛒',
  ProfileTab: '👤',
};

export function StudentNavigator() {
  const { colors } = useTheme();
  const cartCount = useCart((state) => state.items.length);

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
      <Tab.Screen name="CartTab" component={CartStackNavigator} options={{ title: cartCount ? `Cart (${cartCount})` : 'Cart' }} />
      <Tab.Screen name="ProfileTab" component={ProfileScreen} options={{ title: 'Profile' }} />
    </Tab.Navigator>
  );
}
