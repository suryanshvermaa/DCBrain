'use client';

import { Provider } from 'react-redux';
import { store } from '@/lib/store';
import { ReactNode } from 'react';
import { ThemeProvider } from '@/components/providers/ThemeProvider';
import { api } from '@/lib/api';
import { useEffect, useRef } from 'react';
import { selectAccessToken, refreshSession } from '@/features/auth/authSlice';
import { useAppSelector, useAppDispatch } from '@/lib/hooks';

function AuthClientBridge() {
  const dispatch = useAppDispatch();
  const accessToken = useAppSelector(selectAccessToken);
  const bootstrapped = useRef(false);

  // Set the token synchronously during render so all child components
  // immediately have access to the token in the API client before their useEffects run
  api.setToken(accessToken);

  useEffect(() => {
    if (!accessToken && !bootstrapped.current) {
      bootstrapped.current = true;
      dispatch(refreshSession()).then((action) => {
        if (refreshSession.fulfilled.match(action)) {
          api.setToken(action.payload.token.accessToken);
        }
      });
    }
  }, [dispatch, accessToken]);

  return null;
}

export function Providers({ children }: { children: ReactNode }) {
  return (
    <Provider store={store}>
      <ThemeProvider>
        <AuthClientBridge />
        {children}
      </ThemeProvider>
    </Provider>
  );
}