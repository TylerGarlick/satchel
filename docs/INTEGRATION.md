# Satchel-Compatible App Integration Guide

> **⚠️ Important Security Note:** Satchel provides **authorization by badge ownership**, not secure authentication. Algorand ASA revocation is not guaranteed — badges cannot be reliably revoked on-chain. Do not use Satchel badges as the sole factor for security-critical decisions.

---

## Overview

Satchel is an NFT badge authorization system for Algorand wallets. Third-party applications can become "Satchel-compatible" to:

- **Detect** connected Algorand wallets
- **Query** badge holdings from the Satchel API
- **Conditionally enable** features based on badge ownership

This guide covers the integration flow, API specifications, and implementation examples.

---

## Architecture

```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│   User's    │────▶│  Third-Party │────▶│   Satchel   │
│   Browser   │     │     App      │     │     API     │
└─────────────┘     └──────────────┘     └─────────────┘
       │                   │                    │
       │            Wallet Connection          │
       │◀──── Pera/MyAlgo/WalletConnect ──────▶│
```

---

## Prerequisites

- Node.js 18+
- Algorand wallet (Pera, MyAlgo, or WalletConnect)
- User must have a Satchel-compatible wallet connected

---

## API Endpoint Specifications

### GET /badges/:wallet

Fetch all Satchel badges held by a specific Algorand wallet address.

**Endpoint:** `https://api.satchel.example.com/badges/:wallet`

**Method:** `GET`

**Path Parameters:**

| Parameter | Type   | Description                     |
|-----------|--------|---------------------------------|
| `wallet`  | string | Algorand wallet address (base64) |

**Response Schema (200 OK):**

```json
{
  "wallet": "WALLET_ADDRESS",
  "badges": [
    {
      "id": "badge-asset-id",
      "name": "Early Adopter",
      "description": "Joined Satchel during beta",
      "image": "ipfs://Qm...",
      "issuer": "satchel-app",
      "dateEarned": "2026-03-15T10:30:00Z",
      "criteriaMet": {
        "type": "time-based",
        "description": "Joined before March 2026"
      },
      "collection": "satchel-badges"
    }
  ],
  "totalCount": 1,
  "fetchedAt": "2026-03-21T02:40:00Z"
}
```

**Error Responses:**

| Status | Description                              |
|--------|------------------------------------------|
| 400    | Invalid wallet address format            |
| 404    | No badges found for wallet               |
| 500    | Internal server error                    |

---

## Client-Side Integration

### 1. Detect Connected Wallet

```typescript
// Using Satchel's WalletProvider
import { useWallet } from '@/contexts/WalletProvider';

function MyApp() {
  const { connected, accounts } = useWallet();
  
  if (connected && accounts.length > 0) {
    const walletAddress = accounts[0];
    console.log('Connected wallet:', walletAddress);
  }
}
```

### 2. Query Satchel API

```typescript
interface Badge {
  id: string;
  name: string;
  description: string;
  image: string;
  issuer: string;
  dateEarned: string;
  criteriaMet: Record<string, unknown>;
  collection: string;
}

interface BadgeResponse {
  wallet: string;
  badges: Badge[];
  totalCount: number;
  fetchedAt: string;
}

async function fetchBadges(walletAddress: string): Promise<BadgeResponse> {
  const response = await fetch(
    `https://api.satchel.example.com/badges/${walletAddress}`
  );
  
  if (!response.ok) {
    throw new Error(`Failed to fetch badges: ${response.status}`);
  }
  
  return response.json();
}
```

### 3. Check Badge Ownership

```typescript
async function hasBadge(walletAddress: string, badgeName: string): Promise<boolean> {
  try {
    const { badges } = await fetchBadges(walletAddress);
    return badges.some(badge => badge.name === badgeName);
  } catch (error) {
    console.error('Error checking badge:', error);
    return false;
  }
}

