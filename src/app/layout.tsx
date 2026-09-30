import type { Metadata } from 'next';
import { Outfit } from 'next/font/google';
import './globals.css';
import Navigation from '@/components/Navigation';

const outfit = Outfit({ subsets: ['latin'], weight: ['400', '600', '800', '900'] });

export const metadata: Metadata = {
  title: 'FIZZY | Watermelon Crush',
  description: 'Juicy watermelon. Bright bubbles. Zero boring sips.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={outfit.className}>
        <Navigation />
        {children}
      </body>
    </html>
  );
}
