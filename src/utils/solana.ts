import { Connection, PublicKey } from '@solana/web3.js';
import * as borsh from 'borsh';
import { RAYDIUM_POOL_IDS, ORCA_POOL_IDS, TOKEN_DECIMALS, RAYDIUM_POOL_SCHEMA, ORCA_POOL_SCHEMA, TOKEN_MINTS, SOLEND_RESERVE_SCHEMA } from '../constants';
import { PricePoint } from '../types';

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
      swapFeeNumerator: bigint;
      swapFeeDenominator: bigint;
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
    return poolState; // Return pool state for use in arbitrage check
  } catch (err: any) {
    const errorMessage = err.message || `Failed to fetch Raydium price data for ${tokenPair}`;
    setError(errorMessage);
    console.error(`Raydium error for ${tokenPair}:`, err);
    setLoading(false);
    return null;
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
      feeRate: number;
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
    return poolState; // Return pool state for use in arbitrage check
  } catch (err: any) {
    const errorMessage = err.message || `Failed to fetch Orca price data for ${tokenPair}`;
    setError(errorMessage);
    console.error(`Orca error for ${tokenPair}:`, err);
    setLoading(false);
    return null;
  }
};

export function uint8ArrayToBigInt(arr: Uint8Array): bigint {
  const value = BigInt(
    arr.reduce((acc, val, i) => acc + BigInt(val) * BigInt(2) ** BigInt(8 * i), BigInt(0))
  );
  return value;
}

interface ArbitrageResult {
  isProfitable: boolean;
  profit: number; // Profit in tokens
  buyMarket: string; // 'Raydium' or 'Orca'
  sellMarket: string; // 'Raydium' or 'Orca'
  loanAmount: number; // Actual SOL loaned
  tokensBought: number; // Tokens bought on buy market
  minTokensBought: number; // Minimum tokens bought with slippage
  priceImpact: number; // Price impact percentage
  rate: number; // Tokens per SOL
}

