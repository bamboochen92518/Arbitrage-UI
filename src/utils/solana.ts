import { Connection, PublicKey } from '@solana/web3.js';
import * as borsh from 'borsh';
import { RAYDIUM_POOL_IDS, ORCA_POOL_IDS, TOKEN_DECIMALS, RAYDIUM_POOL_SCHEMA, ORCA_POOL_SCHEMA, TOKEN_MINTS } from '../constants';
import { PricePoint } from '../types';
import { use } from 'react';

// Helper function to map token mint (Uint8Array) to token name
const getTokenName = (mint: Uint8Array): string | null => {
  const mintPublicKey = new PublicKey(mint);
  for (const [tokenName, tokenMint] of Object.entries(TOKEN_MINTS)) {
    if (tokenMint.equals(mintPublicKey)) {
      return tokenName;
    }
  }
  return null; // Return null if no match found
};

export const fetchRaydiumPrice = async (
  tokenPair: string,
  setPrice: (price: number | null) => void,
  setPriceHistory: (history: (prev: PricePoint[]) => PricePoint[]) => void,
  setLoading: (loading: boolean) => void,
  setError: (error: string | null) => void
) => {
  try {
    const connection = new Connection('https://solana-mainnet.core.chainstack.com/27098d57fcb5334739b6917c275dba1c', 'confirmed');
    const poolId = RAYDIUM_POOL_IDS[tokenPair as keyof typeof RAYDIUM_POOL_IDS];
    if (!poolId) {
      throw new Error(`Raydium pool ID not found for ${tokenPair}`);
    }

    const poolInfo = await connection.getAccountInfo(poolId);
    if (!poolInfo) {
      throw new Error(`Raydium pool not found for ${tokenPair}`);
    }

    const poolData = poolInfo.data;
    const poolState = borsh.deserialize(RAYDIUM_POOL_SCHEMA, poolData) as {
      baseVault: Uint8Array;
      quoteVault: Uint8Array;
      baseMint: Uint8Array;
      quoteMint: Uint8Array;
    };

    const baseVaultKey = new PublicKey(poolState.baseVault);
    const quoteVaultKey = new PublicKey(poolState.quoteVault);

    const baseVaultBalance = await connection.getTokenAccountBalance(baseVaultKey);
    const quoteVaultBalance = await connection.getTokenAccountBalance(quoteVaultKey);

    const baseAmount = baseVaultBalance.value.uiAmount;
    const quoteAmount = quoteVaultBalance.value.uiAmount;

    if (baseAmount === 0) {
      throw new Error(`Raydium base amount is zero for ${tokenPair}`);
    }

    // Get pool token order
    const poolOrder = {
      'base': getTokenName(poolState.baseMint), 
      'quote': getTokenName(poolState.quoteMint)
    };
    if (!poolOrder) {
      throw new Error(`Raydium pool token order not found for ${tokenPair}`);
    }

    // Calculate price (quote/base)
    let fetchedPrice = quoteAmount / baseAmount;

    // Adjust price if pool order differs from user-selected tokenPair
    const [userBase, userQuote] = tokenPair.split('/');
    if (poolOrder.base === userQuote && poolOrder.quote === userBase) {
      // Invert price if pool order is reversed (e.g., pool is USDC/SOL, user wants SOL/USDC)
      fetchedPrice = 1 / fetchedPrice;
    }

    const timestamp = new Date().toLocaleTimeString();

    setPrice(fetchedPrice);
    setPriceHistory((prev) => {
      const newHistory = [...prev, { price: fetchedPrice, timestamp }];
      return newHistory.slice(-60);
    });

    setLoading(false);
  } catch (err: any) {
    const errorMessage = err.message || `Failed to fetch Raydium price data for ${tokenPair}`;
    setError(errorMessage);
    console.error(`Raydium error for ${tokenPair}:`, err);
    setLoading(false);
  }
};

export const fetchOrcaPrice = async (
  tokenPair: string,
  setPrice: (price: number | null) => void,
  setPriceHistory: (history: (prev: PricePoint[]) => PricePoint[]) => void,
  setLoading: (loading: boolean) => void,
  setError: (error: string | null) => void
) => {
  try {
    const connection = new Connection(
      'https://solana-mainnet.core.chainstack.com/27098d57fcb5334739b6917c275dba1c',
      'confirmed'
    );
    const poolId = ORCA_POOL_IDS[tokenPair as keyof typeof ORCA_POOL_IDS];
    if (!poolId) {
      throw new Error(`Orca pool ID not found for ${tokenPair}`);
    }

    const poolInfo = await connection.getAccountInfo(poolId);
    if (!poolInfo) {
      throw new Error(`Orca pool not found for ${tokenPair}`);
    }

    const poolData = poolInfo.data.slice(8);
    const poolState = borsh.deserialize(ORCA_POOL_SCHEMA, poolData) as {
      sqrtPrice: Uint8Array;
      tokenVaultA: Uint8Array;
      tokenVaultB: Uint8Array;
      tokenMintA: Uint8Array;
      tokenMintB: Uint8Array;
    };

    const sqrtPrice = uint8ArrayToBigInt(poolState.sqrtPrice);
    const Q64 = BigInt('18446744073709551616');
    const sqrtPriceF64 = Number(sqrtPrice);
    let rawPrice = Math.pow(sqrtPriceF64 / Number(Q64), 2.0);

    // Get pool token order from tokenMintA and tokenMintB
    const [userBase, userQuote] = tokenPair.split('/');
    const poolOrder = {
      'base': getTokenName(poolState.tokenMintA), 
      'quote': getTokenName(poolState.tokenMintB)
    };

    // Apply decimal adjustment using individual token decimals
    const decimalsA = TOKEN_DECIMALS[poolOrder.base as keyof typeof TOKEN_DECIMALS];
    const decimalsB = TOKEN_DECIMALS[poolOrder.quote as keyof typeof TOKEN_DECIMALS];
    if (decimalsA === undefined || decimalsB === undefined) {
      throw new Error(`Decimal configuration not found for ${tokenPair}`);
    }
    const power = Math.pow(10, decimalsA - decimalsB);
    let finalPrice = rawPrice * power;

    // Verify pool order using token mints
    if (poolOrder['base'] === userQuote && poolOrder['quote'] === userBase) {
      // Pool is quote/base (e.g., USDC/SOL), user wants base/quote (e.g., SOL/USDC)
      finalPrice = 1 / finalPrice; // Invert price
    }

    const timestamp = new Date().toLocaleTimeString();

    setPrice(finalPrice);
    setPriceHistory((prev) => {
      const newHistory = [...prev, { price: finalPrice, timestamp }];
      return newHistory.slice(-60);
    });

    setLoading(false);
  } catch (err: any) {
    const errorMessage = err.message || `Failed to fetch Orca price data for ${tokenPair}`;
    setError(errorMessage);
    console.error(`Orca error for ${tokenPair}:`, err);
    setLoading(false);
  }
};

export function uint8ArrayToBigInt(arr: Uint8Array): bigint {
  const value = BigInt(
    arr.reduce((acc, val, i) => acc + BigInt(val) * BigInt(2) ** BigInt(8 * i), BigInt(0))
  );
  return value;
}