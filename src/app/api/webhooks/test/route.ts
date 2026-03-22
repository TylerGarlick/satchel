import { NextRequest, NextResponse } from 'next/server';
import { WebhookTestRequest, WebhookTestResponse, WebhookDeliveryReceipt } from '@/types/webhook';
import { webhooks, receipts, evaluateConditions } from '../store';
import crypto from 'crypto';

// POST /api/webhooks/test - Test a webhook with a custom payload
export async function POST(request: NextRequest) {
  try {
    const body: WebhookTestRequest = await request.json();

    // Validate required fields
    if (!body.webhookId || !body.payload) {
      return NextResponse.json(
        { error: 'Missing required fields: webhookId, payload' },
        { status: 400 }
      );
    }

    // Find the webhook
    const webhook = webhooks.find((w) => w.id === body.webhookId);

    if (!webhook) {
      return NextResponse.json(
        { error: 'Webhook not found' },
        { status: 404 }
      );
    }

    // Generate HMAC signature for the test payload
    const payloadString = JSON.stringify(body.payload);
    const signature = crypto
      .createHmac('sha256', webhook.secret)
      .update(payloadString)
      .digest('hex');

    // Validate conditions
    const conditionsPassed = evaluateConditions(body.payload, webhook.conditions);
    
    // Determine target wallet
    const targetWallet = 
      body.payload.targetWallet || 
      body.payload.wallet || 
      webhook.targetWallet;

    // Build delivery receipt for the test
    const deliveryReceipt: WebhookDeliveryReceipt = {
      id: `test_receipt_${Date.now()}`,
      webhookId: webhook.id,
      timestamp: new Date().toISOString(),
      success: conditionsPassed && !!targetWallet,
      statusCode: conditionsPassed ? 200 : 400,
      requestPayload: body.payload,
      responseBody: JSON.stringify({
        conditionsPassed,
        targetWalletFound: !!targetWallet,
        evaluatedConditions: webhook.conditions.map((c) => ({
          ...c,
          passed: (() => {
            const value = body.payload[c.field];
            switch (c.operator) {
              case 'exists': return value !== undefined && value !== null;
              case 'not_exists': return value === undefined || value === null;
              case 'equals': return value === c.value;
              case 'contains': 
                if (typeof value === 'string' && typeof c.value === 'string') {
                  return value.includes(c.value);
                }
                return false;
              case 'greater_than':
                return typeof value === 'number' && typeof c.value === 'number' && value > c.value;
              case 'less_than':
                return typeof value === 'number' && typeof c.value === 'number' && value < c.value;
              default: return false;
            }
          })(),
        })),
      }),
      errorMessage: !conditionsPassed 
        ? 'Conditions not met' 
        : !targetWallet 
          ? 'No target wallet in payload' 
          : undefined,
    };

    // Store the test receipt
    receipts.push(deliveryReceipt);

    // Build response
    const response: WebhookTestResponse = {
      success: deliveryReceipt.success,
      deliveryReceipt,
      badgeIssued: false, // Test mode doesn't actually issue
      message: conditionsPassed 
        ? `Test passed! Conditions met. Target wallet: ${targetWallet || 'none specified'}`
        : 'Test failed: Conditions not met',
    };

    // Include helpful debug info
    const debugInfo = {
      webhookName: webhook.name,
      webhookId: webhook.id,
      badgeId: webhook.badgeId,
      conditions: webhook.conditions,
      conditionsPassed,
      targetWallet,
      suggestedPayload: {
        wallet: targetWallet || 'WALLET_ADDRESS_HERE',
        ...(webhook.conditions.length > 0 && {
          _note: 'Include these fields to satisfy conditions',
          ...Object.fromEntries(
            webhook.conditions.map((c) => [c.field, c.value || 'value'])
          ),
        }),
      },
      signature: `sha256=${signature}`,
      curlCommand: `curl -X POST ${webhook.endpointUrl} \\
  -H "Content-Type: application/json" \\
  -H "x-webhook-signature: sha256=${signature}" \\
  -H "x-webhook-id: ${webhook.id}" \\
  -d '${payloadString}'`,
    };

    return NextResponse.json({
      ...response,
      debug: debugInfo,
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Invalid request body' },
      { status: 400 }
    );
  }
}
