'use client';

import { Provider } from 'react-redux';
import { store } from '@/lib/store';
import { ReactNode } from 'react';
import { useEffect } from 'react';
import { api } from '@/lib/api';
import { selectAccessToken } from '@/features/auth/authSlice';
import { useAppSelector } from '@/lib/hooks';

function AuthClientBridge() {
  const accessToken = useAppSelector(selectAccessToken);

  useEffect(() => {
    api.setToken(accessToken);
  }, [accessToken]);

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