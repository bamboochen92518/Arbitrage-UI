import { Connection, PublicKey } from '@solana/web3.js';
import * as borsh from 'borsh';
import { RAYDIUM_SOL_USDC_POOL_ID, ORCA_SOL_USDC_POOL_ID, RAYDIUM_POOL_SCHEMA, ORCA_POOL_SCHEMA } from '../constants';
import { PricePoint } from '../types';

export const fetchRaydiumPrice = async (
  setPrice: (price: number | null) => void,
  setPriceHistory: (history: (prev: PricePoint[]) => PricePoint[]) => void,
  setLoading: (loading: boolean) => void,
  setError: (error: string | null) => void
) => {
  try {
    const connection = new Connection('https://solana-mainnet.core.chainstack.com/27098d57fcb5334739b6917c275dba1c', 'confirmed');
    const poolInfo = await connection.getAccountInfo(RAYDIUM_SOL_USDC_POOL_ID);
    if (!poolInfo) {
      throw new Error('Raydium pool not found');
    }

    const poolState = borsh.deserialize(RAYDIUM_POOL_SCHEMA, poolInfo.data) as {
      baseVault: Uint8Array;
      quoteVault: Uint8Array;
    };

    const baseVaultKey = new PublicKey(poolState.baseVault);
    const quoteVaultKey = new PublicKey(poolState.quoteVault);

    // console.log('Raydium Base Vault:', baseVaultKey.toString());
    // console.log('Raydium Quote Vault:', quoteVaultKey.toString());

    const baseVaultBalance = await connection.getTokenAccountBalance(baseVaultKey);
    const quoteVaultBalance = await connection.getTokenAccountBalance(quoteVaultKey);

    const baseAmount = baseVaultBalance.value.uiAmount;
    const quoteAmount = quoteVaultBalance.value.uiAmount;
    if (baseAmount === 0) {
      throw new Error('Raydium base amount is zero');
    }
    const fetchedPrice = quoteAmount / baseAmount;

    const timestamp = new Date().toLocaleTimeString();

    setPrice(fetchedPrice);
    // console.log(`Raydium SOL/USDC Price: ${fetchedPrice}`);

    setPriceHistory((prev) => {
      const newHistory = [...prev, { price: fetchedPrice, timestamp }];
      return newHistory.slice(-60);
    });

    setLoading(false);
  } catch (err: any) {
    const errorMessage = err.message || 'Failed to fetch Raydium price data';
    setError(errorMessage);
    console.error('Raydium error:', err);
    setLoading(false);
  }
};

export const fetchOrcaPrice = async (
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
    const poolInfo = await connection.getAccountInfo(ORCA_SOL_USDC_POOL_ID);
    if (!poolInfo) {
      throw new Error('Orca pool not found');
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
    // console.log('sqrtPrice:', sqrtPrice.toString());

    const Q64 = BigInt('18446744073709551616');
    const sqrtPriceF64 = Number(sqrtPrice);
    const rawPrice = Math.pow(sqrtPriceF64 / Number(Q64), 2.0);
    // console.log('Raw price:', rawPrice);

    const decimalsA = 9;
    const decimalsB = 6;
    const power = Math.pow(10, decimalsA - decimalsB);
    const finalPrice = rawPrice * power;
    // console.log('Price after decimal adjustment:', finalPrice);

    const timestamp = new Date().toLocaleTimeString();

    setPrice(finalPrice);
    // console.log(`Orca SOL/USDC Price: ${finalPrice}`);

    setPriceHistory((prev) => {
      const newHistory = [...prev, { price: finalPrice, timestamp }];
      return newHistory.slice(-60);
    });

    setLoading(false);
  } catch (err: any) {
    const errorMessage = err.message || 'Failed to fetch Orca price data';
    setError(errorMessage);
    console.error('Orca error:', err);
    setLoading(false);
  }
};

export function uint8ArrayToBigInt(arr: Uint8Array): bigint {
  const value = BigInt(
    arr.reduce((acc, val, i) => acc + BigInt(val) * BigInt(2) ** BigInt(8 * i), BigInt(0))
  );
  return value;
}