// Usage example
const userHasEarlyAdopter = await hasBadge(walletAddress, "Early Adopter");
```

### 4. Conditional Feature Access

```typescript
function FeatureGate({ badgeRequired, children }) {
  const { connected, accounts } = useWallet();
  const [badges, setBadges] = useState([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    if (connected && accounts.length > 0) {
      fetchBadges(accounts[0])
        .then(data => setBadges(data.badges))
        .finally(() => setLoading(false));
    }
  }, [connected, accounts]);
  
  if (loading) return <Spinner />;
  
  const hasAccess = !badgeRequired || badges.some(b => b.name === badgeRequired);
  
  return hasAccess ? children : <PremiumUpsell />;
}

// Usage
<FeatureGate badgeRequired="Premium Member">
  <PremiumContent />
</FeatureGate>
```

---

## SDK / Embed Snippet

For quick integration, add this script to your HTML:

```html
<script
  src="https://cdn.satchel.example.com/satchel-sdk.js"
  data-api-url="https://api.satchel.example.com"
  data-app-id="YOUR_APP_ID"
  async
></script>
```

Then use the global `Satchel` object:

```javascript
// Check badge ownership
const hasAccess = await Satchel.hasBadge('Early Adopter');

// Get all user badges
const badges = await Satchel.getBadges();

// Listen for wallet changes
Satchel.onWalletChange((address) => {
  console.log('Wallet changed to:', address);
});
```

---

## Integration Checklist

- [ ] Add Algorand wallet connection support (Pera, MyAlgo, or WalletConnect)
- [ ] Integrate Satchel API client
- [ ] Implement badge query on wallet connect
- [ ] Add feature gating based on badge ownership
- [ ] Add UI for locked features (premium upsell)
- [ ] Add security disclaimer about badge authorization
- [ ] Test with testnet badges before mainnet
- [ ] Handle API errors gracefully

---

## Example: Complete Integration

```typescript
// satchel-integration.ts
const SATCHEL_API = process.env.NEXT_PUBLIC_SATCHEL_API_URL;

export async function checkBadgeAccess(
  walletAddress: string,
  requiredBadge: string
): Promise<boolean> {
  try {
    const response = await fetch(`${SATCHEL_API}/badges/${walletAddress}`);
    
    if (!response.ok) {
      console.error('Satchel API error:', response.status);
      return false;
    }
    
    const data = await response.json();
    return data.badges.some(
      (badge: { name: string }) => badge.name === requiredBadge
    );
  } catch (error) {
    console.error('Badge check failed:', error);
    return false;
  }
}

export async function getUserBadges(walletAddress: string) {
  try {
    const response = await fetch(`${SATCHEL_API}/badges/${walletAddress}`);
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    
    return response.json();
  } catch (error) {
    console.error('Failed to fetch badges:', error);
    return { wallet: walletAddress, badges: [], totalCount: 0 };
  }
}
```

```tsx
// PremiumFeature.tsx
import { checkBadgeAccess } from './satchel-integration';
import { useWallet } from '@/contexts/WalletProvider';

export function PremiumFeature({ badge, children }) {
  const { accounts } = useWallet();
  const [hasAccess, setHasAccess] = useState(false);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    if (accounts.length > 0) {
      checkBadgeAccess(accounts[0], badge)
        .then(setHasAccess)
        .finally(() => setLoading(false));
    }
  }, [accounts, badge]);
  
  if (loading) return <Skeleton />;
  
  if (!hasAccess) {
    return (
      <div className="premium-locked">
        <p>🔒 This feature requires the "{badge}" badge</p>
        <Button onClick={() => window.open('https://satchel.example.com', '_blank')}>
          Get Satchel Badge
        </Button>
      </div>
    );
  }
  
  return children;
}
```

---

## Security Considerations

| Concern | Mitigation |
|---------|------------|
| Badge revocation not guaranteed | Use badges for authorization, not authentication. Combine with other trust signals. |
| Wallet can change | Re-verify badge ownership on sensitive actions. |
| API endpoint exposed | Validate server-side when possible. |
| Fake badges | Satchel badges are on-chain NFTs — verify the ASA ID and issuer. |

**This is authorization by badge ownership only.** For security-critical features, combine with additional verification.

---

## Support & Contact

- **Documentation:** https://docs.satchel.example.com
- **GitHub Issues:** https://github.com/TylerGarlick/satchel/issues
- **Discord:** https://discord.gg/satchel

---

*Last updated: 2026-03-21*
