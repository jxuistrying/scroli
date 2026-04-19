import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { RootStackParamList } from './types';
import { MainNavigator } from './MainNavigator';
import { OnboardingScreen } from '../screens/onboarding/OnboardingScreen';
import { ImpactFlowScreen } from '../screens/impact/ImpactFlowScreen';
import { SignInScreen } from '../screens/SignInScreen';
import { SignUpScreen } from '../screens/SignUpScreen';
import { GoalScreen } from '../screens/settings/GoalScreen';
import { StakeScreen } from '../screens/settings/StakeScreen';
import { CharityScreen } from '../screens/settings/CharityScreen';
import { PaymentScreen } from '../screens/settings/PaymentScreen';
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
        <>
          <Stack.Screen name="SignIn" component={SignInScreen} />
          <Stack.Screen name="SignUp" component={SignUpScreen} />
        </>
      ) : !hasCompletedOnboarding ? (
        <Stack.Screen name="Onboarding" component={OnboardingScreen} />
      ) : (
        <>
          <Stack.Screen name="Main" component={MainNavigator} />
          <Stack.Screen name="ImpactFlow" component={ImpactFlowScreen} />
          <Stack.Screen name="GoalSettings" component={GoalScreen} />
          <Stack.Screen name="StakeSettings" component={StakeScreen} />
          <Stack.Screen name="CharitySettings" component={CharityScreen} />
          <Stack.Screen name="PaymentSettings" component={PaymentScreen} />
        </>
      )}
    </Stack.Navigator>
  );
};
