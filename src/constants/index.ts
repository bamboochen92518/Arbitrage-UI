import { PublicKey } from '@solana/web3.js';

// Raydium pool IDs (Raydium Liquidity Pool V4)
// https://solscan.io/amm/raydium?program_id=675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8&sortBy=total_volume_1_24h#markets
export const RAYDIUM_POOL_IDS = {
  'SOL/USDC': new PublicKey('58oQChx4yWmvKdwLLZzBi4ChoCc2fqCUWBkwMihLYQo2'), // Example SOL/USDC pool ID
  'POPCAT/SOL': new PublicKey('FRhB8L7Y9Qq41qZXYLtC2nw8An1RJfLLxRF2x9RwLLMo'),
  'FARTCOIN/SOL': new PublicKey('Bzc9NZfMqkXR6fz1DBph7BDf9BroyEf6pnzESP7v5iiw'),
};

// Orca pool IDs
// https://www.orca.so/pools
export const ORCA_POOL_IDS = {
  'SOL/USDC': new PublicKey('FpCMFDFGYotvufJ7HrFHsWEiiQCGbkLCtwHiDnh7o28Q'), // Example SOL/USDC pool ID
  'POPCAT/SOL': new PublicKey('AHTTzwf3GmVMJdxWM8v2MSxyjZj8rQR6hyAC3g9477Yj'),
  'FARTCOIN/SOL': new PublicKey('C9U2Ksk6KKWvLEeo5yUQ7Xu46X7NzeBJtd9PBfuXaUSM'),
};

// Token mints for verification
export const TOKEN_MINTS = {
  SOL: new PublicKey('So11111111111111111111111111111111111111112'), // SOL mint
  USDC: new PublicKey('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'), // USDC mint
  POPCAT: new PublicKey('7GCihgDB8fe6KNjn2MYtkzZcRjQy3t9GHdC8uHYmW2hr'),
  FARTCOIN: new PublicKey('9BB6NFEcjBCtnNLFko2FqVQBq8HHM13kCyYcdQbgpump'),
};

// Pool token order (base/quote as stored in the pool)
export const RAYDIUM_POOL_TOKEN_ORDER = {
  'SOL/USDC': { base: 'SOL', quote: 'USDC' }, // Pool stores SOL as base, USDC as quote
  'POPCAT/SOL': { base: 'POPCAT', quote: 'SOL' }, // Example: Pool might be ETH/SOL
  'FARTCOIN/SOL': { base: 'SOL', quote: 'FARTCOIN' }, // Adjust based on actual pool
};

export const ORCA_POOL_TOKEN_ORDER = {
  'SOL/USDC': { base: 'USDC', quote: 'SOL' }, // Example: Pool might be USDC/SOL
  'POPCAT/SOL': { base: 'SOL', quote: 'POPCAT' },
  'FARTCOIN/SOL': { base: 'FARTCOIN', quote: 'SOL' }, // Adjust based on actual pool
};

// Token decimals (for Orca price adjustments)
export const TOKEN_DECIMALS = {
  'SOL/USDC': { base: 9, quote: 6 }, // SOL: 9 decimals, USDC: 6 decimals
  'POPCAT/SOL': { base: 9, quote: 9 }, // POPCAT: 9 decimals, SOL: 9 decimals
  'FARTCOIN/SOL': { base: 9, quote: 6 }, // FARTCOIN: 6 decimals, SOL: 9 decimals (adjust as needed)
};

export const RAYDIUM_POOL_SCHEMA = {
  struct: {
    _padding: { array: { type: 'u8', len: 336 } },
    baseVault: { array: { type: 'u8', len: 32 } },
    quoteVault: { array: { type: 'u8', len: 32 } },
  },
};

export const ORCA_POOL_SCHEMA = {
  struct: {
    whirlpoolsConfig: { array: { type: 'u8', len: 32 } },
    whirlpoolBump: { array: { type: 'u8', len: 1 } },
    tickSpacing: 'u16',
    tickSpacingSeed: { array: { type: 'u8', len: 2 } },
    feeRate: 'u16',
    protocolFeeRate: 'u16',
    liquidity: { array: { type: 'u8', len: 16 } },
    sqrtPrice: { array: { type: 'u8', len: 16 } },
    tickCurrentIndex: 'i32',
    protocolFeeOwedA: { array: { type: 'u8', len: 8 } },
    protocolFeeOwedB: { array: { type: 'u8', len: 8 } },
    tokenMintA: { array: { type: 'u8', len: 32 } },
    tokenVaultA: { array: { type: 'u8', len: 32 } },
    feeGrowthGlobalA: { array: { type: 'u8', len: 16 } },
    tokenMintB: { array: { type: 'u8', len: 32 } },
    tokenVaultB: { array: { type: 'u8', len: 32 } },
    feeGrowthGlobalB: { array: { type: 'u8', len: 16 } },
    rewardLastUpdatedTimestamp: { array: { type: 'u8', len: 8 } },
  },
};