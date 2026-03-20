# ⚠️ SECURITY DISCLAIMER — READ BEFORE USING

## This System Provides AUTHORIZATION, Not AUTHENTICATION

**Satchel badges are authorization tokens, NOT secure authentication tokens.**

Understanding the distinction between authorization and authentication is critical to using this system safely.

---

## What Badges CAN Do

- ✅ Verify that a wallet address holds a specific badge at a point in time
- ✅ Provide a decentralized, tamper-proof record of badge issuance on-chain
- ✅ Enable user-controlled credential portability across applications
- ✅ Serve as one factor among many for access control decisions

## What Badges CANNOT Do

- ❌ **Prevent wallet access** by unauthorized users
- ❌ **Guarantee the current wallet holder is the original recipient**
- ❌ **Provide revocation or rollback** once minted
- ❌ **Control who has access to the underlying wallet itself**
- ❌ **Serve as proof of identity** — only proof of badge ownership

---

## The Revocation Problem

**Algorand ASAs (Algorand Standard Assets) cannot be revoked by default.**

This is a fundamental property of the Algorand blockchain, not a Satchel limitation. For revocation to be possible:

1. The ASA must have been created with `clawback` parameter set to a valid address
2. The `clawback` address must be controlled by your application
3. **Most ASAs — including badges — are created with clawback DISABLED (default)**

### Implications

| Scenario | Result |
|----------|--------|
| User earned a badge legitimately | Badge stays in their wallet forever |
| User transferred badge to another wallet | Badge is now in the new wallet |
| User sold badge to someone else | You cannot reclaim it |
| User lost wallet with badge | Badge is gone (wallet access lost, not badge) |
| Malicious actor obtained user's wallet | They inherit all badges in that wallet |

---

## Badge Ownership Can Change

Badges are **transferable tokens**. They can be:

- 📤 Transferred to another wallet
- 💰 Sold on secondary markets
- 📋 Lost due to wallet compromise
- 👤 Passed to heirs or representatives

**Treat badge holdings as authorization tokens (like event tickets or club memberships), not as proof of identity.**

---

## Do NOT Use This System For

- 🚫 **Security-critical access control** (e.g., financial transactions, admin functions)
- 🚫 **As the sole authorization factor** for sensitive operations
- 🚫 **Proof of identity verification** — badge ownership ≠ identity
- 🚫 **Revocable credentials** — once issued, badges cannot be recalled

---

## Best Practices for Applications Using Satchel

1. **Combine multiple signals** — Use wallet age, transaction history, on-chain reputation, and other factors alongside badges
2. **Implement additional verification** — Email verification, 2FA, or other identity confirmation for sensitive operations
3. **Use badges for feature access, not security decisions** — Badges work well for unlocking UI features, content access, or non-critical functionality
4. **Track temporal context** — Record when badges were minted if time-sensitive access matters
5. **Plan for badge transfer** — Accept that badge holders may change; design your access model accordingly

---

## Wallet Security

**Satchel does not control users' wallets.**

Wallet security is the sole responsibility of the wallet holder.:

- 🔐 Never share private keys or seed phrases with any application, including Satchel
- 🔐 Use hardware wallets for significant holdings
- 🔐 Verify contract addresses before signing transactions

---

## Questions?

If you have questions about whether Satchel is appropriate for your use case, please open an issue on GitHub for discussion.

---

*Last updated: 2026-03-20*
