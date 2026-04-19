import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../theme';
import { Mascot } from '../../components/mascots/Mascot';
import { WalletMascot } from '../../components/mascots/WalletMascot';
import { PiggyMascot } from '../../components/mascots/PiggyMascot';
import { CoinStackMascot } from '../../components/mascots/CoinStackMascot';
import { getMascotForCharity } from '../../utils/charityMascots';
import type { MascotType } from '../../utils/constants';
import type { DayResult } from '../../services/TrackingService';

interface ImpactStepProps {
  donationAmount: number;
  impactMessage: string;
  charityName?: string | null;
  dayResult: DayResult;
  currentStreak: number;
}

function CharityMascot({ type, usagePercent }: { type: MascotType; usagePercent: number }) {
  const props = { size: 160, usagePercent };
  switch (type) {
    case 'wallet': return <WalletMascot {...props} />;
    case 'piggy': return <PiggyMascot {...props} />;
    case 'coinstack': return <CoinStackMascot {...props} />;
    default: return <Mascot {...props} />;
  }
}

export const ImpactStep: React.FC<ImpactStepProps> = ({
  donationAmount,
  impactMessage,
  charityName,
  dayResult,
  currentStreak,
}) => {
  const mascotType = getMascotForCharity(charityName);
  const isSuccess = dayResult === 'success';
  const streakToBonus = 7 - (currentStreak % 7);

  if (isSuccess) {
    // Success state: celebrate the win, show streak progress
    return (
      <View style={styles.successContainer}>
        <CharityMascot type={mascotType} usagePercent={0.1} />

        <Text style={styles.successTitle}>No charge today!</Text>
        <Text style={styles.successSubtitle}>Your money stays in your pocket.</Text>

        <View style={styles.streakCard}>
          <View style={styles.streakRow}>
            <Text style={styles.streakEmoji}>🔥</Text>
            <View>
              <Text style={styles.streakValue}>{currentStreak} day streak</Text>
              <Text style={styles.streakSub}>
                {streakToBonus === 7
                  ? 'Start your next streak cycle!'
                  : `${streakToBonus} more day${streakToBonus === 1 ? '' : 's'} to earn $${donationAmount} back`}
              </Text>
            </View>
          </View>
          <View style={styles.streakDots}>
            {Array.from({ length: 7 }).map((_, i) => (
              <View
                key={i}
                style={[
                  styles.dot,
                  i < (currentStreak % 7) && styles.dotFilled,
                ]}
              />
            ))}
          </View>
        </View>

        {charityName && (
          <View style={styles.charityNote}>
            <Ionicons name="heart" size={14} color={theme.colors.primary} />
            <Text style={styles.charityNoteText}>Supporting {charityName}</Text>
          </View>
        )}
      </View>
    );
  }

  // Failure state: show charity donation impact
  return (
    <LinearGradient colors={[theme.colors.gradient.start, theme.colors.gradient.end]} style={styles.container}>
      <CharityMascot type={mascotType} usagePercent={0.5} />

      <Text style={styles.amountLabel}>going to charity</Text>
      <Text style={styles.amount}>${donationAmount}</Text>

      {charityName && (
        <View style={styles.charityBadge}>
          <Text style={styles.charityName}>{charityName}</Text>
        </View>
      )}

      <View style={styles.impactCard}>
        <Text style={styles.impactTitle}>Real World Impact</Text>
        <Text style={styles.impactMessage}>{impactMessage}</Text>
      </View>

      <Text style={styles.subtitle}>
        While you lost today, someone else won because of you.
      </Text>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  // Success styles
  successContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.lg,
    backgroundColor: '#F0FDF4',
    gap: theme.spacing.sm,
  },
  successTitle: {
    fontSize: theme.typography.fontSize.h1,
    fontFamily: theme.typography.fontFamily.bold,
    color: theme.colors.text.primary,
    marginTop: theme.spacing.md,
    textAlign: 'center',
  },
  successSubtitle: {
    fontSize: theme.typography.fontSize.body,
    fontFamily: theme.typography.fontFamily.regular,
    color: theme.colors.text.secondary,
    textAlign: 'center',
  },
  streakCard: {
    backgroundColor: theme.colors.background,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    width: '100%',
    marginTop: theme.spacing.sm,
    ...theme.shadows.sm,
  },
  streakRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
  },
  streakEmoji: { fontSize: 32 },
  streakValue: {
    fontSize: theme.typography.fontSize.h3,
    fontFamily: theme.typography.fontFamily.bold,
    color: theme.colors.text.primary,
  },
  streakSub: {
    fontSize: theme.typography.fontSize.small,
    fontFamily: theme.typography.fontFamily.regular,
    color: theme.colors.text.secondary,
    marginTop: 2,
  },
  streakDots: {
    flexDirection: 'row',
    gap: 6,
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: theme.colors.border,
  },
  dotFilled: {
    backgroundColor: theme.colors.primary,
  },
  charityNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: theme.spacing.xs,
  },
  charityNoteText: {
    fontSize: theme.typography.fontSize.small,
    fontFamily: theme.typography.fontFamily.medium,
    color: theme.colors.text.secondary,
  },

  // Failure styles
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.lg,
    gap: 8,
  },
  amountLabel: {
    fontSize: theme.typography.fontSize.body,
    fontFamily: theme.typography.fontFamily.medium,
    color: 'rgba(255,255,255,0.85)',
    marginTop: theme.spacing.sm,
  },
  amount: {
    fontSize: 64,
    fontFamily: theme.typography.fontFamily.extrabold,
    color: '#FFFFFF',
    lineHeight: 72,
  },
  charityBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 6,
  },
  charityName: {
    fontSize: theme.typography.fontSize.small,
    fontFamily: theme.typography.fontFamily.semibold,
    color: '#FFFFFF',
  },
  impactCard: {
    backgroundColor: theme.colors.background,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    marginTop: theme.spacing.sm,
    width: '100%',
    ...theme.shadows.md,
  },
  impactTitle: {
    fontSize: theme.typography.fontSize.body,
    fontFamily: theme.typography.fontFamily.semibold,
    color: theme.colors.text.primary,
    marginBottom: 6,
    textAlign: 'center',
  },
  impactMessage: {
    fontSize: theme.typography.fontSize.body,
    fontFamily: theme.typography.fontFamily.regular,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    lineHeight: theme.typography.fontSize.body * theme.typography.lineHeight.relaxed,
  },
  subtitle: {
    fontSize: theme.typography.fontSize.body,
    fontFamily: theme.typography.fontFamily.regular,
    color: 'rgba(255,255,255,0.85)',
    textAlign: 'center',
    lineHeight: theme.typography.fontSize.body * theme.typography.lineHeight.relaxed,
  },
});
