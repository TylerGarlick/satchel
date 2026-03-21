import { NextRequest, NextResponse } from 'next/server';
import { Webhook, WebhookDefinition } from '@/types/webhook';
import { webhooks, generateSecret } from '../store';

// GET /api/webhooks/[id] - Get a single webhook
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const webhook = webhooks.find((w) => w.id === id);

  if (!webhook) {
    return NextResponse.json({ error: 'Webhook not found' }, { status: 404 });
  }

  // Return without secret
  const { secret, ...safeWebhook } = webhook;
  return NextResponse.json({ webhook: safeWebhook });
}

// PUT /api/webhooks/[id] - Update a webhook
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const webhookIndex = webhooks.findIndex((w) => w.id === id);

  if (webhookIndex === -1) {
    return NextResponse.json({ error: 'Webhook not found' }, { status: 404 });
  }

  try {
    const updates: Partial<WebhookDefinition & { regenerateSecret?: boolean }> =
      await request.json();

    // Validate URL format if being updated
    if (updates.endpointUrl) {
      try {
        new URL(updates.endpointUrl);
      } catch {
        return NextResponse.json(
          { error: 'Invalid endpointUrl format' },
          { status: 400 }
        );
      }
    }

    const currentWebhook = webhooks[webhookIndex];
    
    // Regenerate secret if requested
    let newSecret = currentWebhook.secret;
    if (updates.regenerateSecret) {
      newSecret = generateSecret();
    }

    const updatedWebhook: Webhook = {
      ...currentWebhook,
      ...updates,
      secret: newSecret,
      id: currentWebhook.id, // Ensure ID cannot be changed
      createdAt: currentWebhook.createdAt, // Ensure createdAt cannot be changed
      updatedAt: new Date().toISOString(),
    };

    webhooks[webhookIndex] = updatedWebhook;

    // Return with new secret if regenerated
    return NextResponse.json({
      webhook: { ...updatedWebhook, secret: undefined },
      secret: updates.regenerateSecret ? newSecret : undefined,
    });
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }
}

// DELETE /api/webhooks/[id] - Delete a webhook
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const webhookIndex = webhooks.findIndex((w) => w.id === id);

  if (webhookIndex === -1) {
    return NextResponse.json({ error: 'Webhook not found' }, { status: 404 });
  }

  // Remove webhook
  webhooks.splice(webhookIndex, 1);

  return NextResponse.json({ message: 'Webhook deleted successfully' });
}
