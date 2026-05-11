import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'TradeSim — Professional Backtesting Platform',
  description: 'Backtest your trading strategies with professional-grade charts and indicators',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
