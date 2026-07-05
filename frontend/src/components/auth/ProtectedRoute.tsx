'use client';

import { useEffect, useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/lib/hooks';
import { refreshSession, selectAccessToken } from '@/features/auth/authSlice';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const router = useRouter();
  const pathname = usePathname();
  const dispatch = useAppDispatch();
  const accessToken = useAppSelector(selectAccessToken);
  const bootstrapped = useRef(false);

  useEffect(() => {
    if (accessToken || bootstrapped.current) {
      return;
    }

    bootstrapped.current = true;
    dispatch(refreshSession())
      .unwrap()
      .catch(() => {
        const nextPath = pathname && pathname !== '/' ? `?next=${encodeURIComponent(pathname)}` : '';
        router.replace(`/login${nextPath}`);
      });
  }, [accessToken, dispatch, pathname, router]);

  if (accessToken) {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-100">
      <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-5 py-4 text-sm shadow-2xl backdrop-blur">
        <Loader2 className="h-4 w-4 animate-spin text-sky-300" />
        Checking your session...
      </div>
    </div>
  );
}