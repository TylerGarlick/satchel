'use client';

import React, { useState } from 'react';
import { useWallet } from '@/contexts/WalletProvider';
import { WalletSelectorModal } from './WalletSelectorModal';

function formatAddress(address: string): string {
  if (address.length <= 12) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

function getWalletIcon(walletType: string | null) {
  if (walletType === 'pera') {
    return (
      <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none">
        <circle cx="12" cy="12" r="10" fill="#7E3BB6" />
        <path d="M8 12L11 9L15 13L11 15L8 12Z" fill="white" />
      </svg>
    );
  }
  if (walletType === 'myalgo') {
    return (
      <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none">
        <circle cx="12" cy="12" r="10" fill="#7E3BB6" />
        <text x="12" y="16" textAnchor="middle" fill="white" fontSize="10" fontWeight="bold">M</text>
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none">
      <circle cx="12" cy="12" r="10" fill="#3B99FC" />
      <path d="M7 13.5C7 11.5 9 10 12 10C15 10 17 11.5 17 13.5C17 15.5 15 16.5 12 17.5C9 16.5 7 15.5 7 13.5Z" fill="white" />
    </svg>
  );
}

interface ConnectButtonProps {
  className?: string;
  variant?: 'primary' | 'secondary';
}

export function ConnectButton({ className = '', variant = 'primary' }: ConnectButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { address, walletType, isConnected, isConnecting, disconnect, error } = useWallet();

  if (isConnected && address) {
    return (
      <div className="flex items-center gap-3">
        <div className={`flex items-center gap-2 px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg ${className}`}>
          <span className="text-gray-400">
            {getWalletIcon(walletType)}
          </span>
          <span className="font-mono text-sm text-white">
            {formatAddress(address)}
          </span>
        </div>
        <button
          onClick={disconnect}
          className="px-4 py-2 text-sm text-gray-300 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
          title="Disconnect wallet"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
        </button>
      </div>
    );
  }

  const baseClasses = variant === 'primary'
    ? 'bg-cyan-600 hover:bg-cyan-700 text-white font-semibold'
    : 'bg-gray-700 hover:bg-gray-600 text-white';

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        disabled={isConnecting}
        className={`flex items-center gap-2 px-6 py-3 rounded-lg transition-all active:scale-[0.98] ${baseClasses} ${className}
          ${isConnecting ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        {isConnecting ? (
          <>
            <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            <span>Connecting...</span>
          </>
        ) : (
          <>
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <span>Connect Wallet</span>
          </>
        )}
      </button>

      {error && (
        <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 px-3 py-2 bg-red-900/80 border border-red-600 rounded-lg text-sm text-red-200 whitespace-nowrap">
          {error}
        </div>
      )}

      <WalletSelectorModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
      />
    </>
  );
}
