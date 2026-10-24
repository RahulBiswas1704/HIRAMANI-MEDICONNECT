import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'MediConnect - Hospital WhatsApp Automation Platform',
  description: 'Enterprise healthcare communication and appointment automation for hospitals and clinics via Meta WhatsApp Business Platform.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50 antialiased">{children}</body>
    </html>
  );
}
