# Helios Beta Mainnet App

A Next.js application for interacting with the Helios blockchain Beta Mainnet. This application provides essential tools for builders to interact with the Helios Beta Mainnet, including asset bridging, staking, and earning HLS rewards.

## Features

### Asset Bridging
- Bridge assets from Ethereum, BNB Chain, Polygon, and other supported chains
- Seamless cross-chain asset transfers
- Real-time transaction tracking

### Staking & Rewards
- Stake assets to earn HLS rewards
- View staking history and rewards
- Participate in the Helios ecosystem

### Web3 Integration
- Connect with popular Web3 wallets 
- Interact directly with the Helios Beta Mainnet blockchain
- View transaction status and history

## Helios Beta Mainnet Information

- **Chain ID**: 42000
- **Network Name**: Helios Beta Mainnet
- **RPC URL**: https://testnet1.helioschainlabs.org/
- **Explorer**: https://explorer.helioschainlabs.org/
- **Native Currency**: 
  - **Name**: Helios
  - **Symbol**: HLS
  - **Decimals**: 18

## Getting Started

### Prerequisites

- Node.js 18.x or later
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone https://github.com/helios-network/helios-testnet-react.git
cd helios-testnet-react
```

2. Install dependencies:
```bash
npm install
# or
yarn install
```

3. Start the development server:
```bash
npm run dev
# or
yarn dev
```

4. Open [http://localhost:3000](http://localhost:3000) with your browser to see the application.

## Connecting to Helios Beta Mainnet

To connect your wallet to the Helios Beta Mainnet:

1. Open your wallet (MetaMask, etc.)
2. Add a custom network with the following details:
   - Network Name: Helios Beta Mainnet
   - RPC URL: https://testnet1.helioschainlabs.org/
   - Chain ID: 42000
   - Currency Symbol: HLS
   - Block Explorer: https://explorer.helioschainlabs.org/

## Development

This project uses:

- [Next.js](https://nextjs.org/) - React framework
- [Wagmi](https://wagmi.sh/) - React Hooks for Ethereum
- [TailwindCSS](https://tailwindcss.com/) - For styling
- [Framer Motion](https://www.framer.com/motion/) - For animations

## Building for Production

```bash
npm run build
# or
yarn build
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Contact

For questions or support, please contact the Helios team.
