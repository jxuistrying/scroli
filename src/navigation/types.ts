import type { NavigatorScreenParams } from '@react-navigation/native';

export type MainTabParamList = {
  Dashboard: undefined;
  Stats: undefined;
  Center: undefined;
  Profile: undefined;
  Settings: undefined;
};

export type RootStackParamList = {
  SignIn: undefined;
  SignUp: undefined;
  Onboarding: undefined;
  Main: NavigatorScreenParams<MainTabParamList>;
  ImpactFlow: undefined;
  GoalSettings: undefined;
  StakeSettings: undefined;
  CharitySettings: undefined;
  PaymentSettings: undefined;
};

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
