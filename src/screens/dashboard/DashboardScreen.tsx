import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, AppState } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../theme';
import { Card } from '../../components/ui/Card';
import { ProgressBar } from '../../components/ui/ProgressBar';
import { Mascot } from '../../components/mascots/Mascot';
import { WalletMascot } from '../../components/mascots/WalletMascot';
import { PiggyMascot } from '../../components/mascots/PiggyMascot';
import { CoinStackMascot } from '../../components/mascots/CoinStackMascot';
import { WeekCalendar } from '../../components/WeekCalendar';
import { TopOffendersCard } from './TopOffendersCard';
import { useOnboardingStore } from '../../stores/onboardingStore';
import { useAuth } from '../../contexts/AuthContext';
import { ScroliLogo } from '../../components/ScroliLogo';
import { formatTime } from '../../utils/formatters';
import { MascotType } from '../../utils/constants';
import { useScreenTime } from '../../hooks/useScreenTime';
import { TrackingService } from '../../services/TrackingService';
import { getMascotForCharity } from '../../utils/charityMascots';
import { getPeriodLabel } from '../../utils/goalPeriod';
import { supabase } from '../../services/supabase';

type DayStatus = 'check' | 'miss' | 'future';

const MOCK_OFFENDERS = [
  { name: 'Instagram', icon: 'logo-instagram' as const, color: '#E4405F', time: '1h 12m' },
  { name: 'TikTok', icon: 'musical-notes' as const, color: '#000000', time: '45m' },
  { name: 'Twitter', icon: 'logo-twitter' as const, color: '#1DA1F2', time: '23m' },
];

/** Returns ISO date string (YYYY-MM-DD) for Monday of the current week */
function getMondayOfWeek(today: Date): Date {
  const d = new Date(today);
  const day = d.getDay(); // 0=Sun, 1=Mon...
  const diff = day === 0 ? -6 : 1 - day; // shift to Mon
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

/** Build array of 7 ISO date strings Mon–Sun for the current week */
function getWeekDates(today: Date): string[] {
  const monday = getMondayOfWeek(today);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d.toISOString().split('T')[0];
  });
}

/** Compute streak: consecutive 'success' days ending at (and including) yesterday */
function computeStreak(records: { date: string; status: string }[], today: string): number {
  const successSet = new Set(
    records.filter((r) => r.status === 'success').map((r) => r.date),
  );
  let streak = 0;
  const cursor = new Date(today);
  cursor.setDate(cursor.getDate() - 1); // start from yesterday
  while (true) {
    const dateStr = cursor.toISOString().split('T')[0];
    if (successSet.has(dateStr)) {
      streak++;
      cursor.setDate(cursor.getDate() - 1);
    } else {
      break;
    }
  }
  return streak;
}

