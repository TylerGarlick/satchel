# Satchel

**NFT Badge Authorization System for Algorand**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

---

## What is Satchel?

Satchel is a decentralized badge authorization system that enables app developers to create criteria-based achievement systems, and users to earn verifiable NFT badges that unlock features across the Algorand ecosystem.

Think of it like achievement badges meets OAuth — but instead of generic permissions, you earn unique NFTs that prove your achievements and grant you access everywhere Satchel is integrated.

## How It Works

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│   App Developer              Satchel              User         │
│                                                                 │
│   ┌──────────────┐          ┌───────┐         ┌──────────────┐ │
│   │ Define badge │─────────▶│ Store │         │              │ │
│   │ criteria     │          │ rules │         │  Connect     │ │
│   └──────────────┘          └───────┘         │  Algorand    │ │
│                                              │  wallet      │ │
│   ┌──────────────┐          ┌───────┐         └──────────────┘ │
│   │ Integrate    │◀─────────│ Verify│─────────────────────────▶│
│   │ Satchel SDK  │          │ badges│         Show badges      │
│   └──────────────┘          └───────┘         to unlock         │
│                                              features           │
│                                              ┌──────────────┐  │
│                          ┌───────┐          │  Earn NFT    │  │
│                          │ Mint  │◀─────────│  badge       │  │
│                          │ NFTs  │          └──────────────┘  │
│                          └───────┘                            │
└─────────────────────────────────────────────────────────────────┘
```

### The Flow

1. **Earn Badges via Criteria**
   - App developers define badge criteria (e.g., "completed 10 trades", "held 1000 ALGOs for 30 days", "completed KYC")
   - Users connect their Algorand wallet and meet the criteria
   - Satchel verifies the criteria are met on-chain

2. **Receive NFTs**
   - Once criteria are verified, Satchel mints a unique NFT badge
   - The NFT is automatically sent to the user's Algorand wallet
   - Each badge is provably scarce and verifiable

3. **Unlock Features**
   - Satchel-compatible apps check the user's wallet for relevant badges
   - Badge holders unlock exclusive features, content, or permissions
   - No central authority — it's all verifiable on-chain

## Key Features

### 🔐 **Criterion-Based Achievements**
- Define flexible, programmable criteria for badge issuance
- Support for on-chain data (holdings, transactions, opt-ins)
- Time-locked and decay-enabled criteria

### 🎨 **NFT Badges**
- Standards-compliant Algorand NFTs (ARC-3/ARC-69)
- Unique metadata and visual design per badge
- Transferable but tied to wallet history

### 🚪 **Universal Authorization**
- Single badge can unlock features across multiple apps
- Privacy-preserving: prove you have a badge without revealing wallet address
- Composable: stack multiple badges for tiered access

### 🔗 **Developer-Friendly**
- Simple SDK for integrating badge verification
- No backend required for basic verification
- Webhook support for real-time badge issuance

### 🌐 **Open Ecosystem**
- Anyone can create and issue badges
- Public registry of known badge types
- Community-maintained badge standards

## Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | React, TypeScript, Next.js |
| **UI Framework** | SkeletonCSS (Tailwind Plugin) |
| **Blockchain** | Algorand (AVM) |
| **NFT Standards** | ARC-3, ARC-69 |
| **Wallet Integration** | WalletConnect, Pera, Defly |
| **Backend** | Next.js API Routes, Edge Functions |
| **Storage** | IPFS (via Pinata), Algorand Indexer |

## Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn
- Algorand wallet (Pera, Defly, or WalletConnect)

### Installation

```bash
# Clone the repository
git clone https://github.com/TylerGarlick/satchel.git
cd satchel

# Install dependencies
npm install

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

### Wallet Connection

The app uses `@perawallet/connect` for Algorand wallet integration:

```typescript
import { PeraWalletConnect } from "@perawallet/connect";

const peraWallet = new PeraWalletConnect();
await peraWallet.connect();
```

## Project Structure

```
satchel/
├── src/
│   ├── app/                 # Next.js App Router
│   │   ├── layout.tsx       # Root layout
│   │   ├── page.tsx         # Homepage
│   │   └── globals.css      # Global styles
│   ├── components/          # React components
│   ├── hooks/               # Custom React hooks
│   ├── lib/                 # Utilities and helpers
│   └── types/               # TypeScript type definitions
├── public/                  # Static assets
├── package.json
├── tsconfig.json
├── tailwind.config.ts
└── README.md
```

## Environment Variables

Create a `.env.local` file:

```env
# Algorand Configuration
NEXT_PUBLIC_ALGOD_URL=https://testnet-api.algonode.cloud
NEXT_PUBLIC_INDEXER_URL=https://testnet-indexer.algonode.cloud
NEXT_PUBLIC_NETWORK=testnet

# NFT Storage (Pinata)
PINATA_JWT=your_pinata_jwt
```

## Contributing

Contributions are welcome! Here's how to get involved:

### Development Workflow

1. **Fork** the repository
2. **Clone** your fork:
   ```bash
   git clone https://github.com/YOUR_USERNAME/satchel.git
   ```
3. **Create a feature branch**:
   ```bash
   git checkout -b feature/your-feature-name
   ```
4. **Make your changes** and commit:
   ```bash
   git commit -m "Add: your feature description"
   ```
5. **Push to your fork**:
   ```bash
   git push origin feature/your-feature-name
   ```
6. Open a **Pull Request**

### Code Standards

- TypeScript strict mode enabled
- Run `npm run lint` before committing
- Follow existing code formatting (Prettier + ESLint)
- Add tests for new functionality

### Badge Criteria Format

When contributing badge definitions, follow this schema:

```typescript
interface BadgeCriteria {
  id: string;
  name: string;
  description: string;
  appId: string;
  conditions: {
    type: 'holdings' | 'transactions' | 'opt-in' | 'custom';
    assetId?: number;
    amount?: number;
    duration?: number; // in seconds
    transactionCount?: number;
    logic: 'AND' | 'OR';
  }[];
}
```

## Related Projects

- [Algorand SDK](https://github.com/algorand/js-algorand-sdk) - Official Algorand JavaScript SDK
- [perawallet-connect](https://github.com/perawallet/connect) - Pera Wallet integration
- [SkeletonCSS](https://www.skeleton.dev/) - UI component library

## License

MIT License - see [LICENSE](LICENSE) for details.

## Contact

- GitHub Issues: [TylerGarlick/satchel/issues](https://github.com/TylerGarlick/satchel/issues)
- Twitter: [@TylerGarlick](https://twitter.com/TylerGarlick)

---

Built with 💜 for the Algorand community
