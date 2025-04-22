import { useState, useEffect } from 'react';
import RaydiumChart from './components/RaydiumChart';
import OrcaChart from './components/OrcaChart';
import PlaceholderChart from './components/PlaceholderChart';
import { fetchRaydiumPrice, fetchOrcaPrice, checkArbitrageProfitability } from './utils/solana';
import { CONSTANTS } from './constants';
import { PricePoint } from './types';
import './App.css';

// Define token names as a union type
type TokenName = keyof typeof CONSTANTS.mainnet.TOKEN_MINTS;

// Define all possible token pairs
const ALL_TOKEN_PAIRS = ['SOL/USDC', 'POPCAT/SOL', 'FARTCOIN/SOL', 'JTO/SOL', 'TRUMP/SOL'] as const;
type TokenPair = (typeof ALL_TOKEN_PAIRS)[number];

function App() {
  // State for selected token pair
  const [selectedPair, setSelectedPair] = useState<TokenPair>('SOL/USDC');

  // State for network (mainnet or devnet)
  const [network, setNetwork] = useState<'mainnet' | 'devnet'>('mainnet');

  // Filter token pairs based on valid token mints
  const TOKEN_PAIRS = ALL_TOKEN_PAIRS.filter((pair) => {
    try {
      const [base, quote] = pair.split('/') as [TokenName, TokenName];
      const baseMint = CONSTANTS[network].TOKEN_MINTS[base];
      const quoteMint = CONSTANTS[network].TOKEN_MINTS[quote];
      return baseMint !== null && quoteMint !== null;
    } catch (error) {
      console.error(`Error filtering token pair ${pair}:`, error);
      return false;
    }
  }) as TokenPair[];

  // Ensure selectedPair is valid for the current network
  useEffect(() => {
    if (!TOKEN_PAIRS.includes(selectedPair)) {
      setSelectedPair(TOKEN_PAIRS[0] || 'SOL/USDC');
    }
  }, [network, TOKEN_PAIRS]);

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

    console.log(`Arbitrage Bot Running for ${selectedPair} on ${network}`);
    console.log(`Raydium Price: ${raydiumPrice ?? 'N/A'}`);
    console.log(`Orca Price: ${orcaPrice ?? 'N/A'}`);

    if (raydiumPrice && orcaPrice) {
      const { isProfitable, profit, buyMarket, sellMarket, loanAmount } = await checkArbitrageProfitability(
        selectedPair,
        network,
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

  // Effect for resetting and fetching prices when selectedPair or network changes
  useEffect(() => {
    let intervalId: NodeJS.Timeout;

    const fetchPrices = async () => {
      try {
        await Promise.all([
          fetchRaydiumPrice(
            selectedPair,
            network,
            setRaydiumPrice,
            setRaydiumPriceHistory,
            setRaydiumLoading,
            setRaydiumError
          ),
          fetchOrcaPrice(
            selectedPair,
            network,
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

    // Reset history, prices, and bot state when selectedPair or network changes
    setRaydiumLoading(true);
    setOrcaLoading(true);
    setRaydiumPrice(null);
    setOrcaPrice(null);
    setRaydiumError(null);
    setOrcaError(null);
    setRaydiumPriceHistory([]);
    setOrcaPriceHistory([]);
    setIsBotActive(false); // Reset bot to inactive on token pair or network switch

    fetchPrices();
    intervalId = setInterval(fetchPrices, 5000);

    return () => clearInterval(intervalId);
  }, [selectedPair, network]);

  // Effect for running arbitrage bot when isBotActive or prices change
  useEffect(() => {
    if (!isBotActive) return;

    runArbitrageBot(); // Run immediately when bot is activated
    const intervalId = setInterval(runArbitrageBot, 5000); // Run every second if active

    return () => clearInterval(intervalId);
  }, [isBotActive, raydiumPrice, orcaPrice, selectedPair, network]);

  // Debug state changes
  useEffect(() => {
    console.log(`isBotActive changed to: ${isBotActive}`);
    console.log(`Network changed to: ${network}`);
  }, [isBotActive, network]);

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
      <div className="button-group" style={{ display: 'flex', marginLeft: 'auto', gap: '10px', alignItems: 'center' }}>
        {/* Auto Arbitrage Bot Button */}
        <button
          className={`arbitrage-bot-button ${isBotActive ? 'active' : 'inactive'}`}
          onClick={() => setIsBotActive(!isBotActive)}
        >
          Arbitrage Bot: {isBotActive ? 'Active' : 'Inactive'}
        </button>
        {/* Network Switch Button */}
        <button
          className={`network-switch-button ${network === 'mainnet' ? 'active' : 'inactive'}`}
          onClick={() => setNetwork(network === 'mainnet' ? 'devnet' : 'mainnet')}
        >
          Network: {network === 'mainnet' ? 'Mainnet' : 'Devnet'}
        </button>
      </div>
      <div className="row">
        <RaydiumChart
          price={raydiumPrice}
          priceHistory={raydiumPriceHistory}
          loading={raydiumLoading}
          error={raydiumError}
          tokenPair={selectedPair}
          network={network}
        />
        <OrcaChart
          price={orcaPrice}
          priceHistory={orcaPriceHistory}
          loading={orcaLoading}
          error={orcaError}
          tokenPair={selectedPair}
          network={network}
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