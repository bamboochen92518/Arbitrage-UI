import { useState, useEffect } from 'react';
import RaydiumChart from './components/RaydiumChart';
import OrcaChart from './components/OrcaChart';
import PlaceholderChart from './components/PlaceholderChart';
import { fetchRaydiumPrice, fetchOrcaPrice } from './utils/solana';
import { PricePoint } from './types';
import './App.css';

// Define available token pairs
const TOKEN_PAIRS = ['SOL/USDC', 'POPCAT/SOL', 'FARTCOIN/SOL', 'JTO/SOL', 'TRUMP/SOL'] as const;
type TokenPair = (typeof TOKEN_PAIRS)[number];

function App() {
  // State for selected token pair
  const [selectedPair, setSelectedPair] = useState<TokenPair>('SOL/USDC');

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
      // Reset states when fetching new pair


      await Promise.all([
        fetchRaydiumPrice(
          selectedPair,
          setRaydiumPrice,
          setRaydiumPriceHistory,
          setRaydiumLoading,
          setRaydiumError
        ),
        fetchOrcaPrice(
          selectedPair,
          setOrcaPrice,
          setOrcaPriceHistory,
          setOrcaLoading,
          setOrcaError
        ),
      ]);
    };

    // Reset history only when selectedPair changes
    setRaydiumLoading(true);
    setOrcaLoading(true);
    setRaydiumPrice(null);
    setOrcaPrice(null);
    setRaydiumError(null);
    setOrcaError(null);
    setRaydiumPriceHistory([]);
    setOrcaPriceHistory([]);

    fetchPrices();
    intervalId = setInterval(fetchPrices, 1000);

    return () => clearInterval(intervalId);
  }, [selectedPair]);

  return (
    <div className="container">
      <div className="title">
      <h1>{selectedPair}</h1> {/* Display selected pair */}
      </div>
      <div className="token-pair-selector">
        {TOKEN_PAIRS.map((pair) => (
          <button
            key={pair}
            className={`token-pair-button ${selectedPair === pair ? 'active' : ''}`}
            onClick={() => setSelectedPair(pair)}
          >
            {pair}
          </button>
        ))}
      </div>
      <div className="row">
      <RaydiumChart
          price={raydiumPrice}
          priceHistory={raydiumPriceHistory}
          loading={raydiumLoading}
          error={raydiumError}
          tokenPair={selectedPair} // Pass selectedPair as tokenPair
        />
        <OrcaChart
          price={orcaPrice}
          priceHistory={orcaPriceHistory}
          loading={orcaLoading}
          error={orcaError}
          tokenPair={selectedPair} // Pass selectedPair as tokenPair (if OrcaChart is updated)
        />
      </div>
      <div className="row">
        <PlaceholderChart title="Other Protocol (Meteora)" />
        <PlaceholderChart title="Other Protocol (E)" />
      </div>
    </div>
  );
}

export default App;