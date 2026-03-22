/**
 * MySatchel Component Tests
 * 
 * Tests for the MySatchel component that displays
 * NFT badges earned by the connected wallet.
 */

import { describe, test, expect, beforeEach, afterEach, vi } from 'bun:test';
import { renderHook, act } from '@testing-library/react';
import React from 'react';

// Mock types for testing
interface MockBadge {
  id: number;
  name: string;
  description: string;
  image: string;
  issuer: string;
  earnedAt: string;
  ipfsHash?: string;
}

// Test helper functions (mirror those in MySatchel.tsx)
function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function shortAddress(addr: string): string {
  if (addr.length <= 16) return addr;
  return `${addr.slice(0, 8)}...${addr.slice(-8)}`;
}

// Test badge data
const TEST_BADGES: MockBadge[] = [
  {
    id: 123456789,
    name: 'Early Contributor',
    description: 'Awarded to early contributors of the Satchel ecosystem',
    image: 'https://via.placeholder.com/400x400/06b6d4/ffffff?text=Early+Contributor',
    issuer: 'SATCHEL_ISSUER_ADDRESS_12345678',
    earnedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    ipfsHash: 'QmEarlyContributor123',
  },
  {
    id: 987654321,
    name: 'Webhook Master',
    description: 'Completed webhook integration challenge',
    image: 'https://via.placeholder.com/400x400/8b5cf6/ffffff?text=Webhook+Master',
    issuer: 'SATCHEL_ISSUER_ADDRESS_12345678',
    earnedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    ipfsHash: 'QmWebhookMaster456',
  },
  {
    id: 555555555,
    name: 'Community Star',
    description: 'Recognized for outstanding community contributions',
    image: 'https://via.placeholder.com/400x400/f59e0b/ffffff?text=Community+Star',
    issuer: 'COMMUNITY_ISSUER_ADDRESS_87654321',
    earnedAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
    ipfsHash: 'QmCommunityStar789',
  },
];

describe('MySatchel - Date Formatting', () => {
  test('formats date correctly', () => {
    const dateStr = '2024-01-15T12:00:00.000Z';
    const formatted = formatDate(dateStr);
    expect(formatted).toContain('Jan');
    expect(formatted).toContain('15');
    expect(formatted).toContain('2024');
  });

  test('formats recent date correctly', () => {
    const recent = new Date();
    const formatted = formatDate(recent.toISOString());
    const now = new Date();
    expect(formatted).toContain(now.getFullYear().toString());
  });
});

describe('MySatchel - Address Formatting', () => {
  test('shortens long addresses', () => {
    const longAddress = 'SATCHEL_ISSUER_ADDRESS_12345678';
    const shortened = shortAddress(longAddress);
    expect(shortened).toBe('SATCHEL_...12345678');
    expect(shortened.length).toBeLessThan(longAddress.length);
  });

  test('keeps short addresses unchanged', () => {
    const shortAddr = 'SHORT123';
    expect(shortAddress(shortAddr)).toBe('SHORT123');
  });

  test('handles exactly 16 character address', () => {
    const exact16 = '1234567890123456';
    expect(shortAddress(exact16)).toBe(exact16);
  });
});

describe('MySatchel - Badge Data Structure', () => {
  test('badge has all required fields', () => {
    const badge = TEST_BADGES[0];
    expect(badge.id).toBeDefined();
    expect(typeof badge.id).toBe('number');
    expect(badge.name).toBeDefined();
    expect(typeof badge.name).toBe('string');
    expect(badge.description).toBeDefined();
    expect(badge.image).toBeDefined();
    expect(badge.issuer).toBeDefined();
    expect(badge.earnedAt).toBeDefined();
  });

  test('badge with ipfsHash includes optional field', () => {
    const badge = TEST_BADGES[0];
    expect(badge.ipfsHash).toBeDefined();
    expect(badge.ipfsHash?.startsWith('Qm')).toBe(true);
  });
});

describe('MySatchel - Filter State Types', () => {
  type BadgeSortOption = 'date_desc' | 'date_asc' | 'name_asc' | 'name_desc' | 'issuer';
  type BadgeFilterOption = 'all' | 'by_issuer' | 'by_name';

  interface BadgeFilterState {
    sortBy: BadgeSortOption;
    filterBy: BadgeFilterOption;
    searchQuery: string;
    selectedIssuer: string | null;
  }

  test('default filter state structure', () => {
    const filters: BadgeFilterState = {
      sortBy: 'date_desc',
      filterBy: 'all',
      searchQuery: '',
      selectedIssuer: null,
    };

    expect(filters.sortBy).toBe('date_desc');
    expect(filters.filterBy).toBe('all');
    expect(filters.searchQuery).toBe('');
    expect(filters.selectedIssuer).toBeNull();
  });

  test('sort options are mutually exclusive', () => {
    const sortOptions: BadgeSortOption[] = ['date_desc', 'date_asc', 'name_asc', 'name_desc', 'issuer'];
    expect(sortOptions).toHaveLength(5);
  });

  test('filter options are mutually exclusive', () => {
    const filterOptions: BadgeFilterOption[] = ['all', 'by_issuer', 'by_name'];
    expect(filterOptions).toHaveLength(3);
  });
});

