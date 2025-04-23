import { useState, useEffect } from 'react';
import { Keypair } from '@solana/web3.js';
import bs58 from 'bs58';
import RaydiumChart from './components/RaydiumChart';
import OrcaChart from './components/OrcaChart';
import PlaceholderChart from './components/PlaceholderChart';
import ArbitrageStatus from './components/ArbitrageStatus';
import { fetchRaydiumPrice, fetchOrcaPrice, checkArbitrageProfitability, executeArbitrageTransaction } from './utils/solana';
import { TOKEN_MINTS } from './constants';
import { PricePoint } from './types';
import './App.css';

// Validate RPC node
const DEFAULT_RPC = 'https://api.mainnet-beta.solana.com';
const RPC_NODE = import.meta.env.VITE_RPC_NODE || DEFAULT_RPC;
if (!import.meta.env.VITE_RPC_NODE) {
  console.warn('VITE_RPC_NODE not found in .env, using public RPC:', DEFAULT_RPC);
}

// Load wallet from .env
let wallet: Keypair | null = null;
try {
  const secretKeyString = import.meta.env.VITE_WALLET_SECRET_KEY;
  if (!secretKeyString) {
    throw new Error('VITE_WALLET_SECRET_KEY not found in .env');
  }
  let secretKey: Uint8Array;
  if (secretKeyString.startsWith('[')) {
    // JSON array format
    secretKey = Uint8Array.from(JSON.parse(secretKeyString));
  } else {
    // Base58 format
    secretKey = bs58.decode(secretKeyString);
  }
  wallet = Keypair.fromSecretKey(secretKey);
  console.log('Wallet loaded:', wallet.publicKey.toBase58());
} catch (err) {
  console.error('Failed to load wallet from .env:', err);
}

// Define token names and pairs
type TokenName = keyof typeof TOKEN_MINTS;
const ALL_TOKEN_PAIRS = ['SOL/USDC', 'POPCAT/SOL', 'FARTCOIN/SOL', 'JTO/SOL', 'TRUMP/SOL'] as const;
type TokenPair = (typeof ALL_TOKEN_PAIRS)[number];

interface ArbitrageResult {
  isProfitable: boolean;
  profit: number;
  buyMarket: string;
  sellMarket: string;
  loanAmount: number;
  tokensBought: number;
  minTokensBought: number;
  priceImpact: number;
  rate: number;
}

function App() {
  const [selectedPair, setSelectedPair] = useState<TokenPair>('SOL/USDC');
  const [raydiumPrice, setRaydiumPrice] = useState<number | null>(null);
  const [raydiumPriceHistory, setRaydiumPriceHistory] = useState<PricePoint[]>([]);
  const [raydiumLoading, setRaydiumLoading] = useState(true);
  const [raydiumError, setRaydiumError] = useState<string | null>(null);
  const [orcaPrice, setOrcaPrice] = useState<number | null>(null);
  const [orcaPriceHistory, setOrcaPriceHistory] = useState<PricePoint[]>([]);
  const [orcaLoading, setOrcaLoading] = useState(true);
  const [orcaError, setOrcaError] = useState<string | null>(null);
  const [isBotActive, setIsBotActive] = useState(false);
  const [arbitrageResult, setArbitrageResult] = useState<ArbitrageResult | null>(null);

  // Fetch prices on pair change
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

    setRaydiumLoading(true);
    setOrcaLoading(true);
    setRaydiumPrice(null);
    setOrcaPrice(null);
    setRaydiumError(null);
    setOrcaError(null);
    setRaydiumPriceHistory([]);
    setOrcaPriceHistory([]);
    setIsBotActive(false);
    setArbitrageResult(null);

    fetchPrices();
    intervalId = setInterval(fetchPrices, 5000);

    return () => clearInterval(intervalId);
  }, [selectedPair]);

  // Run arbitrage bot
  const runArbitrageBot = async () => {
    if (!isBotActive || !wallet) {
      if (!wallet) console.error('Arbitrage bot inactive: Wallet not loaded');
      return;
    }

    if (raydiumPrice && orcaPrice) {
      const result = await checkArbitrageProfitability(
        selectedPair,
        raydiumPrice,
        orcaPrice
      );
      setArbitrageResult(result);

      if (result.isProfitable) {
        try {
          const signature = await executeArbitrageTransaction(selectedPair, wallet);
          if (signature) {
            console.log(`Arbitrage executed successfully: ${signature}`);
          } else {
            console.error('Arbitrage transaction failed');
          }
        } catch (err) {
          console.error('Error executing arbitrage:', err);
        }
      }
    }
  };

  useEffect(() => {
    if (!isBotActive) {
      setArbitrageResult(null);
      return;
    }

    runArbitrageBot();
    const intervalId = setInterval(runArbitrageBot, 5000);
    return () => clearInterval(intervalId);
  }, [isBotActive, raydiumPrice, orcaPrice, selectedPair]);

  return (
    <div className="container">
      <div className="title">
        <h1>{selectedPair}</h1>
      </div>
      <div className="token-pair-selector">
        {ALL_TOKEN_PAIRS.map((pair) => (
          <button
            key={pair}
            className={`token-pair-button ${selectedPair === pair ? 'active' : ''}`}
            onClick={() => setSelectedPair(pair)}
          >
            {pair}
          </button>
        ))}
      </div>
      <div className="status-button-container">
        <ArbitrageStatus
          isBotActive={isBotActive}
          arbitrageResult={arbitrageResult}
          selectedPair={selectedPair}
        />
        <div className="button-group">
          <button
            className={`arbitrage-bot-button ${isBotActive ? 'active' : 'inactive'}`}
            onClick={() => setIsBotActive(!isBotActive)}
          >
            Arbitrage Bot: {isBotActive ? 'Active' : 'Inactive'}
          </button>
        </div>
      </div>
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