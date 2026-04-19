import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../theme';
import { Mascot } from '../../components/mascots/Mascot';
import type { DayResult } from '../../services/TrackingService';

interface ResetStepProps {
  dayResult: DayResult;
  currentStreak: number;
  stakeAmount: number;
}

const MISS_TIPS = [
  'Put your phone in another room at night',
  'Turn on Screen Time limits for your top apps',
  'Replace scroll time with a 5-min walk',
];

const WIN_TIPS = [
  'Keep your phone face-down during meals',
  'Check in tomorrow to keep the streak alive',
  'You\'re building a habit — consistency is the game',
];

export const ResetStep: React.FC<ResetStepProps> = ({ dayResult, currentStreak, stakeAmount }) => {
  const isSuccess = dayResult === 'success';
  const tips = isSuccess ? WIN_TIPS : MISS_TIPS;
  const streakToBonus = 7 - (currentStreak % 7);

  return (
    <View style={styles.container}>
      <Mascot size={160} usagePercent={isSuccess ? 0.1 : 0.5} />

      <Text style={styles.title}>
        {isSuccess ? 'Keep it going!' : 'Tomorrow is a\nnew day'}
      </Text>
      <Text style={styles.message}>
        {isSuccess
          ? `${streakToBonus === 7 ? 'A new streak cycle starts tomorrow.' : `${streakToBonus} more day${streakToBonus === 1 ? '' : 's'} to earn $${stakeAmount} back.`}`
          : 'Every day resets at midnight. Come back stronger.'}
      </Text>

      <View style={styles.tipsCard}>
        <Text style={styles.tipsTitle}>{isSuccess ? 'Keep the momentum' : 'Tips for tomorrow'}</Text>
        {tips.map((tip, i) => (
          <View key={i} style={[styles.tipRow, i > 0 && styles.tipRowBorder]}>
            <View style={[styles.tipIcon, isSuccess && styles.tipIconSuccess]}>
              <Ionicons
                name={isSuccess ? 'checkmark' : 'bulb-outline'}
                size={14}
                color={theme.colors.primary}
              />
            </View>
            <Text style={styles.tipText}>{tip}</Text>
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.lg,
    backgroundColor: theme.colors.cream,
  },
  title: {
    fontSize: theme.typography.fontSize.h1,
    fontFamily: theme.typography.fontFamily.bold,
    color: theme.colors.text.primary,
    marginTop: theme.spacing.lg,
    textAlign: 'center',
    lineHeight: theme.typography.fontSize.h1 * theme.typography.lineHeight.tight,
  },
  message: {
    fontSize: theme.typography.fontSize.body,
    fontFamily: theme.typography.fontFamily.regular,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    marginTop: theme.spacing.sm,
    marginBottom: theme.spacing.xl,
    lineHeight: theme.typography.fontSize.body * 1.5,
  },
  tipsCard: {
    backgroundColor: theme.colors.background,
    borderRadius: theme.borderRadius.md,
    width: '100%',
    ...theme.shadows.sm,
    overflow: 'hidden',
  },
  tipsTitle: {
    fontSize: theme.typography.fontSize.small,
    fontFamily: theme.typography.fontFamily.semibold,
    color: theme.colors.text.secondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    paddingHorizontal: theme.spacing.sm,
    paddingTop: theme.spacing.sm,
    paddingBottom: theme.spacing.xs,
  },
  tipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    padding: theme.spacing.sm,
  },
  tipRowBorder: {
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  tipIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: theme.colors.primaryFaded,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tipIconSuccess: {
    backgroundColor: '#DCFCE7',
  },
  tipText: {
    flex: 1,
    fontSize: theme.typography.fontSize.small,
    fontFamily: theme.typography.fontFamily.medium,
    color: theme.colors.text.primary,
    lineHeight: theme.typography.fontSize.small * theme.typography.lineHeight.relaxed,
  },
});