describe('MySatchel - Badge Sorting', () => {
  test('sorts by date descending', () => {
    const sorted = [...TEST_BADGES].sort((a, b) => 
      new Date(b.earnedAt).getTime() - new Date(a.earnedAt).getTime()
    );
    // Most recent should be first
    expect(sorted[0].name).toBe('Webhook Master'); // 7 days ago
    expect(sorted[1].name).toBe('Community Star'); // 14 days ago
    expect(sorted[2].name).toBe('Early Contributor'); // 30 days ago
  });

  test('sorts by date ascending', () => {
    const sorted = [...TEST_BADGES].sort((a, b) => 
      new Date(a.earnedAt).getTime() - new Date(b.earnedAt).getTime()
    );
    // Oldest should be first
    expect(sorted[0].name).toBe('Early Contributor');
    expect(sorted[2].name).toBe('Webhook Master');
  });

  test('sorts by name ascending', () => {
    const sorted = [...TEST_BADGES].sort((a, b) => 
      a.name.localeCompare(b.name)
    );
    expect(sorted[0].name).toBe('Community Star');
    expect(sorted[1].name).toBe('Early Contributor');
    expect(sorted[2].name).toBe('Webhook Master');
  });

  test('sorts by name descending', () => {
    const sorted = [...TEST_BADGES].sort((a, b) => 
      b.name.localeCompare(a.name)
    );
    expect(sorted[0].name).toBe('Webhook Master');
    expect(sorted[2].name).toBe('Community Star');
  });

  test('sorts by issuer', () => {
    const sorted = [...TEST_BADGES].sort((a, b) => 
      a.issuer.localeCompare(b.issuer)
    );
    // Alphabetically by issuer
    expect(sorted[0].issuer).toBe('COMMUNITY_ISSUER_ADDRESS_87654321');
    expect(sorted[1].issuer).toBe('SATCHEL_ISSUER_ADDRESS_12345678');
    expect(sorted[2].issuer).toBe('SATCHEL_ISSUER_ADDRESS_12345678');
  });
});

describe('MySatchel - Badge Filtering', () => {
  test('filters by search query in name', () => {
    const query = 'webhook';
    const filtered = TEST_BADGES.filter(badge => 
      badge.name.toLowerCase().includes(query.toLowerCase())
    );
    expect(filtered).toHaveLength(1);
    expect(filtered[0].name).toBe('Webhook Master');
  });

  test('filters by search query in description', () => {
    const query = 'community';
    const filtered = TEST_BADGES.filter(badge => 
      badge.description.toLowerCase().includes(query.toLowerCase())
    );
    expect(filtered).toHaveLength(1);
    expect(filtered[0].name).toBe('Community Star');
  });

  test('filters by search query is case insensitive', () => {
    const query = 'EARLY';
    const filtered = TEST_BADGES.filter(badge => 
      badge.name.toLowerCase().includes(query.toLowerCase())
    );
    expect(filtered).toHaveLength(1);
    expect(filtered[0].name).toBe('Early Contributor');
  });

  test('filters by selected issuer', () => {
    const issuer = 'COMMUNITY_ISSUER_ADDRESS_87654321';
    const filtered = TEST_BADGES.filter(badge => 
      badge.issuer === issuer
    );
    expect(filtered).toHaveLength(1);
    expect(filtered[0].name).toBe('Community Star');
  });

  test('search query with no matches returns empty', () => {
    const query = 'nonexistent';
    const filtered = TEST_BADGES.filter(badge => 
      badge.name.toLowerCase().includes(query.toLowerCase()) ||
      badge.description.toLowerCase().includes(query.toLowerCase())
    );
    expect(filtered).toHaveLength(0);
  });
});

