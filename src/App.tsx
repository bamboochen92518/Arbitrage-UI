import { useState, useEffect } from 'react';
import { Connection, PublicKey } from '@solana/web3.js';
import * as borsh from 'borsh';
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

// SOL/USDC pool ID (Raydium mainnet)
const SOL_USDC_POOL_ID = new PublicKey('58oQChx4yWmvKdwLLZzBi4ChoCc2fqCUWBkwMihLYQo2');

// Schema for Raydium pool (adjusted offset)
// https://github.com/raydium-io/raydium-sdk/blob/master/src/liquidity/layout.ts
const POOL_SCHEMA = {
  struct: {
    _padding: { array: { type: 'u8', len: 336 } }, // Adjusted to reach baseVault
    baseVault: { array: { type: 'u8', len: 32 } },
    quoteVault: { array: { type: 'u8', len: 32 } },
  },
};

// Interface for price data point
interface PricePoint {
  price: number;
  timestamp: string;
}

function App() {
  const [price, setPrice] = useState<number | null>(null);
  const [priceHistory, setPriceHistory] = useState<PricePoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let intervalId: NodeJS.Timeout;

    const fetchRaydiumPrice = async () => {
      try {
        // Use Chainstack RPC
        const connection = new Connection('https://solana-mainnet.core.chainstack.com/27098d57fcb5334739b6917c275dba1c', 'confirmed');

        // Fetch pool info
        const poolInfo = await connection.getAccountInfo(SOL_USDC_POOL_ID);
        if (!poolInfo) {
          throw new Error('Pool not found');
        }

        // Decode minimal pool state
        const poolState = borsh.deserialize(POOL_SCHEMA, poolInfo.data) as {
          baseVault: Uint8Array;
          quoteVault: Uint8Array;
        };

        // Convert byte arrays to PublicKey
        const baseVaultKey = new PublicKey(poolState.baseVault);
        const quoteVaultKey = new PublicKey(poolState.quoteVault);

        console.log('Base Vault:', baseVaultKey.toString());
        console.log('Quote Vault:', quoteVaultKey.toString());

        // Get base (SOL) and quote (USDC) vault balances
        const baseVaultBalance = await connection.getTokenAccountBalance(baseVaultKey);
        const quoteVaultBalance = await connection.getTokenAccountBalance(quoteVaultKey);

        // Calculate price: USDC per SOL
        const baseAmount = baseVaultBalance.value.uiAmount; // SOL amount
        const quoteAmount = quoteVaultBalance.value.uiAmount; // USDC amount
        if (baseAmount === 0) {
          throw new Error('Base amount is zero, cannot calculate price');
        }
        const fetchedPrice = quoteAmount / baseAmount; // USDC per SOL

        const timestamp = new Date().toLocaleTimeString();

        // Update current price
        setPrice(fetchedPrice);
        console.log(`Raydium SOL/USDC Price: ${fetchedPrice}`);

        // Update price history (limit to 60 points ~ 60 seconds)
        setPriceHistory((prev) => {
          const newHistory = [...prev, { price: fetchedPrice, timestamp }];
          return newHistory.slice(-60); // Keep last 60 points
        });

        setLoading(false);
      } catch (err: any) {
        const errorMessage = err.message || 'Failed to fetch Raydium price data';
        setError(errorMessage);
        console.error('Error fetching price:', err);
        setLoading(false);
      }
    };

    // Run immediately and then every 1 second
    fetchRaydiumPrice();
    intervalId = setInterval(fetchRaydiumPrice, 1000);

    // Cleanup interval on unmount
    return () => clearInterval(intervalId);
  }, []);

  // Chart data configuration
  const chartData = {
    labels: priceHistory.map((point) => point.timestamp),
    datasets: [
      {
        label: 'SOL/USDC Price',
        data: priceHistory.map((point) => point.price),
        borderColor: 'rgba(75, 192, 192, 1)',
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        fill: false,
        tension: 0.1,
      },
    ],
  };

  // Chart options
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
    <>
      <div className="App">
        <h1>SOL/USDC Price (Raydium)</h1>
        {loading && <p>Loading...</p>}
        {error && <p>{error}</p>}
        {price && (
          <div>
            <p>1 SOL = {price.toFixed(6)} USDC</p>
            <Line data={chartData} options={chartOptions} />
          </div>
        )}
      </div>
    </>
  );
}

export default App;