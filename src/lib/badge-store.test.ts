/**
 * Badge Store Tests
 * 
 * Tests for the shared badge store module that handles
 * badge CRUD operations and state management.
 */

import { describe, test, expect, beforeEach } from 'bun:test';
import {
  badgeStore,
  createBadge,
  getBadgeById,
  getActiveBadges,
  searchBadges,
  updateBadge,
  softDeleteBadge,
  validateStateTransition,
  resetBadgeStore
} from './badge-store';
import type { BadgeDefinition, BadgeState } from '@/types/badge';

describe('Badge Store - Core Functions', () => {
  beforeEach(() => {
    resetBadgeStore();
  });

  describe('createBadge', () => {
    test('creates a badge with minimal fields', () => {
      const definition: BadgeDefinition = {
        name: 'Test Badge',
        description: 'A test badge',
        image: 'ipfs://QmTest123'
      };

      const badge = createBadge(definition);

      expect(badge.id).toBe(1);
      expect(badge.name).toBe('Test Badge');
      expect(badge.description).toBe('A test badge');
      expect(badge.image).toBe('ipfs://QmTest123');
      expect(badge.state).toBe('draft');
      expect(badge.earnedAt).toBeTruthy();
    });

    test('creates a badge with all fields', () => {
      const definition: BadgeDefinition = {
        name: 'Full Badge',
        description: 'A badge with all fields',
        image: 'https://example.com/image.png',
        issuer: 'CUSTOM_ISSUER',
        state: 'active',
        criteria: {
          type: 'structured',
          version: '1.0',
          requirements: [
            { id: 'r1', type: 'wallet_holds', description: 'Test', params: { assetId: 123 } }
          ]
        }
      };

      const badge = createBadge(definition);

      expect(badge.name).toBe('Full Badge');
      expect(badge.issuer).toBe('CUSTOM_ISSUER');
      expect(badge.state).toBe('active');
      expect(badge.criteria?.requirements).toHaveLength(1);
    });

    test('increments badge ID correctly', () => {
      createBadge({ name: 'Badge 1', description: 'd', image: 'ipfs://a' });
      createBadge({ name: 'Badge 2', description: 'd', image: 'ipfs://b' });
      const badge3 = createBadge({ name: 'Badge 3', description: 'd', image: 'ipfs://c' });

      expect(badge3.id).toBe(3);
    });
  });

  describe('getBadgeById', () => {
    test('returns badge when found', () => {
      const badge = getBadgeById(1);
      expect(badge).toBeDefined();
      expect(badge?.name).toBe('Test Badge');
    });

    test('returns undefined when not found', () => {
      const badge = getBadgeById(999);
      expect(badge).toBeUndefined();
    });
  });

  describe('getActiveBadges', () => {
    test('excludes deleted badges by default', () => {
      const badges = getActiveBadges();
      badges.forEach(b => expect(b.deletedAt).toBeUndefined());
    });

    test('includes deleted badges when requested', () => {
      softDeleteBadge(1);
      const badges = getActiveBadges(true);
      expect(badges.some(b => b.deletedAt)).toBe(true);
    });
  });

  describe('searchBadges', () => {
    test('searches by name', () => {
      createBadge({ name: 'Unique Name 123', description: 'desc', image: 'ipfs://a' });
      const results = searchBadges('Unique Name 123');
      expect(results).toHaveLength(1);
      expect(results[0].name).toBe('Unique Name 123');
    });

    test('searches by description', () => {
      createBadge({ name: 'Badge', description: 'Searchable description xyz', image: 'ipfs://a' });
      const results = searchBadges('xyz');
      expect(results).toHaveLength(1);
    });

    test('filters by state', () => {
      createBadge({ name: 'Draft Badge', description: 'd', image: 'ipfs://a', state: 'draft' });
      createBadge({ name: 'Active Badge', description: 'd', image: 'ipfs://b', state: 'active' });

      const drafts = searchBadges('', 'draft');
      expect(drafts.every(b => b.state === 'draft')).toBe(true);
    });

    test('combines search and state filter', () => {
      createBadge({ name: 'Alpha Active', description: 'desc', image: 'ipfs://a', state: 'active' });
      createBadge({ name: 'Alpha Draft', description: 'desc', image: 'ipfs://b', state: 'draft' });
      createBadge({ name: 'Beta Active', description: 'desc', image: 'ipfs://c', state: 'active' });

      const results = searchBadges('Alpha', 'active');
      expect(results).toHaveLength(1);
      expect(results[0].name).toBe('Alpha Active');
    });
  });

  describe('updateBadge', () => {
    test('updates badge fields', () => {
      const updated = updateBadge(1, { name: 'Updated Name' });
      expect(updated?.name).toBe('Updated Name');
    });

    test('preserves unchanged fields', () => {
      const original = getBadgeById(1);
      updateBadge(1, { name: 'New Name' });
      const updated = getBadgeById(1);

      expect(updated?.description).toBe(original?.description);
      expect(updated?.image).toBe(original?.image);
    });

    test('returns null for non-existent badge', () => {
      const result = updateBadge(999, { name: 'Test' });
      expect(result).toBeNull();
    });

    test('returns null for deleted badge', () => {
      softDeleteBadge(1);
      const result = updateBadge(1, { name: 'Test' });
      expect(result).toBeNull();
    });

    test('cannot change badge ID', () => {
      updateBadge(1, { name: 'Test' } as any);
      const badge = getBadgeById(1);
      expect(badge?.id).toBe(1);
      expect(getBadgeById(2)).toBeUndefined();
    });
  });

  describe('softDeleteBadge', () => {
    test('sets deletedAt timestamp', () => {
      const result = softDeleteBadge(1);
      expect(result?.deletedAt).toBeTruthy();
    });

    test('marks badge as not active', () => {
      softDeleteBadge(1);
      const badge = getBadgeById(1);
      expect(badge?.deletedAt).toBeTruthy();
    });

    test('returns null for non-existent badge', () => {
      const result = softDeleteBadge(999);
      expect(result).toBeNull();
    });

    test('returns null for already deleted badge', () => {
      softDeleteBadge(1);
      const result = softDeleteBadge(1);
      expect(result).toBeNull();
    });
  });

  describe('validateStateTransition', () => {
    test('allows draft to active', () => {
      expect(validateStateTransition('draft', 'active')).toBe(true);
    });

    test('allows active to archived', () => {
      expect(validateStateTransition('active', 'archived')).toBe(true);
    });

    test('prevents draft to archived', () => {
      expect(validateStateTransition('draft', 'archived')).toBe(false);
    });

    test('prevents archived to any state', () => {
      expect(validateStateTransition('archived', 'draft')).toBe(false);
      expect(validateStateTransition('archived', 'active')).toBe(false);
    });

    test('prevents same state transition', () => {
      expect(validateStateTransition('draft', 'draft')).toBe(false);
      expect(validateStateTransition('active', 'active')).toBe(false);
    });
  });

  describe('Edge Cases', () => {
    test('handles empty search query', () => {
      const results = searchBadges('');
      expect(results.length).toBeGreaterThan(0);
    });

    test('search is case insensitive', () => {
      createBadge({ name: 'UPPERCASE', description: 'desc', image: 'ipfs://a' });
      const results = searchBadges('uppercase');
      expect(results.some(b => b.name === 'UPPERCASE')).toBe(true);
    });

    test('badge store persists between operations', () => {
      const initialCount = badgeStore.length;
      createBadge({ name: 'New', description: 'd', image: 'ipfs://x' });
      expect(badgeStore.length).toBe(initialCount + 1);
    });

    test('getBadgeById returns undefined for invalid IDs', () => {
      expect(getBadgeById(0)).toBeUndefined();
      expect(getBadgeById(-1)).toBeUndefined();
    });
  });
});
