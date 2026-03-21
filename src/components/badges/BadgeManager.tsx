'use client';

import { useState, useEffect, useCallback } from 'react';
import type { Badge, BadgeDefinition, BadgeCriteria, BadgeState } from '@/types/badge';
import { BadgeCriteriaEditor, BadgeFormFields, StateTransitionBadge } from './BadgeCriteriaEditor';

interface BadgeManagerProps {
  adminAddress?: string | null;
  isAdmin?: boolean | null;
}

export function BadgeManager({ adminAddress, isAdmin = false }: BadgeManagerProps) {
  const [badges, setBadges] = useState<Badge[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [stateFilter, setStateFilter] = useState<BadgeState | 'all'>('all');
  
  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectedBadge, setSelectedBadge] = useState<Badge | null>(null);
  
  // Form state
  const [formData, setFormData] = useState<{
    name: string;
    description: string;
    image: string;
    state: BadgeState;
    criteria: BadgeCriteria;
  }>({
    name: '',
    description: '',
    image: '',
    state: 'draft',
    criteria: { type: 'structured', version: '1.0', requirements: [] }
  });

  const fetchBadges = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params = new URLSearchParams();
      if (searchQuery) params.set('search', searchQuery);
      if (stateFilter !== 'all') params.set('state', stateFilter);
      
      const res = await fetch(`/api/badges?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to fetch badges');
      
      const data = await res.json();
      setBadges(data.badges);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [searchQuery, stateFilter]);

  useEffect(() => {
    fetchBadges();
  }, [fetchBadges]);

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      image: '',
      state: 'draft',
      criteria: { type: 'structured', version: '1.0', requirements: [] }
    });
  };

  const openCreateModal = () => {
    if (!isAdmin) {
      setError('Only administrators can create badges');
      return;
    }
    resetForm();
    setShowCreateModal(true);
  };

  const openEditModal = (badge: Badge) => {
    if (!isAdmin) {
      setError('Only administrators can edit badges');
      return;
    }
    setSelectedBadge(badge);
    setFormData({
      name: badge.name,
      description: badge.description,
      image: badge.image,
      state: badge.state || 'draft',
      criteria: badge.criteria || { type: 'structured', version: '1.0', requirements: [] }
    });
    setShowEditModal(true);
  };

  const openDeleteConfirm = (badge: Badge) => {
    if (!isAdmin) {
      setError('Only administrators can delete badges');
      return;
    }
    setSelectedBadge(badge);
    setShowDeleteConfirm(true);
  };

  const handleCreate = async () => {
    try {
      const res = await fetch('/api/badges', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to create badge');
      }
      
      setShowCreateModal(false);
      resetForm();
      fetchBadges();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create badge');
    }
  };

  const handleUpdate = async () => {
    if (!selectedBadge) return;
    
    try {
      const res = await fetch(`/api/badges/${selectedBadge.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to update badge');
      }
      
      setShowEditModal(false);
      setSelectedBadge(null);
      fetchBadges();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update badge');
    }
  };

  const handleDelete = async () => {
    if (!selectedBadge) return;
    
    try {
      const res = await fetch(`/api/badges/${selectedBadge.id}`, {
        method: 'DELETE'
      });
      
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to delete badge');
      }
      
      setShowDeleteConfirm(false);
      setSelectedBadge(null);
      fetchBadges();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete badge');
    }
  };

  const handleStateTransition = async (badge: Badge, newState: BadgeState) => {
    try {
      const res = await fetch(`/api/badges/${badge.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ state: newState })
      });
      
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to update badge state');
      }
      
      fetchBadges();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update badge state');
    }
  };

  const getNextState = (current: BadgeState | undefined): BadgeState | null => {
    const state = current || 'draft';
    const transitions: Record<BadgeState, BadgeState | null> = {
      'draft': 'active',
      'active': 'archived',
      'archived': null
    };
    return transitions[state];
  };

  if (!isAdmin && !adminAddress) {
    return (
      <div className="alert alert-warning">
        <span>Connect your wallet to view badge management</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-bold">Badge Management</h2>
        {isAdmin && (
          <button onClick={openCreateModal} className="btn btn-primary">
            + Create Badge
          </button>
        )}
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="form-control flex-1">
          <div className="input-group">
            <input
              type="text"
              placeholder="Search badges..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input input-bordered w-full"
            />
            <button className="btn btn-square">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>
          </div>
        </div>
        <select
          value={stateFilter}
          onChange={(e) => setStateFilter(e.target.value as BadgeState | 'all')}
          className="select select-bordered"
        >
          <option value="all">All States</option>
          <option value="draft">Draft</option>
          <option value="active">Active</option>
          <option value="archived">Archived</option>
        </select>
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

      {/* Badge List */}
      {!loading && (
        <div className="grid gap-4">
          {badges.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No badges found. {isAdmin && 'Create your first badge to get started.'}
            </div>
          ) : (
            badges.map((badge) => (
              <div key={badge.id} className="card bg-base-200 shadow">
                <div className="card-body">
                  <div className="flex flex-col sm:flex-row gap-4">
                    {/* Badge Image */}
                    <div className="w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden bg-base-300">
                      {badge.image.startsWith('ipfs://') ? (
                        <img
                          src={`https://ipfs.io/ipfs/${badge.image.replace('ipfs://', '')}`}
                          alt={badge.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <img
                          src={badge.image}
                          alt={badge.name}
                          className="w-full h-full object-cover"
                        />
                      )}
                    </div>
                    
                    {/* Badge Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h3 className="card-title">{badge.name}</h3>
                          <StateTransitionBadge state={badge.state} />
                        </div>
                        <div className="text-sm text-gray-500">ID: {badge.id}</div>
                      </div>
                      <p className="text-sm mt-1">{badge.description}</p>
                      {badge.criteria && (
                        <p className="text-xs text-gray-400 mt-1">
                          {badge.criteria.type === 'structured' 
                            ? `${badge.criteria.requirements?.length || 0} requirement(s)`
                            : 'JSON Schema criteria'
                          }
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  {isAdmin && (
                    <div className="card-actions justify-end items-center mt-4 pt-4 border-t border-base-300">
                      {/* State Transition */}
                      {getNextState(badge.state) && (
                        <button
                          onClick={() => handleStateTransition(badge, getNextState(badge.state)!)}
                          className="btn btn-sm btn-outline"
                        >
                          Move to {getNextState(badge.state)}
                        </button>
                      )}
                      
                      <button
                        onClick={() => openEditModal(badge)}
                        className="btn btn-sm btn-primary"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => openDeleteConfirm(badge)}
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
          <div className="modal-box max-w-2xl">
            <h3 className="font-bold text-lg">Create New Badge</h3>
            <div className="py-4 space-y-4">
              <BadgeFormFields
                name={formData.name}
                description={formData.description}
                image={formData.image}
                state={formData.state}
                onChange={(field, value) => setFormData({ ...formData, [field]: value })}
              />
              
              <div className="divider">Criteria</div>
              
              <BadgeCriteriaEditor
                criteria={formData.criteria}
                onChange={(criteria) => setFormData({ ...formData, criteria })}
              />
            </div>
            <div className="modal-action">
              <button onClick={() => setShowCreateModal(false)} className="btn">
                Cancel
              </button>
              <button onClick={handleCreate} className="btn btn-primary">
                Create Badge
              </button>
            </div>
          </div>
          <div className="modal-backdrop" onClick={() => setShowCreateModal(false)} />
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && selectedBadge && (
        <div className="modal modal-open">
          <div className="modal-box max-w-2xl">
            <h3 className="font-bold text-lg">Edit Badge</h3>
            <p className="text-sm text-gray-500">ID: {selectedBadge.id}</p>
            <div className="py-4 space-y-4">
              <BadgeFormFields
                name={formData.name}
                description={formData.description}
                image={formData.image}
                state={formData.state}
                onChange={(field, value) => setFormData({ ...formData, [field]: value })}
              />
              
              <div className="divider">Criteria</div>
              
              <BadgeCriteriaEditor
                criteria={formData.criteria}
                onChange={(criteria) => setFormData({ ...formData, criteria })}
              />
            </div>
            <div className="modal-action">
              <button onClick={() => { setShowEditModal(false); setSelectedBadge(null); }} className="btn">
                Cancel
              </button>
              <button onClick={handleUpdate} className="btn btn-primary">
                Save Changes
              </button>
            </div>
          </div>
          <div className="modal-backdrop" onClick={() => { setShowEditModal(false); setSelectedBadge(null); }} />
        </div>
      )}

      {/* Delete Confirmation */}
      {showDeleteConfirm && selectedBadge && (
        <div className="modal modal-open">
          <div className="modal-box">
            <h3 className="font-bold text-lg">Delete Badge</h3>
            <p className="py-4">
              Are you sure you want to delete <strong>{selectedBadge.name}</strong>?
            </p>
            <p className="text-sm text-gray-500">
              This will soft-delete the badge. It can be restored later if needed.
            </p>
            <div className="modal-action">
              <button onClick={() => { setShowDeleteConfirm(false); setSelectedBadge(null); }} className="btn">
                Cancel
              </button>
              <button onClick={handleDelete} className="btn btn-error">
                Delete Badge
              </button>
            </div>
          </div>
          <div className="modal-backdrop" onClick={() => { setShowDeleteConfirm(false); setSelectedBadge(null); }} />
        </div>
      )}
    </div>
  );
}
