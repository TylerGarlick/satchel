import { NextRequest, NextResponse } from 'next/server';
import { Badge, BadgeDefinition, BadgeState } from '@/types/badge';

// In-memory store for demo (replace with database in production)
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

let nextId = 2;

// GET /api/badges - List all badges with optional search
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const search = searchParams.get('search')?.toLowerCase() || '';
  const state = searchParams.get('state') as BadgeState | null;
  const includeDeleted = searchParams.get('includeDeleted') === 'true';

  let filtered = badges.filter(badge => {
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

  return NextResponse.json({ badges: filtered });
}

// POST /api/badges - Create a new badge (admin only)
export async function POST(request: NextRequest) {
  try {
    const body: BadgeDefinition = await request.json();
    
    // Validate required fields
    if (!body.name || !body.description || !body.image) {
      return NextResponse.json(
        { error: 'Missing required fields: name, description, image' },
        { status: 400 }
      );
    }

    const newBadge: Badge = {
      id: nextId++,
      name: body.name,
      description: body.description,
      image: body.image,
      issuer: body.issuer || 'SATCHEL_ISSUER_ADDRESS',
      earnedAt: new Date().toISOString(),
      state: body.state || 'draft',
      criteria: body.criteria || {
        type: 'structured',
        version: '1.0',
        requirements: []
      }
    };

    badges.push(newBadge);

    return NextResponse.json({ badge: newBadge }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: 'Invalid request body' },
      { status: 400 }
    );
  }
}
