# Satchel Revocation Research — Algorand ASA Capabilities

**Date:** 2026-03-20
**Task:** BL-2026-0320-055
**Author:** Tyler Garlick / Janus (Research Agent)
**Status:** ✅ Complete

---

## ⚠️ CRITICAL DISCLAIMER — READ FIRST

> **Satchel is authorization by badge ownership, NOT secure authentication.**
>
> Algorand ASAs (the underlying NFT standard for Satchel badges) do NOT guarantee revocation. A badge holder can retain and continue to use their badge even if an issuer attempts to revoke it — unless specific on-chain parameters were set at asset creation time. **If revocation is a hard security requirement, Satchel badges are the wrong tool.** Applications using Satchel badges MUST NOT rely on them as the sole mechanism for security-critical access decisions.

---

## 1. Can an ASA Be Burned or Revoked by the Issuer?

### Short Answer: **It depends — but revocation is NOT default behavior.**

There are three relevant mechanisms in the Algorand ASA specification:

| Mechanism | Can Issuer Do It? | Requires Pre-Configuration? | Effect |
|---|---|---|---|
| **Clawback** | Yes, if `clawbackAddress` set | **YES** — must be specified at creation | Force-transfer asset from any holder to anywhere |
| **Freeze** | Yes, if `freezeAddress` set | **YES** — must be specified at creation | Prevent a holder from transferring the asset |
| **Burn (Destroy)** | Only if total supply = 0 and all holdings = 0 | N/A (rarely achievable post-mint) | Destroys the asset definition itself |

### Key Findings

**1. Clawback (`clawbackAddress`)**
- The ASA standard includes a `clawbackAddress` field.
- If set to a valid address at asset creation, that account can issue **asset transfer transactions** that move the asset from any holder's account without the holder's signature.
- If `clawbackAddress` is set to the zero address (`AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAY5HFKQ`), clawback is **disabled**.
- **In practice:** Most ASA-creating tools (including many SDK defaults) set clawback to the zero address, meaning clawback is disabled by default.
- **Satchel implication:** Unless Satchel explicitly sets a clawback address when creating badge ASAs, it cannot revoke badges.

**2. Freeze (`freezeAddress`)**
- The ASA standard includes a `freezeAddress` field.
- If set, that account can issue **asset freeze transactions** targeting specific accounts, which revokes their ability to transfer the asset.
- The asset remains in the holder's wallet — they just can't move it.
- **Not true revocation** — the holder still possesses the badge and can prove ownership on-chain.

**3. Burn / Asset Destroy (`makeAssetDestroyTxn`)**
- The Algorand SDK provides `makeAssetDestroyTxn`.
- An asset can only be destroyed if **all units are held by accounts that voluntarily close them to 0**, OR if the asset has 0 total outstanding units.
- You **cannot** burn specific tokens in a user's wallet — only the asset creator can destroy the asset definition, and only when no tokens are in circulation.
- This is not revocation — it's asset lifecycle cleanup after all holders have voluntarily transferred away their holdings.

### Verdict

**Revocation is opt-in, not opt-out.** An issuer can only clawback badges if they:
1. Specified a `clawbackAddress` at the time of ASA creation, AND
2. Retains control of that clawback account

Even then, clawback is a blockchain operation — it doesn't prevent a holder from having used the badge for authorization before the clawback occurred. The authorization window is between when the badge was received and when the clawback transaction confirmed.

---

## 2. On-Chain Constraints for ASA Revocation

### What the Chain Actually Enforces

The Algorand protocol enforces these rules at the consensus level for ASA transfer transactions:

```
AssetTransferTxn valid if ALL of:
  1. sender has sufficient asset holding (balance >= amount)
  2. IF asset.freezeAddress != zero: transaction must be signed by freezeAddress OR
     - the account is not frozen
  3. IF asset.clawbackAddress != zero: transaction must be signed by clawbackAddress OR
     - sender is the sender of the transfer (normal transfer)
```

### The Constraint Summary

| Asset Flag | Default (Zero Address) | Effect |
|---|---|---|
| `clawbackAddress` | `AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAY5HFKQ` (disabled) | Only the holder can transfer; no forced clawback |
| `freezeAddress` | `AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAY5HFKQ` (disabled) | No account can be frozen |
| `reserveAddress` | `AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAY5HFKQ` (disabled) | No special reserve behavior |
| `manager` | Issuer address (active) | Can modify clawback/freeze/reserve, but cannot bypass clawback to move assets directly |
| `decimals` | 0 for NFTs | Cannot be changed post-creation |

### Important: The Manager Cannot Override Clawback

Many people assume the issuer/manager can always override. This is **incorrect**. The `manager` account can:
- Update the `clawbackAddress`, `freezeAddress`, or `reserveAddress`
- Opt in to the asset
- Destroy the asset (if supply is 0)

But the `manager` **cannot** directly transfer assets from other accounts. Only the configured `clawbackAddress` can do that. If clawback is disabled (zero address), nothing short of a protocol-level change can force a transfer.

---

## 3. SDK Reference (js-algorand-sdk)

### Asset Creation — Enabling Clawback