export const DashboardScreen: React.FC = () => {
  const { stakeAmount } = useOnboardingStore();
  const { user } = useAuth();
  const { hoursToday, minutesToday, permissionGranted, loading } = useScreenTime();

  const [weekHistory, setWeekHistory] = useState<DayStatus[]>(Array(7).fill('future'));
  const [streak, setStreak] = useState(0);
  const [activeMascot, setActiveMascot] = useState<MascotType>('original');
  const [charityName, setCharityName] = useState<string | null>(null);
  const [periodType, setPeriodType] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [periodLimitMinutes, setPeriodLimitMinutes] = useState(180);
  const [periodUsageMinutes, setPeriodUsageMinutes] = useState(0);

  const currentHours = permissionGranted ? hoursToday : 0;
  const periodLimitHours = periodLimitMinutes / 60;
  const periodUsageHours = periodUsageMinutes / 60;
  const usagePercent = Math.min(periodUsageHours / periodLimitHours, 1);
  const periodLabel = getPeriodLabel(periodType);
  const streakToBonus = 7 - (streak % 7);

  const fetchWeekData = useCallback(async () => {
    if (!user) return;
    try {
      const [records, profileRes, goal] = await Promise.all([
        TrackingService.getRecentRecords(user.id, 35),
        supabase.from('profiles').select('default_charity_id, charities(name)').eq('id', user.id).single(),
        TrackingService.getActiveGoal(user.id),
      ]);

      const today = new Date().toISOString().split('T')[0];
      const weekDates = getWeekDates(new Date());
      const recordMap = new Map(records.map((r) => [r.date, r.status]));
      const durationMap = new Map(records.map((r) => [r.date, r.duration_minutes]));

      const history: DayStatus[] = weekDates.map((date) => {
        if (date >= today) return 'future';
        const status = recordMap.get(date);
        return status === 'success' ? 'check' : status === 'failure' ? 'miss' : 'future';
      });

      setWeekHistory(history);
      setStreak(computeStreak(records, today));

      const resolvedCharityName = (profileRes.data?.charities as any)?.name ?? null;
      setCharityName(resolvedCharityName);
      setActiveMascot(getMascotForCharity(resolvedCharityName));

      // Period usage
      const pt = (goal?.period_type ?? 'daily') as 'daily' | 'weekly' | 'monthly';
      setPeriodType(pt);
      setPeriodLimitMinutes(goal?.daily_limit_minutes ?? 180);

      if (pt === 'weekly') {
        // Exclude today from DB — use live hook value instead so bar reflects current session
        const pastTotal = weekDates
          .filter((d) => d !== today)
          .reduce((sum, d) => sum + (durationMap.get(d) ?? 0), 0);
        setPeriodUsageMinutes(pastTotal + minutesToday);
      } else if (pt === 'monthly') {
        const now = new Date();
        let monthTotal = 0;
        records.forEach((r) => {
          if (r.date === today) return; // exclude today from DB
          const d = new Date(r.date);
          if (d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()) {
            monthTotal += r.duration_minutes;
          }
        });
        setPeriodUsageMinutes(monthTotal + minutesToday);
      } else {
        setPeriodUsageMinutes(minutesToday);
      }
    } catch (err) {
      console.error('Failed to fetch week data:', err);
    }
  }, [user, minutesToday]);

  // Save daily record + fetch week data on mount
  useEffect(() => {
    if (user && permissionGranted && minutesToday > 0) {
      TrackingService.saveDailyRecord(user.id, minutesToday).catch(console.error);
    }
    fetchWeekData();
  }, [user, permissionGranted, minutesToday, fetchWeekData]);

  // Refetch when app comes back to foreground
  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') fetchWeekData();
    });
    return () => sub.remove();
  }, [fetchWeekData]);

  const renderMascot = () => {
    const props = { size: 240, usagePercent };
    switch (activeMascot) {
      case 'wallet': return <WalletMascot {...props} />;
      case 'piggy': return <PiggyMascot {...props} />;
      case 'coinstack': return <CoinStackMascot {...props} />;
      default: return <Mascot {...props} />;
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <ScroliLogo variant="full" size="sm" />
          <Pressable>
            <Ionicons name="help-circle-outline" size={28} color={theme.colors.text.primary} />
          </Pressable>
        </View>

        {/* Mascot */}
        <View style={styles.mascotContainer}>
          {renderMascot()}
          {charityName && (
            <View style={styles.charityPill}>
              <Text style={styles.charityPillText}>❤️ Supporting {charityName}</Text>
            </View>
          )}
        </View>

        {/* Current Hours */}
        <Text style={styles.displayNumber}>
          {loading ? '…' : periodType === 'daily' ? currentHours.toFixed(1) : periodUsageHours.toFixed(1)}
        </Text>
        <Text style={styles.hoursLabel}>hours {periodLabel}</Text>

        {/* Progress Bar */}
        <View style={styles.progressBarContainer}>
          <ProgressBar progress={usagePercent} height={12} />
        </View>
        <View style={styles.progressLabels}>
          <Text style={styles.progressLabel}>0</Text>
          <Text style={styles.progressLabel}>{periodLimitHours % 1 === 0 ? periodLimitHours : periodLimitHours.toFixed(1)}h {periodType === 'daily' ? 'goal' : `/ ${periodType}`}</Text>
        </View>

        {/* Status Card */}
        <Card style={styles.statusCard}>
          <View style={styles.statusRow}>
            <View style={styles.statusItem}>
              <Text style={styles.statusLabel}>Screen Time Today</Text>
              <Text style={styles.statusValue}>{formatTime(currentHours * 60)}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.statusItem}>
              <Text style={styles.statusLabel}>At Stake</Text>
              <Text style={[styles.statusValue, styles.statusValueStake]}>
                ${stakeAmount}
              </Text>
            </View>
          </View>
        </Card>

        {/* Streak Bonus */}
        <View style={styles.bonusCard}>
          <View style={styles.bonusLeft}>
            <Text style={styles.bonusTitle}>🔥 Streak Bonus</Text>
            <Text style={styles.bonusSubtitle}>
              {streakToBonus === 7
                ? 'Start a streak to earn your stake back!'
                : `${streakToBonus} more day${streakToBonus === 1 ? '' : 's'} → earn $${stakeAmount} back`}
            </Text>
          </View>
          <View style={styles.bonusDots}>
            {Array.from({ length: 7 }).map((_, i) => (
              <View
                key={i}
                style={[styles.bonusDot, i < (streak % 7) && styles.bonusDotFilled]}
              />
            ))}
          </View>
        </View>

        {/* Streak Section */}
        <View style={styles.streakSection}>
          <Text style={styles.sectionTitle}>Current Streak</Text>
          <View style={styles.streakContainer}>
            <Text style={styles.streakEmojis}>🔥🔥🔥</Text>
            <Text style={styles.streakText}>
              {streak === 0 ? 'Start today!' : `${streak} day${streak === 1 ? '' : 's'}`}
            </Text>
          </View>
        </View>

        {/* Week Calendar */}
        <View style={styles.weekSection}>
          <Text style={styles.sectionTitle}>This Week</Text>
          <WeekCalendar weekHistory={weekHistory} />
        </View>

        {/* Top Offenders */}
        <TopOffendersCard offenders={MOCK_OFFENDERS} />
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  mascotContainer: {
    alignItems: 'center',
    marginVertical: theme.spacing.sm,
    gap: theme.spacing.xs,
  },
  charityPill: {
    backgroundColor: theme.colors.primaryFaded,
    borderRadius: theme.borderRadius.full,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: theme.colors.primaryLight,
  },
  charityPillText: {
    fontSize: theme.typography.fontSize.small,
    fontFamily: theme.typography.fontFamily.medium,
    color: theme.colors.primary,
  },
  displayNumber: {
    fontSize: theme.typography.fontSize.display,
    fontFamily: theme.typography.fontFamily.extrabold,
    color: theme.colors.text.primary,
    textAlign: 'center',
  },
  hoursLabel: {
    fontSize: theme.typography.fontSize.h3,
    fontFamily: theme.typography.fontFamily.medium,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    marginTop: theme.spacing.xs,
  },
  progressBarContainer: {
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.xs,
  },
  progressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.md,
  },
  progressLabel: {
    fontSize: theme.typography.fontSize.small,
    color: theme.colors.text.secondary,
  },
  statusCard: {
    marginBottom: theme.spacing.md,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusItem: {
    flex: 1,
    alignItems: 'center',
  },
  divider: {
    width: 1,
    height: 40,
    backgroundColor: theme.colors.border,
  },
  statusLabel: {
    fontSize: theme.typography.fontSize.small,
    fontFamily: theme.typography.fontFamily.medium,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.xs,
  },
  statusValue: {
    fontSize: theme.typography.fontSize.h2,
    fontFamily: theme.typography.fontFamily.extrabold,
    color: theme.colors.text.primary,
  },
  statusValueStake: {
    color: theme.colors.primary,
  },
  bonusCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.primaryFaded,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.sm,
    marginBottom: theme.spacing.md,
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.primary,
  },
  bonusLeft: { flex: 1 },
  bonusTitle: {
    fontSize: theme.typography.fontSize.body,
    fontFamily: theme.typography.fontFamily.semibold,
    color: theme.colors.primary,
    marginBottom: 2,
  },
  bonusSubtitle: {
    fontSize: theme.typography.fontSize.small,
    fontFamily: theme.typography.fontFamily.regular,
    color: theme.colors.text.secondary,
  },
  bonusDots: {
    flexDirection: 'row',
    gap: 5,
    paddingLeft: theme.spacing.sm,
  },
  bonusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: theme.colors.border,
  },
  bonusDotFilled: {
    backgroundColor: theme.colors.primary,
  },
  streakSection: {
    marginBottom: theme.spacing.md,
  },
  sectionTitle: {
    fontSize: theme.typography.fontSize.h3,
    fontFamily: theme.typography.fontFamily.semibold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.sm,
  },
  streakContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  streakEmojis: {
    fontSize: theme.typography.fontSize.h1,
  },
  streakText: {
    fontSize: theme.typography.fontSize.h2,
    fontFamily: theme.typography.fontFamily.bold,
    color: theme.colors.text.primary,
  },
  weekSection: {
    marginBottom: theme.spacing.md,
  },
});
