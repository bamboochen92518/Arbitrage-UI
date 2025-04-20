# Arbitrage UI

**Arbitrage UI** is a tool for visualizing token prices across different liquidity pools and protocols on **Solana**. It helps users easily identify arbitrage opportunities by providing real-time price data in an intuitive interface.

The project is built using **React**, **TypeScript**, and **Vite**.

### How to Run

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
- [ ] Extend support for even more token pairs
- [ ] Integrate additional liquidity pools (e.g., Meteora, Lifinity, etc.)
- [ ] Visualize different types of Raydium pools (e.g., V4, AMM, Concentrated Liquidity, CPMM) in separate charts
- [ ] ⚠️ Implement automatic arbitrage execution (`runArbitrageBot` in `App.tsx`)

