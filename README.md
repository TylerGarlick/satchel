# Satchel

A badge-based NFT authorization system for Algorand wallets. Satchel distributes NFTs (badges) to wallets when criteria are met, enabling Satchel-enabled applications to detect earned badges and unlock features based on badge ownership.

## What is Satchel?

Satchel is an NFT-based authorization layer that brings badge-gated access to the Algorand ecosystem. Think of it as "NFT-based feature flags" — instead of traditional authorization systems that rely on centrally-controlled databases, Satchel leverages the Algorand blockchain to create verifiable, wallet-bound credentials that users truly own.

When a user connects their Algorand wallet to a Satchel-enabled application, the app can read their on-chain badge holdings and conditionally grant access to features, content, or functionality based on which badges they hold. Badges are minted as Algorand ASAs (Algorand Standard Assets) with special metadata distinguishing them from regular NFTs.

**Why badges on-chain?** By using the blockchain as the source of truth, Satchel eliminates the need for applications to maintain their own user credential databases. Users hold their badges in their wallets — if they control the wallet, they control the credentials. This is credential portability at its core: earn a badge once, use it anywhere.

## How It Works

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           Satchel Badge Flow                                │
└─────────────────────────────────────────────────────────────────────────────┘

   ISSUER                          SATCHEL                          HOLDER
    APP                         (Satchel Service)                   WALLET

      │                               │                                │
      │  1. Create Badge Definition   │                                │
      │──────────────────────────────>│                                │
      │                               │                                │
      │  2. Define Criteria           │                                │
      │    (manual / webhook)         │                                │
      │                               │                                │
      │                               │<───── 3. User Earns Badge ─────│
      │                               │     (completes criteria)        │
      │                               │                                │
      │                               │  4. Mint NFT (ASA)              │
      │                               │───────────────────────────────>│
      │                               │                                │
      │                               │                                │
      │                         5. Connect Wallet                     │
      │<────────────────────────────────────────────────────────────────│
      │  (Satchel-enabled app reads on-chain badge ownership)         │
      │                               │                                │
      │  6. Unlock Feature            │                                │
      │  (if badge present)           │                                │
      │                               │                                │
