'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useWallet } from '@/contexts/WalletProvider';
import type { Badge, BadgeSortOption, BadgeFilterState, ARC69Note, SatchelAssetParams } from '@/types/badge';

// Algorand node/API configuration
const ALGORAND_NODE_URL = process.env.NEXT_PUBLIC_ALGORAND_NODE_URL || 'https://mainnet-api.algonode.cloud';
const ALGORAND_INDEXER_URL = process.env.NEXT_PUBLIC_ALGORAND_INDEXER_URL || 'https://mainnet-idx.algonode.cloud';

// Satchel collection filter - in production this would be the actual Satchel ASA collection
const SATCHEL_COLLECTION_IDS = process.env.NEXT_PUBLIC_SATCHEL_COLLECTION_IDS?.split(',').map(Number) || [];

// Sample/test badges for demo mode when no real badges exist
const SAMPLE_BADGES: Badge[] = [
  {
    id: 123456789,
    name: 'Early Contributor',
    description: 'Awarded to early contributors of the Satchel ecosystem',
    image: 'https://via.placeholder.com/400x400/06b6d4/ffffff?text=Early+Contributor',
    issuer: 'SATCHEL_ISSUER_ADDRESS',
    earnedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    ipfsHash: 'QmEarlyContributor123',
  },
  {
    id: 987654321,
    name: 'Webhook Master',
    description: 'Completed webhook integration challenge',
    image: 'https://via.placeholder.com/400x400/8b5cf6/ffffff?text=Webhook+Master',
    issuer: 'SATCHEL_ISSUER_ADDRESS',
    earnedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    ipfsHash: 'QmWebhookMaster456',
  },
  {
    id: 555555555,
    name: 'Community Star',
    description: 'Recognized for outstanding community contributions',
    image: 'https://via.placeholder.com/400x400/f59e0b/ffffff?text=Community+Star',
    issuer: 'COMMUNITY_ISSUER_ADDRESS',
    earnedAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
    ipfsHash: 'QmCommunityStar789',
  },
];

// Parse ARC69 note from asset params
function parseARC69Note(noteBase64?: string): ARC69Note | null {
  if (!noteBase64) return null;
  try {
    const noteJson = atob(noteBase64);
    const note = JSON.parse(noteJson);
    if (note.standard === 'arc69') {
      return note as ARC69Note;
    }
    return null;
  } catch {
    return null;
  }
}

// Check if an asset is a Satchel badge
function isSatchelBadge(asset: SatchelAssetParams): boolean {
  const params = asset.params;
  
  // Check if it's in the Satchel collection
  if (SATCHEL_COLLECTION_IDS.length > 0 && SATCHEL_COLLECTION_IDS.includes(asset.id)) {
    return true;
  }
  
  // Check ARC69 note for Satchel-specific fields
  if (params.note) {
    const noteBase64 = Buffer.from(params.note).toString('base64');
    const arc69 = parseARC69Note(noteBase64);
    if (arc69 && (arc69.badge_id || arc69.issuer)) {
      return true;
    }
  }
  
  // Check URL for Satchel indicator (common pattern)
  if (params.url && params.url.includes('satchel')) {
    return true;
  }
  
  return false;
}

// Extract badge from asset
async function extractBadgeFromAsset(
  asset: SatchelAssetParams,
  accountAddress: string
): Promise<Badge | null> {
  const params = asset.params;
  
  // Parse ARC69 note
  let arc69: ARC69Note | null = null;
  if (params.note) {
    const noteBase64 = Buffer.from(params.note).toString('base64');
    arc69 = parseARC69Note(noteBase64);
  }
  
  // Determine badge data
  const name = arc69?.properties?.name as string || 
               params.name as string || 
               params['unit-name'] as string || 
               `Badge #${asset.id}`;
  
  const description = arc69?.description || 
                     arc69?.properties?.description as string || 
                     `Badge ID: ${asset.id}`;
  
  const image = arc69?.image || 
               arc69?.external_url || 
               params.url || 
               `https://via.placeholder.com/400x400/6b7280/ffffff?text=${encodeURIComponent(name)}`;
  
  const issuer = arc69?.issuer || 
                arc69?.properties?.issuer as string || 
                params.creator;
  
  const earnedAt = arc69?.earned_at || 
                   arc69?.properties?.earned_at as string || 
                   new Date().toISOString();
  
  const ipfsHash = arc69?.properties?.ipfs_hash as string;
  
  return {
    id: asset.id,
    name,
    description,
    image,
    issuer,
    earnedAt,
    ipfsHash,
  };
}

