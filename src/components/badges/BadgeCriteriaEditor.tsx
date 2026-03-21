'use client';

import { useState } from 'react';
import type { BadgeCriteria, BadgeRequirement, BadgeState } from '@/types/badge';

interface BadgeCriteriaEditorProps {
  criteria: BadgeCriteria;
  onChange: (criteria: BadgeCriteria) => void;
  disabled?: boolean;
}

export function BadgeCriteriaEditor({ criteria, onChange, disabled = false }: BadgeCriteriaEditorProps) {
  const [criteriaType, setCriteriaType] = useState<'json_schema' | 'structured'>(criteria.type);
  const [schemaText, setSchemaText] = useState(
    criteria.schema ? JSON.stringify(criteria.schema, null, 2) : ''
  );
  const [requirements, setRequirements] = useState<BadgeRequirement[]>(
    criteria.requirements || []
  );

  const handleTypeChange = (type: 'json_schema' | 'structured') => {
    setCriteriaType(type);
    onChange({
      ...criteria,
      type,
      schema: type === 'json_schema' ? criteria.schema : undefined,
      requirements: type === 'structured' ? requirements : undefined
    });
  };

  const handleSchemaChange = (text: string) => {
    setSchemaText(text);
    try {
      const schema = JSON.parse(text);
      onChange({
        ...criteria,
        type: 'json_schema',
        schema
      });
    } catch {
      // Invalid JSON, don't update
    }
  };

  const addRequirement = () => {
    const newRequirement: BadgeRequirement = {
      id: `req_${Date.now()}`,
      type: 'wallet_holds',
      description: '',
      params: {}
    };
    const updated = [...requirements, newRequirement];
    setRequirements(updated);
    onChange({
      ...criteria,
      type: 'structured',
      requirements: updated
    });
  };

  const updateRequirement = (index: number, updates: Partial<BadgeRequirement>) => {
    const updated = requirements.map((req, i) => 
      i === index ? { ...req, ...updates } : req
    );
    setRequirements(updated);
    onChange({
      ...criteria,
      type: 'structured',
      requirements: updated
    });
  };

  const removeRequirement = (index: number) => {
    const updated = requirements.filter((_, i) => i !== index);
    setRequirements(updated);
    onChange({
      ...criteria,
      type: 'structured',
      requirements: updated
    });
  };

  return (
    <div className="space-y-4">
      {/* Criteria Type Toggle */}
      <div className="flex gap-4">
        <label className="flex items-center gap-2">
          <input
            type="radio"
            name="criteriaType"
            value="structured"
            checked={criteriaType === 'structured'}
            onChange={() => handleTypeChange('structured')}
            disabled={disabled}
            className="radio radio-primary"
          />
          <span>Structured Requirements</span>
        </label>
        <label className="flex items-center gap-2">
          <input
            type="radio"
            name="criteriaType"
            value="json_schema"
            checked={criteriaType === 'json_schema'}
            onChange={() => handleTypeChange('json_schema')}
            disabled={disabled}
            className="radio radio-primary"
          />
          <span>JSON Schema</span>
        </label>
      </div>

      {/* Structured Requirements Editor */}
      {criteriaType === 'structured' && (
        <div className="space-y-4 pl-4 border-l-2 border-primary-500">
          <div className="flex justify-between items-center">
            <h4 className="font-semibold">Requirements</h4>
            <button
              type="button"
              onClick={addRequirement}
              disabled={disabled}
              className="btn btn-sm btn-primary"
            >
              + Add Requirement
            </button>
          </div>
          
          {requirements.length === 0 && (
            <p className="text-sm text-gray-500 italic">No requirements defined yet.</p>
          )}

          {requirements.map((req, index) => (
            <div key={req.id} className="card bg-base-200 p-4 space-y-3">
              <div className="flex justify-between items-start">
                <select
                  value={req.type}
                  onChange={(e) => updateRequirement(index, { 
                    type: e.target.value as BadgeRequirement['type']
                  })}
                  disabled={disabled}
                  className="select select-sm select-bordered"
                >
                  <option value="wallet_holds">Wallet Holds Asset</option>
                  <option value="transaction_count">Transaction Count</option>
                  <option value="asset_ownership">Asset Ownership</option>
                  <option value="custom">Custom</option>
                </select>
                <button
                  type="button"
                  onClick={() => removeRequirement(index)}
                  disabled={disabled}
                  className="btn btn-sm btn-ghost btn-circle text-error"
                >
                  ✕
                </button>
              </div>
              
              <div className="form-control">
                <label className="label">
                  <span className="label-text">Description</span>
                </label>
                <input
                  type="text"
                  value={req.description}
                  onChange={(e) => updateRequirement(index, { description: e.target.value })}
                  disabled={disabled}
                  placeholder="Describe what this requirement checks"
                  className="input input-bordered input-sm"
                />
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text">Parameters (JSON)</span>
                </label>
                <textarea
                  value={JSON.stringify(req.params, null, 2)}
                  onChange={(e) => {
                    try {
                      updateRequirement(index, { params: JSON.parse(e.target.value) });
                    } catch {
                      // Invalid JSON
                    }
                  }}
                  disabled={disabled}
                  placeholder='{"assetId": 123456, "minAmount": 1}'
                  className="textarea textarea-bordered textarea-sm font-mono text-xs"
                  rows={3}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* JSON Schema Editor */}
      {criteriaType === 'json_schema' && (
        <div className="space-y-2 pl-4 border-l-2 border-secondary-500">
          <label className="label">
            <span className="label-text font-semibold">JSON Schema</span>
          </label>
          <textarea
            value={schemaText}
            onChange={(e) => handleSchemaChange(e.target.value)}
            disabled={disabled}
            placeholder='{"type": "object", "properties": {...}}'
            className="textarea textarea-bordered font-mono text-xs"
            rows={10}
          />
          {schemaText && (
            <div className="text-xs text-gray-500">
              {(() => {
                try {
                  JSON.parse(schemaText);
                  return <span className="text-success">✓ Valid JSON Schema</span>;
                } catch {
                  return <span className="text-error">✗ Invalid JSON</span>;
                }
              })()}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

interface BadgeFormFieldsProps {
  name: string;
  description: string;
  image: string;
  state: BadgeState;
  onChange: (field: string, value: string | BadgeState) => void;
  disabled?: boolean;
}

export function BadgeFormFields({
  name,
  description,
  image,
  state,
  onChange,
  disabled = false
}: BadgeFormFieldsProps) {
  return (
    <div className="space-y-4">
      <div className="form-control">
        <label className="label">
          <span className="label-text">Badge Name *</span>
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => onChange('name', e.target.value)}
          disabled={disabled}
          placeholder="e.g., Early Adopter, Contributor, Expert"
          className="input input-bordered"
          required
        />
      </div>

      <div className="form-control">
        <label className="label">
          <span className="label-text">Description *</span>
        </label>
        <textarea
          value={description}
          onChange={(e) => onChange('description', e.target.value)}
          disabled={disabled}
          placeholder="Describe who earns this badge and what it represents"
          className="textarea textarea-bordered"
          rows={3}
          required
        />
      </div>

      <div className="form-control">
        <label className="label">
          <span className="label-text">Image URL or IPFS Hash *</span>
        </label>
        <input
          type="text"
          value={image}
          onChange={(e) => onChange('image', e.target.value)}
          disabled={disabled}
          placeholder="ipfs://Qm... or https://..."
          className="input input-bordered font-mono text-sm"
          required
        />
        <label className="label">
          <span className="label-text-alt text-gray-500">
            IPFS hash or URL pointing to badge image
          </span>
        </label>
      </div>

      <div className="form-control">
        <label className="label">
          <span className="label-text">Badge State</span>
        </label>
        <select
          value={state}
          onChange={(e) => onChange('state', e.target.value as BadgeState)}
          disabled={disabled}
          className="select select-bordered"
        >
          <option value="draft">Draft</option>
          <option value="active">Active</option>
          <option value="archived">Archived</option>
        </select>
        <label className="label">
          <span className="label-text-alt text-gray-500">
            Draft → Active → Archived (one-way transitions)
          </span>
        </label>
      </div>
    </div>
  );
}

interface StateTransitionBadgeProps {
  state: BadgeState | undefined;
}

export function StateTransitionBadge({ state }: StateTransitionBadgeProps) {
  const currentState = state || 'draft';
  const stateConfig: Record<BadgeState, { color: string; icon: string }> = {
    draft: { color: 'badge-warning', icon: '📝' },
    active: { color: 'badge-success', icon: '✓' },
    archived: { color: 'badge-neutral', icon: '📦' }
  };

  const config = stateConfig[currentState];

  return (
    <span className={`badge ${config.color} badge-lg`}>
      {config.icon} {currentState.charAt(0).toUpperCase() + currentState.slice(1)}
    </span>
  );
}
