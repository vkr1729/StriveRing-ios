import { useEffect } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import type { AppAction } from '@/types';

const TICK_INTERVAL_MS = 1000;

export function useTimer(dispatch: (action: AppAction) => void, isActive: boolean) {
  useEffect(() => {
    if (!isActive) return;

    const id = setInterval(() => {
      if (AppState.currentState === 'active') {
        dispatch({ type: 'TICK', currentTime: Date.now() });
      }
    }, TICK_INTERVAL_MS);

    return () => clearInterval(id);
  }, [isActive, dispatch]);

  useEffect(() => {
    const handleAppStateChange = (nextState: AppStateStatus) => {
      if (nextState === 'active') {
        dispatch({ type: 'TICK', currentTime: Date.now() });
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription.remove();
  }, [dispatch]);
}
