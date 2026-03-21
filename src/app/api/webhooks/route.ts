import { NextRequest, NextResponse } from 'next/server';
import { Webhook, WebhookDefinition } from '@/types/webhook';
import { webhooks, getNextWebhookId, generateSecret } from './store';

// GET /api/webhooks - List all webhooks
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const includeInactive = searchParams.get('includeInactive') === 'true';
  const badgeId = searchParams.get('badgeId');

  let filtered = webhooks.filter((webhook) => {
    if (!includeInactive && !webhook.isActive) return false;
    if (badgeId && webhook.badgeId !== parseInt(badgeId)) return false;
    return true;
  });

  // Return webhooks without their secrets for security
  const safeWebhooks = filtered.map(({ secret, ...rest }) => rest);

  return NextResponse.json({ webhooks: safeWebhooks });
}

// POST /api/webhooks - Create a new webhook
export async function POST(request: NextRequest) {
  try {
    const body: WebhookDefinition = await request.json();

    // Validate required fields
    if (!body.name || !body.endpointUrl || !body.badgeId) {
      return NextResponse.json(
        { error: 'Missing required fields: name, endpointUrl, badgeId' },
        { status: 400 }
      );
    }

    // Validate URL format
    try {
      new URL(body.endpointUrl);
    } catch {
      return NextResponse.json(
        { error: 'Invalid endpointUrl format' },
        { status: 400 }
      );
    }

    // Generate secret if not provided
    const secret = body.secret || generateSecret();
    const id = getNextWebhookId();

    const newWebhook: Webhook = {
      id: `webhook_${id}`,
      name: body.name,
      description: body.description || '',
      endpointUrl: body.endpointUrl,
      secret,
      badgeId: body.badgeId,
      targetWallet: body.targetWallet,
      conditions: body.conditions || [],
      isActive: body.isActive ?? true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: 'system', // In production, get from auth
    };

    webhooks.push(newWebhook);

    // Return the webhook with secret (only time it's fully visible)
    return NextResponse.json(
      { webhook: { ...newWebhook, secret: undefined }, secret },
      { status: 201 }
    );
  } catch {
    return NextResponse.json(
      { error: 'Invalid request body' },
      { status: 400 }
    );
  }
}
