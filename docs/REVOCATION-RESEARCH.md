# Algorand ASA Revocation Research

**Research Date:** 2026-03-21  
**Status:** Complete

## Executive Summary

**Key Finding:** Algorand ASAs (which Satchel badges are built on) **can support revocation and freezing, but only if these features are explicitly enabled at ASA creation time**. By default, ASA creation on Algorand **disables** clawback, freeze, and does not allow destruction if any units exist.

**For Satchel badge authentication:** Badge ownership ≠ guaranteed ongoing access. The current Satchel implementation creates ASAs with **clawback and freeze DISABLED by default**, making revocation impossible without migrating to a new ASA with updated parameters.

---

## 1. ASA Clawback

### Can an ASA issuer claw back tokens from any wallet?

**Yes, but only if clawback was enabled at ASA creation time.**

When creating an Algorand ASA, you can set a `clawback` address. If set:
- The clawback address can force-transfer ASA units from any wallet that holds that ASA
- This does NOT require the holder's signature
- The clawback address can be the issuer's wallet or a smart contract

### How to enable clawback at creation (algosdk):

```typescript
import algosdk from 'algosdk';

// During ASA creation, set the clawback address
const txn = algosdk.makeAssetCreateTxnWithSuggestedParamsFromObject({
  from: issuerAddress,
  suggestedParams: params,
  assetName: "Satchel Badge",
  unitName: "BADGE",
  total: 1,  // For NFTs, total supply is 1
  decimals: 0,
  defaultFrozen: false,
  clawback: issuerAddress,  // ← Enable clawback to issuer address
  freeze: algosdk.generateAccount().addr,  // Or a freeze address
  manager: issuerAddress,
  reserve: issuerAddress,
});
```

### Requirements for clawback:
1. **ASA must have been created with a clawback address** (not the zero address)
2. **The clawback transaction must be signed by the clawback address** (not the holder)
3. The issuer cannot claw back if they didn't set a clawback address at creation

### Test script concept:
```typescript
// Check if an ASA has clawback enabled
const assetInfo = await indexer.lookupAssetByID(assetId).do();
const hasClawback = assetInfo.asset.params.clawback !== undefined && 
                    assetInfo.asset.params.clawback !== "";

// Invoke clawback (if enabled)
const clawbackTxn = algosdk.makeAssetTransferTxnWithSuggestedParamsFromObject({
  from: clawbackAddress,
  to: clawbackAddress,  // Send back to clawback holder (burn)
  assetCloseTo: recipientAddress,  // Or close to
  amount: 1,
  assetIndex: assetId,
  suggestedParams: params,
});
```

---

## 2. ASA Freeze

### Can the issuer freeze an account's ASA holdings?

**Yes, but only if freeze was enabled at ASA creation time.**

When creating an ASA, you can set a `freeze` address. If set:
- The freeze address can freeze a specific wallet's holdings of that ASA
- Frozen assets cannot be transferred by the holder
- The freeze address can later unfreez the account

### How to enable freeze at creation:

```typescript
const txn = algosdk.makeAssetCreateTxnWithSuggestedParamsFromObject({
  from: issuerAddress,
  suggestedParams: params,
  assetName: "Satchel Badge",
  unitName: "BADGE",
  total: 1,
  decimals: 0,
  defaultFrozen: false,
  freeze: freezeAddress,  // ← Enable freeze
  clawback: issuerAddress,
  manager: issuerAddress,
  reserve: issuerAddress,
});
```

### On-chain mechanics:
- **AssetFreezeTxn** is the transaction type
- Must be signed by the freeze address
- Sets `frozen` state on the target account's asset holding
- Does NOT prevent the holder from receiving more of the ASA
- Does NOT prevent the issuer from minting new units

### Requirements:
1. ASA must have been created with a freeze address
2. Freeze transaction must be signed by the freeze address

---

## 3. ASA Destroy

### Can an ASA be destroyed/burned permanently?

**Partially. Destruction has significant constraints.**

### Destruction rules (Algorand protocol):

1. **AssetDestroyTxn** can only be called by the ASA creator
2. **Constraint:** All units of the ASA must be destroyed (total supply = 0) before destruction succeeds
3. **Constraint:** No account can hold a nonzero balance of the ASA

### Destruction process:

```typescript
// Step 1: Burn all tokens held by all accounts (requires clawback)
const burnTxn = algosdk.makeAssetTransferTxnWithSuggestedParamsFromObject({
  from: clawbackAddress,
  to: clawbackAddress,  // Send to self to burn
  assetIndex: assetId,
  amount: 1,
  suggestedParams: params,
});

// Step 2: Destroy the ASA (only after all units are 0)
const destroyTxn = algosdk.makeAssetDestroyTxnWithSuggestedParamsFromObject({
  from: creatorAddress,
  suggestedParams: params,
  assetIndex: assetId,
});
```

