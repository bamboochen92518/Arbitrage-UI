# Arbitrage UI

**Arbitrage UI** is a tool for visualizing token prices across different liquidity pools and protocols on **Solana**. It helps users easily identify arbitrage opportunities by providing real-time price data in an intuitive interface.

The project is built using **React**, **TypeScript**, and **Vite**.

### Prerequisites

First, you need to register for a private RPC node via [Chainstack](https://chainstack.com/).

### How to Run

```bash
git clone https://github.com/bamboochen92518/Arbitrage-UI.git
cd Arbitrage-UI
cp .env.example .env
```

Next, open the `.env` file and fill in your wallet's private key and RPC node:

```
VITE_WALLET_SECRET_KEY=yourBase58SecretKeyHere
VITE_RPC_NODE=yourRpcNodeHere
```

Then install the dependencies and start the development server:

```bash
npm install
npm run dev
```

### TODO List

- [x] Build a UI to monitor the SOL/USDC pair on Raydium
- [x] Build a UI to monitor the SOL/USDC pair on Orca
- [x] Add support for additional token pairs (e.g., POPCAT/SOL, FARTCOIN/SOL)
- [x] Add buttons to select different token pairs
- [x] Write a tutorial on how to add a new token pair
- [x] Add a function to check for arbitrage opportunities
- [x] Implement automatic arbitrage execution (`executeArbitrageTransaction` in `utils/solana.ts`)
- [ ] Extend support for even more token pairs
- [ ] Integrate additional liquidity pools (e.g., Meteora, Lifinity, etc.)
- [ ] Visualize different types of Raydium pools (e.g., V4, AMM, Concentrated Liquidity, CPMM) in separate charts

