export type WalletType = 'pera' | 'myalgo' | 'walletconnect';

export interface WalletState {
  address: string | null;
  walletType: WalletType | null;
  isConnected: boolean;
  isConnecting: boolean;
  error: string | null;
}

export interface WalletContextType extends WalletState {
  connect: (walletType: WalletType) => Promise<void>;
  disconnect: () => void;
}

export interface SavedWalletSession {
  address: string;
  walletType: WalletType;
  connectedAt: string;
}