### Important notes:
- **For NFTs (total=1):** You must collect and burn the token before destroying the ASA
- **For fungible tokens:** You must burn the entire supply
- **Once destroyed:** The ASA ID can never be reused
- **No selective destruction:** Cannot destroy while any units exist

### What destroying does NOT do:
- Does not prevent people from holding metadata about the ASA
- Does not affect historical transaction records
- Does not rollback badge issuance history

---

## 4. ARC69/ARC3 Metadata — Does Revocation Differ for NFTs vs Fungible Tokens?

**No.** ARC69 and ARC3 are metadata standards that sit on top of ASAs. They define how metadata (name, image URL, traits) is stored and accessed for NFT use cases. The underlying ASA mechanics (clawback, freeze, destroy) apply equally to all ASAs regardless of whether they follow ARC3, ARC69, or no special standard.

### Key distinctions:

| Feature | Fungible ASA | NFT (ARC3/ARC69) |
|---------|-------------|------------------|
| Clawback | Same | Same |
| Freeze | Same | Same |
| Destroy | Requires 0 total supply | Requires burning the single unit first |
| Transferability | Can be toggled at creation | Default: frozen accounts cannot send, but can receive |

### For Satchel badges specifically:
- Badges are created as ASAs with `total=1` and `decimals=0`
- They are NFT-styled but follow the same ASA mechanics as any other ASA
- If clawback/freeze were not enabled at creation, they **cannot be added later**

---

## 5. Practical Test Scripts

### Test 1: Check if ASA has clawback enabled

```typescript
// scripts/test-clawback.ts
import algosdk from 'algosdk';

async function checkClawback(assetId: number, indexer: algosdk.Indexer) {
  const assetInfo = await indexer.lookupAssetByID(assetId).do();
  const clawbackAddr = assetInfo.asset.params.clawback;
  
  console.log(`ASA ${assetId} clawback address:`, clawbackAddr || 'NOT SET (clawback disabled)');
  
  return clawbackAddr && clawbackAddr !== "";
}

async function invokeClawback(assetId: number, holderAddress: string, clawbackAddress: string, sk: Uint8Array) {
  const params = await indexer.clientForNetwork().getTransactionParams().do();
  
  // Force transfer from holder back to clawback holder (effectively a burn)
  const txn = algosdk.makeAssetTransferTxnWithSuggestedParamsFromObject({
    from: clawbackAddress,
    to: clawbackAddress,
    assetCloseTo: holderAddress,  // Closes out holder's position
    amount: 1,
    assetIndex: assetId,
    suggestedParams: params,
  });
  
  const signedTxn = txn.signTxn(sk);
  const result = await indexer.clientForNetwork().sendRawTransaction(signedTxn).do();
  console.log('Clawback tx submitted:', result.txid);
  
  await algosdk.waitForConfirmation(indexer.clientForNetwork(), result.txid, 10);
  console.log('Clawback confirmed!');
}
```

### Test 2: Check if ASA has freeze enabled

```typescript
// scripts/test-freeze.ts
import algosdk from 'algosdk';

async function checkFreeze(assetId: number, indexer: algosdk.Indexer) {
  const assetInfo = await indexer.lookupAssetByID(assetId).do();
  const freezeAddr = assetInfo.asset.params.freeze;
  
  console.log(`ASA ${assetId} freeze address:`, freezeAddr || 'NOT SET (freeze disabled)');
  
  return freezeAddr && freezeAddr !== "";
}

async function invokeFreeze(assetId: number, targetAddress: string, freezeAddress: string, sk: Uint8Array) {
  const params = await indexer.clientForNetwork().getTransactionParams().do();
  
  const txn = algosdk.makeAssetFreezeTxnWithSuggestedParamsFromObject({
    from: freezeAddress,
    suggestedParams: params,
    assetIndex: assetId,
    target: targetAddress,
    newFreezeState: true,  // Freeze
  });
  
  const signedTxn = txn.signTxn(sk);
  const result = await indexer.clientForNetwork().sendRawTransaction(signedTxn).do();
  console.log('Freeze tx submitted:', result.txid);
  
  await algosdk.waitForConfirmation(indexer.clientForNetwork(), result.txid, 10);
  console.log('Account frozen!');
}
```

### Test 3: Can an ASA with existing holdings be destroyed?

