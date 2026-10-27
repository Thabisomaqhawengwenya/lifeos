import React from 'react';
import { Tabs } from 'expo-router';
import { Platform, View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '@/src/design-system/ThemeContext';
import { haptic } from '@/src/design-system/haptics';

export default function TabLayout() {
  const { colors, isDark, radii } = useAppTheme();

  const renderTabIcon = (
    name: keyof typeof Ionicons.glyphMap,
    focusedName: keyof typeof Ionicons.glyphMap,
    focused: boolean,
    color: string
  ) => (
    <View
      style={[
        styles.iconPill,
        {
          backgroundColor: focused ? colors.primaryContainer : 'transparent',
          borderRadius: radii.full,
        },
      ]}
    >
      <Ionicons
        name={focused ? focusedName : name}
        size={20}
        color={focused ? colors.onPrimaryContainer : typeof color === 'string' ? color : colors.outline}
      />
    </View>
  );

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.onSurfaceVariant,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.outlineVariant,
          borderTopWidth: 1,
          height: Platform.OS === 'ios' ? 88 : 70,
          paddingBottom: Platform.OS === 'ios' ? 26 : 10,
          paddingTop: 8,
          elevation: 6,
          shadowColor: colors.shadow,
          shadowOffset: { width: 0, height: -3 },
          shadowOpacity: isDark ? 0.35 : 0.04,
          shadowRadius: 8,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          marginTop: 2,
        },
      }}
      screenListeners={{
        tabPress: () => {
          haptic.selection();
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, focused }) =>
            renderTabIcon('grid-outline', 'grid', focused, color as string),
        }}
      />
      <Tabs.Screen
        name="planner"
        options={{
          title: 'Planner',
          tabBarIcon: ({ color, focused }) =>
            renderTabIcon('calendar-outline', 'calendar', focused, color as string),
        }}
      />
      <Tabs.Screen
        name="tasks"
        options={{
          title: 'Tasks',
          tabBarIcon: ({ color, focused }) =>
            renderTabIcon('checkbox-outline', 'checkbox', focused, color as string),
        }}
      />
      <Tabs.Screen
        name="life"
        options={{
          title: 'Life',
          tabBarIcon: ({ color, focused }) =>
            renderTabIcon('sparkles-outline', 'sparkles', focused, color as string),
        }}
      />
      <Tabs.Screen
        name="assistant"
        options={{
          title: 'Assistant',
          tabBarIcon: ({ color, focused }) =>
            renderTabIcon('chatbubble-ellipses-outline', 'chatbubble-ellipses', focused, color as string),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  iconPill: {
    paddingHorizontal: 16,
    paddingVertical: 3,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 28,
  },
});
