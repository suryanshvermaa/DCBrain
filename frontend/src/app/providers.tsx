'use client';

import { Provider } from 'react-redux';
import { store } from '@/lib/store';
import { ReactNode } from 'react';

import { api } from '@/lib/api';
import { selectAccessToken } from '@/features/auth/authSlice';
import { useAppSelector } from '@/lib/hooks';

function AuthClientBridge() {
  const accessToken = useAppSelector(selectAccessToken);

  // Set the token synchronously during render so all child components
  // immediately have access to the token in the API client before their useEffects run
  api.setToken(accessToken);

  return null;
}

export function Providers({ children }: { children: ReactNode }) {
  return (
    <Provider store={store}>
      <AuthClientBridge />
      {children}
    </Provider>
  );
}