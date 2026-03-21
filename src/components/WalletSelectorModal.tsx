'use client';

import React from 'react';
import { useWallet } from '@/contexts/WalletProvider';
import type { WalletType } from '@/types/wallet';

interface WalletOptionProps {
  name: string;
  description: string;
  icon: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
}

function WalletOption({ name, description, icon, onClick, disabled }: WalletOptionProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`w-full flex items-center gap-4 p-4 rounded-lg border transition-all
        ${disabled 
          ? 'border-gray-700 bg-gray-800/50 cursor-not-allowed opacity-50' 
          : 'border-gray-600 bg-gray-800 hover:border-cyan-500 hover:bg-gray-750 active:scale-[0.98]'
        }`}
    >
      <div className="w-12 h-12 flex items-center justify-center bg-gray-700 rounded-lg">
        {icon}
      </div>
      <div className="text-left flex-1">
        <div className="font-semibold text-white">{name}</div>
        <div className="text-sm text-gray-400">{description}</div>
      </div>
    </button>
  );
}

// Pera Wallet Icon
function PeraIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-8 h-8" fill="none">
      <circle cx="12" cy="12" r="10" fill="#7E3BB6" />
      <path d="M8 12L11 9L15 13L11 15L8 12Z" fill="white" />
    </svg>
  );
}

// MyAlgo Icon
function MyAlgoIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-8 h-8" fill="none">
      <circle cx="12" cy="12" r="10" fill="#7E3BB6" />
      <text x="12" y="16" textAnchor="middle" fill="white" fontSize="10" fontWeight="bold">M</text>
    </svg>
  );
}

// WalletConnect Icon
function WalletConnectIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-8 h-8" fill="none">
      <circle cx="12" cy="12" r="10" fill="#3B99FC" />
      <path d="M7 13.5C7 11.5 9 10 12 10C15 10 17 11.5 17 13.5C17 15.5 15 16.5 12 17.5C9 16.5 7 15.5 7 13.5Z" fill="white" />
      <circle cx="8" cy="13.5" r="1.5" fill="#3B99FC" />
      <circle cx="16" cy="13.5" r="1.5" fill="#3B99FC" />
    </svg>
  );
}

interface WalletSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function WalletSelectorModal({ isOpen, onClose }: WalletSelectorModalProps) {
  const { connect, isConnecting } = useWallet();

  if (!isOpen) return null;

  const handleConnect = async (walletType: WalletType) => {
    try {
      await connect(walletType);
      onClose();
    } catch (error) {
      console.error('Connection failed:', error);
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      onClick={handleBackdropClick}
    >
      <div className="bg-gray-900 border border-gray-700 rounded-xl w-full max-w-md p-6 shadow-2xl">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-white">Connect Wallet</h2>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors p-1"
            aria-label="Close"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-3">
          <WalletOption
            name="Pera Wallet"
            description="Popular Algorand wallet with browser extension and mobile app"
            icon={<PeraIcon />}
            onClick={() => handleConnect('pera')}
            disabled={isConnecting}
          />
          
          <WalletOption
            name="MyAlgo Wallet"
            description="Secure web wallet for Algorand with hardware wallet support"
            icon={<MyAlgoIcon />}
            onClick={() => handleConnect('myalgo')}
            disabled={isConnecting}
          />
          
          <WalletOption
            name="WalletConnect"
            description="Connect using any wallet via WalletConnect protocol"
            icon={<WalletConnectIcon />}
            onClick={() => handleConnect('walletconnect')}
            disabled={isConnecting}
          />
        </div>

        {isConnecting && (
          <div className="mt-4 text-center text-cyan-400">
            <div className="inline-flex items-center gap-2">
              <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Connecting...
            </div>
          </div>
        )}

        <p className="mt-6 text-xs text-gray-500 text-center">
          By connecting, you agree to the terms of service and acknowledge the security notice.
        </p>
      </div>
    </div>
  );
}