```

**Step-by-step breakdown:**

1. **Create Badge** — An issuer defines a badge with a name, description, criteria (manual approval or webhook-triggered), and metadata
2. **Criteria Met** — A user satisfies the badge requirements (completes an action, receives webhook signal, or is manually approved)
3. **Mint & Distribute** — Satchel mints an Algorand ASA and sends it to the user's wallet address
4. **Wallet Connection** — The user connects their Algorand wallet to any Satchel-enabled application
5. **On-Chain Verification** — The app queries the blockchain to check if the connected wallet holds the required badge ASA
6. **Feature Unlock** — If the badge is present, the app grants access to the associated feature or content

## Key Features

### Wallet Management
- **Multi-wallet support** — Connect via Pera Wallet, Defly Wallet, Exodus, or WalletConnect
- **Seamless connect/disconnect** — One-click wallet connection flow
- **Wallet balance display** — View ALGO balance and badge holdings

### Badge Management
- **Create badges** — Define name, description, image, and criteria for any badge type
- **Search badges** — Find badges by name, creator, or attributes
- **Update badges** — Modify badge metadata and criteria after creation
- **Delete badges** — Remove badge definitions (does not affect already-minted badges)
- **Criteria management** — Set manual approval or webhook-based criteria

### Badge Issuance
- **Issue individual badges** — Mint and send a single badge NFT to a wallet
- **Batch issuance** — Issue multiple badges to multiple wallets in one transaction
- **Manual approval** — Issuer manually triggers badge minting

### Webhook System
- **Register webhook endpoints** — Third parties can register URLs to trigger badge issuance
- **Webhook testing tool** — Send test payloads to verify webhook integration
- **Automatic badge minting** — Webhook triggers automatically mint and send badges when external events occur

### Settings
- **User profile** — Manage account information
- **Wallet management** — Add, remove, and switch connected wallets
- **Notification preferences** — Configure how you receive badge-related updates

## Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | React 18, TypeScript 5, Next.js 14 |
| **UI Framework** | Tailwind CSS with Skeleton-inspired components |
| **Blockchain** | Algorand (algosdk) |
| **Wallet Connect** | WalletConnect Modal, Pera Wallet |
| **NFT Standard** | ARC3 / ARC69 |
| **Testing** | Jest |

### Architecture Overview

```
┌──────────────────────────────────────────────────────────────────┐
│                           CLIENT                                  │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐              │
│  │   Pera      │  │   Defly     │  │   Exodus    │              │
│  │   Wallet    │  │   Wallet    │  │   Wallet    │              │
│  └─────────────┘  └─────────────┘  └─────────────┘              │
│           │              │              │                        │
│           └──────────────┴──────────────┘                        │
│                          │                                       │
│                    WalletConnect                                 │
│                          │                                       │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │                    React / Next.js UI                       │  │
│  │  • Wallet connect modal                                    │  │
│  │  • Badge browser                                            │  │
│  │  • Badge creator                                            │  │
│  │  • Webhook manager                                          │  │
│  │  • Settings page                                            │  │
│  └────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌──────────────────────────────────────────────────────────────────┐
│                      ALGORAND BLOCKCHAIN                          │
│                                                                   │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐              │
│  │  Satchel    │  │   Badge     │  │   Badge     │              │
│  │  Badges     │  │   NFTs      │  │   NFTs      │              │
│  │  (ASAs)     │  │   (ASAs)    │  │   (ASAs)    │              │
│  └─────────────┘  └─────────────┘  └─────────────┘              │
│                                                                   │
│  Metadata: collection="Satchel", trait_badge_type=<badge_name>  │
└──────────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌──────────────────────────────────────────────────────────────────┐
│                       SATCHEL BACKEND                             │
│                                                                   │
│  • Badge definition CRUD                                         │
│  • Webhook endpoint registration                                 │
│  • ASA minting and distribution                                  │
│  • On-chain badge ownership queries                              │
└──────────────────────────────────────────────────────────────────┘
```

### Data Flow

1. **Wallet Connection** — User clicks "Connect Wallet" → WalletConnect opens → User approves → Wallet address stored in React state
2. **Badge Query** — App calls `algosdk.indexerClient.lookupAccountAssets()` to find ASAs with Satchel collection metadata
3. **Badge Creation** — Issuer fills form → API creates badge definition → Returns ASA creation params
4. **Badge Minting** — Call `algosdk.makeAssetCreateTxnWithSuggestedParams()` → Sign with issuer wallet → Submit to network
5. **Webhook Trigger** — External service POSTs to webhook URL → Satchel validates payload → Mints badge to specified wallet

## Quick Start

### Prerequisites

- Bun.js 1.0+ or Node.js 18+
- An Algorand wallet (Pera, Defly, or Exodus)
- Algorand TestNet or MainNet access

### Installation

```bash
# Clone the repository
git clone https://github.com/TylerGarlick/satchel.git
cd satchel

# Install dependencies
bun install

# Copy environment variables
cp .env.example .env.local
```

### Configuration

Edit `.env.local` with your configuration:

```env
# Algorand Network
NEXT_PUBLIC_ALGOD_NETWORK=testnet
NEXT_PUBLIC_ALGOD_SERVER=https://testnet-api.algorand.stackprint.io
NEXT_PUBLIC_ALGOD_TOKEN=
NEXT_PUBLIC_INDEXER_SERVER=https://testnet-idx.algorand.stackprint.io

# WalletConnect (optional, for WalletConnect support)
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Running

```bash
# Start the development server
bun run dev

# Run tests
bun test

# Build for production
bun run build
```

The application will be available at `http://localhost:3000`.

## Badge NFT Standard

Satchel badges are Algorand ASAs (Algorand Standard Assets) that follow a consistent metadata convention to distinguish them from regular NFTs.

### Metadata Fields

Satchel badges use ARC3/ARC69 compatible metadata with these additional fields:

| Field | Value | Description |
|-------|-------|-------------|
| `collection` | `"Satchel"` | Identifies this ASA as a Satchel badge |
| `badge_type` | `<badge_name>` | The specific badge identifier |
| `issuer` | `<issuer_address>` | Algorand address of the badge issuer |
| `criteria` | `"manual"` or `"webhook"` | How the badge is earned |
| `version` | `"1.0"` | Satchel standard version |

### Example NFT Properties

```json
{
  "name": "Newcomer Badge",
  "symbol": "NEWCOMER",
  "unitname": "NEWCOMER",
  "url": "https://satchel.example/badges/newcomer",
  "metadata_hash": "<sha256 of metadata>",
  "properties": {
    "collection": "Satchel",
    "badge_type": "newcomer",
    "issuer": "WXYZ...1234",
    "criteria": "manual",
    "version": "1.0"
  }
}
```

### Detecting Satchel Badges

To check if a wallet holds a specific Satchel badge:

