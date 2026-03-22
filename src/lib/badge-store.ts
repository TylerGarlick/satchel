// Shared in-memory store for badges
// In production, replace with database

import type { Badge, BadgeDefinition, BadgeState } from '@/types/badge';

export const badgeStore: Badge[] = [
  {
    id: 1,
    name: 'Early Adopter',
    description: 'Awarded to the first 100 users who joined Satchel',
    image: 'ipfs://QmX8AdLpQsMRXm5U5eYqP8xT4vZ9wQ7yX3kN2mR6tL9jA',
    issuer: 'SATCHEL_ISSUER_ADDRESS',
    earnedAt: new Date().toISOString(),
    state: 'active',
    criteria: {
      type: 'structured',
      version: '1.0',
      requirements: [
        {
          id: 'req_1',
          type: 'wallet_holds',
          description: 'Must hold at least 1 SATCHEL governance token',
          params: { assetId: 123456, minAmount: 1 }
        }
      ]
    }
  }
];

export let nextBadgeId = 2;

export function createBadge(definition: BadgeDefinition): Badge {
  const badge: Badge = {
    id: nextBadgeId++,
    name: definition.name,
    description: definition.description,
    image: definition.image,
    issuer: definition.issuer || 'SATCHEL_ISSUER_ADDRESS',
    earnedAt: new Date().toISOString(),
    state: definition.state || 'draft',
    criteria: definition.criteria || {
      type: 'structured',
      version: '1.0',
      requirements: []
    }
  };
  badgeStore.push(badge);
  return badge;
}

export function getBadgeById(id: number): Badge | undefined {
  return badgeStore.find(b => b.id === id);
}

export function getActiveBadges(includeDeleted = false): Badge[] {
  return badgeStore.filter(b => includeDeleted || !b.deletedAt);
}

export function searchBadges(
  query: string,
  state?: BadgeState | null,
  includeDeleted = false
): Badge[] {
  const search = query.toLowerCase();
  return badgeStore.filter(badge => {
    if (!includeDeleted && badge.deletedAt) return false;
    if (state && badge.state && badge.state !== state) return false;
    if (search) {
      const matchesSearch = 
        badge.name.toLowerCase().includes(search) ||
        badge.description.toLowerCase().includes(search);
      if (!matchesSearch) return false;
    }
    return true;
  });
}

export function updateBadge(id: number, updates: Partial<Badge>): Badge | null {
  const index = badgeStore.findIndex(b => b.id === id);
  if (index === -1 || badgeStore[index].deletedAt) return null;
  
  badgeStore[index] = { ...badgeStore[index], ...updates, id };
  return badgeStore[index];
}

export function softDeleteBadge(id: number): Badge | null {
  const index = badgeStore.findIndex(b => b.id === id);
  if (index === -1) return null;
  if (badgeStore[index].deletedAt) return null;
  
  badgeStore[index].deletedAt = new Date().toISOString();
  return badgeStore[index];
}

export function validateStateTransition(
  currentState: BadgeState,
  newState: BadgeState
): boolean {
  const validTransitions: Record<BadgeState, BadgeState[]> = {
    'draft': ['active'],
    'active': ['archived'],
    'archived': []
  };
  return validTransitions[currentState]?.includes(newState) ?? false;
}

export function resetBadgeStore(): void {
  badgeStore.length = 0;
  nextBadgeId = 1;
  badgeStore.push({
    id: 1,
    name: 'Test Badge',
    description: 'A test badge for unit tests',
    image: 'ipfs://QmTest123',
    issuer: 'TEST_ISSUER',
    earnedAt: new Date().toISOString(),
    state: 'active',
    criteria: { type: 'structured', version: '1.0', requirements: [] }
  });
}
