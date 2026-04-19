import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Alert, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { theme } from '../../theme';
import { useAuth } from '../../contexts/AuthContext';
import { useOnboardingStore } from '../../stores/onboardingStore';
import { useAuthStore } from '../../stores/authStore';
import { supabase } from '../../services/supabase';
import type { RootStackParamList } from '../../navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList>;

interface SettingItemProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle?: string;
  onPress: () => void;
  last?: boolean;
}

const SettingItem: React.FC<SettingItemProps> = ({ icon, title, subtitle, onPress, last }) => {
  return (
    <Pressable style={[styles.settingItem, last && styles.settingItemLast]} onPress={onPress}>
      <View style={styles.settingLeft}>
        <Ionicons name={icon} size={24} color={theme.colors.primary} />
        <View style={styles.settingText}>
          <Text style={styles.settingTitle}>{title}</Text>
          {subtitle && <Text style={styles.settingSubtitle}>{subtitle}</Text>}
        </View>
      </View>
      <Ionicons name="chevron-forward" size={20} color={theme.colors.text.light} />
    </Pressable>
  );
};

export const SettingsScreen: React.FC = () => {
  const navigation = useNavigation<Nav>();
  const { signOut, user } = useAuth();
  const { dailyGoalHours, stakeAmount } = useOnboardingStore();
  const { setHasCompletedOnboarding } = useAuthStore();

  const handleResetOnboarding = () => {
    Alert.alert('Reset Onboarding', 'This will take you back through onboarding without signing out.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Reset',
        style: 'destructive',
        onPress: async () => {
          if (user) {
            await supabase.from('profiles').update({ has_completed_onboarding: false }).eq('id', user.id);
          }
          setHasCompletedOnboarding(false);
        },
      },
    ]);
  };

  const handleSignOut = () => {
    if (Platform.OS === 'web') {
      if (window.confirm('Are you sure you want to sign out?')) {
        signOut();
      }
    } else {
      Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign Out', style: 'destructive', onPress: () => signOut() },
      ]);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.header}>Settings</Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Preferences</Text>
          <View style={styles.settingsList}>
            <SettingItem
              icon="time-outline"
              title="Daily Goal"
              subtitle={`${dailyGoalHours.toFixed(1)} hours`}
              onPress={() => navigation.navigate('GoalSettings')}
            />
            <SettingItem
              icon="cash-outline"
              title="Daily Stake"
              subtitle={`$${stakeAmount}.00`}
              onPress={() => navigation.navigate('StakeSettings')}
              last
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notifications</Text>
          <View style={styles.settingsList}>
            <SettingItem
              icon="notifications-outline"
              title="Push Notifications"
              subtitle="Daily reminders and alerts"
              onPress={() => {}}
            />
            <SettingItem
              icon="mail-outline"
              title="Email Updates"
              subtitle="Weekly progress reports"
              onPress={() => {}}
              last
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          <View style={styles.settingsList}>
            <SettingItem
              icon="card-outline"
              title="Payment Method"
              subtitle="Manage your payment"
              onPress={() => navigation.navigate('PaymentSettings')}
            />
            <SettingItem
              icon="heart-outline"
              title="Charity"
              subtitle="Choose where donations go"
              onPress={() => navigation.navigate('CharitySettings')}
            />
            <SettingItem
              icon="shield-checkmark-outline"
              title="Privacy & Security"
              onPress={() => {}}
              last
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>
          <View style={styles.settingsList}>
            <SettingItem icon="help-circle-outline" title="Help & Support" onPress={() => {}} />
            <SettingItem icon="document-text-outline" title="Terms of Service" onPress={() => {}} />
            <SettingItem
              icon="information-circle-outline"
              title="About Scroli"
              onPress={() => {}}
              last
            />
          </View>
        </View>

        <Pressable style={styles.logoutButton} onPress={handleSignOut}>
          <Text style={styles.logoutText}>Log Out</Text>
        </Pressable>

        {/* DEV ONLY — remove before App Store submission */}
        <Pressable style={styles.devButton} onPress={handleResetOnboarding}>
          <Text style={styles.devButtonText}>DEV: Reset Onboarding</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollContent: {
    paddingHorizontal: theme.spacing.md,
    paddingBottom: theme.spacing.xl,
  },
  header: {
    fontSize: theme.typography.fontSize.h1,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.md,
  },
  section: {
    marginBottom: theme.spacing.lg,
  },
  sectionTitle: {
    fontSize: theme.typography.fontSize.small,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.secondary,
    textTransform: 'uppercase',
    marginBottom: theme.spacing.sm,
    letterSpacing: 0.5,
  },
  settingsList: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.md,
    ...theme.shadows.sm,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  settingItemLast: {
    borderBottomWidth: 0,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    flex: 1,
  },
  settingText: {
    flex: 1,
  },
  settingTitle: {
    fontSize: theme.typography.fontSize.body,
    fontWeight: theme.typography.fontWeight.medium,
    color: theme.colors.text.primary,
    marginBottom: 2,
  },
  settingSubtitle: {
    fontSize: theme.typography.fontSize.small,
    color: theme.colors.text.secondary,
  },
  logoutButton: {
    backgroundColor: theme.colors.error,
    padding: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    marginTop: theme.spacing.md,
  },
  logoutText: {
    fontSize: theme.typography.fontSize.body,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.white,
  },
  devButton: {
    borderWidth: 1,
    borderColor: '#999',
    borderStyle: 'dashed',
    padding: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    marginTop: theme.spacing.sm,
  },
  devButtonText: {
    fontSize: theme.typography.fontSize.small,
    color: '#999',
  },
});
