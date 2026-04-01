import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '../../theme';
import { WelcomeStep } from './WelcomeStep';
import { GoalStep } from './GoalStep';
import { StakeStep } from './StakeStep';
import { Button } from '../../components/ui/Button';
import { useAuthStore } from '../../stores/authStore';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../services/supabase';
import { showAlert } from '../../utils/alert';

export const OnboardingScreen: React.FC = () => {
  const { user } = useAuth();
  const { completeOnboarding } = useAuthStore();
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [WelcomeStep, GoalStep, StakeStep];
  const totalSteps = steps.length;
  const CurrentStepComponent = steps[currentStep];

  const handleNext = async () => {
    if (currentStep < totalSteps - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      if (user) {
        try {
          const { error } = await supabase
            .from('profiles')
            .update({ has_completed_onboarding: true })
            .eq('id', user.id);

          if (error) {
            console.error('Error saving onboarding status:', error);
            showAlert('Wait...', 'We couldn\'t save your progress. Please try again.');
            return;
          }
        } catch (err) {
          console.error('Error in onboarding completion:', err);
        }
      }

      // Complete onboarding in local state — RootNavigator will
      // automatically switch to Main now that it's persisted/synced
      completeOnboarding();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.content}>
        <CurrentStepComponent />
      </View>

      <View style={styles.footer}>
        <View style={styles.pagination}>
          {Array.from({ length: totalSteps }).map((_, index) => (
            <View
              key={index}
              style={[
                styles.paginationDot,
                index === currentStep && styles.paginationDotActive,
              ]}
            />
          ))}
        </View>

        <View style={styles.buttonContainer}>
          {currentStep > 0 && (
            <Button title="Back" onPress={handleBack} variant="secondary" style={styles.button} />
          )}
          <Button
            title={currentStep === totalSteps - 1 ? "Let's Go!" : 'Next'}
            onPress={handleNext}
            variant="primary"
            style={styles.button}
          />
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    flex: 1,
  },
  footer: {
    paddingHorizontal: theme.spacing.md,
    paddingBottom: theme.spacing.md,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: theme.spacing.xs,
    marginBottom: theme.spacing.md,
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.border,
  },
  paginationDotActive: {
    width: 24,
    backgroundColor: theme.colors.primary,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  button: {
    flex: 1,
  },
});
