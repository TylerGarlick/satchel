import { NextRequest, NextResponse } from 'next/server';
import { receipts } from '../store';

// GET /api/webhooks/receipts - List delivery receipts
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const webhookId = searchParams.get('webhookId');
  const limit = parseInt(searchParams.get('limit') || '50');
  const offset = parseInt(searchParams.get('offset') || '0');

  let filtered = [...receipts];

  // Filter by webhook ID if specified
  if (webhookId) {
    filtered = filtered.filter((r) => r.webhookId === webhookId);
  }

  // Sort by timestamp descending (most recent first)
  filtered.sort((a, b) => 
    new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  // Paginate
  const total = filtered.length;
  const paginated = filtered.slice(offset, offset + limit);

  return NextResponse.json({
    receipts: paginated,
    pagination: {
      total,
      limit,
      offset,
      hasMore: offset + limit < total,
    },
  });
}
