# Satchel-Compatible App Integration Guide

This guide explains how to integrate third-party applications with Satchel, enabling badge-based feature authorization for Algorand wallets.

## Table of Contents

1. [Overview](#overview)
2. [API Endpoint Specification](#api-endpoint-specification)
3. [Client-Side Integration](#client-side-integration)
4. [SDK / Embed Snippet](#sdk--embed-snippet)
5. [Integration Checklist](#integration-checklist)
6. [Example Implementation Walkthrough](#example-implementation-walkthrough)
7. [Security Considerations](#security-considerations)
8. [Support & Contact](#support--contact)

---

## Overview

Satchel is an NFT badge authorization system built on Algorand. Users earn badges by satisfying criteria (defined by issuers), receiving them as Algorand Standard Assets (ASAs). Third-party applications can become "Satchel-compatible" by:

1. Detecting when a user connects their Algorand wallet
2. Querying the Satchel API to fetch the user's badge holdings
3. Conditionally enabling features based on badge ownership

### The Compatibility Model

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    SATCHEL COMPATIBILITY FLOW                           │
└─────────────────────────────────────────────────────────────────────────┘

   USER                    YOUR APP                    SATCHEL API
    │                          │                             │
    │  1. Connect Wallet       │                             │
    │─────────────────────────>│                             │
    │                          │                             │
    │                          │  2. GET /badges/:wallet     │
    │                          │────────────────────────────>│
    │                          │                             │
    │                          │  3. Badge List Response     │
    │                          │<────────────────────────────│
    │                          │                             │
    │  4. Conditional Access   │                             │
    │  (Feature unlocked if     │                             │
    │   required badge held)   │                             │
    │<─────────────────────────│                             │
    │                          │                             │
```

### Badge as Authorization Token

A Satchel badge is an Algorand ASA with metadata identifying it as a Satchel badge. The badge proves:
- The wallet holder was awarded the badge by an issuer
- The badge meets the criteria defined at creation
- The badge is still held by the wallet (non-transferable without wallet compromise)

**Key limitation:** Badge presence proves the wallet holds the badge now, but cannot prove who originally earned it or whether it was transferred.

---

## API Endpoint Specification

### GET /badges/:wallet

Fetches all Satchel badges held by a specific Algorand wallet address.

**Endpoint:**
```
GET https://api.satchel.example/api/badges/{walletAddress}
```

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `walletAddress` | string | Algorand wallet address (32 chars, base32) |

**Headers:**

| Header | Value | Required |
|--------|-------|----------|
| `Accept` | `application/json` | Yes |

**Response Schema (200 OK):**

```json
{
  "address": "WXYZABCD1234567890EFGHIJKMNOPQRSTUVWXYZ",
  "badges": [
    {
      "id": 123456789,
      "name": "Early Contributor",
      "description": "Awarded to early contributors of the Satchel ecosystem",
      "image": "https://ipfs.io/ipfs/QmXxx.../badge.png",
      "ipfsHash": "QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco",
      "issuer": "WXYZ...ISSUER",
      "earnedAt": "2024-01-15T10:30:00Z",
      "criteria": "manual",
      "collection": "Satchel",
      "badgeType": "early_contributor",
      "version": "1.0"
    }
  ],
  "totalCount": 1,
  "network": "testnet",
  "fetchedAt": "2024-03-20T15:45:00Z"
}
```

**Response Fields:**

| Field | Type | Description |
|-------|------|-------------|
| `address` | string | The queried wallet address |
| `badges` | array | Array of badge objects |
| `badges[].id` | number | Algorand ASA ID |
| `badges[].name` | string | Human-readable badge name |
| `badges[].description` | string | Detailed description |
| `badges[].image` | string | URL to badge image (IPFS or HTTP) |
| `badges[].ipfsHash` | string | IPFS content hash (if stored on IPFS) |
| `badges[].issuer` | string | Algorand address of the badge issuer |
| `badges[].earnedAt` | string | ISO 8601 timestamp when badge was minted |
| `badges[].criteria` | string | How badge was earned: `"manual"` or `"webhook"` |
| `badges[].collection` | string | Always `"Satchel"` for Satchel badges |
| `badges[].badgeType` | string | Unique identifier for badge type |
| `badges[].version` | string | Satchel standard version (e.g., `"1.0"`) |
| `totalCount` | number | Total number of badges held |
| `network` | string | Algorand network: `"testnet"` or `"mainnet"` |
| `fetchedAt` | string | ISO 8601 timestamp of API response |

**Error Responses:**

| Status | Code | Description |
|--------|------|-------------|
| `400` | `INVALID_ADDRESS` | Wallet address format is invalid |
| `404` | `WALLET_NOT_FOUND` | No badges found for this address |
| `429` | `RATE_LIMITED` | Too many requests, retry after delay |
| `500` | `INTERNAL_ERROR` | Server error, retry later |

**Rate Limits:**
- 100 requests per minute per IP
- 1000 requests per minute per wallet address
- Include `X-Request-Id` header for rate limit debugging

---

## Client-Side Integration

### 1. Detect Connected Algorand Wallet

Satchel supports multiple Algorand wallet providers. Use the `@walletconnect/modal` library for a unified connection experience, or connect directly to specific wallets.

**Using WalletConnect Modal (Recommended):**

```typescript
import { EthereumProvider } from "@walletconnect/ethereum-provider";
import algosdk from "algosdk";

// Initialize WalletConnect
async function initWalletConnect(): Promise<string | null> {
  const provider = await EthereumProvider.init({
    projectId: "YOUR_WALLETCONNECT_PROJECT_ID", // Get from walletconnect.com
    chains: [0], // Algorand MainNet (use 0x1 for testnet)
    showQrModal: true,
  });

  await provider.enable();
  const accounts = await provider.request({ method: "algorand_signTransaction" }) as string[];
  
  return accounts?.[0] ?? null;
}
```

**Direct Pera Wallet Connection:**

```typescript
// Pera Wallet browser extension detection
function getPeraWallet(): { connect: () => Promise<string[]> } | null {
  if (typeof window !== 'undefined' && (window as any).peraWallet) {
    return (window as any).peraWallet;
  }
  return null;
}

async function connectPera(): Promise<string | null> {
  const pera = getPeraWallet();
  if (!pera) {
    throw new Error("Pera Wallet not installed");
  }
  
  const accounts = await pera.connect();
  return accounts?.[0] ?? null;
}
```

**Direct MyAlgo Wallet Connection:**

```typescript
import { MyAlgoWallet } from "@randlabs/myalgo-connect";

const myAlgoWallet = new MyAlgoWallet();

async function connectMyAlgo(): Promise<string | null> {
  const accounts = await myAlgoWallet.connect();
  return accounts?.[0] ?? null;
}
```

### 2. Query Satchel API with Wallet Address

After obtaining the wallet address, query the Satchel API:

```typescript
interface Badge {
  id: number;
  name: string;
  description: string;
  image: string;
  ipfsHash?: string;
  issuer: string;
  earnedAt: string;
  criteria: string;
  collection: string;
  badgeType: string;
  version: string;
}

interface SatchelResponse {
  address: string;
  badges: Badge[];
  totalCount: number;
  network: string;
  fetchedAt: string;
}

async function fetchBadges(walletAddress: string): Promise<SatchelResponse> {
  const response = await fetch(
    `https://api.satchel.example/api/badges/${walletAddress}`,
    {
      headers: {
        "Accept": "application/json",
      },
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to fetch badges");
  }

  return response.json();
}
```

### 3. Check if User Holds Required Badges

Implement badge requirement checking:

```typescript
interface BadgeRequirement {
  badgeType: string;      // e.g., "early_contributor"
  issuer?: string;         // Optional: require specific issuer
  minEarnedAt?: Date;      // Optional: earned before specific date
}

function hasRequiredBadge(
  badges: Badge[],
  requirement: BadgeRequirement
): boolean {
  return badges.some((badge) => {
    if (badge.badgeType !== requirement.badgeType) {
      return false;
    }
    if (requirement.issuer && badge.issuer !== requirement.issuer) {
      return false;
    }
    if (requirement.minEarnedAt) {
      const earnedAt = new Date(badge.earnedAt);
      if (earnedAt < requirement.minEarnedAt) {
        return false;
      }
    }
    return true;
  });
}

// Example: Check for multiple required badges (AND logic)
function hasAllBadges(badges: Badge[], requirements: BadgeRequirement[]): boolean {
  return requirements.every((req) => hasRequiredBadge(badges, req));
}

// Example: Check for any of multiple badges (OR logic)
function hasAnyBadge(badges: Badge[], badgeTypes: string[]): boolean {
  return badges.some((badge) => badgeTypes.includes(badge.badgeType));
}
```

### 4. Conditionally Enable Features

Based on badge ownership, gate your features:

```typescript
interface FeatureGate {
  featureId: string;
  name: string;
  requiredBadges: BadgeRequirement[];
  badgeOperator: "AND" | "OR"; // How to evaluate multiple requirements
}

const FEATURE_GATES: FeatureGate[] = [
  {
    featureId: "premium_content",
    name: "Premium Content Access",
    requiredBadges: [{ badgeType: "early_contributor" }],
    badgeOperator: "AND",
  },
  {
    featureId: "beta_features",
    name: "Beta Features",
    requiredBadges: [
      { badgeType: "beta_tester" },
      { badgeType: "verified_user" },
    ],
    badgeOperator: "OR",
  },
];

function canAccessFeature(badges: Badge[], featureId: string): boolean {
  const gate = FEATURE_GATES.find((g) => g.featureId === featureId);
  if (!gate) return false;

  if (gate.badgeOperator === "AND") {
    return hasAllBadges(badges, gate.requiredBadges);
  }
  return hasAnyBadge(badges, gate.requiredBadges.map((r) => r.badgeType));
}

// React component example
function PremiumContent({ badges }: { badges: Badge[] }) {
  const hasAccess = canAccessFeature(badges, "premium_content");

  if (!hasAccess) {
    return (
      <div className="locked-content">
        <p>🔒 This content requires the Early Contributor badge.</p>
        <a href="/earn-badges">Learn how to earn badges</a>
      </div>
    );
  }

  return <div className="premium-content">{/* Premium content */}</div>;
}
```

---

## SDK / Embed Snippet

For quick integration, use the Satchel client SDK:

### Installation

```bash
npm install @satchel/client
# or
yarn add @satchel/client
# or
pnpm add @satchel/client
```

### Basic Usage

```typescript
import { SatchelClient, WalletProvider } from "@satchel/client";

// Initialize client
const satchel = new SatchelClient({
  network: "testnet", // or "mainnet"
  apiUrl: "https://api.satchel.example", // Optional: self-hosted
});

// Connect wallet
async function connect() {
  const address = await satchel.connect(WalletProvider.PERA);
  console.log("Connected:", address);
  return address;
}

// Fetch user badges
async function getUserBadges(address: string) {
  const { badges } = await satchel.getBadges(address);
  return badges;
}

// Check badge ownership
async function checkAccess(address: string, badgeType: string) {
  return satchel.hasBadge(address, badgeType);
}

// Example: Full React integration
import { useState, useEffect } from "react";

function SatchelGate({
  badgeType,
  children,
  fallback,
}: {
  badgeType: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}) {
  const [hasBadge, setHasBadge] = useState<boolean | null>(null);
  const [badges, setBadges] = useState<any[]>([]);

  useEffect(() => {
    async function checkBadge() {
      if (!satchel.isConnected()) {
        setHasBadge(false);
        return;
      }

      const { badges } = await satchel.getBadges(satchel.getAddress());
      setBadges(badges);
      setHasBadge(satchel.hasBadgeByType(badgeType));
    }

    checkBadge();
  }, [badgeType]);

  if (hasBadge === null) {
    return <div>Loading...</div>;
  }

  return hasBadge ? <>{children}</> : <>{fallback || null}</>;
}

// Usage
function App() {
  return (
    <SatchelGate badgeType="early_contributor" fallback={<LockedMessage />}>
      <PremiumContent />
    </SatchelGate>
  );
}
```

### Direct Algorand Indexer Query (No API)

If you prefer to query badges directly from the Algorand blockchain without using the Satchel API:

```typescript
import algosdk from "algosdk";

const ALGORAND_INDEXER_URL = "https://mainnet-idx.algonode.cloud";
const indexer = new algosdk.Indexer("", ALGORAND_INDEXER_URL, "");

interface OnChainBadge {
  assetId: number;
  name: string;
  unitName: string;
  url: string;
  issuer: string;
  metadataHash: string;
  createdAtRound: number;
}

async function fetchBadgesFromChain(walletAddress: string): Promise<OnChainBadge[]> {
  const response = await indexer
    .lookupAccountAssets(walletAddress)
    .do();

  const badges: OnChainBadge[] = [];

  for (const asset of response.assets) {
    const assetId = asset["asset-id"];
    
    // Skip if amount is 0 (all assets except the last one show 0 when consolidated)
    if (asset.amount === 0) continue;

    try {
      const assetInfo = await indexer.lookupAssetByID(assetId).do();
      const params = assetInfo.asset.params;

      // Check if this is a Satchel badge by parsing ARC69 metadata
      let noteData: any = null;
      if (params.note) {
        try {
          const noteBase64 = Buffer.from(params.note).toString("base64");
          const noteJson = atob(noteBase64);
          noteData = JSON.parse(noteJson);
        } catch {
          // Not valid JSON, skip
        }
      }

      // Detect Satchel badge by collection marker or URL pattern
      const isSatchel =
        params.url?.includes("satchel") ||
        noteData?.properties?.collection === "Satchel" ||
        noteData?.badge_id;

      if (isSatchel) {
        badges.push({
          assetId,
          name: params.name || "",
          unitName: params["unit-name"] || "",
          url: params.url || "",
          issuer: params.creator,
          metadataHash: params.metadataHash
            ? Buffer.from(params.metadataHash).toString("hex")
            : "",
          createdAtRound: asset["created-at-round"],
        });
      }
    } catch (error) {
      console.warn(`Failed to fetch asset ${assetId}:`, error);
    }
  }

  return badges;
}
```

---

## Integration Checklist

### Prerequisites

- [ ] Node.js 18+ or Bun 1.0+
- [ ] Algorand wallet (Pera, MyAlgo, or WalletConnect-compatible)
- [ ] Access to Algorand TestNet or MainNet
- [ ] (Optional) WalletConnect Project ID from [walletconnect.com](https://walletconnect.com)

### Integration Steps

#### Phase 1: Wallet Connection

- [ ] Implement wallet detection for Pera Wallet browser extension
- [ ] Implement wallet detection for MyAlgo Wallet
- [ ] Implement WalletConnect integration for mobile wallets
- [ ] Handle wallet connection state (connecting, connected, disconnected)
- [ ] Handle wallet errors (rejected connection, not installed, network mismatch)
- [ ] Store wallet address in application state
- [ ] Support wallet disconnect functionality

#### Phase 2: Badge Querying

- [ ] Query Satchel API when wallet connects: `GET /badges/{address}`
- [ ] Parse and validate API response schema
- [ ] Handle API errors gracefully (network failure, rate limits)
- [ ] Cache badge data to reduce API calls (recommended: 60-second TTL)
- [ ] Implement refresh mechanism for badge updates

#### Phase 3: Feature Gating

- [ ] Define badge requirements for each gated feature
- [ ] Implement badge checking logic (`AND` and `OR` operators)
- [ ] Create UI states for: loading, authorized, unauthorized
- [ ] Build fallback UI for users without required badges
- [ ] Test all badge combinations for correctness

#### Phase 4: Production Readiness

- [ ] Configure production Algorand network (MainNet)
- [ ] Set up WalletConnect Project ID for production
- [ ] Implement badge presence caching for performance
- [ ] Add analytics for badge-based feature access
- [ ] Review and test security considerations (see below)

---

## Example Implementation Walkthrough

### Scenario

You have a content platform where users with the "Premium Member" badge can access exclusive articles.

### Step 1: Define Badge Requirements

```typescript
// Configuration - map badge types to features
const PREMIUM_BADGE = "premium_member";
const EARLY_ACCESS_BADGE = "early_access";

// Satchel API endpoint
const SATCHEL_API = "https://api.satchel.example";
```

### Step 2: Create the Integration Hook

```typescript
import { useState, useEffect, useCallback } from "react";

interface UseBadgeAccessResult {
  isConnected: boolean;
  walletAddress: string | null;
  badges: Badge[];
  hasBadge: (badgeType: string) => boolean;
  canAccessPremium: boolean;
  isLoading: boolean;
  error: string | null;
  connect: () => Promise<void>;
  disconnect: () => void;
}

export function useBadgeAccess(): UseBadgeAccessResult {
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [badges, setBadges] = useState<Badge[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Connect Pera Wallet
  const connect = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const pera = (window as any).peraWallet;
      if (!pera) {
        throw new Error("Pera Wallet not installed");
      }

      const accounts = await pera.connect();
      const address = accounts[0];
      setWalletAddress(address);
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Disconnect wallet
  const disconnect = useCallback(() => {
    setWalletAddress(null);
    setBadges([]);
    setError(null);
  }, []);

  // Fetch badges when wallet connects
  useEffect(() => {
    if (!walletAddress) {
      setBadges([]);
      return;
    }

    async function fetchBadges() {
      setIsLoading(true);
      try {
        const response = await fetch(
          `${SATCHEL_API}/badges/${walletAddress}`
        );
        if (!response.ok) {
          throw new Error("Failed to fetch badges");
        }
        const data = await response.json();
        setBadges(data.badges);
      } catch (err: any) {
        setError(err.message);
        setBadges([]);
      } finally {
        setIsLoading(false);
      }
    }

    fetchBadges();
  }, [walletAddress]);

  // Check if user has a specific badge type
  const hasBadge = useCallback(
    (badgeType: string): boolean => {
      return badges.some((b) => b.badgeType === badgeType);
    },
    [badges]
  );

  // Check premium access
  const canAccessPremium = hasBadge(PREMIUM_BADGE);

  return {
    isConnected: !!walletAddress,
    walletAddress,
    badges,
    hasBadge,
    canAccessPremium,
    isLoading,
    error,
    connect,
    disconnect,
  };
}
```

### Step 3: Build the Protected Content Component

```typescript
function PremiumArticle({ article }: { article: Article }) {
  const {
    isConnected,
    walletAddress,
    badges,
    canAccessPremium,
    isLoading,
    error,
    connect,
  } = useBadgeAccess();

  // Loading state
  if (isLoading) {
    return <ArticleSkeleton />;
  }

  // Not connected - prompt to connect
  if (!isConnected) {
    return (
      <div className="premium-gate">
        <div className="gate-content">
          <h2>🔐 Connect Your Wallet</h2>
          <p>
            This article is exclusive to Premium Members. Connect your
            Algorand wallet to verify your badge.
          </p>
          <button onClick={connect} className="btn-primary">
            Connect Wallet
          </button>
        </div>
      </div>
    );
  }

  // Connected but no badge - show how to earn
  if (!canAccessPremium) {
    return (
      <div className="premium-gate">
        <div className="gate-content">
          <h2>🔒 Premium Content</h2>
          <p>
            This article requires the <strong>Premium Member</strong> badge.
          </p>
          <div className="user-badges">
            <p>Your current badges:</p>
            {badges.length === 0 ? (
              <p className="no-badges">No badges found</p>
            ) : (
              <ul className="badge-list">
                {badges.map((badge) => (
                  <li key={badge.id}>
                    <img src={badge.image} alt={badge.name} />
                    <span>{badge.name}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <a href="/earn-premium" className="btn-secondary">
            Learn How to Earn Premium Badge
          </a>
        </div>
      </div>
    );
  }

  // Authorized - show content
  return (
    <article className="premium-article">
      <header>
        <span className="badge-indicator">⭐ Premium Member</span>
        <h1>{article.title}</h1>
      </header>
      <div className="article-content">{article.content}</div>
    </article>
  );
}
```

### Step 4: Displaying Badge Status

```typescript
function WalletBadgeStatus() {
  const { walletAddress, badges, isConnected } = useBadgeAccess();

  if (!isConnected) {
    return <div className="badge-status">No wallet connected</div>;
  }

  return (
    <div className="badge-status">
      <p className="wallet-address">
        Wallet: <code>{walletAddress?.slice(0, 8)}...{walletAddress?.slice(-4)}</code>
      </p>
      <div className="badge-display">
        <h3>Your Badges ({badges.length})</h3>
        {badges.length === 0 ? (
          <p className="no-badges">No badges yet</p>
        ) : (
          <div className="badge-grid">
            {badges.map((badge) => (
              <div key={badge.id} className="badge-card">
                <img src={badge.image} alt={badge.name} />
                <div className="badge-info">
                  <strong>{badge.name}</strong>
                  <span>{badge.description}</span>
                  <small>
                    Earned: {new Date(badge.earnedAt).toLocaleDateString()}
                  </small>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
```

---

## Security Considerations

### ⚠️ Critical Warning

**Satchel provides AUTHORIZATION by badge ownership, NOT secure AUTHENTICATION.**

This distinction is critical for application security.

### What Badges Prove

| Property | Proven by Badge | NOT Proven by Badge |
|----------|-----------------|---------------------|
| Wallet currently holds the badge | ✅ Yes | |
| Badge was minted to this wallet | ✅ Yes | |
| Original recipient is current holder | | ❌ No |
| Badge was never transferred | | ❌ No |
| User is who they claim to be | | ❌ No |
| User controls the private key | | ❌ No |

### The Revocation Problem

**Algorand ASAs cannot be revoked by default.** Once a badge is minted to a wallet, it remains there permanently unless the issuer:

1. Enabled clawback at ASA creation time (disabled by default in Satchel)
2. Uses the clawback mechanism to recall the badge
3. This is a blockchain fundamental, not a Satchel limitation

**Implications:**
- Users who legitimately earned a badge will always hold it
- Users who purchased/traded for a badge will have it in their wallet
- There is no guarantee the current holder is the original recipient
- Badge revocation requires explicit issuer action with clawback enabled

### Security Best Practices

1. **Never use badge ownership as sole authorization for security-critical operations**
   - Badges are excellent for feature gates (UI visibility, content access)
   - Badges are NOT suitable for authentication (login, transactions, admin actions)

2. **Combine with other signals**
   - Wallet age and transaction history
   - Email verification, 2FA, or other identity verification
   - Server-side session management

3. **Implement time-based access when relevant**
   - Some badges may have temporal value (e.g., "2024 Summit Attendee")
   - Track `earnedAt` timestamps if time sensitivity matters

4. **Consider badge freshness**
   - Badges minted recently may be more trustworthy than ancient badges
   - Consider requiring minimum holding period for high-value features

5. **Use HTTPS for all API calls**
   - Never query the Satchel API over unencrypted connections
   - Validate SSL certificates in production

6. **Handle the not-connected state**
   - Always assume disconnected users are unauthorized
   - Never reveal gated content to unauthenticated users

### Do NOT Use Satchel Badges For

- 🚫 Account login or authentication
- 🚫 Authorization for financial transactions
- 🚫 Access to admin functions or sensitive data
- 🚫 Proof of identity verification
- 🚫 Single factor for security-critical decisions
- 🚫 Any system requiring revocable credentials by default

### Secure vs. Insecure Use Cases

| Use Case | Secure? | Notes |
|----------|---------|-------|
| Show/hide premium content UI | ✅ Yes | Badge ownership gates UI |
| Unlock beta feature flags | ✅ Yes | Feature visibility, not security |
| Community badge display | ✅ Yes | Identity expression |
| Content paywall | ⚠️ Caution | Combine with payment verification |
| Financial authorization | ❌ No | Never use for transaction approval |
| Admin access control | ❌ No | Requires proper authentication |
| Identity verification | ❌ No | Badges don't verify identity |

---

## Support & Contact

### Resources

- **Documentation:** https://github.com/TylerGarlick/satchel#readme
- **API Reference:** https://api.satchel.example/docs
- **GitHub Issues:** https://github.com/TylerGarlick/satchel/issues
- **Security Disclosures:** See SECURITY_DISCLAIMER.md

### Getting Help

1. **FAQ:** Check existing GitHub issues and discussions
2. **Bug Reports:** Open a GitHub issue with the `bug` label
3. **Feature Requests:** Open a GitHub issue with the `enhancement` label
4. **Security Issues:** See SECURITY_DISCLAIMER.md for responsible disclosure

### Wallet Support

For wallet connection issues:
- **Pera Wallet:** https://perawallet.app/support
- **MyAlgo Wallet:** https://wallet.myalgo.com/support
- **WalletConnect:** https://docs.walletconnect.com/

### Network Support

- **Algorand Dev Portal:** https://developer.algorand.org/
- **Algorand Discord:** https://discord.gg/algorand

---

*Document version: 1.0*  
*Last updated: 2024-03-20*  
*Satchel repository: https://github.com/TylerGarlick/satchel*
