import { useState, useEffect, useCallback } from 'react';
import { NativeModules, Platform } from 'react-native';
import { ScreenTimeService } from '../services/ScreenTimeService';

// Simulator fallback — real device returns actual screen time
const SIMULATOR_MOCK_MINUTES = 0;

const isScreenTimeAvailable =
  Platform.OS === 'ios' && !!NativeModules.ScreenTimeModule;

interface ScreenTimeState {
  minutesToday: number;
  permissionGranted: boolean;
  loading: boolean;
  error: string | null;
}

export const useScreenTime = () => {
  const [state, setState] = useState<ScreenTimeState>({
    minutesToday: 0,
    permissionGranted: false,
    loading: true,
    error: null,
  });

  const requestAndFetch = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    // Native module not compiled in (simulator or missing from Xcode target)
    // Use mock data so the app doesn't crash
    if (!isScreenTimeAvailable) {
      setState({
        minutesToday: SIMULATOR_MOCK_MINUTES,
        permissionGranted: true,
        loading: false,
        error: null,
      });
      return;
    }

    try {
      const granted = await ScreenTimeService.requestPermission();
      if (!granted) {
        setState({
          minutesToday: SIMULATOR_MOCK_MINUTES,
          permissionGranted: false,
          loading: false,
          error: 'ScreenTime permission denied',
        });
        return;
      }

      const minutes = await ScreenTimeService.getTodayScreenTime();
      setState({
        minutesToday: minutes,
        permissionGranted: true,
        loading: false,
        error: null,
      });
    } catch (e) {
      setState({
        minutesToday: SIMULATOR_MOCK_MINUTES,
        permissionGranted: false,
        loading: false,
        error: 'Failed to fetch screen time',
      });
    }
  }, []);

  useEffect(() => {
    requestAndFetch();
  }, [requestAndFetch]);

  return {
    ...state,
    hoursToday: state.minutesToday / 60,
    refetch: requestAndFetch,
  };
};