```typescript
// scripts/test-destroy.ts
import algosdk from 'algosdk';

async function tryDestroyAsset(assetId: number, creatorAddress: string, creatorSk: Uint8Array, indexer: algosdk.Indexer) {
  // First, check if anyone holds this ASA
  const accountInfo = await indexer.lookupAccountAssets(creatorAddress).do();
  const assetHolding = accountInfo.assets.find(a => a['asset-id'] === assetId);
  
  console.log('Creator holding:', assetHolding ? assetHolding.amount : 0);
  
  if (assetHolding && assetHolding.amount > 0) {
    console.log('❌ Cannot destroy: creator still holds units. Burn them first.');
    return false;
  }
  
  // Check other accounts (would need to check ALL accounts with this ASA)
  // In practice, you need clawback to burn everyone's tokens first
  
  const params = await indexer.clientForNetwork().getTransactionParams().do();
  
  try {
    const destroyTxn = algosdk.makeAssetDestroyTxnWithSuggestedParamsFromObject({
      from: creatorAddress,
      suggestedParams: params,
      assetIndex: assetId,
    });
    
    const signedTxn = destroyTxn.signTxn(creatorSk);
    const result = await indexer.clientForNetwork().sendRawTransaction(signedTxn).do();
    console.log('Destroy tx submitted:', result.txid);
    
    await algosdk.waitForConfirmation(indexer.clientForNetwork(), result.txid, 10);
    console.log('✅ ASA destroyed successfully!');
    return true;
  } catch (e) {
    console.log('❌ Destroy failed:', e);
    return false;
  }
}
```

---

## 6. Security Conclusion

### Can Satchel be used for secure authentication?

**No. Badge ownership ≠ guaranteed ongoing access.**

#### Why Satchel badges are NOT suitable for secure authentication:

1. **No mandatory revocation mechanism:** By default, ASAs have no clawback. Once a badge is minted, it stays in the holder's wallet until they transfer it.

2. **Badge transfer is indistinguishable from legitimate holding:** If a user transfers their badge to another wallet, there's no on-chain way to distinguish "the original owner sold their badge" from "someone stole the badge."

3. **No time-based expiry:** ASAs don't have built-in expiration. A badge issued today is valid forever (unless explicitly destroyed, which requires clawback + burning).

4. **Freeze ≠ Revocation:** Even if freeze is enabled, freezing an account prevents them from transferring OUT but does NOT:
   - Remove the badge from their wallet
   - Prevent them from receiving more badges
   - Prevent them from using the badge for authorization (apps read the blockchain)

5. **Compromised wallet = compromised badges:** If a user's wallet is compromised, all badges in that wallet can be transferred out by the attacker.

#### What Satchel IS suitable for:
- ✅ Authorization (feature gating based on badge presence)
- ✅ Credential portability (user-controlled credentials across apps)
- ✅ Proof of historical achievement (on-chain issuance record)
- ✅ One factor among many in multi-factor auth systems

#### What Satchel is NOT suitable for:
- 🚫 Secure authentication as sole factor
- 🚫 Time-limited access control
- 🚫 Credentials that must be revocable
- 🚫 Identity verification (badge ownership ≠ identity)

### Recommendations for Satchel:

1. **For revocable badges:** Create ASAs with `clawback` enabled at creation. Store the clawback key securely. When revocation is needed, use clawback to reclaim tokens.

2. **For temporary badges:** Track badge issuance timestamps off-chain. Have apps check both badge ownership AND timestamp. Implement application-level logic to reject badges older than a certain age.

3. **For security-critical use cases:** Never use Satchel badges as the sole authorization mechanism. Combine with:
   - Wallet age requirements
   - Transaction history checks
   - Additional off-chain authentication (2FA, email verification)
   - Smart contract-based access that can be updated

---

## Appendix: ASA Creation Parameters Reference

When calling `makeAssetCreateTxnWithSuggestedParamsFromObject`:

| Parameter | Default | Revocation-Related |
|-----------|---------|-------------------|
| `clawback` | `""` (zero address, disabled) | Set to issuer address to enable clawback |
| `freeze` | `""` (zero address, disabled) | Set to enable freeze |
| `manager` | `""` (zero address, disabled) | Can change clawback/freeze/reserve |
| `reserve` | `""` (zero address, disabled) | No direct revocation use |
| `total` | Required | Set to 1 for NFTs |
| `decimals` | Required | Set to 0 for NFTs |
| `defaultFrozen` | `false` | If true, accounts must be unfrozen to receive |

---

## References

- [Algorand Developer Docs - ASAs](https://developer.algorand.org/docs/get-details/asa/)
- [Algorand Developer Docs - Asset Transactions](https://developer.algorand.org/docs/get-details/transactions/)
- [js-algorand-sdk on GitHub](https://github.com/algorand/js-algorand-sdk)
- [ARC3 NFT Standard](https://github.com/algorandfoundation/ARCs/blob/main/ARCs/arc-0003.md)
- [ARC69 NFT Metadata Standard](https://github.com/algorandfoundation/ARCs/blob/main/ARCs/arc-0069.md)
