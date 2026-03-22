import { NextRequest, NextResponse } from 'next/server';
import { BadgeDefinition, BadgeState } from '@/types/badge';
import { getBadgeById, updateBadge, softDeleteBadge, validateStateTransition } from '@/lib/badge-store';

// GET /api/badges/[id] - Get a single badge
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const badgeId = parseInt(id, 10);
  
  if (isNaN(badgeId)) {
    return NextResponse.json({ error: 'Invalid badge ID' }, { status: 400 });
  }
  
  const badge = getBadgeById(badgeId);
  
  if (!badge) {
    return NextResponse.json({ error: 'Badge not found' }, { status: 404 });
  }

  if (badge.deletedAt) {
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
  const badgeId = parseInt(id, 10);
  
  if (isNaN(badgeId)) {
    return NextResponse.json({ error: 'Invalid badge ID' }, { status: 400 });
  }
  
  const existingBadge = getBadgeById(badgeId);
  
  if (!existingBadge) {
    return NextResponse.json({ error: 'Badge not found' }, { status: 404 });
  }

  if (existingBadge.deletedAt) {
    return NextResponse.json({ error: 'Badge not found' }, { status: 404 });
  }

  try {
    const updates: Partial<BadgeDefinition & { state?: BadgeState }> = await request.json();
    
    // Validate state transitions
    const currentState = existingBadge.state || 'draft';
    const newState = updates.state;
    
    if (newState && newState !== currentState) {
      if (!validateStateTransition(currentState, newState)) {
        return NextResponse.json(
          { error: `Invalid state transition from ${currentState} to ${newState}` },
          { status: 400 }
        );
      }
    }

    // Validate name length if updating
    if (updates.name !== undefined) {
      if (updates.name.length > 100) {
        return NextResponse.json(
          { error: 'Badge name must be 100 characters or less' },
          { status: 400 }
        );
      }
    }

    // Validate description length if updating
    if (updates.description !== undefined) {
      if (updates.description.length > 1000) {
        return NextResponse.json(
          { error: 'Badge description must be 1000 characters or less' },
          { status: 400 }
        );
      }
    }

    // Validate image if updating
    if (updates.image !== undefined) {
      const isValidImage = updates.image.startsWith('ipfs://') || 
                           updates.image.startsWith('https://') ||
                           updates.image.startsWith('http://');
      if (!isValidImage) {
        return NextResponse.json(
          { error: 'Image must be a valid URL or IPFS hash' },
          { status: 400 }
        );
      }
    }

    // Update badge
    const updatedBadge = updateBadge(badgeId, updates);

    if (!updatedBadge) {
      return NextResponse.json({ error: 'Failed to update badge' }, { status: 500 });
    }

    return NextResponse.json({ badge: updatedBadge });
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
  const badgeId = parseInt(id, 10);
  
  if (isNaN(badgeId)) {
    return NextResponse.json({ error: 'Invalid badge ID' }, { status: 400 });
  }
  
  const badge = getBadgeById(badgeId);
  
  if (!badge) {
    return NextResponse.json({ error: 'Badge not found' }, { status: 404 });
  }

  if (badge.deletedAt) {
    return NextResponse.json({ error: 'Badge already deleted' }, { status: 400 });
  }

  // Soft delete
  const deletedBadge = softDeleteBadge(badgeId);

  if (!deletedBadge) {
    return NextResponse.json({ error: 'Failed to delete badge' }, { status: 500 });
  }

  return NextResponse.json({ 
    message: 'Badge deleted successfully',
    badge: deletedBadge
  });
}
