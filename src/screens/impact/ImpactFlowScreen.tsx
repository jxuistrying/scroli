import React, { useState, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { RealityStep } from './RealityStep';
import { ImpactStep } from './ImpactStep';
import { ResetStep } from './ResetStep';
import { Button } from '../../components/ui/Button';
import { LoadingView } from '../../components/ui/LoadingView';
import { theme } from '../../theme';
import { useAuth } from '../../contexts/AuthContext';
import { useOnboardingStore } from '../../stores/onboardingStore';
import { TrackingService, DayResult } from '../../services/TrackingService';
import { supabase } from '../../services/supabase';
import { getCharityImpactMessage } from '../../utils/charityImpact';

export const ImpactFlowScreen: React.FC = () => {
  const navigation = useNavigation();
  const { user } = useAuth();
  const { stakeAmount } = useOnboardingStore();

  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(true);

  const [goalHours, setGoalHours] = useState(3);
  const [actualHours, setActualHours] = useState(0);
  const [dayResult, setDayResult] = useState<DayResult>('pending');
  const [charityName, setCharityName] = useState<string | null>(null);
  const [currentStreak, setCurrentStreak] = useState(0);

  useEffect(() => {
    if (!user) { setLoading(false); return; }

    const load = async () => {
      try {
        const [goal, result, profileRes, records] = await Promise.all([
          TrackingService.getActiveGoal(user.id),
          TrackingService.evaluateDayResult(user.id),
          supabase.from('profiles').select('charities(name)').eq('id', user.id).single(),
          TrackingService.getRecentRecords(user.id, 35),
        ]);

        if (goal) setGoalHours(goal.daily_limit_minutes / 60);
        setDayResult(result);
        setCharityName((profileRes.data?.charities as any)?.name ?? null);

        const today = new Date().toISOString().split('T')[0];
        const todayRecord = records.find(r => r.date === today);
        if (todayRecord) setActualHours(todayRecord.duration_minutes / 60);

        // Compute streak
        const sorted = [...records].sort((a, b) => b.date.localeCompare(a.date));
        let streak = 0;
        for (const r of sorted) {
          if (r.date === today) continue; // exclude today (just evaluated)
          if (r.status === 'success') streak++;
          else break;
        }
        // If today is a success, include it
        if (result === 'success') streak += 1;
        setCurrentStreak(streak);
      } catch (err) {
        console.error('ImpactFlow load error:', err);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [user]);

  const impactMessage = getCharityImpactMessage(charityName, stakeAmount);

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return (
          <RealityStep
            goalHours={goalHours}
            actualHours={actualHours}
            dayResult={dayResult}
          />
        );
      case 1:
        return (
          <ImpactStep
            donationAmount={stakeAmount}
            impactMessage={impactMessage}
            charityName={charityName}
            dayResult={dayResult}
            currentStreak={currentStreak}
          />
        );
      case 2:
        return (
          <ResetStep
            dayResult={dayResult}
            currentStreak={currentStreak}
            stakeAmount={stakeAmount}
          />
        );
      default:
        return null;
    }
  };

  const handleNext = () => {
    if (currentStep < 2) {
      setCurrentStep(currentStep + 1);
    } else {
      navigation.goBack();
    }
  };

  if (loading) return <LoadingView />;

  return (
    <View style={styles.container}>
      <View style={styles.content}>{renderStep()}</View>
      <View style={styles.footer}>
        <Button
          title={currentStep === 2 ? 'Close' : 'Next'}
          onPress={handleNext}
          variant="primary"
          style={styles.button}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1 },
  footer: {
    paddingHorizontal: theme.spacing.md,
    paddingBottom: theme.spacing.lg,
    backgroundColor: 'transparent',
  },
  button: { width: '100%' },
});
