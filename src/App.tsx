import { useState, useEffect } from 'react';
import RaydiumChart from './components/RaydiumChart';
import OrcaChart from './components/OrcaChart';
import PlaceholderChart from './components/PlaceholderChart';
import { fetchRaydiumPrice, fetchOrcaPrice , checkArbitrageProfitability } from './utils/solana';
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

  // Auto arbitrage bot state (inactive by default)
  const [isBotActive, setIsBotActive] = useState(false);

  // Placeholder function for arbitrage bot logic
  const runArbitrageBot = async () => {
    if (!isBotActive) return;

    console.log(`Arbitrage Bot Running for ${selectedPair}`);
    console.log(`Raydium Price: ${raydiumPrice ?? 'N/A'}`);
    console.log(`Orca Price: ${orcaPrice ?? 'N/A'}`);

    if (raydiumPrice && orcaPrice) {
      const { isProfitable, profit, buyMarket, sellMarket, loanAmount } = await checkArbitrageProfitability(
        selectedPair,
        raydiumPrice,
        orcaPrice
      );

      if (isProfitable) {
        console.log(
          `Profitable arbitrage opportunity! Buy on ${buyMarket}, sell on ${sellMarket}. ` +
          `Loan amount: ${loanAmount} SOL, Estimated profit: ${profit.toFixed(6)} tokens`
        );
        // TODO: Implement flash loan with Flash Loan Mastery, buy on cheaper market, sell on higher market
      } else {
        console.log(`No profitable arbitrage opportunity. Loan amount: ${loanAmount} SOL`);
      }
    }
  };

  // Effect for resetting and fetching prices when selectedPair changes
  useEffect(() => {
    let intervalId: NodeJS.Timeout;

    const fetchPrices = async () => {
      try {
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
      } catch (error) {
        console.error('Error fetching prices:', error);
      }
    };

    // Reset history, prices, and bot state when selectedPair changes
    setRaydiumLoading(true);
    setOrcaLoading(true);
    setRaydiumPrice(null);
    setOrcaPrice(null);
    setRaydiumError(null);
    setOrcaError(null);
    setRaydiumPriceHistory([]);
    setOrcaPriceHistory([]);
    setIsBotActive(false); // Reset bot to inactive on token pair switch

    fetchPrices();
    intervalId = setInterval(fetchPrices, 5000);

    return () => clearInterval(intervalId);
  }, [selectedPair]);

  // Effect for running arbitrage bot when isBotActive or prices change
  useEffect(() => {
    if (!isBotActive) return;

    runArbitrageBot(); // Run immediately when bot is activated
    const intervalId = setInterval(runArbitrageBot, 5000); // Run every second if active

    return () => clearInterval(intervalId);
  }, [isBotActive, raydiumPrice, orcaPrice, selectedPair]);

  // Debug state changes
  useEffect(() => {
    console.log(`isBotActive changed to: ${isBotActive}`);
  }, [isBotActive]);

  return (
    <div className="container">
      <div className="title">
        <h1>{selectedPair}</h1>
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
      {/* Auto Arbitrage Bot Button */}
      <button
        className={`arbitrage-bot-button ${isBotActive ? 'active' : 'inactive'}`}
        onClick={() => setIsBotActive(!isBotActive)}
        style={{ marginLeft: 'auto' }}
      >
        Arbitrage Bot: {isBotActive ? 'Active' : 'Inactive'}
      </button>
      <div className="row">
        <RaydiumChart
          price={raydiumPrice}
          priceHistory={raydiumPriceHistory}
          loading={raydiumLoading}
          error={raydiumError}
          tokenPair={selectedPair}
        />
        <OrcaChart
          price={orcaPrice}
          priceHistory={orcaPriceHistory}
          loading={orcaLoading}
          error={orcaError}
          tokenPair={selectedPair}
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