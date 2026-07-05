'use client';

import { useMemo, useState, type FormEvent } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { AuthShell } from '@/components/auth/AuthShell';
import { useAppDispatch, useAppSelector } from '@/lib/hooks';
import { loginUser, selectAuthError, selectAuthStatus } from '@/features/auth/authSlice';

interface LoginFormState {
  email: string;
  password: string;
}

const initialState: LoginFormState = {
  email: '',
  password: '',
};

function validateLogin(values: LoginFormState): string | null {
  if (!values.email.trim()) {
    return 'Email is required';
  }

  if (!values.email.includes('@')) {
    return 'Enter a valid email address';
  }

  if (!values.password) {
    return 'Password is required';
  }

  return null;
}

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const dispatch = useAppDispatch();
  const authStatus = useAppSelector(selectAuthStatus);
  const authError = useAppSelector(selectAuthError);
  const [form, setForm] = useState<LoginFormState>(initialState);
  const [localError, setLocalError] = useState<string | null>(null);

  const nextPath = useMemo(() => searchParams.get('next') ?? '/', [searchParams]);
  const isSubmitting = authStatus === 'loading';

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const validationError = validateLogin(form);
    if (validationError) {
      setLocalError(validationError);
      return;
    }

    setLocalError(null);

    try {
      await dispatch(loginUser({ email: form.email.trim().toLowerCase(), password: form.password })).unwrap();
      router.replace(nextPath);
    } catch {
      // Redux state already stores the error.
    }
  }

  return (
    <AuthShell
      title="Welcome back"
      description="Sign in to the DCBrain platform to continue working with EPC documents, schedule intelligence, and compliance workflows."
      footerText="No account yet?"
      footerHref="/register"
      footerLabel="Create one"
    >
      <form className="space-y-5" onSubmit={handleSubmit}>
        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700" htmlFor="email">
            Email
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            value={form.email}
            onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
            className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-950 outline-none transition focus:border-sky-500 focus:bg-white focus:ring-4 focus:ring-sky-100"
            placeholder="name@company.com"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700" htmlFor="password">
            Password
          </label>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            value={form.password}
            onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
            className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-950 outline-none transition focus:border-sky-500 focus:bg-white focus:ring-4 focus:ring-sky-100"
            placeholder="Enter your password"
          />
        </div>

        {(localError || authError) && (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            {localError ?? authError}
          </div>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
          Sign in
        </button>
      </form>
    </AuthShell>
  );
}