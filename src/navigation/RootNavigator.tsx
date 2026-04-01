import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { RootStackParamList } from './types';
import { MainNavigator } from './MainNavigator';
import { OnboardingScreen } from '../screens/onboarding/OnboardingScreen';
import { ImpactFlowScreen } from '../screens/impact/ImpactFlowScreen';
import { SignInScreen } from '../screens/SignInScreen';
import { SignUpScreen } from '../screens/SignUpScreen';
import { useAuth } from '../contexts/AuthContext';
import { useAuthStore } from '../stores/authStore';

const Stack = createNativeStackNavigator<RootStackParamList>();

export const RootNavigator: React.FC = () => {
  const { user } = useAuth();
  const { hasCompletedOnboarding } = useAuthStore();

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      {!user ? (
        // Not signed in — show auth screens
        <>
          <Stack.Screen name="SignIn" component={SignInScreen} />
          <Stack.Screen name="SignUp" component={SignUpScreen} />
        </>
      ) : !hasCompletedOnboarding ? (
        // Signed in but new user — show onboarding
        <Stack.Screen name="Onboarding" component={OnboardingScreen} />
      ) : (
        // Signed in and returning user — show main app
        <>
          <Stack.Screen name="Main" component={MainNavigator} />
          <Stack.Screen
            name="ImpactFlow"
            component={ImpactFlowScreen}
          />
        </>
      )}
    </Stack.Navigator>
  );
};
