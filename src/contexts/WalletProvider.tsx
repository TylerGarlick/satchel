'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import type { WalletContextType, WalletType, SavedWalletSession, WalletState } from '@/types/wallet';

const SESSION_KEY = 'satchel_wallet_session';

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export function useWallet() {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
}

interface WalletProviderProps {
  children: ReactNode;
}

export function WalletProvider({ children }: WalletProviderProps) {
  const [state, setState] = useState<WalletState>({
    address: null,
    walletType: null,
    isConnected: false,
    isConnecting: false,
    error: null,
  });

  // Load session from localStorage on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    try {
      const saved = localStorage.getItem(SESSION_KEY);
      if (saved) {
        const session: SavedWalletSession = JSON.parse(saved);
        setState({
          address: session.address,
          walletType: session.walletType,
          isConnected: true,
          isConnecting: false,
          error: null,
        });
      }
    } catch (e) {
      console.error('Failed to load wallet session:', e);
    }
  }, []);

  // Save session to localStorage
  const saveSession = useCallback((address: string, walletType: WalletType) => {
    if (typeof window === 'undefined') return;
    
    const session: SavedWalletSession = {
      address,
      walletType,
      connectedAt: new Date().toISOString(),
    };
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  }, []);

  // Clear session from localStorage
  const clearSession = useCallback(() => {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(SESSION_KEY);
  }, []);

  // Connect with Pera Wallet
  const connectPera = useCallback(async (): Promise<string> => {
    const { PeraWalletConnect } = await import('@perawallet/connect');
    const peraWallet = new PeraWalletConnect({
      chainId: 4160, // MainNet Algorand
    });
    
    const accounts = await peraWallet.connect();
    if (!accounts || accounts.length === 0) {
      throw new Error('No accounts found');
    }
    return accounts[0];
  }, []);

  // Connect with MyAlgo Wallet
  const connectMyAlgo = useCallback(async (): Promise<string> => {
    const MyAlgoConnect = (await import('@randlabs/myalgo-connect')).default;
    const myAlgoConnect = new MyAlgoConnect();
    
    const accounts = await myAlgoConnect.connect({
      shouldSelectOneAccount: true,
    });
    if (!accounts || accounts.length === 0) {
      throw new Error('No accounts found');
    }
    return accounts[0].address;
  }, []);

  // Connect with WalletConnect
  // Note: WalletConnect v2 requires a compatible provider. For Algorand, you would typically
  // use @walletconnect/universal-provider or a similar package with Algorand chain support.
  // This placeholder provides the UI flow but requires additional setup for actual connection.
  const connectWalletConnect = useCallback(async (): Promise<string> => {
    const { WalletConnectModal } = await import('@walletconnect/modal');
    
    // WalletConnect v2 requires project ID - use env var or demo placeholder
    const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID;
    
    if (!projectId) {
      throw new Error('WalletConnect requires NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID environment variable. See README for setup instructions.');
    }
    
    const walletConnectModal = new WalletConnectModal({
      projectId,
      chains: ['algorand: mainnet'],
    });

    // Open the modal to initiate pairing
    await walletConnectModal.openModal();
    
    // In a full implementation, you would:
    // 1. Use @walletconnect/universal-provider or @walletconnect/ethereum-provider
    // 2. Configure it for Algorand chain ( chainId: 'algorand:mainnet' )
    // 3. Listen for the 'connect' event to get accounts
    // 4. Close the modal when connected
    
    // Placeholder - actual wallet connection would need Algorand-specific provider
    walletConnectModal.closeModal();
    throw new Error('WalletConnect for Algorand requires additional provider setup. Use Pera Wallet or MyAlgo Wallet for now.');
  }, []);

  // Connect wallet
  const connect = useCallback(async (walletType: WalletType) => {
    setState(prev => ({ ...prev, isConnecting: true, error: null }));

    try {
      let address: string;

      switch (walletType) {
        case 'pera':
          address = await connectPera();
          break;
        case 'myalgo':
          address = await connectMyAlgo();
          break;
        case 'walletconnect':
          address = await connectWalletConnect();
          break;
        default:
          throw new Error('Unsupported wallet type');
      }

      setState({
        address,
        walletType,
        isConnected: true,
        isConnecting: false,
        error: null,
      });

      saveSession(address, walletType);
    } catch (error) {
      setState(prev => ({
        ...prev,
        isConnecting: false,
        error: error instanceof Error ? error.message : 'Connection failed',
      }));
      throw error;
    }
  }, [connectPera, connectMyAlgo, connectWalletConnect, saveSession]);

  // Disconnect wallet
  const disconnect = useCallback(() => {
    setState({
      address: null,
      walletType: null,
      isConnected: false,
      isConnecting: false,
      error: null,
    });
    clearSession();
  }, [clearSession]);

  const value: WalletContextType = {
    ...state,
    connect,
    disconnect,
  };

  return (
    <WalletContext.Provider value={value}>
      {children}
    </WalletContext.Provider>
  );
}
