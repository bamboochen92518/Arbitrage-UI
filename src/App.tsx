import { useState, useEffect } from 'react';
import RaydiumChart from './components/RaydiumChart';
import OrcaChart from './components/OrcaChart';
import PlaceholderChart from './components/PlaceholderChart';
import { fetchRaydiumPrice, fetchOrcaPrice } from './utils/solana';
import { PricePoint } from './types';
import './App.css';

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

    const fetchPrices = async () => {
      await Promise.all([
        fetchRaydiumPrice(
          setRaydiumPrice,
          setRaydiumPriceHistory,
          setRaydiumLoading,
          setRaydiumError
        ),
        fetchOrcaPrice(
          setOrcaPrice,
          setOrcaPriceHistory,
          setOrcaLoading,
          setOrcaError
        ),
      ]);
    };

    fetchPrices();
    intervalId = setInterval(fetchPrices, 1000);

    return () => clearInterval(intervalId);
  }, []);

  return (
    <div className="container">
      <div className="title">
        <h1>SOL/USDC</h1>
      </div>
      <div className="row">
        <RaydiumChart
          price={raydiumPrice}
          priceHistory={raydiumPriceHistory}
          loading={raydiumLoading}
          error={raydiumError}
        />
        <OrcaChart
          price={orcaPrice}
          priceHistory={orcaPriceHistory}
          loading={orcaLoading}
          error={orcaError}
        />
      </div>
      <div className="row">
        <PlaceholderChart title="Other Protocol (D)" />
        <PlaceholderChart title="Other Protocol (E)" />
      </div>
    </div>
  );
}

export default App;