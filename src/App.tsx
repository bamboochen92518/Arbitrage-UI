import { useState, useEffect } from 'react';
import { Connection, PublicKey } from '@solana/web3.js';
import * as borsh from "borsh";
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import './App.css';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

// Raydium SOL/USDC pool ID (mainnet)
const RAYDIUM_SOL_USDC_POOL_ID = new PublicKey('58oQChx4yWmvKdwLLZzBi4ChoCc2fqCUWBkwMihLYQo2');

// Orca SOL/USDC pool ID (mainnet)
const ORCA_SOL_USDC_POOL_ID = new PublicKey('FpCMFDFGYotvufJ7HrFHsWEiiQCGbkLCtwHiDnh7o28Q');

// Raydium pool schema
// https://github.com/raydium-io/raydium-sdk/blob/master/src/liquidity/layout.ts
const RAYDIUM_POOL_SCHEMA = {
  struct: {
    _padding: { array: { type: 'u8', len: 336 } },
    baseVault: { array: { type: 'u8', len: 32 } },
    quoteVault: { array: { type: 'u8', len: 32 } },
  },
};

// Orca pool schema (simplified for token vaults)
// https://solscan.io/account/FpCMFDFGYotvufJ7HrFHsWEiiQCGbkLCtwHiDnh7o28Q#anchorData
const ORCA_POOL_SCHEMA = {
  struct: {
    whirlpoolsConfig: { array: { type: "u8", len: 32 } },
    whirlpoolBump: { array: { type: "u8", len: 1 } },
    tickSpacing: "u16",
    tickSpacingSeed: { array: { type: "u8", len: 2 } },
    feeRate: "u16",
    protocolFeeRate: "u16",
    liquidity: { array: { type: "u8", len: 16 } },
    sqrtPrice: { array: { type: "u8", len: 16 } },
    tickCurrentIndex: "i32",
    protocolFeeOwedA: { array: { type: "u8", len: 8 } },
    protocolFeeOwedB: { array: { type: "u8", len: 8 } },
    tokenMintA: { array: { type: "u8", len: 32 } },
    tokenVaultA: { array: { type: "u8", len: 32 } },
    feeGrowthGlobalA: { array: { type: "u8", len: 16 } },
    tokenMintB: { array: { type: "u8", len: 32 } },
    tokenVaultB: { array: { type: "u8", len: 32 } },
    feeGrowthGlobalB: { array: { type: "u8", len: 16 } },
    rewardLastUpdatedTimestamp: { array: { type: "u8", len: 8 } },
  },
};

const mintLayout = {
  struct: {
    mintAuthority: { option: { array: { type: "u8", len: 32 } } },
    supply: "u64",
    decimals: "u8",
    isInitialized: "bool",
    freezeAuthority: { option: { array: { type: "u8", len: 32 } } },
  },
};

// Interface for price data point
interface PricePoint {
  price: number;
  timestamp: string;
}

function uint8ArrayToBigInt(arr) {
  const value = BigInt(
    arr.reduce((acc, val, i) => acc + BigInt(val) * BigInt(2) ** BigInt(8 * i), BigInt(0))
  );
  console.log("uint8ArrayToBigInt:", arr, "->", value.toString());
  return value;
}

function uint8ArrayToPublicKey(arr) {
  return new PublicKey(arr);
}

