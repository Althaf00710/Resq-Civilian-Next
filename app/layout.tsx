import type { Metadata } from 'next';
import { Poppins } from 'next/font/google';
import './globals.css';
import GlassBottomNav from '@/components/shared/GlassBottomNav';
import Providers from './providers'; 

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['300','400','500','600','700'],
  display: 'swap',
  variable: '--font-poppins',
});

export const metadata: Metadata = {
  title: 'Civilian Next',
  description: 'A Next.js application using Geist UI',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${poppins.variable}`}>
        <Providers>
          {children}
          <GlassBottomNav />
        </Providers>
      </body>
    </html>
  );
}
