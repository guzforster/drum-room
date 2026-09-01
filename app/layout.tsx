import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.SITE_URL ?? 'http://localhost:3000'),
  title: 'Drumroom — Beginner Beat Practice',
  description: 'Explore, hear, read, and print beginner-friendly drum grooves.',
  openGraph: {
    title: 'Drumroom — Beginner Beat Practice',
    description: 'Explore, hear, read, and print beginner-friendly drum grooves.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Drumroom — Beginner Beat Practice',
    description: 'Explore, hear, read, and print beginner-friendly drum grooves.',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}

