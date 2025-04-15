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

// Schema for Raydium pool
const POOL_SCHEMA = {
  struct: {
    _padding: { array: { type: 'u8', len: 336 } },
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
        const connection = new Connection('https://solana-mainnet.core.chainstack.com/27098d57fcb5334739b6917c275dba1c', 'confirmed');
        const poolInfo = await connection.getAccountInfo(SOL_USDC_POOL_ID);
        if (!poolInfo) {
          throw new Error('Pool not found');
        }

        const poolState = borsh.deserialize(POOL_SCHEMA, poolInfo.data) as {
          baseVault: Uint8Array;
          quoteVault: Uint8Array;
        };

        const baseVaultKey = new PublicKey(poolState.baseVault);
        const quoteVaultKey = new PublicKey(poolState.quoteVault);

        console.log('Base Vault:', baseVaultKey.toString());
        console.log('Quote Vault:', quoteVaultKey.toString());

        const baseVaultBalance = await connection.getTokenAccountBalance(baseVaultKey);
        const quoteVaultBalance = await connection.getTokenAccountBalance(quoteVaultKey);

        const baseAmount = baseVaultBalance.value.uiAmount;
        const quoteAmount = quoteVaultBalance.value.uiAmount;
        if (baseAmount === 0) {
          throw new Error('Base amount is zero, cannot calculate price');
        }
        const fetchedPrice = quoteAmount / baseAmount;

        const timestamp = new Date().toLocaleTimeString();

        setPrice(fetchedPrice);
        console.log(`Raydium SOL/USDC Price: ${fetchedPrice}`);

        setPriceHistory((prev) => {
          const newHistory = [...prev, { price: fetchedPrice, timestamp }];
          return newHistory.slice(-60);
        });

        setLoading(false);
      } catch (err: any) {
        const errorMessage = err.message || 'Failed to fetch Raydium price data';
        setError(errorMessage);
        console.error('Error fetching price:', err);
        setLoading(false);
      }
    };

    fetchRaydiumPrice();
    intervalId = setInterval(fetchRaydiumPrice, 1000);

    return () => clearInterval(intervalId);
  }, []);

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
          {loading && <p>Loading...</p>}
          {error && <p>{error}</p>}
          {price && (
            <div>
              <p className="price">1 SOL = {price.toFixed(6)} USDC</p>
              <Line data={chartData} options={chartOptions} />
            </div>
          )}
        </div>
        <div className="chart-section placeholder">
          <p>Other Protocol (C)</p>
          <p>Placeholder for future chart</p>
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