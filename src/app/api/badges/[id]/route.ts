import { NextRequest, NextResponse } from 'next/server';
import { Badge, BadgeDefinition, BadgeState } from '@/types/badge';

// In-memory store reference (shared with route.ts in production)
let badges: Badge[] = [
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

// GET /api/badges/[id] - Get a single badge
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const badgeId = parseInt(id);
  
  const badge = badges.find(b => b.id === badgeId && !b.deletedAt);
  
  if (!badge) {
    return NextResponse.json({ error: 'Badge not found' }, { status: 404 });
  }

  return NextResponse.json({ badge });
}

// PUT /api/badges/[id] - Update badge metadata
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const badgeId = parseInt(id);
  
  const badgeIndex = badges.findIndex(b => b.id === badgeId);
  
  if (badgeIndex === -1 || badges[badgeIndex].deletedAt) {
    return NextResponse.json({ error: 'Badge not found' }, { status: 404 });
  }

  try {
    const updates: Partial<BadgeDefinition & { state?: BadgeState }> = await request.json();
    
    // Validate state transitions
    const currentState = badges[badgeIndex].state || 'draft';
    const newState = updates.state;
    
    if (newState && newState !== currentState) {
      const validTransitions: Record<BadgeState, BadgeState[]> = {
        'draft': ['active'],
        'active': ['archived'],
        'archived': []
      };
      
      if (!validTransitions[currentState]?.includes(newState)) {
        return NextResponse.json(
          { error: `Invalid state transition from ${currentState} to ${newState}` },
          { status: 400 }
        );
      }
    }

    // Update badge fields
    badges[badgeIndex] = {
      ...badges[badgeIndex],
      ...updates,
      id: badgeId // Ensure ID cannot be changed
    };

    return NextResponse.json({ badge: badges[badgeIndex] });
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }
}

// DELETE /api/badges/[id] - Soft delete a badge
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const badgeId = parseInt(id);
  
  const badgeIndex = badges.findIndex(b => b.id === badgeId);
  
  if (badgeIndex === -1) {
    return NextResponse.json({ error: 'Badge not found' }, { status: 404 });
  }

  if (badges[badgeIndex].deletedAt) {
    return NextResponse.json({ error: 'Badge already deleted' }, { status: 400 });
  }

  // Soft delete
  badges[badgeIndex].deletedAt = new Date().toISOString();

  return NextResponse.json({ 
    message: 'Badge deleted successfully',
    badge: badges[badgeIndex]
  });
}