function App() {
  // Raydium state
  const [raydiumPrice, setRaydiumPrice] = useState<number | null>(null);
  const [raydiumPriceHistory, setRaydiumPriceHistory] = useState<PricePoint[]>([]);
  const [raydiumLoading, setRaydiumLoading] = useState(true);
  const [raydiumError, setRaydiumError] = useState<string | null>(null);

  // Orca state
  const [orcaPrice, setOrcaPrice] = useState<number | null>(null);
  const [orcaPriceHistory, setOrcaPriceHistory] = useState<PricePoint[]>([]);
  const [orcaLoading, setOrcaLoading] = useState(true);
  const [orcaError, setOrcaError] = useState<string | null>(null);

  useEffect(() => {
    let intervalId: NodeJS.Timeout;

    // Fetch Raydium price
    const fetchRaydiumPrice = async () => {
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

        console.log('Raydium Base Vault:', baseVaultKey.toString());
        console.log('Raydium Quote Vault:', quoteVaultKey.toString());

        const baseVaultBalance = await connection.getTokenAccountBalance(baseVaultKey);
        const quoteVaultBalance = await connection.getTokenAccountBalance(quoteVaultKey);

        const baseAmount = baseVaultBalance.value.uiAmount;
        const quoteAmount = quoteVaultBalance.value.uiAmount;
        if (baseAmount === 0) {
          throw new Error('Raydium base amount is zero');
        }
        const fetchedPrice = quoteAmount / baseAmount;

        const timestamp = new Date().toLocaleTimeString();

        setRaydiumPrice(fetchedPrice);
        console.log(`Raydium SOL/USDC Price: ${fetchedPrice}`);

        setRaydiumPriceHistory((prev) => {
          const newHistory = [...prev, { price: fetchedPrice, timestamp }];
          return newHistory.slice(-60);
        });

        setRaydiumLoading(false);
      } catch (err: any) {
        const errorMessage = err.message || 'Failed to fetch Raydium price data';
        setRaydiumError(errorMessage);
        console.error('Raydium error:', err);
        setRaydiumLoading(false);
      }
    };

    // Fetch Orca price
    const fetchOrcaPrice = async () => {
      try {
        const connection = new Connection(
          "https://solana-mainnet.core.chainstack.com/27098d57fcb5334739b6917c275dba1c",
          "confirmed"
        );
        const poolInfo = await connection.getAccountInfo(ORCA_SOL_USDC_POOL_ID);
        if (!poolInfo) {
          throw new Error("Orca pool not found");
        }
    
        // Skip 8-byte discriminator
        const poolData = poolInfo.data.slice(8);
        const poolState = borsh.deserialize(ORCA_POOL_SCHEMA, poolData) as {
          sqrtPrice: Uint8Array;
          tokenVaultA: Uint8Array;
          tokenVaultB: Uint8Array;
          tokenMintA: Uint8Array;
          tokenMintB: Uint8Array;
        };
    
        // Convert sqrtPrice to BigInt
        const sqrtPrice = uint8ArrayToBigInt(poolState.sqrtPrice);
        console.log("sqrtPrice:", sqrtPrice.toString());

        // Orca's sqrt_price_to_price logic
        const Q64 = BigInt("18446744073709551616"); // 2^64
        const sqrtPriceF64 = Number(sqrtPrice);
        const rawPrice = Math.pow(sqrtPriceF64 / Number(Q64), 2.0);
        console.log("Raw price:", rawPrice);

        const decimalsA = 9;
        const decimalsB = 6;
        const power = Math.pow(10, decimalsA - decimalsB); // 10^(decimalsA - decimalsB)
        let finalPrice = rawPrice * power;
        console.log("Price after decimal adjustment:", finalPrice);
    
        const timestamp = new Date().toLocaleTimeString();
    
        setOrcaPrice(finalPrice);
        console.log(`Orca SOL/USDC Price: ${finalPrice}`);
    
        setOrcaPriceHistory((prev) => {
          const newHistory = [...prev, { price: finalPrice, timestamp }];
          return newHistory.slice(-60);
        });
    
        setOrcaLoading(false);
      } catch (err) {
        const errorMessage = err.message || "Failed to fetch Orca price data";
        setOrcaError(errorMessage);
        console.error("Orca error:", err);
        setOrcaLoading(false);
      }
    };

    const fetchPrices = async () => {
      await Promise.all([fetchRaydiumPrice(), fetchOrcaPrice()]);
    };

    fetchPrices();
    intervalId = setInterval(fetchPrices, 1000);

    return () => clearInterval(intervalId);
  }, []);

  // Raydium chart data
  const raydiumChartData = {
    labels: raydiumPriceHistory.map((point) => point.timestamp),
    datasets: [
      {
        label: 'SOL/USDC Price',
        data: raydiumPriceHistory.map((point) => point.price),
        borderColor: 'rgba(75, 192, 192, 1)',
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        fill: false,
        tension: 0.1,
      },
    ],
  };

  // Orca chart data
  const orcaChartData = {
    labels: orcaPriceHistory.map((point) => point.timestamp),
    datasets: [
      {
        label: 'SOL/USDC Price',
        data: orcaPriceHistory.map((point) => point.price),
        borderColor: 'rgba(255, 99, 132, 1)',
        backgroundColor: 'rgba(255, 99, 132, 0.2)',
        fill: false,
        tension: 0.1,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'SOL/USDC Price Over Time',
      },
    },
    scales: {
      x: {
        title: {
          display: true,
          text: 'Time',
        },
      },
      y: {
        title: {
          display: true,
          text: 'Price (USDC)',
        },
      },
    },
  };

  return (
    <div className="container">
      {/* (a) Title */}
      <div className="title">
        <h1>SOL/USDC</h1>
      </div>

      {/* (b) Raydium Chart and (c) Placeholder */}
      <div className="row">
        <div className="chart-section">
          <p>Raydium</p>
          {raydiumLoading && <p>Loading...</p>}
          {raydiumError && <p>{raydiumError}</p>}
          {raydiumPrice && (
            <div>
              <p className="price">1 SOL = {raydiumPrice.toFixed(6)} USDC</p>
              <Line data={raydiumChartData} options={chartOptions} />
            </div>
          )}
        </div>
        <div className="chart-section">
          <p>Orca</p>
          {orcaLoading && <p>Loading...</p>}
          {orcaError && <p>{orcaError}</p>}
          {orcaPrice && (
            <div>
              <p style={{ textAlign: 'center' }}>1 SOL = {orcaPrice.toFixed(6)} USDC</p>
              <Line data={orcaChartData} options={chartOptions} />
            </div>
          )}
        </div>
      </div>

      {/* (d) Placeholder and (e) Placeholder */}
      <div className="row">
        <div className="chart-section placeholder">
          <p>Other Protocol (D)</p>
          <p>Placeholder for future chart</p>
        </div>
        <div className="chart-section placeholder">
          <p>Other Protocol (E)</p>
          <p>Placeholder for future chart</p>
        </div>
      </div>
    </div>
  );
}

export default App;