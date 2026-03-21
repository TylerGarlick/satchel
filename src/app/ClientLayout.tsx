'use client';

import { WalletProvider } from '@/contexts/WalletProvider';

export function ClientLayout({ children }: { children: React.ReactNode }) {
  return <WalletProvider>{children}</WalletProvider>;
}
