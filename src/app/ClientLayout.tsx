'use client';

import { WalletProvider, useWallet } from '@/contexts/WalletProvider';
import { UserSettingsProvider } from '@/contexts/UserSettingsContext';
import { useEffect, useState } from 'react';

function SettingsBridge({ children }: { children: React.ReactNode }) {
  const { address, walletType, isConnected } = useWallet();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Don't render settings provider until mounted to avoid hydration issues
  if (!mounted) {
    return <>{children}</>;
  }

  return (
    <UserSettingsProvider initialAddress={address || undefined}>
      {children}
    </UserSettingsProvider>
  );
}

export function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <WalletProvider>
      <SettingsBridge>
        {children}
      </SettingsBridge>
    </WalletProvider>
  );
}
