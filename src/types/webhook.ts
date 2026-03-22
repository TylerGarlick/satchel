// Webhook types for Satchel badge issuance system

export interface WebhookCondition {
  field: string;
  operator: 'equals' | 'contains' | 'greater_than' | 'less_than' | 'exists' | 'not_exists';
  value?: string | number | boolean;
}

export interface Webhook {
  id: string;
  name: string;
  description?: string;
  endpointUrl: string;
  secret: string;
  badgeId: number;
  targetWallet?: string;
  conditions: WebhookCondition[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

export interface WebhookDefinition {
  name: string;
  description?: string;
  endpointUrl: string;
  secret?: string;  // Optional - if not provided, keep existing secret
  badgeId: number;
  targetWallet?: string;
  conditions?: WebhookCondition[];
  isActive?: boolean;
}

export interface WebhookDeliveryReceipt {
  id: string;
  webhookId: string;
  timestamp: string;
  success: boolean;
  statusCode?: number;
  responseBody?: string;
  errorMessage?: string;
  requestPayload?: Record<string, unknown>;
  responseHeaders?: Record<string, string>;
}

export interface WebhookTestRequest {
  webhookId: string;
  payload: Record<string, unknown>;
}

export interface WebhookTestResponse {
  success: boolean;
  deliveryReceipt: WebhookDeliveryReceipt;
  badgeIssued?: boolean;
  message: string;
}

// In-memory store types (for demo - replace with database)
export interface WebhookStore {
  webhooks: Webhook[];
  receipts: WebhookDeliveryReceipt[];
}

export interface IncomingWebhookPayload {
  wallet?: string;
  targetWallet?: string;
  [key: string]: unknown;
}
