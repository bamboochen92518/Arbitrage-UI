import { PublicKey } from '@solana/web3.js';

// Raydium pool IDs (Raydium Liquidity Pool V4)
// https://solscan.io/amm/raydium?program_id=675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8&sortBy=total_volume_1_24h#markets
export const RAYDIUM_POOL_IDS = {
  'SOL/USDC': new PublicKey('58oQChx4yWmvKdwLLZzBi4ChoCc2fqCUWBkwMihLYQo2'), // Example SOL/USDC pool ID
  'POPCAT/SOL': new PublicKey('FRhB8L7Y9Qq41qZXYLtC2nw8An1RJfLLxRF2x9RwLLMo'),
  'FARTCOIN/SOL': new PublicKey('Bzc9NZfMqkXR6fz1DBph7BDf9BroyEf6pnzESP7v5iiw'),
  'JTO/SOL': new PublicKey('EzLBvtY6gwdz5BGJnKDZGgYrMzm1PLKcxdViqRx5fSL1'),
};

// Orca pool IDs
// https://www.orca.so/pools
export const ORCA_POOL_IDS = {
  'SOL/USDC': new PublicKey('FpCMFDFGYotvufJ7HrFHsWEiiQCGbkLCtwHiDnh7o28Q'), // Example SOL/USDC pool ID
  'POPCAT/SOL': new PublicKey('AHTTzwf3GmVMJdxWM8v2MSxyjZj8rQR6hyAC3g9477Yj'),
  'FARTCOIN/SOL': new PublicKey('C9U2Ksk6KKWvLEeo5yUQ7Xu46X7NzeBJtd9PBfuXaUSM'),
  'JTO/SOL': new PublicKey('2UhFnySoJi6c89aydGAGS7ZRemo2dbkFRhvSJqDX4gHJ'),
};

// Token mints for verification
export const TOKEN_MINTS = {
  'SOL': new PublicKey('So11111111111111111111111111111111111111112'), // SOL mint
  'USDC': new PublicKey('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'), // USDC mint
  'POPCAT': new PublicKey('7GCihgDB8fe6KNjn2MYtkzZcRjQy3t9GHdC8uHYmW2hr'),
  'FARTCOIN': new PublicKey('9BB6NFEcjBCtnNLFko2FqVQBq8HHM13kCyYcdQbgpump'),
  'JTO': new PublicKey('jtojtomepa8beP8AuQc6eXt5FriJwfFMwQx2v2f9mCL'),
};

// Token decimals (for Orca price adjustments)
export const TOKEN_DECIMALS = {
  'SOL': 9,
  'USDC': 6,
  'POPCAT': 9,
  'FARTCOIN': 6,
  'JTO': 9,
};

export const RAYDIUM_POOL_SCHEMA = {
  struct: {
    status: 'u64',
    nonce: 'u64',
    maxOrder: 'u64',
    depth: 'u64',
    baseDecimal: 'u64',
    quoteDecimal: 'u64',
    state: 'u64',
    resetFlag: 'u64',
    minSize: 'u64',
    volMaxCutRatio: 'u64',
    amountWaveRatio: 'u64',
    baseLotSize: 'u64',
    quoteLotSize: 'u64',
    minPriceMultiplier: 'u64',
    maxPriceMultiplier: 'u64',
    systemDecimalValue: 'u64',
    minSeparateNumerator: 'u64',
    minSeparateDenominator: 'u64',
    tradeFeeNumerator: 'u64',
    tradeFeeDenominator: 'u64',
    pnlNumerator: 'u64',
    pnlDenominator: 'u64',
    swapFeeNumerator: 'u64',
    swapFeeDenominator: 'u64',
    baseNeedTakePnl: 'u64',
    quoteNeedTakePnl: 'u64',
    quoteTotalPnl: 'u64',
    baseTotalPnl: 'u64',
    poolOpenTime: 'u64',
    punishPcAmount: 'u64',
    punishCoinAmount: 'u64',
    orderbookToInitTime: 'u64',
    swapBaseInAmount: 'u128',
    swapQuoteOutAmount: 'u128',
    swapBase2QuoteFee: 'u64',
    swapQuoteInAmount: 'u128',
    swapBaseOutAmount: 'u128',
    swapQuote2BaseFee: 'u64',
    baseVault: { array: { type: 'u8', len: 32 } },
    quoteVault: { array: { type: 'u8', len: 32 } },
    baseMint: { array: { type: 'u8', len: 32 } },
    quoteMint: { array: { type: 'u8', len: 32 } },
    lpMint: { array: { type: 'u8', len: 32 } },
    openOrders: { array: { type: 'u8', len: 32 } },
    marketId: { array: { type: 'u8', len: 32 } },
    marketProgramId: { array: { type: 'u8', len: 32 } },
    targetOrders: { array: { type: 'u8', len: 32 } },
    withdrawQueue: { array: { type: 'u8', len: 32 } },
    lpVault: { array: { type: 'u8', len: 32 } },
    owner: { array: { type: 'u8', len: 32 } },
    lpReserve: 'u64',
    padding: { array: { type: 'u64', len: 3 } },
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