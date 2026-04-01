import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '../../theme';
import { WelcomeStep } from './WelcomeStep';
import { GoalStep } from './GoalStep';
import { StakeStep } from './StakeStep';
import { Button } from '../../components/ui/Button';
import { useAuthStore } from '../../stores/authStore';

export const OnboardingScreen: React.FC = () => {
  const { completeOnboarding } = useAuthStore();
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [WelcomeStep, GoalStep, StakeStep];
  const totalSteps = steps.length;
  const CurrentStepComponent = steps[currentStep];

  const handleNext = () => {
    if (currentStep < totalSteps - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // Complete onboarding — RootNavigator will automatically
      // switch to Main once hasCompletedOnboarding becomes true
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
