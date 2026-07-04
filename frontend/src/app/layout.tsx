import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
  preload: true,
  fallback: ['system-ui', 'sans-serif'],
});

export const metadata: Metadata = {
  title: 'DCBrain - AI Platform for Data Centre EPC',
  description: 'DCBrain: AI-powered platform unifying EPC project data using RAG, Knowledge Graph, automated compliance checking, and autonomous AI agents.',
  keywords: ['EPC', 'Data Centre', 'AI', 'RAG', 'Knowledge Graph', 'Compliance', 'Schedule Risk'],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col font-sans">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}