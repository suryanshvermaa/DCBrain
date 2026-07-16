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

// Inline script that runs before React hydrates to prevent theme flash.
// Reads localStorage and applies 'dark' class synchronously.
const themeScript = `
(function(){
  try{
    var t=localStorage.getItem('dcbrain-theme');
    var d=document.documentElement;
    if(t==='dark'||(t==='system'||!t)&&window.matchMedia('(prefers-color-scheme: dark)').matches){
      d.classList.add('dark');
    }else{
      d.classList.remove('dark');
    }
  }catch(e){}
})();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`} suppressHydrationWarning>
      <head>
        {/* Flash prevention: must run before any paint */}
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-full flex flex-col font-sans bg-[var(--color-bg)] text-[var(--color-text-primary)] transition-colors duration-[200ms]">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}