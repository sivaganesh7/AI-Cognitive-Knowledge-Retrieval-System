import ThemeToggle from '@/components/ThemeToggle';
import { AuthProvider } from '@/context/AuthContext';
import { ThemeProvider } from '@/context/ThemeContext';
import '@/styles/globals.css';
import { Inter } from 'next/font/google';
import { Toaster } from 'react-hot-toast';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata = {
  title: 'AI Cognitive Knowledge Retrieval System — AI-Powered Knowledge Management',
  description:
    'Capture, organize, and query your personal knowledge base with the power of AI. ' +
    'Your knowledge, organized by AI, accessible forever.',
  keywords: ['ai cognitive knowledge retrieval system', 'knowledge management', 'AI notes', 'Gemini AI', 'PKM'],
  authors: [{ name: 'AI Cognitive Knowledge Retrieval System' }],
  openGraph: {
    title: 'AI Cognitive Knowledge Retrieval System — AI-Powered Knowledge Management',
    description: 'Your knowledge, organized by AI, accessible forever.',
    type: 'website',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body className="antialiased" suppressHydrationWarning>
        <ThemeProvider>
          <AuthProvider>
            {children}
            <ThemeToggle />
            <Toaster
              position="bottom-right"
              toastOptions={{
                duration: 3000,
                style: {
                  background: 'var(--color-surface-2)',
                  color: 'var(--color-text)',
                  border: '1px solid var(--color-border)',
                  borderRadius: '10px',
                  fontSize: '14px',
                },
                success: {
                  iconTheme: { primary: '#10b981', secondary: 'var(--color-bg)' },
                },
                error: {
                  iconTheme: { primary: '#ef4444', secondary: 'var(--color-bg)' },
                },
              }}
            />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}


