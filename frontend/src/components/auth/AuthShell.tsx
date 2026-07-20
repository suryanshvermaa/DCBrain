import Link from 'next/link';
import type { ReactNode } from 'react';

interface AuthShellProps {
  title: string;
  description: string;
  footerText: string;
  footerHref: string;
  footerLabel: string;
  children: ReactNode;
}

export function AuthShell({ title, description, footerText, footerHref, footerLabel, children }: AuthShellProps) {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(14,165,233,0.15),_transparent_35%),linear-gradient(90deg,_#0f172a_0%,_#111827_50%,_#f8fafc_50%,_#f8fafc_100%)] text-slate-900">
      <div className="mx-auto grid min-h-screen max-w-7xl grid-cols-1 lg:grid-cols-[1.05fr_0.95fr]">
        <section className="flex items-center px-6 py-16 lg:px-10">
          <div className="max-w-xl text-white lg:pr-16">
            <div className="mb-8 inline-flex items-center gap-3 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-medium text-slate-100 backdrop-blur">
              <span className="h-2.5 w-2.5 rounded-full bg-cyan-300" />
              DCBrain secure access
            </div>
            <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">{title}</h1>
            <p className="mt-5 max-w-lg text-base leading-7 text-slate-300 sm:text-lg">{description}</p>
            <div className="mt-10 grid gap-4 sm:grid-cols-3">
              {[
                'Memory-only access tokens',
                'HttpOnly refresh cookies',
                'Role-based API controls',
              ].map((item) => (
                <div key={item} className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-200 shadow-[0_20px_60px_rgba(15,23,42,0.25)] backdrop-blur">
                  {item}
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="flex items-center px-6 py-10 lg:px-10">
          <div className="w-full rounded-3xl border border-slate-200/80 bg-white p-8 shadow-[0_40px_100px_rgba(15,23,42,0.18)] sm:p-10">
            <div className="mb-8 flex items-center justify-between">
              <Link href="/" className="text-sm font-medium text-slate-500 transition hover:text-slate-900">
                Return to dashboard
              </Link>
              <span className="rounded-full bg-sky-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-sky-700">
                {title}
              </span>
            </div>
            <div className="space-y-2">
              <h2 className="text-3xl font-semibold tracking-tight text-slate-950">{title}</h2>
              <p className="text-sm leading-6 text-slate-600">{description}</p>
            </div>
            <div className="mt-8">{children}</div>
            <p className="mt-8 text-sm text-slate-500">
              {footerText}{' '}
              <Link href={footerHref} className="font-medium text-sky-700 underline-offset-4 hover:underline">
                {footerLabel}
              </Link>
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}