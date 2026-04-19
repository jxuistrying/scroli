import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { theme } from '../../theme';
import { Mascot } from '../../components/mascots/Mascot';
import type { DayResult } from '../../services/TrackingService';

interface RealityStepProps {
  goalHours: number;
  actualHours: number;
  dayResult: DayResult;
}

export const RealityStep: React.FC<RealityStepProps> = ({ goalHours, actualHours, dayResult }) => {
  const isSuccess = dayResult === 'success';
  const diffHours = Math.abs(actualHours - goalHours).toFixed(1);
  const usagePercent = goalHours > 0 ? Math.min(actualHours / goalHours, 1) : 0;

  // Progress bar: show actual vs goal visually
  const barPercent = goalHours > 0 ? Math.min(actualHours / (goalHours * 1.5), 1) : 0;
  const goalMarker = goalHours > 0 ? (goalHours / (goalHours * 1.5)) : 0.67;

  return (
    <View style={[styles.container, { backgroundColor: isSuccess ? '#F0FDF4' : '#FEF2F2' }]}>
      <Mascot size={160} usagePercent={isSuccess ? 0.3 : 1} />

      <Text style={styles.title}>
        {isSuccess ? 'You crushed it!' : "Here's the reality"}
      </Text>
      <Text style={[styles.subtitle, { color: isSuccess ? theme.colors.success : theme.colors.error }]}>
        {isSuccess
          ? `${diffHours}h under your goal today`
          : `${diffHours}h over your goal today`}
      </Text>

      {/* Stats comparison */}
      <View style={styles.statsRow}>
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>Your goal</Text>
          <Text style={styles.statValue}>{goalHours.toFixed(1)}h</Text>
        </View>
        <View style={styles.vsWrap}>
          <Text style={styles.vsText}>vs</Text>
        </View>
        <View style={[
          styles.statBox,
          isSuccess ? styles.statBoxSuccess : styles.statBoxOver,
        ]}>
          <Text style={styles.statLabel}>You used</Text>
          <Text style={[
            styles.statValue,
            isSuccess ? styles.statValueSuccess : styles.statValueOver,
          ]}>
            {actualHours.toFixed(1)}h
          </Text>
        </View>
      </View>

      {/* Visual progress bar */}
      <View style={styles.barWrapper}>
        <View style={styles.barTrack}>
          <View style={[
            styles.barFill,
            {
              width: `${barPercent * 100}%`,
              backgroundColor: isSuccess ? theme.colors.success : theme.colors.error,
            },
          ]} />
          {/* Goal marker line */}
          <View style={[styles.goalMarker, { left: `${goalMarker * 100}%` }]} />
        </View>
        <View style={[styles.goalMarkerLabel, { left: `${goalMarker * 100}%` }]}>
          <Text style={styles.goalMarkerText}>goal</Text>
        </View>
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
  },
  title: {
    fontSize: theme.typography.fontSize.h1,
    fontFamily: theme.typography.fontFamily.bold,
    color: theme.colors.text.primary,
    marginTop: theme.spacing.lg,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: theme.typography.fontSize.body,
    fontFamily: theme.typography.fontFamily.medium,
    marginTop: theme.spacing.sm,
    textAlign: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    marginTop: theme.spacing.xl,
    width: '100%',
  },
  statBox: {
    flex: 1,
    backgroundColor: theme.colors.background,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    ...theme.shadows.sm,
  },
  statBoxOver: { backgroundColor: '#FEE2E2' },
  statBoxSuccess: { backgroundColor: '#DCFCE7' },
  statLabel: {
    fontSize: theme.typography.fontSize.small,
    fontFamily: theme.typography.fontFamily.medium,
    color: theme.colors.text.secondary,
    marginBottom: 6,
  },
  statValue: {
    fontSize: theme.typography.fontSize.h1,
    fontFamily: theme.typography.fontFamily.extrabold,
    color: theme.colors.text.primary,
  },
  statValueOver: { color: theme.colors.error },
  statValueSuccess: { color: theme.colors.success },
  vsWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  vsText: {
    fontSize: theme.typography.fontSize.small,
    fontFamily: theme.typography.fontFamily.semibold,
    color: theme.colors.text.secondary,
  },
  barWrapper: {
    width: '100%',
    marginTop: theme.spacing.lg,
    paddingBottom: 20,
  },
  barTrack: {
    width: '100%',
    height: 10,
    backgroundColor: theme.colors.border,
    borderRadius: 5,
    overflow: 'visible',
    position: 'relative',
  },
  barFill: {
    height: '100%',
    borderRadius: 5,
  },
  goalMarker: {
    position: 'absolute',
    top: -4,
    width: 2,
    height: 18,
    backgroundColor: theme.colors.text.secondary,
    borderRadius: 1,
  },
  goalMarkerLabel: {
    position: 'absolute',
    top: 14,
    transform: [{ translateX: -12 }],
  },
  goalMarkerText: {
    fontSize: 10,
    fontFamily: theme.typography.fontFamily.medium,
    color: theme.colors.text.secondary,
  },
});