// Fetch account assets from Algorand indexer
async function fetchAccountAssets(address: string): Promise<number[]> {
  const response = await fetch(
    `${ALGORAND_INDEXER_URL}/v2/accounts/${address}/assets?asset-id=0&exclude-deleted=true&include-all=false`,
    {
      headers: {
        'Accept': 'application/json',
      },
    }
  );
  
  if (!response.ok) {
    throw new Error(`Failed to fetch assets: ${response.statusText}`);
  }
  
  const data = await response.json();
  // Filter to only assets where the account has a balance > 0 (holds the asset)
  return data.assets
    .filter((asset: { amount: number; 'is-frozen': boolean }) => asset.amount > 0 && !asset['is-frozen'])
    .map((asset: { 'asset-id': number }) => asset['asset-id']);
}

// Fetch asset info from Algorand indexer
async function fetchAssetInfo(assetId: number): Promise<SatchelAssetParams | null> {
  const response = await fetch(
    `${ALGORAND_INDEXER_URL}/v2/assets/${assetId}`,
    {
      headers: {
        'Accept': 'application/json',
      },
    }
  );
  
  if (!response.ok) {
    return null;
  }
  
  const data = await response.json();
  return data.asset as SatchelAssetParams;
}

// BadgeCard component
function BadgeCard({ badge }: { badge: Badge }) {
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };
  
  const shortAddress = (addr: string) => {
    if (addr.length <= 16) return addr;
    return `${addr.slice(0, 8)}...${addr.slice(-8)}`;
  };
  
  return (
    <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden hover:border-cyan-500/50 transition-colors">
      <div className="aspect-square bg-gray-700 relative">
        <img
          src={badge.image}
          alt={badge.name}
          className="w-full h-full object-cover"
          onError={(e) => {
            (e.target as HTMLImageElement).src = `https://via.placeholder.com/400x400/6b7280/ffffff?text=${encodeURIComponent(badge.name)}`;
          }}
        />
      </div>
      <div className="p-4">
        <h3 className="font-semibold text-lg mb-1 truncate" title={badge.name}>
          {badge.name}
        </h3>
        <p className="text-gray-400 text-sm mb-3 line-clamp-2" title={badge.description}>
          {badge.description}
        </p>
        <div className="space-y-1 text-xs text-gray-500">
          <div className="flex justify-between">
            <span className="font-medium text-gray-400">Issuer:</span>
            <span className="font-mono" title={badge.issuer}>
              {shortAddress(badge.issuer)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="font-medium text-gray-400">Earned:</span>
            <span>{formatDate(badge.earnedAt)}</span>
          </div>
          <div className="flex justify-between">
            <span className="font-medium text-gray-400">ASA ID:</span>
            <span className="font-mono">{badge.id.toLocaleString()}</span>
          </div>
          {badge.ipfsHash && (
            <div className="flex justify-between">
              <span className="font-medium text-gray-400">IPFS:</span>
              <span className="font-mono truncate max-w-[120px]" title={badge.ipfsHash}>
                {badge.ipfsHash.slice(0, 12)}...
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Loading skeleton for badge cards
function BadgeCardSkeleton() {
  return (
    <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden animate-pulse">
      <div className="aspect-square bg-gray-700" />
      <div className="p-4 space-y-3">
        <div className="h-5 bg-gray-700 rounded w-3/4" />
        <div className="space-y-2">
          <div className="h-3 bg-gray-700 rounded" />
          <div className="h-3 bg-gray-700 rounded w-2/3" />
        </div>
        <div className="pt-2 space-y-2">
          <div className="h-3 bg-gray-700 rounded w-1/2" />
          <div className="h-3 bg-gray-700 rounded w-1/3" />
        </div>
      </div>
    </div>
  );
}

// Empty state component
function EmptyState({ hasWallet }: { hasWallet: boolean }) {
  return (
    <div className="text-center py-16">
      <div className="text-6xl mb-4">🎒</div>
      <h3 className="text-xl font-semibold mb-2">
        {hasWallet ? 'No Badges Yet' : 'Connect Your Wallet'}
      </h3>
      <p className="text-gray-400 max-w-md mx-auto">
        {hasWallet 
          ? "You haven't earned any Satchel badges yet. Complete criteria or receive badges through webhook integrations to see them here."
          : "Connect your Algorand wallet to view your Satchel badges. Badges are NFT credentials that unlock features across Satchel-compatible apps."}
      </p>
    </div>
  );
}

// Filter bar component
function FilterBar({
  filters,
  onFiltersChange,
  issuers,
}: {
  filters: BadgeFilterState;
  onFiltersChange: (filters: BadgeFilterState) => void;
  issuers: string[];
}) {
  return (
    <div className="flex flex-wrap gap-4 mb-6 items-center">
      {/* Search */}
      <div className="flex-1 min-w-[200px]">
        <input
          type="text"
          placeholder="Search badges..."
          value={filters.searchQuery}
          onChange={(e) => onFiltersChange({ ...filters, searchQuery: e.target.value })}
          className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500"
        />
      </div>
      
      {/* Issuer filter */}
      {issuers.length > 1 && (
        <select
          value={filters.selectedIssuer || 'all'}
          onChange={(e) => onFiltersChange({ ...filters, selectedIssuer: e.target.value === 'all' ? null : e.target.value })}
          className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-cyan-500"
        >
          <option value="all">All Issuers</option>
          {issuers.map((issuer) => (
            <option key={issuer} value={issuer}>
              {issuer.slice(0, 8)}...{issuer.slice(-8)}
            </option>
          ))}
        </select>
      )}
      
      {/* Sort */}
      <select
        value={filters.sortBy}
        onChange={(e) => onFiltersChange({ ...filters, sortBy: e.target.value as BadgeSortOption })}
        className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-cyan-500"
      >
        <option value="date_desc">Newest First</option>
        <option value="date_asc">Oldest First</option>
        <option value="name_asc">Name (A-Z)</option>
        <option value="name_desc">Name (Z-A)</option>
        <option value="issuer">By Issuer</option>
      </select>
    </div>
  );
}

// Main MySatchel component
export function MySatchel() {
  const { address, isConnected } = useWallet();
  const [badges, setBadges] = useState<Badge[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [useDemoData, setUseDemoData] = useState(false);
  const [filters, setFilters] = useState<BadgeFilterState>({
    sortBy: 'date_desc',
    filterBy: 'all',
    searchQuery: '',
    selectedIssuer: null,
  });
  
  // Fetch badges when wallet is connected
  useEffect(() => {
    if (!isConnected || !address) {
      setBadges([]);
      setUseDemoData(false);
      return;
    }
    
    const fetchBadges = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // Fetch all assets owned by the account
        const assetIds = await fetchAccountAssets(address);
        
        if (assetIds.length === 0) {
          // No assets, show demo data for testing
          setBadges(SAMPLE_BADGES);
          setUseDemoData(true);
          setIsLoading(false);
          return;
        }
        
        // Fetch asset info and filter for Satchel badges
        const satchelBadges: Badge[] = [];
        
        for (const assetId of assetIds) {
          try {
            const assetInfo = await fetchAssetInfo(assetId);
            if (assetInfo && isSatchelBadge(assetInfo)) {
              const badge = await extractBadgeFromAsset(assetInfo, address);
              if (badge) {
                satchelBadges.push(badge);
              }
            }
          } catch (err) {
            console.warn(`Failed to fetch asset ${assetId}:`, err);
          }
        }
        
        if (satchelBadges.length === 0) {
          // No Satchel badges found, show demo data for testing
          setBadges(SAMPLE_BADGES);
          setUseDemoData(true);
        } else {
          setBadges(satchelBadges);
          setUseDemoData(false);
        }
      } catch (err) {
        console.error('Failed to fetch badges:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch badges');
        // Show demo data on error for testing
        setBadges(SAMPLE_BADGES);
        setUseDemoData(true);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchBadges();
  }, [isConnected, address]);
  
  // Get unique issuers for filter
  const uniqueIssuers = useMemo(() => {
    const issuers = new Set(badges.map((b) => b.issuer));
    return Array.from(issuers);
  }, [badges]);
  
  // Filter and sort badges
  const filteredBadges = useMemo(() => {
    let result = [...badges];
    
    // Search filter
    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase();
      result = result.filter(
        (badge) =>
          badge.name.toLowerCase().includes(query) ||
          badge.description.toLowerCase().includes(query)
      );
    }
    
    // Issuer filter
    if (filters.selectedIssuer) {
      result = result.filter((badge) => badge.issuer === filters.selectedIssuer);
    }
    
    // Sort
    switch (filters.sortBy) {
      case 'date_desc':
        result.sort((a, b) => new Date(b.earnedAt).getTime() - new Date(a.earnedAt).getTime());
        break;
      case 'date_asc':
        result.sort((a, b) => new Date(a.earnedAt).getTime() - new Date(b.earnedAt).getTime());
        break;
      case 'name_asc':
        result.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'name_desc':
        result.sort((a, b) => b.name.localeCompare(a.name));
        break;
      case 'issuer':
        result.sort((a, b) => a.issuer.localeCompare(b.issuer));
        break;
    }
    
    return result;
  }, [badges, filters]);
  
  if (!isConnected) {
    return (
      <div className="py-12">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold mb-2">My Satchel</h2>
          <p className="text-gray-400">Connect your wallet to view your earned badges</p>
        </div>
        <EmptyState hasWallet={false} />
      </div>
    );
  }
  
  return (
    <div className="py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-3xl font-bold mb-1">My Satchel</h2>
          <p className="text-gray-400">
            {address && (
              <span className="font-mono text-sm">
                {address.slice(0, 8)}...{address.slice(-8)}
              </span>
            )}
          </p>
        </div>
        {useDemoData && (
          <div className="px-3 py-1 bg-amber-600/20 border border-amber-600 rounded-full text-amber-400 text-sm">
            Demo Data
          </div>
        )}
      </div>
      
      {error && (
        <div className="mb-6 p-4 bg-red-900/50 border border-red-600 rounded-lg text-red-200">
          <p className="font-medium">Error loading badges</p>
          <p className="text-sm">{error}</p>
        </div>
      )}
      
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <BadgeCardSkeleton key={i} />
          ))}
        </div>
      ) : filteredBadges.length === 0 ? (
        <EmptyState hasWallet={true} />
      ) : (
        <>
          <FilterBar
            filters={filters}
            onFiltersChange={setFilters}
            issuers={uniqueIssuers}
          />
          
          {useDemoData && (
            <div className="mb-6 p-4 bg-amber-900/30 border border-amber-600 rounded-lg text-amber-200 text-sm">
              <p className="font-medium mb-1">ℹ️ Demo Mode</p>
              <p>
                Showing sample badges because no real Satchel badges were found in your wallet. 
                Connect the Satchel app to your wallet to receive real badges.
              </p>
            </div>
          )}
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredBadges.map((badge) => (
              <BadgeCard key={badge.id} badge={badge} />
            ))}
          </div>
          
          <div className="mt-6 text-center text-gray-500 text-sm">
            Showing {filteredBadges.length} of {badges.length} badges
          </div>
        </>
      )}
    </div>
  );
}

export default MySatchel;
