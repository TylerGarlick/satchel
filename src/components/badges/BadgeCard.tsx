'use client';

import React from 'react';
import type { Badge } from '@/types/badge';

export function BadgeCard({ badge }: { badge: Badge }) {
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };
  
  const shortAddress = (addr: string) => {
    if (addr.length <= 16) return addr;
    return `${addr.slice(0, 8)}...${addr.slice(-8)}`;
  };

  return (
    <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden hover:border-cyan-500/50 transition-colors">
      <div className="aspect-square bg-gray-700 relative">
        <img
          src={badge.image}
          alt={badge.name}
          className="w-full h-full object-cover"
          onError={(e) => {
            (e.target as HTMLImageElement).src = `https://via.placeholder.com/400x400/6b7280/ffffff?text=${encodeURIComponent(badge.name)}`;
          }}
        />
      </div>
      <div className="p-4">
        <h3 className="font-semibold text-lg mb-1 truncate" title={badge.name}>
          {badge.name}
        </h3>
        <p className="text-gray-400 text-sm mb-3 line-clamp-2" title={badge.description}>
          {badge.description}
        </p>
        <div className="space-y-1 text-xs text-gray-500">
          <div className="flex justify-between">
            <span className="font-medium text-gray-400">Issuer:</span>
            <span className="font-mono" title={badge.issuer}>
              {shortAddress(badge.issuer)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="font-medium text-gray-400">Earned:</span>
            <span>{formatDate(badge.earnedAt)}</span>
          </div>
          <div className="flex justify-between">
            <span className="font-medium text-gray-400">ASA ID:</span>
            <span className="font-mono">{badge.id.toLocaleString()}</span>
          </div>
          {badge.ipfsHash && (
            <div className="flex justify-between">
              <span className="font-medium text-gray-400">IPFS:</span>
              <span className="font-mono truncate max-w-[120px]" title={badge.ipfsHash}>
                {badge.ipfsHash.slice(0, 12)}...
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function BadgeCardSkeleton() {
  return (
    <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden animate-pulse">
      <div className="aspect-square bg-gray-700" />
      <div className="p-4 space-y-3">
        <div className="h-5 bg-gray-700 rounded w-3/4" />
        <div className="space-y-2">
          <div className="h-3 bg-gray-700 rounded" />
          <div className="h-3 bg-gray-700 rounded w-2/3" />
        </div>
        <div className="pt-2 space-y-2">
          <div className="h-3 bg-gray-700 rounded w-1/2" />
          <div className="h-3 bg-gray-700 rounded w-1/3" />
        </div>
      </div>
    </div>
  );
}
