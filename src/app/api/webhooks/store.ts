// Shared webhook store for demo purposes
// In production, replace with database (Postgres, MongoDB, etc.)
// Note: In Next.js, module-level variables are shared within a single Edge Runtime instance
// but not across different instances. For true global state, use globalThis.

import { Webhook, WebhookDeliveryReceipt } from '@/types/webhook';

// Extend globalThis for TypeScript
declare global {
  var __webhookStore: {
    webhooks: Webhook[];
    receipts: WebhookDeliveryReceipt[];
    nextWebhookId: number;
  } | undefined;
}

// Initialize store on globalThis to survive across module reloads in development
function getStore() {
  if (!globalThis.__webhookStore) {
    globalThis.__webhookStore = {
      webhooks: [],
      receipts: [],
      nextWebhookId: 1,
    };
  }
  return globalThis.__webhookStore;
}

export const webhooks = getStore().webhooks;
export const receipts = getStore().receipts;
export const nextWebhookId = getStore().nextWebhookId;

// Function to increment webhook ID (needed because we can't modify imported const)
export function getNextWebhookId(): number {
  return getStore().nextWebhookId++;
}

export function generateId(): string {
  const { randomBytes } = require('crypto');
  return randomBytes(16).toString('hex');
}

export function generateSecret(): string {
  const { randomBytes } = require('crypto');
  return randomBytes(32).toString('hex');
}

// Helper to check if payload matches conditions
export function evaluateConditions(
  payload: Record<string, unknown>,
  conditions: Webhook['conditions']
): boolean {
  if (!conditions || conditions.length === 0) return true;

  return conditions.every((condition) => {
    const value = payload[condition.field];
    
    switch (condition.operator) {
      case 'exists':
        return value !== undefined && value !== null;
      case 'not_exists':
        return value === undefined || value === null;
      case 'equals':
        return value === condition.value;
      case 'contains':
        if (typeof value === 'string' && typeof condition.value === 'string') {
          return value.includes(condition.value);
        }
        if (Array.isArray(value)) {
          return value.includes(condition.value);
        }
        return false;
      case 'greater_than':
        if (typeof value === 'number' && typeof condition.value === 'number') {
          return value > condition.value;
        }
        return false;
      case 'less_than':
        if (typeof value === 'number' && typeof condition.value === 'number') {
          return value < condition.value;
        }
        return false;
      default:
        return false;
    }
  });
}

// Helper to validate HMAC signature
export function validateSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  const { createHmac, timingSafeEqual } = require('crypto');
  const expectedSignature = createHmac('sha256', secret)
    .update(payload)
    .digest('hex');
  
  // Support both 'sha256=' prefix and raw hex
  const normalizedSignature = signature.startsWith('sha256=')
    ? signature.slice(7)
    : signature;
  
  try {
    return timingSafeEqual(
      Buffer.from(expectedSignature, 'hex'),
      Buffer.from(normalizedSignature, 'hex')
    );
  } catch {
    return false;
  }
}
