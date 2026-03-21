import { NextRequest, NextResponse } from 'next/server';
import { Webhook, WebhookDeliveryReceipt, IncomingWebhookPayload } from '@/types/webhook';
import { webhooks, receipts, evaluateConditions, validateSignature } from '../store';
import crypto from 'crypto';

// In-memory badges reference (shared with badge routes in production)
let badges: Array<{
  id: number;
  name: string;
  state?: string;
}> = [
  { id: 1, name: 'Early Adopter', state: 'active' }
];

// POST /api/webhooks/trigger - Trigger badge issuance via webhook
export async function POST(request: NextRequest) {
  // Extract signature from headers
  const signature = request.headers.get('x-webhook-signature') || 
                    request.headers.get('x-hub-signature-256') ||
                    '';
  
  const webhookId = request.headers.get('x-webhook-id') || '';

  // Find the webhook
  const webhook = webhooks.find((w) => w.id === webhookId && w.isActive);
  
  if (!webhook) {
    return NextResponse.json(
      { error: 'Webhook not found or inactive', code: 'WEBHOOK_NOT_FOUND' },
      { status: 404 }
    );
  }

  // Parse payload
  let payload: IncomingWebhookPayload;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json(
      { error: 'Invalid JSON payload', code: 'INVALID_PAYLOAD' },
      { status: 400 }
    );
  }

  // Validate HMAC signature if secret is set
  let signatureValid = true;
  if (webhook.secret && signature) {
    const rawBody = JSON.stringify(payload);
    signatureValid = validateSignature(rawBody, signature, webhook.secret);
    
    if (!signatureValid) {
      const receipt: WebhookDeliveryReceipt = {
        id: `receipt_${Date.now()}`,
        webhookId: webhook.id,
        timestamp: new Date().toISOString(),
        success: false,
        errorMessage: 'Invalid signature',
        requestPayload: payload,
      };
      receipts.push(receipt);

      return NextResponse.json(
        { error: 'Invalid signature', code: 'INVALID_SIGNATURE' },
        { status: 401 }
      );
    }
  }

  // Evaluate conditions
  if (!evaluateConditions(payload, webhook.conditions)) {
    const receipt: WebhookDeliveryReceipt = {
      id: `receipt_${Date.now()}`,
      webhookId: webhook.id,
      timestamp: new Date().toISOString(),
      success: false,
      errorMessage: 'Conditions not met',
      requestPayload: payload,
    };
    receipts.push(receipt);

    return NextResponse.json(
      { 
        error: 'Conditions not met', 
        code: 'CONDITIONS_NOT_MET',
        message: 'The payload does not satisfy the webhook conditions'
      },
      { status: 200 } // Return 200 to prevent retries for condition failures
    );
  }

  // Determine target wallet
  const targetWallet = payload.targetWallet || payload.wallet || webhook.targetWallet;
  
  if (!targetWallet) {
    const receipt: WebhookDeliveryReceipt = {
      id: `receipt_${Date.now()}`,
      webhookId: webhook.id,
      timestamp: new Date().toISOString(),
      success: false,
      errorMessage: 'No target wallet specified',
      requestPayload: payload,
    };
    receipts.push(receipt);

    return NextResponse.json(
      { error: 'No target wallet specified', code: 'NO_TARGET_WALLET' },
      { status: 400 }
    );
  }

  // Validate badge exists
  const badge = badges.find((b) => b.id === webhook.badgeId);
  if (!badge) {
    const receipt: WebhookDeliveryReceipt = {
      id: `receipt_${Date.now()}`,
      webhookId: webhook.id,
      timestamp: new Date().toISOString(),
      success: false,
      errorMessage: 'Badge not found',
      requestPayload: payload,
    };
    receipts.push(receipt);

    return NextResponse.json(
      { error: 'Badge not found', code: 'BADGE_NOT_FOUND' },
      { status: 404 }
    );
  }

  // Check badge is active
  if (badge.state && badge.state !== 'active') {
    const receipt: WebhookDeliveryReceipt = {
      id: `receipt_${Date.now()}`,
      webhookId: webhook.id,
      timestamp: new Date().toISOString(),
      success: false,
      errorMessage: `Badge is ${badge.state}, not active`,
      requestPayload: payload,
    };
    receipts.push(receipt);

    return NextResponse.json(
      { error: `Badge is ${badge.state}`, code: 'BADGE_NOT_ACTIVE' },
      { status: 400 }
    );
  }

  // In production, this is where you would call algosdk to issue the NFT
  // For demo, we simulate the issuance
  try {
    // Simulate badge issuance
    // In production:
    // const { algosdk } = await import('algosdk');
    // const client = new algosdk.Algodv2(token, server, port);
    // const params = await client.getTransactionParams().do();
    // const txn = algosdk.makeAssetCreateTxnWithSuggestedParamsFromObject({
    //   sender: issuerAddress,
    //   total: 1,
    //   decimals: 0,
    //   assetName: badge.name,
    //   unitName: `BADGE_${badge.id}`,
    //   assetURL: badge.image,
    //   defaultFrozen: false,
    //   freezeAddr: undefined,
    //   manager: issuerAddress,
    //   reserveAddr: undefined,
    //   clawback: undefined,
    //   suggestedParams: params,
    // });
    // ... sign and submit transaction

    const receipt: WebhookDeliveryReceipt = {
      id: `receipt_${Date.now()}`,
      webhookId: webhook.id,
      timestamp: new Date().toISOString(),
      success: true,
      statusCode: 200,
      responseBody: JSON.stringify({
        message: 'Badge issued successfully',
        badgeId: webhook.badgeId,
        badgeName: badge.name,
        targetWallet,
        transactionId: `TX_${crypto.randomBytes(16).toString('hex')}`, // Simulated
      }),
      requestPayload: payload,
    };
    receipts.push(receipt);

    return NextResponse.json({
      success: true,
      message: 'Badge issued successfully',
      badgeId: webhook.badgeId,
      badgeName: badge.name,
      targetWallet,
      receiptId: receipt.id,
    });
  } catch (error) {
    const receipt: WebhookDeliveryReceipt = {
      id: `receipt_${Date.now()}`,
      webhookId: webhook.id,
      timestamp: new Date().toISOString(),
      success: false,
      errorMessage: error instanceof Error ? error.message : 'Badge issuance failed',
      requestPayload: payload,
    };
    receipts.push(receipt);

    return NextResponse.json(
      { 
        error: 'Badge issuance failed', 
        code: 'ISSUANCE_FAILED',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// ⚠️ IMPORTANT SECURITY NOTICE ⚠️
// This webhook system uses Algorand ASAs (Algorand Standard Assets) for badges.
// Algorand ASA-based authentication is NOT a secure authentication system.
// 
// IMPORTANT LIMITATIONS:
// 1. ASA "clawback" and "freeze" keys can be used to revoke badges, but:
//    - Requires the issuer to maintain and protect the clawback key
//    - If the issuer's keys are compromised, an attacker could freeze/clawback badges
//    - Many ASA configurations disable clawback for simplicity
//
// 2. Badge revocation is NOT automatically guaranteed:
//    - Wallets may cache/badge assets and not check revocation status
//    - Third-party services may not properly implement revocation checks
//
// 3. Wallet-based authentication can be gamed:
//    - Users can create multiple wallets
//    - Badges can be transferred to any wallet
//    - There's no inherent identity binding
//
// USE CASES FOR THIS SYSTEM:
// ✓ Event attendance verification (conference badges)
// ✓ Achievement/gamification systems
// ✓ Loyalty programs
// ✓ Community membership verification
//
// DO NOT USE FOR:
// ✗ Critical security decisions
// ✗ Financial authorization
// ✗ Identity verification requiring legal recourse
// ✗ Any system where false positives could cause harm
//
// For production secure authentication, consider:
// - Soul Bound Tokens (SBTs) with proper smart contract logic
// - ZK proofs for privacy-preserving credential verification
// - Traditional OAuth/OIDC for identity verification