```typescript
import algosdk from 'algosdk';

// During asset creation, set clawbackAddress:
const txn = algosdk.makeAssetCreateTxnWithSuggestedParamsFromObject({
  sender: issuerAddress,
  suggestedParams: params,
  assetName: 'SatchelBadge',
  unitName: 'BADGE',
  total: 1,            // NFTs are total=1, decimal=0
  decimals: 0,
  defaultFrozen: false,
  assetURL: 'https://satchel.example/badge/001',
  // This is the key field for revocation:
  clawbackAddress: issuerAddress,  // Set to enable clawback
  freezeAddress: issuerAddress,   // Set to enable freeze
  manager: issuerAddress,
  reserve: issuerAddress,
});

// Without clawbackAddress set (or set to zero), revocation is impossible.
```

### Clawback Transfer

```typescript
// Only works if asset.clawbackAddress == clawbackAccount
const clawbackTxn = algosdk.makeAssetTransferTxnWithSuggestedParamsFromObject({
  sender: clawbackAccount,       // Must be the clawbackAddress
  suggestedParams: params,
  assetRecipient: issuerAddress, // Where to send the revoked badge
  assetSender: holderAddress,     // Force-transfer FROM this holder
  assetAmount: 1,
  assetIndex: assetId,
});
// NO signature required from holderAddress — that's the point of clawback.
```

### Asset Freeze

```typescript
const freezeTxn = algosdk.makeAssetFreezeTxnWithSuggestedParamsFromObject({
  sender: freezeAccount,
  suggestedParams: params,
  assetIndex: assetId,
  target: holderAddress,
  newFreezeSetting: true, // true = frozen, false = unfrozen
});
```

### Asset Destroy (Burn the Asset Definition)

```typescript
// Only succeeds if total outstanding units == 0
const destroyTxn = algosdk.makeAssetDestroyTxnWithSuggestedParamsFromObject({
  sender: managerAddress,
  suggestedParams: params,
  assetIndex: assetId,
});
```

---

## 4. Practical Implications for Satchel

### What Satchel CAN Do (if reconfigured)

If Satchel were to enable clawback and freeze on badge ASAs:

| Action | Can Satchel Do It? | How |
|---|---|---|
| Revoke a badge from a wallet | ✅ Yes | Use clawback to transfer badge to Satchel treasury |
| Freeze a badge (prevent transfer) | ✅ Yes | Use asset freeze transaction |
| Permanently destroy a badge | ❌ No (unless holder sends it back) | Must wait for holder to close position; cannot force-burn |

### What Satchel CANNOT Do

- **Cannot revoke a badge** if `clawbackAddress` was not set at creation
- **Cannot prevent a holder from using a badge** for authorization before clawback executes
- **Cannot burn specific tokens** held by users — only the holder can release them
- **Cannot retroactively enable clawback** — the field is fixed after creation (only the address can be changed, not from zero to non-zero; only from non-zero to non-zero)

### The Fundamental Limitation

Even with clawback enabled, Satchel badges represent **authorization by ownership, not authentication**. The chain proves someone owns the badge at a point in time. It does not:

- Prove the current session belongs to the badge owner
- Prevent the owner from lending/sharing their wallet
- Revoke authorization in real-time before a tx confirm
- Bind badge usage to a specific device, IP, or session

---

## 5. Recommendations

### For Satchel Applications

1. **Never use badge ownership as the sole factor for security-critical actions** (financial transactions, privilege escalation, admin access)
2. **If revocation is required, enable clawback at ASA creation** — and document clearly which badges have it enabled
3. **Consider time-bounded authorization** — query `assetHolding` timestamp or use Satchel's off-chain event log to determine when the badge was received, and apply additional verification for sensitive operations
4. **Combine signals**: wallet age + transaction history + on-chain reputation + badge ownership
5. **Add a prominent UI disclaimer** on any feature gated purely by badge ownership

### For Satchel Architecture

If true revocation is needed, consider:

- **Smart contract-based badges** (ARC-72 or custom contract) where the contract tracks authorization state and can reject even wallet-holders
- **Off-chain authorization with on-chain proof** — badge ownership proves off-chain KYC was completed, but actual authorization is an off-chain JWT with short TTL
- **Non-transferable assets (ARC-69 note field)** — Algorand supports metadata indicating "do not transfer" but this is a convention, not a protocol-enforced rule; it can be ignored

---

## 6. Conclusion

> **Revocation is NOT guaranteed on the Algorand ASA standard.**
>
> Satchel badges are a badge-based **authorization** system — they prove a wallet held a badge at some point. They do NOT constitute **secure authentication** and MUST NOT be treated as such. Applications that gate security-sensitive operations on badge ownership alone are vulnerable to badge sharing, wallet compromise, and timing attacks between authorization and revocation.
>
> The Algorand ASA standard provides clawback and freeze mechanisms, but they must be explicitly configured at asset creation time and are not enabled by default. Even when enabled, revocation is not instantaneous and does not prevent prior use of the badge for authorization.

---

## References

- [Algorand Developer Docs — ASA](https://developer.algorand.org/docs/get-details/asa/)
- [js-algorand-sdk — Asset Transactions](https://algorand.github.io/js-algorand-sdk/)
- [ARC-69 — Algorand NFT Metadata Standard](https://arc.algorand.foundation/ARCs/arc-0069)
- [Algorand Protocol Spec — Asset Transfer](https://developer.algorand.org/docs/get-details/transactions/#asset-transfer-transaction)
