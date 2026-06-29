import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { AdminDashboardScreen } from '../screens/admin/AdminDashboardScreen';
import { AdminBooksScreen } from '../screens/admin/AdminBooksScreen';
import { AdminManagementScreen } from '../screens/admin/AdminManagementScreen';

type AdminTabParamList = {
  Dashboard: undefined;
  Catalog: undefined;
  Admins: undefined;
};

const Tab = createBottomTabNavigator<AdminTabParamList>();

const TAB_ICONS: Record<keyof AdminTabParamList, string> = {
  Dashboard: '📊',
  Catalog: '📚',
  Admins: '🛡️',
};

export function AdminNavigator() {
  const { colors } = useTheme();

  return (
    <Tab.Navigator
      screenOptions={({ route }: { route: { name: keyof AdminTabParamList } }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.border },
        tabBarIcon: () => <Text style={{ fontSize: 18 }}>{TAB_ICONS[route.name]}</Text>,
      })}
    >
      <Tab.Screen name="Dashboard" component={AdminDashboardScreen} />
      <Tab.Screen name="Catalog" component={AdminBooksScreen} />
      <Tab.Screen name="Admins" component={AdminManagementScreen} />
    </Tab.Navigator>
  );
}
