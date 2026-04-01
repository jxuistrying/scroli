import { Alert, Platform } from 'react-native';

/**
 * Cross-platform alert that works on both mobile and web.
 * On mobile, uses React Native's Alert.alert().
 * On web, falls back to window.alert().
 */
export const showAlert = (title: string, message: string) => {
  if (Platform.OS === 'web') {
    window.alert(`${title}\n\n${message}`);
  } else {
    Alert.alert(title, message);
  }
};
