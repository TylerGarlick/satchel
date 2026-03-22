'use client';

import { useWallet } from '@/contexts/WalletProvider';
import { BadgeManager } from '@/components/badges/BadgeManager';

export default function AdminBadgesPage() {
  const { address: walletAddress, isConnected: connected } = useWallet();

  // For demo purposes, we'll consider any connected wallet as admin
  // In production, this should check against an admin list or role
  const isAdmin = !!(connected && walletAddress);

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Admin: Badge Management</h1>
        <p className="text-gray-500 mt-2">
          Create, update, and manage badges for your Satchel ecosystem
        </p>
      </div>

      {connected ? (
        <BadgeManager 
          adminAddress={walletAddress} 
          isAdmin={isAdmin} 
        />
      ) : (
        <div className="alert alert-info">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>Connect your wallet to access the badge management panel.</span>
        </div>
      )}
    </div>
  );
}
