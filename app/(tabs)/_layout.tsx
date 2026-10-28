import { useAppTheme } from '@/src/design-system/ThemeContext';
import { haptic } from '@/src/design-system/haptics';
import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { Platform, StyleSheet, View } from 'react-native';

export default function TabLayout() {
  const { colors, isDark } = useAppTheme();

  const renderTabIcon = (
    name: keyof typeof Ionicons.glyphMap,
    focusedName: keyof typeof Ionicons.glyphMap,
    focused: boolean
  ) => (
    <View
      style={[
        styles.iconContainer,
        focused && {
          backgroundColor: colors.accentYellow,
          borderColor: colors.border,
          borderWidth: 2,
          borderRadius: 8,
          shadowColor: isDark ? '#FFFFFF' : '#000000',
          shadowOffset: { width: 2, height: 2 },
          shadowOpacity: 1,
          shadowRadius: 0,
          elevation: 2,
        },
      ]}
    >
      <Ionicons
        name={focused ? focusedName : name}
        size={20}
        color={focused ? '#000000' : isDark ? '#B0B0B0' : '#444444'}
      />
    </View>
  );

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.onBackground,
        tabBarInactiveTintColor: isDark ? '#888888' : '#666666',
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          borderTopWidth: 3,
          height: Platform.OS === 'ios' ? 83 : 60,
          paddingBottom: Platform.OS === 'ios' ? 22 : 8,
          paddingTop: 6,
          elevation: 8,
          shadowColor: '#000000',
          shadowOffset: { width: 0, height: -3 },
          shadowOpacity: 1,
          shadowRadius: 0,
        },
        tabBarLabelStyle: {
          fontFamily: 'SpaceMono',
          fontSize: 10,
          fontWeight: '700',
          marginTop: 2,
          textTransform: 'uppercase',
          letterSpacing: 0.5,
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
          tabBarIcon: ({ focused }) =>
            renderTabIcon('grid-outline', 'grid', focused),
        }}
      />
      <Tabs.Screen
        name="planner"
        options={{
          title: 'Planner',
          tabBarIcon: ({ focused }) =>
            renderTabIcon('calendar-outline', 'calendar', focused),
        }}
      />
      <Tabs.Screen
        name="tasks"
        options={{
          title: 'Tasks',
          tabBarIcon: ({ focused }) =>
            renderTabIcon('checkbox-outline', 'checkbox', focused),
        }}
      />
      <Tabs.Screen
        name="life"
        options={{
          title: 'Life',
          tabBarIcon: ({ focused }) =>
            renderTabIcon('sparkles-outline', 'sparkles', focused),
        }}
      />
      <Tabs.Screen
        name="assistant"
        options={{
          title: 'AI Bot',
          tabBarIcon: ({ focused }) =>
            renderTabIcon('chatbubble-ellipses-outline', 'chatbubble-ellipses', focused),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  iconContainer: {
    paddingHorizontal: 12,
    paddingVertical: 3,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 28,
  },
});