```typescript
import algosdk from 'algosdk';

async function hasBadge(walletAddress: string, badgeType: string): Promise<boolean> {
  const indexer = new algosdk.Indexer('', 'https://testnet-idx.algorand.stackprint.io', '');
  
  const response = await indexer.lookupAccountAssets(walletAddress).do();
  const assets = response.assets;
  
  for (const asset of assets) {
    const assetInfo = await indexer.lookupAssetByID(asset['asset-id']).do();
    const params = assetInfo.asset.params;
    
    // Check for Satchel collection marker
    if (params.properties?.collection === 'Satchel' && 
        params.properties?.badge_type === badgeType) {
      return true;
    }
  }
  
  return false;
}
```

## API / Webhooks

### Webhook Registration

Third-party applications can register webhook endpoints to trigger automatic badge issuance when external events occur.

**Register a webhook:**

```http
POST /api/webhooks
Content-Type: application/json

{
  "url": "https://your-app.com/satchel-webhook",
  "events": ["badge.issue", "badge.revoke"],
  "secret": "your_webhook_secret"
}
```

**Response:**

```json
{
  "id": "wh_abc123",
  "url": "https://your-app.com/satchel-webhook",
  "events": ["badge.issue", "badge.revoke"],
  "created_at": "2024-01-15T10:30:00Z"
}
```

### Webhook Events

| Event | Description | Payload |
|-------|-------------|---------|
| `badge.issue` | A badge was minted to a wallet | `{ wallet, badge_id, badge_type, tx_id }` |
| `badge.revoke` | (Informational) Revocation was attempted | `{ wallet, badge_id, note }` |

### Webhook Payload Format

When a badge is issued, Satchel will POST to your registered endpoint:

```json
{
  "event": "badge.issue",
  "timestamp": "2024-01-15T10:30:00Z",
  "data": {
    "wallet": "WXYZ...5678",
    "badge_id": "badge_newcomer_001",
    "badge_type": "newcomer",
    "tx_id": "ABC123...DEF",
    "issuer": "WXYZ...1234"
  }
}
```

### Verifying Webhook Signatures

All webhook requests include a `X-Satchel-Signature` header. Verify it to ensure the request is authentic:

```typescript
import crypto from 'crypto';

function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');
  
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}
```

### Testing Webhooks

Use the built-in webhook testing tool to send test payloads to your endpoints and verify they receive and process the data correctly.

## Security Notes

### ⚠️ Important: Satchel Is Not a Secure Authentication System

Satchel badges are **on-chain verifiable credentials**, but they are **not secure authentication tokens**. Understanding this distinction is critical:

**What badges CAN do:**
- Verify that a wallet address holds a specific badge
- Provide a decentralized, tamper-proof record of badge issuance
- Enable user-controlled credential portability

**What badges CANNOT do:**
- Prevent wallet access by unauthorized users
- Guarantee the current wallet holder is the original recipient
- Provide revocation or rollback once minted
- Control who has access to the wallet itself

### The Revocation Problem

Algorand ASAs (like all ASA-based NFTs) **cannot be revoked**. Once a badge is minted to a wallet, it remains there permanently. This is a fundamental property of the Algorand blockchain, not a Satchel limitation.

**Implications:**
- Users who earned badges legitimately will always hold them
- Users who transferred badges to another wallet will have them in the new wallet
- There is no mechanism to "take back" a badge

### Best Practices for Applications

1. **Don't rely on Satchel as sole authorization** — Implement additional checks (email verification, 2FA, etc.)
2. **Use badges for feature access, not security-critical operations** — Badges work well for unlocking UI features, not for sensitive actions
3. **Consider time-based logic** — Track when badges were minted if temporal access matters
4. **Combine with other signals** — Use wallet age, transaction history, or on-chain reputation alongside badges

### Wallet Security

Satchel does not control users' wallets. Wallet security is the sole responsibility of the wallet holder. Never share private keys or seed phrases with any application, including Satchel.

## Contributing

Contributions are welcome! Please read our contributing guidelines before submitting pull requests.

### Development Setup

```bash
# Fork and clone the repository
git clone https://github.com/YOUR_USERNAME/satchel.git
cd satchel

# Install dependencies
bun install

# Create a feature branch
git checkout -b feature/your-feature-name

# Make your changes and test
bun test
bun run lint

# Commit with clear messages
git commit -m "feat: add new feature"

# Push and open a pull request
git push origin feature/your-feature-name
```

### Code Style

- Use TypeScript for all new code
- Follow the existing ESLint configuration
- Write tests for new functionality
- Update documentation for any user-facing changes

### Reporting Issues

Please report bugs and feature requests via [GitHub Issues](https://github.com/TylerGarlick/satchel/issues).

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.