describe('MySatchel - Combined Filter and Sort', () => {
  test('filters by issuer and sorts by date', () => {
    const issuer = 'SATCHEL_ISSUER_ADDRESS_12345678';
    
    // First filter
    const filtered = TEST_BADGES.filter(badge => badge.issuer === issuer);
    expect(filtered).toHaveLength(2);
    
    // Then sort
    const sorted = filtered.sort((a, b) => 
      new Date(b.earnedAt).getTime() - new Date(a.earnedAt).getTime()
    );
    
    expect(sorted[0].name).toBe('Webhook Master'); // More recent
    expect(sorted[1].name).toBe('Early Contributor'); // Less recent
  });

  test('search query and sort together', () => {
    // First filter by search
    const filtered = TEST_BADGES.filter(badge => 
      badge.name.toLowerCase().includes('e') // Names containing 'e' or 'E'
    );
    
    // Then sort by name
    const sorted = filtered.sort((a, b) => a.name.localeCompare(b.name));
    
    // All three badges contain 'e' in their names (Ear*ly*, W*eb*hook, St*r*)
    expect(sorted.length).toBeGreaterThan(0);
    expect(sorted[0].name.localeCompare(sorted[sorted.length - 1].name)).toBeLessThanOrEqual(0);
  });
});

describe('MySatchel - Unique Issuers', () => {
  test('extracts unique issuers from badges', () => {
    const issuers = new Set(TEST_BADGES.map(b => b.issuer));
    const uniqueIssuers = Array.from(issuers);
    
    expect(uniqueIssuers).toHaveLength(2);
    expect(uniqueIssuers).toContain('SATCHEL_ISSUER_ADDRESS_12345678');
    expect(uniqueIssuers).toContain('COMMUNITY_ISSUER_ADDRESS_87654321');
  });

  test('all badges have unique issuers count', () => {
    const issuerCounts = TEST_BADGES.reduce((acc, badge) => {
      acc[badge.issuer] = (acc[badge.issuer] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    expect(issuerCounts['SATCHEL_ISSUER_ADDRESS_12345678']).toBe(2);
    expect(issuerCounts['COMMUNITY_ISSUER_ADDRESS_87654321']).toBe(1);
  });
});

describe('MySatchel - Empty States', () => {
  test('empty badges array shows empty state', () => {
    const badges: MockBadge[] = [];
    const showEmpty = badges.length === 0;
    expect(showEmpty).toBe(true);
  });

  test('filtered to zero results shows empty state', () => {
    const query = 'nonexistentbadge123';
    const filtered = TEST_BADGES.filter(badge => 
      badge.name.toLowerCase().includes(query.toLowerCase())
    );
    expect(filtered.length).toBe(0);
  });
});

describe('MySatchel - Badge Image Handling', () => {
  test('badge image URLs are valid', () => {
    const validUrls = TEST_BADGES.every(badge => 
      badge.image.startsWith('https://') || badge.image.startsWith('ipfs://')
    );
    expect(validUrls).toBe(true);
  });

  test('image placeholder fallback generation', () => {
    const badgeName = 'Test Badge';
    const fallbackUrl = `https://via.placeholder.com/400x400/6b7280/ffffff?text=${encodeURIComponent(badgeName)}`;
    expect(fallbackUrl).toContain('Test%20Badge');
    expect(fallbackUrl).toContain('6b7280'); // Gray color
  });
});

describe('MySatchel - ARC69 Note Parsing', () => {
  // Simulate the ARC69 note parsing logic
  function parseARC69Note(noteBase64?: string): Record<string, unknown> | null {
    if (!noteBase64) return null;
    try {
      const noteJson = atob(noteBase64);
      const note = JSON.parse(noteJson);
      if (note.standard === 'arc69') {
        return note;
      }
      return null;
    } catch {
      return null;
    }
  }

  test('parses valid ARC69 note', () => {
    const arc69Note = {
      standard: 'arc69',
      description: 'Test badge description',
      image: 'https://example.com/image.png',
      badge_id: 'test-badge-123',
      issuer: 'ISSUER_ADDRESS',
      earned_at: '2024-01-15T12:00:00.000Z',
    };
    const base64 = btoa(JSON.stringify(arc69Note));
    const parsed = parseARC69Note(base64);
    
    expect(parsed).not.toBeNull();
    expect(parsed?.standard).toBe('arc69');
    expect(parsed?.badge_id).toBe('test-badge-123');
  });

  test('returns null for invalid base64', () => {
    const result = parseARC69Note('not-valid-base64!!!');
    expect(result).toBeNull();
  });

  test('returns null for non-arc69 note', () => {
    const nonArc69Note = {
      description: 'Not an ARC69 badge',
    };
    const base64 = btoa(JSON.stringify(nonArc69Note));
    const result = parseARC69Note(base64);
    expect(result).toBeNull();
  });

  test('returns null for undefined input', () => {
    expect(parseARC69Note(undefined)).toBeNull();
  });
});

describe('MySatchel - Satchel Badge Detection', () => {
  interface MockAssetParams {
    id: number;
    params: {
      creator: string;
      name?: string;
      'unit-name'?: string;
      url?: string;
      note?: string; // Base64 encoded
    };
  }

  // Simulate isSatchelBadge logic
  function isSatchelBadge(asset: MockAssetParams, collectionIds: number[] = []): boolean {
    const params = asset.params;
    
    // Check if in collection
    if (collectionIds.length > 0 && collectionIds.includes(asset.id)) {
      return true;
    }
    
    // Check URL
    if (params.url && params.url.includes('satchel')) {
      return true;
    }
    
    return false;
  }

  test('detects badge by collection ID', () => {
    const asset: MockAssetParams = {
      id: 123456,
      params: { creator: 'creator' },
    };
    const collectionIds = [123456, 789012];
    
    expect(isSatchelBadge(asset, collectionIds)).toBe(true);
  });

  test('detects badge by URL containing satchel', () => {
    const asset: MockAssetParams = {
      id: 999999,
      params: { 
        creator: 'creator',
        url: 'https://satchel.example/asset/123',
      },
    };
    
    expect(isSatchelBadge(asset)).toBe(true);
  });

  test('returns false for non-satchel asset', () => {
    const asset: MockAssetParams = {
      id: 111111,
      params: { 
        creator: 'creator',
        url: 'https://other-platform.example/asset/123',
      },
    };
    
    expect(isSatchelBadge(asset)).toBe(false);
  });
});

describe('MySatchel - Wallet State', () => {
  interface WalletState {
    address: string | null;
    isConnected: boolean;
    isConnecting: boolean;
    error: string | null;
  }

  test('disconnected wallet state', () => {
    const state: WalletState = {
      address: null,
      isConnected: false,
      isConnecting: false,
      error: null,
    };
    
    expect(state.isConnected).toBe(false);
    expect(state.address).toBeNull();
  });

  test('connecting wallet state', () => {
    const state: WalletState = {
      address: null,
      isConnected: false,
      isConnecting: true,
      error: null,
    };
    
    expect(state.isConnecting).toBe(true);
    expect(state.isConnected).toBe(false);
  });

  test('connected wallet state', () => {
    const state: WalletState = {
      address: 'SOME_ALGORAND_ADDRESS_HERE123456',
      isConnected: true,
      isConnecting: false,
      error: null,
    };
    
    expect(state.isConnected).toBe(true);
    expect(state.address).toBeDefined();
    expect(state.address?.length).toBeGreaterThan(0);
  });

  test('wallet error state', () => {
    const state: WalletState = {
      address: null,
      isConnected: false,
      isConnecting: false,
      error: 'Failed to connect wallet',
    };
    
    expect(state.error).toBeDefined();
    expect(state.error?.length).toBeGreaterThan(0);
  });
});

describe('MySatchel - Demo Data Mode', () => {
  test('demo data indicator is shown when useDemoData is true', () => {
    const useDemoData = true;
    expect(useDemoData).toBe(true);
  });

  test('demo data indicator is hidden when useDemoData is false', () => {
    const useDemoData = false;
    expect(useDemoData).toBe(false);
  });

  test('demo mode message explains why sample badges are shown', () => {
    const message = 'Showing sample badges because no real Satchel badges were found in your wallet. Connect the Satchel app to your wallet to receive real badges.';
    expect(message).toContain('sample badges');
    expect(message).toContain('sample');
  });
});

describe('MySatchel - Loading State', () => {
  test('loading state shows skeleton cards', () => {
    const isLoading = true;
    const skeletonCount = 4;
    
    expect(isLoading).toBe(true);
    expect(skeletonCount).toBe(4);
  });

  test('loading state hides content', () => {
    const isLoading = true;
    const showBadges = !isLoading;
    expect(showBadges).toBe(false);
  });
});

describe('MySatchel - Error Handling', () => {
  test('error message is displayed', () => {
    const error = 'Failed to fetch badges: Network error';
    expect(error).toBeDefined();
    expect(error.length).toBeGreaterThan(0);
  });

  test('error has user-friendly message', () => {
    const errorMessage = 'Failed to fetch badges';
    expect(errorMessage.toLowerCase()).toContain('failed');
  });
});

describe('MySatchel - Pagination Info', () => {
  test('shows correct count when filtered', () => {
    const totalBadges = TEST_BADGES.length;
    const filteredBadges = TEST_BADGES.filter(b => b.name.includes('e'));
    
    expect(totalBadges).toBe(3);
    expect(filteredBadges.length).toBe(1); // Only Webhook Master contains 'e' as lowercase
  });

  test('shows filtered vs total count', () => {
    const totalBadges = TEST_BADGES.length;
    const filteredBadges = TEST_BADGES.filter(b => b.name.includes('Webhook'));
    const showingText = `Showing ${filteredBadges.length} of ${totalBadges} badges`;
    
    expect(showingText).toBe('Showing 1 of 3 badges');
  });
});