export async function checkArbitrageProfitability(
  tokenPair: string,
  raydiumPrice: number,
  orcaPrice: number
): Promise<ArbitrageResult> {
  // Determine buy and sell markets
  const buyMarket = raydiumPrice < orcaPrice ? 'Raydium' : 'Orca';
  const sellMarket = buyMarket === 'Raydium' ? 'Orca' : 'Raydium';
  const buyPrice = buyMarket === 'Raydium' ? raydiumPrice : orcaPrice;
  const sellPrice = sellMarket === 'Orca' ? orcaPrice : raydiumPrice;

  // Fetch pool data using existing fetch functions
  let raydiumPool: any = null;
  let orcaPool: any = null;
  let raydiumBaseAmount: number = 0;
  let raydiumQuoteAmount: number = 0;
  let orcaBaseAmount: number = 0;
  let orcaQuoteAmount: number = 0;

  await Promise.all([
    fetchRaydiumPrice(
      tokenPair,
      () => {}, // No-op for price
      () => (prev: PricePoint[]) => prev, // No-op for history
      () => {}, // No-op for loading
      () => {} // No-op for error
    ).then(async (poolState) => {
      raydiumPool = poolState;
      if (poolState) {
        const baseVaultKey = new PublicKey(poolState.baseVault);
        const quoteVaultKey = new PublicKey(poolState.quoteVault);
        const connection = new Connection('https://solana-mainnet.core.chainstack.com/27098d57fcb5334739b6917c275dba1c', 'confirmed');
        const [baseVaultBalance, quoteVaultBalance] = await Promise.all([
          connection.getTokenAccountBalance(baseVaultKey),
          connection.getTokenAccountBalance(quoteVaultKey),
        ]);
        raydiumBaseAmount = baseVaultBalance.value.uiAmount || 0;
        raydiumQuoteAmount = quoteVaultBalance.value.uiAmount || 0;
      }
    }),
    fetchOrcaPrice(
      tokenPair,
      () => {},
      () => (prev: PricePoint[]) => prev,
      () => {},
      () => {}
    ).then(async (poolState) => {
      orcaPool = poolState;
      if (poolState) {
        const vaultAKey = new PublicKey(poolState.tokenVaultA);
        const vaultBKey = new PublicKey(poolState.tokenVaultB);
        const connection = new Connection('https://solana-mainnet.core.chainstack.com/27098d57fcb5334739b6917c275dba1c', 'confirmed');
        const [vaultABalance, vaultBBalance] = await Promise.all([
          connection.getTokenAccountBalance(vaultAKey),
          connection.getTokenAccountBalance(vaultBKey),
        ]);
        const poolOrder = {
          base: getTokenName(poolState.tokenMintA),
          quote: getTokenName(poolState.tokenMintB),
        };
        const [userBase] = tokenPair.split('/');
        // Assign balances based on pool order
        orcaBaseAmount = poolOrder.base === userBase ? vaultABalance.value.uiAmount || 0 : vaultBBalance.value.uiAmount || 0;
        orcaQuoteAmount = poolOrder.quote === userBase ? vaultABalance.value.uiAmount || 0 : vaultBBalance.value.uiAmount || 0;
      }
    }),
  ]);

  if (!raydiumPool || !orcaPool || raydiumBaseAmount === 0 || orcaBaseAmount === 0) {
    return {
      isProfitable: false,
      profit: 0,
      buyMarket,
      sellMarket,
      loanAmount: 0,
      tokensBought: 0,
      minTokensBought: 0,
      priceImpact: 0,
      rate: 0,
    };
  }

  // Calculate fees
  const raydiumFeeRate = Number(raydiumPool.swapFeeNumerator) / Number(raydiumPool.swapFeeDenominator);
  const orcaFeeRate = Number(orcaPool.feeRate) / 10000; // Orca feeRate is in basis points
  const flashLoanFeeRate = 0.003; // Solend’s 0.3% flash loan fee

  // Fetch available loan amount from Solend
  const loanAmount = await getSolendPoolBalance();

  if (loanAmount <= 0) {
    return {
      isProfitable: false,
      profit: 0,
      buyMarket,
      sellMarket,
      loanAmount: 0,
      tokensBought: 0,
      minTokensBought: 0,
      priceImpact: 0,
      rate: 0,
    };
  }

  // Calculate tokens bought on cheaper market (SOL -> Token, e.g., SOL -> USDC)
  let tokensBought: number;
  let priceImpact: number;
  let rate: number;
  const [userBase] = tokenPair.split('/');
  if (buyMarket === 'Raydium') {
    const baseAmount = userBase === 'SOL' ? raydiumBaseAmount : raydiumQuoteAmount;
    const quoteAmount = userBase === 'SOL' ? raydiumQuoteAmount : raydiumBaseAmount;
    const amountInAfterFee = loanAmount * (1 - raydiumFeeRate);
    tokensBought = quoteAmount * amountInAfterFee / (baseAmount + amountInAfterFee);
    priceImpact = (amountInAfterFee / (baseAmount + amountInAfterFee)) * 100;
    rate = tokensBought / loanAmount;
  } else {
    const baseAmount = userBase === 'SOL' ? orcaBaseAmount : orcaQuoteAmount;
    const quoteAmount = userBase === 'SOL' ? orcaQuoteAmount : orcaBaseAmount;
    const amountInAfterFee = loanAmount * (1 - orcaFeeRate);
    tokensBought = quoteAmount * amountInAfterFee / (baseAmount + amountInAfterFee);
    priceImpact = (amountInAfterFee / (baseAmount + amountInAfterFee)) * 100;
    rate = tokensBought / loanAmount;
  }

  // Apply 1% slippage for minimum output (as in OrcaSwap)
  const minTokensBought = tokensBought * 0.99;

  // Calculate SOL received from selling tokens on higher market (Token -> SOL)
  let solReceived: number;
  if (sellMarket === 'Raydium') {
    const baseAmount = userBase === 'SOL' ? raydiumBaseAmount : raydiumQuoteAmount;
    const quoteAmount = userBase === 'SOL' ? raydiumQuoteAmount : raydiumBaseAmount;
    const amountInAfterFee = tokensBought * (1 - raydiumFeeRate);
    solReceived = baseAmount * amountInAfterFee / (quoteAmount + amountInAfterFee);
  } else {
    const baseAmount = userBase === 'SOL' ? orcaBaseAmount : orcaQuoteAmount;
    const quoteAmount = userBase === 'SOL' ? orcaQuoteAmount : orcaBaseAmount;
    const amountInAfterFee = tokensBought * (1 - orcaFeeRate);
    solReceived = baseAmount * amountInAfterFee / (quoteAmount + amountInAfterFee);
  }

  // Calculate flash loan fee (in SOL)
  const flashLoanFee = loanAmount * flashLoanFeeRate;

  // Calculate profit (in tokens)
  const solProfit = solReceived - loanAmount - flashLoanFee; // SOL after repaying loan and fee
  const tokenProfit = solProfit * sellPrice; // Convert SOL profit to tokens

  // Check if profitable
  const isProfitable = tokenProfit > 0;
  console.log("Estimate Profit: ", tokenProfit);

  return {
    isProfitable,
    profit: tokenProfit,
    buyMarket,
    sellMarket,
    loanAmount,
    tokensBought,
    minTokensBought,
    priceImpact,
    rate,
  };
}

// Fetch available SOL balance in Solend SOL reserve
async function getSolendPoolBalance(): Promise<number> {
  try {
    const connection = new Connection('https://solana-mainnet.core.chainstack.com/27098d57fcb5334739b6917c275dba1c', 'confirmed');
    const reservePda = new PublicKey('FcMXW4jYR2SPDGhkSQ8zYTqWdYXMQR3yqyMLpEbt1wrs'); // Solend SOL reserve
    const accountInfo = await connection.getAccountInfo(reservePda);
    if (!accountInfo) {
      throw new Error('Solend SOL reserve not found');
    }
    const reserveData = borsh.deserialize(SOLEND_RESERVE_SCHEMA, accountInfo.data) as {
      liquidity: { availableAmount: bigint };
    };
    // Convert lamports to SOL (1 SOL = 10^9 lamports)
    const balance = Number(reserveData.liquidity.availableAmount) / 1_000_000_000;
    return balance;
  } catch (err: any) {
    console.error('Error fetching Solend pool balance:', err);
    return 0; // Return 0 if fetch fails
  }
}