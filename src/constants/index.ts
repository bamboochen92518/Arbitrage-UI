import { PublicKey } from '@solana/web3.js';

export const RAYDIUM_SOL_USDC_POOL_ID = new PublicKey('58oQChx4yWmvKdwLLZzBi4ChoCc2fqCUWBkwMihLYQo2');

export const ORCA_SOL_USDC_POOL_ID = new PublicKey('FpCMFDFGYotvufJ7HrFHsWEiiQCGbkLCtwHiDnh7o28Q');

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