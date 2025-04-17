# How to Add Your Own Token Pairs

In this tutorial, I’ll walk you through how to add your own token pairs to this tool.

### Step 1: Add the Token Pair Button

In `App.tsx`, add your custom token pair to the `TOKEN_PAIRS` array:

```typescript
const TOKEN_PAIRS = ['SOL/USDC', 'POPCAT/SOL', 'FARTCOIN/SOL', 'TokenA/TokenB'] as const;
```

### Step 2: Add Token and Pool Addresses for Each Protocol (or dApp)

In `constants/index.ts`, update the following arrays by appending your new token pair information:

1. Raydium Pool Address (Raydium Liquidity Pool V4)
    Ensure the pool type is Raydium Liquidity Pool V4 — not AMM, Concentrated Liquidity, or CPMM.
    You can verify the pool type using Solana block explorers like Solscan.
2. Orca Pool Address
3. Token Mint Addresses
4. Token Decimals
