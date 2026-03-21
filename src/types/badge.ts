// Badge types for Satchel NFT badges

export interface Badge {
  id: number;           // Algorand ASA ID
  name: string;
  description: string;
  image: string;        // URL or IPFS hash
  issuer: string;       // Address that issued the badge
  earnedAt: string;     // ISO date string
  ipfsHash?: string;    // Optional IPFS hash for metadata
}

export interface SatchelAssetParams {
  readonly id: number;
  readonly params: {
    readonly creator: string;
    readonly name?: string;
    readonly "unit-name"?: string;
    readonly total?: bigint;
    readonly decimals?: number;
    readonly defaultFrozen?: boolean;
    readonly url?: string;
    readonly metadataHash?: Uint8Array;
    readonly note?: Uint8Array;
  };
}

// ARC69 note structure for Satchel badges
export interface ARC69Note {
  standard: 'arc69';
  description?: string;
  image?: string;
  image_integrity?: string;
  image_mimetype?: string;
  external_url?: string;
  external_url_integrity?: string;
  external_url_mimetype?: string;
  properties?: Record<string, unknown>;
  attributes?: Array<{
    trait_type?: string;
    value?: string | number;
    display_type?: string;
  }>;
  // Satchel-specific fields
  issuer?: string;
  badge_id?: string;
  earned_at?: string;
  criteria?: string;
}

// Filter and sort options
export type BadgeSortOption = 'date_desc' | 'date_asc' | 'name_asc' | 'name_desc' | 'issuer';
export type BadgeFilterOption = 'all' | 'by_issuer' | 'by_name';

export interface BadgeFilterState {
  sortBy: BadgeSortOption;
  filterBy: BadgeFilterOption;
  searchQuery: string;
  selectedIssuer: string | null;
}

// Algorand indexer API response types
export interface AccountAssetsResponse {
  assets: Array<{
    'asset-id': number;
    amount: number;
    'is-frozen': boolean;
    'created-at-round': number;
  }>;
  'next-token'?: string;
}

export interface AssetInfoResponse {
  asset: {
    index: number;
    params: {
      creator: string;
      name?: string;
      "unit-name"?: string;
      total?: string;
      decimals?: number;
      defaultFrozen?: boolean;
      url?: string;
      metadataHash?: string;
    };
    "created-at-round": number;
  };
}
