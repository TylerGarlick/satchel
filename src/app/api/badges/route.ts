import { NextRequest, NextResponse } from 'next/server';
import { BadgeDefinition, BadgeState } from '@/types/badge';
import { createBadge, searchBadges } from '@/lib/badge-store';

// GET /api/badges - List all badges with optional search
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const search = searchParams.get('search') || '';
  const state = searchParams.get('state') as BadgeState | null;
  const includeDeleted = searchParams.get('includeDeleted') === 'true';

  const badges = searchBadges(search, state, includeDeleted);

  return NextResponse.json({ badges });
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

    // Validate name length
    if (body.name.length > 100) {
      return NextResponse.json(
        { error: 'Badge name must be 100 characters or less' },
        { status: 400 }
      );
    }

    // Validate description length
    if (body.description.length > 1000) {
      return NextResponse.json(
        { error: 'Badge description must be 1000 characters or less' },
        { status: 400 }
      );
    }

    // Validate image URL or IPFS hash format
    const isValidImage = body.image.startsWith('ipfs://') || 
                         body.image.startsWith('https://') ||
                         body.image.startsWith('http://');
    if (!isValidImage) {
      return NextResponse.json(
        { error: 'Image must be a valid URL or IPFS hash (ipfs://...)' },
        { status: 400 }
      );
    }

    // Validate state if provided
    if (body.state && !['draft', 'active', 'archived'].includes(body.state)) {
      return NextResponse.json(
        { error: 'Invalid state. Must be one of: draft, active, archived' },
        { status: 400 }
      );
    }

    // Validate criteria if provided
    if (body.criteria) {
      if (!['json_schema', 'structured'].includes(body.criteria.type)) {
        return NextResponse.json(
          { error: 'Invalid criteria type. Must be json_schema or structured' },
          { status: 400 }
        );
      }
    }

    const newBadge = createBadge(body);

    return NextResponse.json({ badge: newBadge }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: 'Invalid request body' },
      { status: 400 }
    );
  }
}
