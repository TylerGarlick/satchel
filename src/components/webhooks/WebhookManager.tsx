'use client';

import { useState, useEffect, useCallback } from 'react';
import type { Webhook, WebhookDefinition, WebhookCondition } from '@/types/webhook';

interface WebhookManagerProps {
  adminAddress?: string | null;
  isAdmin?: boolean | null;
}

const OPERATOR_LABELS: Record<WebhookCondition['operator'], string> = {
  equals: 'equals',
  contains: 'contains',
  greater_than: '>',
  less_than: '<',
  exists: 'exists',
  not_exists: 'not exists',
};

export function WebhookManager({ adminAddress, isAdmin = false }: WebhookManagerProps) {
  const [webhooks, setWebhooks] = useState<Webhook[]>([]);
  const [badges, setBadges] = useState<Array<{ id: number; name: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showTestModal, setShowTestModal] = useState(false);
  const [selectedWebhook, setSelectedWebhook] = useState<Webhook | null>(null);
  
  // Form state
  const [formData, setFormData] = useState<WebhookDefinition & { conditions: WebhookCondition[] }>({
    name: '',
    description: '',
    endpointUrl: '',
    secret: '',
    badgeId: 0,
    targetWallet: '',
    conditions: [],
    isActive: true,
  });
  
  // Test payload
  const [testPayload, setTestPayload] = useState('{\n  "wallet": "WALLET_ADDRESS"\n}');
  const [testResult, setTestResult] = useState<string | null>(null);
  const [testLoading, setTestLoading] = useState(false);
  
  // Newly created webhook secret (shown only once)
  const [newWebhookSecret, setNewWebhookSecret] = useState<string | null>(null);

  const fetchWebhooks = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const res = await fetch('/api/webhooks?includeInactive=true');
      if (!res.ok) throw new Error('Failed to fetch webhooks');
      
      const data = await res.json();
      setWebhooks(data.webhooks);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchBadges = useCallback(async () => {
    try {
      const res = await fetch('/api/badges?includeDeleted=true');
      if (!res.ok) throw new Error('Failed to fetch badges');
      const data = await res.json();
      setBadges(data.badges || []);
    } catch (err) {
      console.error('Failed to fetch badges:', err);
      // Use default badge
      setBadges([{ id: 1, name: 'Early Adopter' }]);
    }
  }, []);

  useEffect(() => {
    fetchWebhooks();
    fetchBadges();
  }, [fetchWebhooks, fetchBadges]);

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      endpointUrl: '',
      secret: '',
      badgeId: 0,
      targetWallet: '',
      conditions: [],
      isActive: true,
    });
    setNewWebhookSecret(null);
  };

  const openCreateModal = () => {
    if (!isAdmin) {
      setError('Only administrators can create webhooks');
      return;
    }
    resetForm();
    setShowCreateModal(true);
  };

  const openEditModal = (webhook: Webhook) => {
    if (!isAdmin) {
      setError('Only administrators can edit webhooks');
      return;
    }
    setSelectedWebhook(webhook);
    setFormData({
      name: webhook.name,
      description: webhook.description || '',
      endpointUrl: webhook.endpointUrl,
      secret: '', // Don't expose existing secret
      badgeId: webhook.badgeId,
      targetWallet: webhook.targetWallet || '',
      conditions: webhook.conditions || [],
      isActive: webhook.isActive,
    });
    setShowEditModal(true);
  };

  const openDeleteConfirm = (webhook: Webhook) => {
    if (!isAdmin) {
      setError('Only administrators can delete webhooks');
      return;
    }
    setSelectedWebhook(webhook);
    setShowDeleteConfirm(true);
  };

  const openTestModal = (webhook: Webhook) => {
    setSelectedWebhook(webhook);
    setTestPayload(JSON.stringify({ wallet: 'WALLET_ADDRESS' }, null, 2));
    setTestResult(null);
    setShowTestModal(true);
  };

  const addCondition = () => {
    setFormData({
      ...formData,
      conditions: [
        ...formData.conditions,
        { field: '', operator: 'equals', value: '' },
      ],
    });
  };

  const removeCondition = (index: number) => {
    setFormData({
      ...formData,
      conditions: formData.conditions.filter((_, i) => i !== index),
    });
  };

  const updateCondition = (index: number, updates: Partial<WebhookCondition>) => {
    setFormData({
      ...formData,
      conditions: formData.conditions.map((c, i) => 
        i === index ? { ...c, ...updates } : c
      ),
    });
  };

  const handleCreate = async () => {
    try {
      const res = await fetch('/api/webhooks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to create webhook');
      }
      
      const data = await res.json();
      setNewWebhookSecret(data.secret);
      setShowCreateModal(false);
      fetchWebhooks();
      
      // If we got a secret back, show it in a modal
      if (data.secret) {
        setSelectedWebhook(data.webhook);
        setFormData(data.webhook);
        setShowEditModal(true);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create webhook');
    }
  };

  const handleUpdate = async () => {
    if (!selectedWebhook) return;
    
    try {
      const payload: Record<string, unknown> = { ...formData };
      if (!payload.secret || payload.secret === '') {
        delete payload.secret;
      }
      
      const res = await fetch(`/api/webhooks/${selectedWebhook.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to update webhook');
      }
      
      setShowEditModal(false);
      setSelectedWebhook(null);
      resetForm();
      fetchWebhooks();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update webhook');
    }
  };

  const handleDelete = async () => {
    if (!selectedWebhook) return;
    
    try {
      const res = await fetch(`/api/webhooks/${selectedWebhook.id}`, {
        method: 'DELETE',
      });
      
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to delete webhook');
      }
      
      setShowDeleteConfirm(false);
      setSelectedWebhook(null);
      fetchWebhooks();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete webhook');
    }
  };

  const handleRegenerateSecret = async () => {
    if (!selectedWebhook) return;
    
    try {
      const res = await fetch(`/api/webhooks/${selectedWebhook.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ regenerateSecret: true }),
      });
      
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to regenerate secret');
      }
      
      const data = await res.json();
      if (data.secret) {
        setNewWebhookSecret(data.secret);
      }
      fetchWebhooks();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to regenerate secret');
    }
  };

  const handleTest = async () => {
    if (!selectedWebhook) return;
    
    try {
      setTestLoading(true);
      setTestResult(null);
      
      const payload = JSON.parse(testPayload);
      const res = await fetch('/api/webhooks/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          webhookId: selectedWebhook.id,
          payload,
        }),
      });
      
      const data = await res.json();
      setTestResult(JSON.stringify(data, null, 2));
    } catch (err) {
      setTestResult(JSON.stringify({
        error: err instanceof Error ? err.message : 'Test failed',
      }, null, 2));
    } finally {
      setTestLoading(false);
    }
  };

  if (!isAdmin && !adminAddress) {
    return (
      <div className="alert alert-warning">
        <span>Connect your wallet to view webhook management</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Security Disclaimer Banner */}
      <div className="alert alert-error">
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        <div>
          <h3 className="font-bold">⚠️ Security Disclaimer</h3>
          <p className="text-sm">
            This webhook system uses Algorand ASAs which are NOT a secure authentication system. 
            Badge revocation is not guaranteed on Algorand ASA standard. 
            <strong> Do not use for critical security decisions.</strong>
          </p>
        </div>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">Webhook Management</h2>
          <p className="text-sm text-gray-500">Manage webhooks for automated badge issuance</p>
        </div>
        {isAdmin && (
          <button onClick={openCreateModal} className="btn btn-primary">
            + Create Webhook
          </button>
        )}
      </div>

      {/* Error Alert */}
      {error && (
        <div className="alert alert-error">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="btn btn-sm btn-ghost">✕</button>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex justify-center py-8">
          <div className="loading loading-spinner loading-lg"></div>
        </div>
      )}

      {/* Webhook List */}
      {!loading && (
        <div className="grid gap-4">
          {webhooks.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No webhooks found. {isAdmin && 'Create your first webhook to get started.'}
            </div>
          ) : (
            webhooks.map((webhook) => (
              <div key={webhook.id} className="card bg-base-200 shadow">
                <div className="card-body">
                  <div className="flex flex-col sm:flex-row gap-4">
                    {/* Webhook Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h3 className="card-title">{webhook.name}</h3>
                          <div className="flex items-center gap-2 mt-1">
                            <span className={`badge ${webhook.isActive ? 'badge-success' : 'badge-error'}`}>
                              {webhook.isActive ? 'Active' : 'Inactive'}
                            </span>
                            <span className="badge badge-outline">Badge #{webhook.badgeId}</span>
                          </div>
                        </div>
                        <div className="text-sm text-gray-500 font-mono">{webhook.id}</div>
                      </div>
                      {webhook.description && (
                        <p className="text-sm mt-2">{webhook.description}</p>
                      )}
                      <div className="mt-2">
                        <p className="text-xs text-gray-400">
                          Endpoint: <span className="font-mono break-all">{webhook.endpointUrl}</span>
                        </p>
                        {webhook.targetWallet && (
                          <p className="text-xs text-gray-400">
                            Target Wallet: <span className="font-mono">{webhook.targetWallet}</span>
                          </p>
                        )}
                      </div>
                      {webhook.conditions && webhook.conditions.length > 0 && (
                        <div className="mt-2">
                          <p className="text-xs text-gray-500 font-semibold">Conditions:</p>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {webhook.conditions.map((c, i) => (
                              <span key={i} className="badge badge-sm badge-ghost">
                                {c.field} {OPERATOR_LABELS[c.operator]} {c.value !== undefined ? String(c.value) : ''}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  {isAdmin && (
                    <div className="card-actions justify-end items-center mt-4 pt-4 border-t border-base-300">
                      <button
                        onClick={() => openTestModal(webhook)}
                        className="btn btn-sm btn-outline"
                      >
                        Test
                      </button>
                      <button
                        onClick={() => openEditModal(webhook)}
                        className="btn btn-sm btn-primary"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => openDeleteConfirm(webhook)}
                        className="btn btn-sm btn-error btn-outline"
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <div className="modal modal-open">
          <div className="modal-box max-w-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="font-bold text-lg">Create New Webhook</h3>
            <div className="py-4 space-y-4">
              <div className="form-control">
                <label className="label"><span className="label-text">Name *</span></label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="input input-bordered"
                  placeholder="e.g., GitHub Contributor Badge"
                />
              </div>
              
              <div className="form-control">
                <label className="label"><span className="label-text">Description</span></label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="textarea textarea-bordered"
                  placeholder="Optional description"
                />
              </div>
              
              <div className="form-control">
                <label className="label"><span className="label-text">Endpoint URL *</span></label>
                <input
                  type="url"
                  value={formData.endpointUrl}
                  onChange={(e) => setFormData({ ...formData, endpointUrl: e.target.value })}
                  className="input input-bordered"
                  placeholder="https://api.example.com/webhook"
                />
              </div>
              
              <div className="form-control">
                <label className="label"><span className="label-text">Secret</span></label>
                <input
                  type="text"
                  value={formData.secret}
                  onChange={(e) => setFormData({ ...formData, secret: e.target.value })}
                  className="input input-bordered font-mono"
                  placeholder="Leave empty to auto-generate"
                />
                <label className="label">
                  <span className="label-text-alt">Used for HMAC signature validation</span>
                </label>
              </div>
              
              <div className="form-control">
                <label className="label"><span className="label-text">Badge *</span></label>
                <select
                  value={formData.badgeId}
                  onChange={(e) => setFormData({ ...formData, badgeId: parseInt(e.target.value) })}
                  className="select select-bordered"
                >
                  <option value={0}>Select a badge...</option>
                  {badges.map((badge) => (
                    <option key={badge.id} value={badge.id}>
                      #{badge.id} - {badge.name}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="form-control">
                <label className="label"><span className="label-text">Default Target Wallet</span></label>
                <input
                  type="text"
                  value={formData.targetWallet}
                  onChange={(e) => setFormData({ ...formData, targetWallet: e.target.value })}
                  className="input input-bordered font-mono"
                  placeholder="WALLET_ADDRESS (optional, can be in payload)"
                />
                <label className="label">
                  <span className="label-text-alt">Wallet that will receive the badge by default</span>
                </label>
              </div>
              
              <div className="form-control">
                <label className="label">
                  <span className="label-text">Conditions</span>
                  <button onClick={addCondition} className="btn btn-xs">+ Add</button>
                </label>
                <div className="space-y-2">
                  {formData.conditions.map((condition, index) => (
                    <div key={index} className="flex gap-2 items-center">
                      <input
                        type="text"
                        value={condition.field}
                        onChange={(e) => updateCondition(index, { field: e.target.value })}
                        className="input input-sm input-bordered flex-1"
                        placeholder="field name"
                      />
                      <select
                        value={condition.operator}
                        onChange={(e) => updateCondition(index, { 
                          operator: e.target.value as WebhookCondition['operator'] 
                        })}
                        className="select select-sm select-bordered"
                      >
                        <option value="equals">equals</option>
                        <option value="contains">contains</option>
                        <option value="greater_than">greater than</option>
                        <option value="less_than">less than</option>
                        <option value="exists">exists</option>
                        <option value="not_exists">not exists</option>
                      </select>
                      <input
                        type="text"
                        value={condition.value !== undefined ? String(condition.value) : ''}
                        onChange={(e) => updateCondition(index, { 
                          value: e.target.value === '' ? undefined : e.target.value 
                        })}
                        className="input input-sm input-bordered w-32"
                        placeholder="value"
                      />
                      <button 
                        onClick={() => removeCondition(index)}
                        className="btn btn-sm btn-square btn-error btn-outline"
                      >✕</button>
                    </div>
                  ))}
                </div>
                <label className="label">
                  <span className="label-text-alt">Payload must match all conditions to trigger</span>
                </label>
              </div>
              
              <div className="form-control">
                <label className="cursor-pointer label justify-start gap-3">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="checkbox checkbox-primary"
                  />
                  <span className="label-text">Active</span>
                </label>
              </div>
            </div>
            <div className="modal-action">
              <button onClick={() => setShowCreateModal(false)} className="btn">Cancel</button>
              <button onClick={handleCreate} className="btn btn-primary">Create Webhook</button>
            </div>
          </div>
          <div className="modal-backdrop" onClick={() => setShowCreateModal(false)} />
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && selectedWebhook && (
        <div className="modal modal-open">
          <div className="modal-box max-w-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="font-bold text-lg">Edit Webhook</h3>
            <p className="text-sm text-gray-500 font-mono">{selectedWebhook.id}</p>
            
            {/* Secret Display/Copy */}
            {newWebhookSecret && (
              <div className="alert alert-warning mt-4">
                <div>
                  <p className="font-bold">⚠️ New Secret Generated!</p>
                  <p className="text-sm break-all font-mono">{newWebhookSecret}</p>
                  <p className="text-xs mt-1">Copy this now - it won&apos;t be shown again!</p>
                </div>
                <button 
                  onClick={() => navigator.clipboard.writeText(newWebhookSecret || '')}
                  className="btn btn-sm"
                >Copy</button>
              </div>
            )}
            
            <div className="py-4 space-y-4">
              <div className="form-control">
                <label className="label"><span className="label-text">Name *</span></label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="input input-bordered"
                />
              </div>
              
              <div className="form-control">
                <label className="label"><span className="label-text">Description</span></label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="textarea textarea-bordered"
                />
              </div>
              
              <div className="form-control">
                <label className="label"><span className="label-text">Endpoint URL *</span></label>
                <input
                  type="url"
                  value={formData.endpointUrl}
                  onChange={(e) => setFormData({ ...formData, endpointUrl: e.target.value })}
                  className="input input-bordered"
                />
              </div>
              
              <div className="form-control">
                <label className="label">
                  <span className="label-text">New Secret</span>
                  <button onClick={handleRegenerateSecret} className="btn btn-xs btn-warning">
                    Regenerate
                  </button>
                </label>
                <input
                  type="text"
                  value={formData.secret}
                  onChange={(e) => setFormData({ ...formData, secret: e.target.value })}
                  className="input input-bordered font-mono"
                  placeholder="Leave empty to keep current"
                />
                <label className="label">
                  <span className="label-text-alt">Current secret is hidden for security</span>
                </label>
              </div>
              
              <div className="form-control">
                <label className="label"><span className="label-text">Badge *</span></label>
                <select
                  value={formData.badgeId}
                  onChange={(e) => setFormData({ ...formData, badgeId: parseInt(e.target.value) })}
                  className="select select-bordered"
                >
                  <option value={0}>Select a badge...</option>
                  {badges.map((badge) => (
                    <option key={badge.id} value={badge.id}>
                      #{badge.id} - {badge.name}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="form-control">
                <label className="label"><span className="label-text">Default Target Wallet</span></label>
                <input
                  type="text"
                  value={formData.targetWallet}
                  onChange={(e) => setFormData({ ...formData, targetWallet: e.target.value })}
                  className="input input-bordered font-mono"
                />
              </div>
              
              <div className="form-control">
                <label className="label">
                  <span className="label-text">Conditions</span>
                  <button onClick={addCondition} className="btn btn-xs">+ Add</button>
                </label>
                <div className="space-y-2">
                  {formData.conditions.map((condition, index) => (
                    <div key={index} className="flex gap-2 items-center">
                      <input
                        type="text"
                        value={condition.field}
                        onChange={(e) => updateCondition(index, { field: e.target.value })}
                        className="input input-sm input-bordered flex-1"
                      />
                      <select
                        value={condition.operator}
                        onChange={(e) => updateCondition(index, { 
                          operator: e.target.value as WebhookCondition['operator'] 
                        })}
                        className="select select-sm select-bordered"
                      >
                        <option value="equals">equals</option>
                        <option value="contains">contains</option>
                        <option value="greater_than">greater than</option>
                        <option value="less_than">less than</option>
                        <option value="exists">exists</option>
                        <option value="not_exists">not exists</option>
                      </select>
                      <input
                        type="text"
                        value={condition.value !== undefined ? String(condition.value) : ''}
                        onChange={(e) => updateCondition(index, { 
                          value: e.target.value === '' ? undefined : e.target.value 
                        })}
                        className="input input-sm input-bordered w-32"
                      />
                      <button 
                        onClick={() => removeCondition(index)}
                        className="btn btn-sm btn-square btn-error btn-outline"
                      >✕</button>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="form-control">
                <label className="cursor-pointer label justify-start gap-3">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="checkbox checkbox-primary"
                  />
                  <span className="label-text">Active</span>
                </label>
              </div>
            </div>
            <div className="modal-action">
              <button onClick={() => { setShowEditModal(false); setSelectedWebhook(null); setNewWebhookSecret(null); }} className="btn">
                Close
              </button>
              <button onClick={handleUpdate} className="btn btn-primary">Save Changes</button>
            </div>
          </div>
          <div className="modal-backdrop" onClick={() => { setShowEditModal(false); setSelectedWebhook(null); setNewWebhookSecret(null); }} />
        </div>
      )}

      {/* Delete Confirmation */}
      {showDeleteConfirm && selectedWebhook && (
        <div className="modal modal-open">
          <div className="modal-box">
            <h3 className="font-bold text-lg">Delete Webhook</h3>
            <p className="py-4">
              Are you sure you want to delete <strong>{selectedWebhook.name}</strong>?
            </p>
            <p className="text-sm text-gray-500">
              This action cannot be undone. The webhook endpoint will stop receiving events.
            </p>
            <div className="modal-action">
              <button onClick={() => { setShowDeleteConfirm(false); setSelectedWebhook(null); }} className="btn">
                Cancel
              </button>
              <button onClick={handleDelete} className="btn btn-error">
                Delete Webhook
              </button>
            </div>
          </div>
          <div className="modal-backdrop" onClick={() => { setShowDeleteConfirm(false); setSelectedWebhook(null); }} />
        </div>
      )}

      {/* Test Modal */}
      {showTestModal && selectedWebhook && (
        <div className="modal modal-open">
          <div className="modal-box max-w-3xl max-h-[90vh] overflow-y-auto">
            <h3 className="font-bold text-lg">Test Webhook</h3>
            <p className="text-sm text-gray-500 font-mono">{selectedWebhook.name}</p>
            
            <div className="py-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Payload Input */}
                <div className="form-control">
                  <label className="label"><span className="label-text">Test Payload (JSON)</span></label>
                  <textarea
                    value={testPayload}
                    onChange={(e) => setTestPayload(e.target.value)}
                    className="textarea textarea-bordered font-mono text-sm h-64"
                    placeholder='{"wallet": "WALLET_ADDRESS"}'
                  />
                  <label className="label">
                    <span className="label-text-alt">Must include wallet or targetWallet field</span>
                  </label>
                </div>
                
                {/* Test Result */}
                <div className="form-control">
                  <label className="label"><span className="label-text">Test Result</span></label>
                  {testResult ? (
                    <pre className="bg-base-300 rounded-lg p-4 text-xs overflow-auto h-64 whitespace-pre-wrap">
                      {testResult}
                    </pre>
                  ) : (
                    <div className="bg-base-300 rounded-lg p-4 h-64 flex items-center justify-center text-gray-500">
                      Click &quot;Run Test&quot; to see results
                    </div>
                  )}
                </div>
              </div>
              
              {/* Debug Info */}
              {testResult && (
                <div className="alert alert-info">
                  <div className="text-sm">
                    <p className="font-bold">Testing Tips:</p>
                    <ul className="list-disc list-inside mt-1">
                      <li>Use the <code className="bg-base-300 px-1 rounded">x-webhook-signature</code> header with <code className="bg-base-300 px-1 rounded">sha256=YOUR_SECRET</code> in production</li>
                      <li>Include the <code className="bg-base-300 px-1 rounded">x-webhook-id</code> header with your webhook ID</li>
                      <li>Conditions must pass AND a wallet must be specified for badge issuance</li>
                    </ul>
                  </div>
                </div>
              )}
            </div>
            
            <div className="modal-action">
              <button onClick={() => { setShowTestModal(false); setSelectedWebhook(null); setTestResult(null); }} className="btn">
                Close
              </button>
              <button onClick={handleTest} className="btn btn-primary" disabled={testLoading}>
                {testLoading ? (
                  <span className="loading loading-spinner loading-sm"></span>
                ) : (
                  'Run Test'
                )}
              </button>
            </div>
          </div>
          <div className="modal-backdrop" onClick={() => { setShowTestModal(false); setSelectedWebhook(null); setTestResult(null); }} />
        </div>
      )}
    </div>
  );
}
