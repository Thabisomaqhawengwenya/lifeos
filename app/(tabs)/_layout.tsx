import React from 'react';
import { Tabs } from 'expo-router';
import { Platform, View, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useAppTheme } from '@/src/design-system/ThemeContext';
import { haptic } from '@/src/design-system/haptics';

export default function TabLayout() {
  const { colors, isDark } = useAppTheme();

  const renderTabIcon = (
    name: keyof typeof Feather.glyphMap,
    focused: boolean
  ) => (
    <View
      style={[
        styles.iconSlot,
        focused && {
          backgroundColor: colors.yellow,
          borderWidth: 2,
          borderColor: colors.border,
          shadowColor: isDark ? '#FFFFFF' : '#000000',
          shadowOffset: { width: 2, height: 2 },
          shadowOpacity: 1,
          shadowRadius: 0,
          elevation: 2,
        },
      ]}
    >
      <Feather
        name={name}
        size={18}
        color={focused ? '#000000' : isDark ? '#A0A0A0' : '#444444'}
      />
    </View>
  );

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.text,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          borderTopWidth: colors.borderWidth,
          height: Platform.OS === 'ios' ? 84 : 68,
          paddingBottom: Platform.OS === 'ios' ? 22 : 8,
          paddingTop: 6,
          elevation: 4,
          shadowColor: '#000000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 1,
          shadowRadius: 0,
        },
        tabBarItemStyle: {
          flex: 1,
          paddingVertical: 2,
          paddingHorizontal: 0,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '700',
          marginTop: 2,
          textTransform: 'uppercase',
          letterSpacing: 0.3,
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
          tabBarIcon: ({ focused }) => renderTabIcon('home', focused),
        }}
      />
      <Tabs.Screen
        name="planner"
        options={{
          title: 'Planner',
          tabBarIcon: ({ focused }) => renderTabIcon('calendar', focused),
        }}
      />
      <Tabs.Screen
        name="tasks"
        options={{
          title: 'Tasks',
          tabBarIcon: ({ focused }) => renderTabIcon('check-square', focused),
        }}
      />
      <Tabs.Screen
        name="life"
        options={{
          title: 'Life',
          tabBarIcon: ({ focused }) => renderTabIcon('compass', focused),
        }}
      />
      <Tabs.Screen
        name="assistant"
        options={{
          title: 'AI',
          tabBarIcon: ({ focused }) => renderTabIcon('cpu', focused),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  iconSlot: {
    width: 40,
    height: 26,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
