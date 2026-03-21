'use client';

import React, { useState, useEffect } from 'react';
import { useWallet } from '@/contexts/WalletProvider';
import { useUserSettings } from '@/contexts/UserSettingsContext';
import type { Badge } from '@/types/badge';
import { BadgeCard, BadgeCardSkeleton } from '@/components/badges';

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function formatAddress(addr: string) {
  if (!addr || addr.length <= 16) return addr;
  return `${addr.slice(0, 8)}...${addr.slice(-8)}`;
}

// Mock function to fetch public badges for a given address
async function fetchPublicBadges(address: string): Promise<Badge[]> {
  // In production, this would call an API endpoint that checks on-chain badges
  // and applies privacy settings. For now, return empty array as badges are private by default.
  return [];
}

export default function ProfilePage() {
  const { address: connectedAddress, isConnected } = useWallet();
  const { settings, connectedWallets, isLoading } = useUserSettings();
  
  const [badges, setBadges] = useState<Badge[]>([]);
  const [isLoadingBadges, setIsLoadingBadges] = useState(false);
  const [copied, setCopied] = useState(false);

  // Determine which address to show profile for
  const profileAddress = settings?.profile?.address || connectedAddress;
  const isOwnProfile = connectedAddress === profileAddress;
  const profile = settings?.profile;

  // Fetch badges for this profile
  useEffect(() => {
    if (!profileAddress) return;
    
    const fetchBadges = async () => {
      setIsLoadingBadges(true);
      try {
        const publicBadges = await fetchPublicBadges(profileAddress);
        setBadges(publicBadges);
      } catch (error) {
        console.error('Failed to fetch public badges:', error);
        setBadges([]);
      } finally {
        setIsLoadingBadges(false);
      }
    };
    
    fetchBadges();
  }, [profileAddress]);

  const handleCopyAddress = () => {
    if (profileAddress) {
      navigator.clipboard.writeText(profileAddress);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Get display name or format address
  const displayName = profile?.displayName || (profileAddress ? formatAddress(profileAddress) : 'Unknown');
  
  // Show private badge count only for own profile
  const showPrivateBadges = isOwnProfile;

  if (isLoading) {
    return (
      <div className="py-12">
        <div className="max-w-4xl mx-auto animate-pulse">
          <div className="flex items-center gap-6 mb-8">
            <div className="w-24 h-24 rounded-full bg-gray-700" />
            <div className="space-y-3">
              <div className="h-6 bg-gray-700 rounded w-48" />
              <div className="h-4 bg-gray-700 rounded w-32" />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-64 bg-gray-800 rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!profileAddress) {
    return (
      <div className="py-12 text-center">
        <div className="text-6xl mb-4">👤</div>
        <h2 className="text-2xl font-bold mb-2">No Profile Found</h2>
        <p className="text-gray-400 max-w-md mx-auto">
          Connect your wallet to view your Satchel profile and earned badges.
        </p>
      </div>
    );
  }

  return (
    <div className="py-8">
      <div className="max-w-4xl mx-auto">
        {/* Profile Header */}
        <div className="bg-gray-800 rounded-lg border border-gray-700 p-6 mb-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
            {/* Avatar */}
            <div className="w-24 h-24 rounded-full bg-gray-700 overflow-hidden flex-shrink-0">
              {profile?.avatar ? (
                <img
                  src={profile.avatar}
                  alt={displayName}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-4xl bg-gradient-to-br from-cyan-600 to-purple-600">
                  {displayName.charAt(0).toUpperCase()}
                </div>
              )}
            </div>

            {/* Profile Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-2xl font-bold truncate">
                  {displayName}
                </h1>
                {isOwnProfile && (
                  <a
                    href="/settings"
                    className="px-3 py-1 text-sm bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-full transition-colors"
                  >
                    Edit
                  </a>
                )}
              </div>
              
              {/* Address */}
              <button
                onClick={handleCopyAddress}
                className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors group mb-3"
              >
                <span className="font-mono text-sm">
                  {profileAddress}
                </span>
                <svg className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                {copied && (
                  <span className="text-green-400 text-xs">Copied!</span>
                )}
              </button>

              {/* Joined Date */}
              <div className="flex items-center gap-2 text-gray-500 text-sm">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span>
                  Joined {profile?.joinedAt ? formatDate(profile.joinedAt) : 'recently'}
                </span>
              </div>
            </div>

            {/* Badge Count */}
            <div className="flex-shrink-0 text-center px-6 py-3 bg-gray-900 rounded-lg">
              <div className="text-3xl font-bold text-cyan-400">
                {showPrivateBadges ? badges.length : '—'}
              </div>
              <div className="text-xs text-gray-400 uppercase tracking-wider">
                {showPrivateBadges ? 'Badges' : 'Public'}
              </div>
            </div>
          </div>
        </div>

        {/* Privacy Notice */}
        {isOwnProfile && settings?.privacy?.showBadgesPublicly === false && (
          <div className="mb-6 p-4 bg-amber-900/20 border border-amber-700 rounded-lg">
            <p className="text-amber-200 text-sm">
              <span className="font-medium">Private Profile:</span> Your badges are hidden from public view.
              <a href="/settings?tab=privacy" className="ml-2 underline hover:text-amber-100">
                Change privacy settings →
              </a>
            </p>
          </div>
        )}

        {/* Badges Section */}
        <div className="mb-4">
          <h2 className="text-xl font-semibold mb-4">
            {isOwnProfile ? 'My Badges' : 'Public Badges'}
          </h2>
          
          {isLoadingBadges ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(3)].map((_, i) => (
                <BadgeCardSkeleton key={i} />
              ))}
            </div>
          ) : badges.length === 0 ? (
            <div className="text-center py-12 bg-gray-800 rounded-lg border border-gray-700">
              <div className="text-5xl mb-3">🎒</div>
              <h3 className="text-lg font-medium mb-2">
                {isOwnProfile ? 'No Badges Yet' : 'No Public Badges'}
              </h3>
              <p className="text-gray-400 max-w-md mx-auto">
                {isOwnProfile
                  ? "You haven't earned any Satchel badges yet. Complete criteria or receive badges through integrations."
                  : "This profile has no publicly visible badges."}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {badges.map((badge) => (
                <BadgeCard key={badge.id} badge={badge} />
              ))}
            </div>
          )}
        </div>

        {/* Own Profile Quick Actions */}
        {isOwnProfile && (
          <div className="mt-8 flex flex-wrap gap-4 justify-center">
            <a
              href="/settings"
              className="px-6 py-3 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg font-medium transition-colors"
            >
              Settings
            </a>
            <a
              href="/badges"
              className="px-6 py-3 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg font-medium transition-colors"
            >
              Browse All Badges
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
