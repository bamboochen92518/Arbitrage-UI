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
  
  interface ArbitrageStatusProps {
    isBotActive: boolean;
    arbitrageResult: ArbitrageResult | null;
    selectedPair: string;
  }
  
  export default function ArbitrageStatus({
    isBotActive,
    arbitrageResult,
    selectedPair,
  }: ArbitrageStatusProps) {
    return (
      <div
        className={`arbitrage-status ${isBotActive ? 'active' : 'inactive'} ${
          isBotActive && arbitrageResult?.isProfitable ? 'profit' : ''
        }`}
      >
        {isBotActive ? (
          arbitrageResult && arbitrageResult.isProfitable ? (
            <div className="profit-info">
              <h3>Arbitrage Opportunity for {
  
  selectedPair}</h3>
              <p>Buy on: {arbitrageResult.buyMarket}</p>
              <p>Sell on: {arbitrageResult.sellMarket}</p>
              <p>Estimated Profit: {arbitrageResult.profit.toFixed(6)} tokens</p>
              <p>Loan Amount: {arbitrageResult.loanAmount.toFixed(4)} SOL</p>
              <p>Tokens Bought: {arbitrageResult.tokensBought.toFixed(6)} tokens</p>
              <p>Price Impact: {arbitrageResult.priceImpact.toFixed(2)}%</p>
              <p>Rate: {arbitrageResult.rate.toFixed(6)} tokens/SOL</p>
            </div>
          ) : (
            <div className="no-profit">
              <h3>Arbitrage Bot Active for {selectedPair}</h3>
              {arbitrageResult && (
                <p>No profitable opportunity at the moment. Estimated Profit: {arbitrageResult.profit.toFixed(6)} SOL</p>
              )}
            </div>
          )
        ) : (
          <div className="inactive-state">
            <h3>Arbitrage Bot Inactive</h3>
            <p>Activate the bot to check for arbitrage opportunities</p>
          </div>
        )}
      </div>
    );
  }